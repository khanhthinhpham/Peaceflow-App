import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { sendPushToUser } from '../notifications/notification.routes.js';
import { detectCrisisSignals, logCrisisFlag } from '../ai/ai.safety.js';

const router = Router();

// Giới hạn 5MB — khớp convention chung toàn app (ảnh bìa bài viết, avatar chuyên gia...).
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function attachmentPreviewLabel(mime) {
  if (!mime) return '📎 Tệp đính kèm';
  if (mime.startsWith('image/')) return '📷 Hình ảnh';
  if (mime.startsWith('audio/')) return '🎤 Tin nhắn thoại';
  return '📎 Tệp đính kèm';
}

async function insertNotification(recipientId, actorName, type, postId, message, params = null) {
  const groupKey = `${type}:${postId}:${recipientId}`;
  await db.query(
    `insert into notifications (recipient_id, actor_name, type, post_id, message, group_key, params)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [recipientId, actorName, type, postId, message, groupKey, params ? JSON.stringify(params) : null]
  );
}

async function getUserLocale(userId) {
  const { rows } = await db.query(`select locale from users where id = $1 limit 1`, [userId]);
  return rows[0]?.locale === 'en' ? 'en' : 'vi';
}

async function getExpertIdByUser(userSub) {
  const r = await db.query(`select id from experts where user_id = $1 limit 1`, [userSub]);
  return r.rows[0]?.id || null;
}

// Trả về { role, conversation } nếu req.user hiện tại thuộc về conversation này (là chính
// client, hoặc là tài khoản chuyên gia gắn với expert_id của conversation) — null nếu không.
// Dùng chung cho mọi route cần xác thực quyền truy cập 1 conversation cụ thể.
async function resolveParticipant(userSub, conversationId) {
  const r = await db.query(`select * from chat_conversations where id = $1`, [conversationId]);
  const conversation = r.rows[0];
  if (!conversation) return null;

  if (conversation.user_id === userSub) {
    return { role: 'client', conversation };
  }
  const expertId = await getExpertIdByUser(userSub);
  if (expertId && expertId === conversation.expert_id) {
    return { role: 'expert', conversation };
  }
  return null;
}

// Tự tạo sẵn (nếu chưa có) 1 hội thoại cho MỌI cặp expert-client đủ điều kiện booking — để
// danh sách "Tin nhắn" hiện ra ngay cả khi chưa ai chủ động bấm "Nhắn tin" lần nào. Idempotent
// (ON CONFLICT DO NOTHING) nên gọi mỗi lần load danh sách không tốn kém/không trùng lặp.
async function materializeConversationsForClient(userId) {
  await db.query(
    `insert into chat_conversations (expert_id, user_id)
     select distinct eb.expert_id, eb.user_id
     from expert_bookings eb
     where eb.user_id = $1 and eb.status in ('confirmed', 'completed')
     on conflict (expert_id, user_id) do nothing`,
    [userId]
  );
}

async function materializeConversationsForExpert(expertId) {
  await db.query(
    `insert into chat_conversations (expert_id, user_id)
     select distinct eb.expert_id, eb.user_id
     from expert_bookings eb
     where eb.expert_id = $1 and eb.status in ('confirmed', 'completed')
     on conflict (expert_id, user_id) do nothing`,
    [expertId]
  );
}

async function hasQualifyingBooking(expertId, userId) {
  const r = await db.query(
    `select 1 from expert_bookings
     where expert_id = $1 and user_id = $2 and status in ('confirmed', 'completed')
     limit 1`,
    [expertId, userId]
  );
  return Boolean(r.rows[0]);
}

async function mapConversationsForClient(userId) {
  const r = await db.query(
    `select c.id, c.expert_id, c.last_message_at, c.last_message_preview,
            e.full_name as expert_name, e.avatar_emoji as expert_avatar,
            coalesce(
              (select count(*)::int from chat_messages m
               where m.conversation_id = c.id and m.sender_user_id != $1 and m.read_at is null),
              0
            ) as unread_count
     from chat_conversations c
     join experts e on e.id = c.expert_id
     where c.user_id = $1
     order by c.last_message_at desc nulls last, c.created_at desc`,
    [userId]
  );
  return r.rows;
}

// expertUserId = user_id (tài khoản đăng nhập) của chuyên gia, KHÔNG phải experts.id —
// cần để so sánh với chat_messages.sender_user_id (luôn lưu user_id thật của người gửi).
async function mapConversationsForExpert(expertId, expertUserId) {
  const r = await db.query(
    `select c.id, c.user_id, c.last_message_at, c.last_message_preview,
            coalesce(u.display_name, u.full_name, 'Người dùng') as client_name,
            coalesce(
              (select count(*)::int from chat_messages m
               where m.conversation_id = c.id and m.sender_user_id != $2 and m.read_at is null),
              0
            ) as unread_count
     from chat_conversations c
     join users u on u.id = c.user_id
     where c.expert_id = $1
     order by c.last_message_at desc nulls last, c.created_at desc`,
    [expertId, expertUserId]
  );
  return r.rows;
}

// ===== CLIENT (user thường) =====

router.post('/chat/conversations', requireAuth, async (req, res) => {
  try {
    const expertId = req.body.expertId;
    if (!expertId) return res.status(400).json({ success: false, message: 'Thiếu expertId.' });

    const ok = await hasQualifyingBooking(expertId, req.user.sub);
    if (!ok) {
      return res.status(403).json({ success: false, message: 'Bạn cần có lịch hẹn đã xác nhận với chuyên gia này mới nhắn tin được.' });
    }

    const r = await db.query(
      `insert into chat_conversations (expert_id, user_id)
       values ($1, $2)
       on conflict (expert_id, user_id) do update set expert_id = excluded.expert_id
       returning id`,
      [expertId, req.user.sub]
    );
    return res.json({ success: true, data: { id: r.rows[0].id } });
  } catch (error) {
    console.error('Create chat conversation error:', error);
    return res.status(500).json({ success: false, message: 'Không tạo được hội thoại.' });
  }
});

router.get('/chat/conversations', requireAuth, async (req, res) => {
  try {
    await materializeConversationsForClient(req.user.sub);
    const data = await mapConversationsForClient(req.user.sub);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('List chat conversations (client) error:', error);
    return res.status(500).json({ success: false, message: 'Không tải được danh sách hội thoại.' });
  }
});

// ===== EXPERT PORTAL =====

router.post('/expert-portal/chat/conversations', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const expertId = await getExpertIdByUser(req.user.sub);
    if (!expertId) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ chuyên gia.' });

    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId.' });

    const ok = await hasQualifyingBooking(expertId, userId);
    if (!ok) {
      return res.status(403).json({ success: false, message: 'Client không thuộc danh sách của bạn.' });
    }

    const r = await db.query(
      `insert into chat_conversations (expert_id, user_id)
       values ($1, $2)
       on conflict (expert_id, user_id) do update set expert_id = excluded.expert_id
       returning id`,
      [expertId, userId]
    );
    return res.json({ success: true, data: { id: r.rows[0].id } });
  } catch (error) {
    console.error('Create chat conversation (expert) error:', error);
    return res.status(500).json({ success: false, message: 'Không tạo được hội thoại.' });
  }
});

router.get('/expert-portal/chat/conversations', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const expertId = await getExpertIdByUser(req.user.sub);
    if (!expertId) return res.json({ success: true, data: [] });

    await materializeConversationsForExpert(expertId);
    const data = await mapConversationsForExpert(expertId, req.user.sub);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('List chat conversations (expert) error:', error);
    return res.status(500).json({ success: false, message: 'Không tải được danh sách hội thoại.' });
  }
});

// ===== CHUNG (cả 2 phía đều gọi được, tự xác định quyền qua resolveParticipant) =====

router.get('/chat/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const access = await resolveParticipant(req.user.sub, req.params.id);
    if (!access) return res.status(403).json({ success: false, message: 'Không có quyền xem hội thoại này.' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const r = await db.query(
      `select m.id, m.sender_user_id, m.content, m.created_at, m.read_at,
              m.attachment_id, m.attachment_mime, m.attachment_filename, m.reply_to_message_id,
              replied.content as reply_to_content, replied.sender_user_id as reply_to_sender_user_id,
              replied.attachment_filename as reply_to_attachment_filename
       from chat_messages m
       left join chat_messages replied on replied.id = m.reply_to_message_id
       where m.conversation_id = $1
       order by m.created_at desc
       limit $2 offset $3`,
      [req.params.id, limit, offset]
    );
    return res.json({ success: true, data: r.rows.reverse() });
  } catch (error) {
    console.error('List chat messages error:', error);
    return res.status(500).json({ success: false, message: 'Không tải được tin nhắn.' });
  }
});

router.post('/chat/conversations/:id/messages', requireAuth, attachmentUpload.single('attachment'), async (req, res) => {
  try {
    const access = await resolveParticipant(req.user.sub, req.params.id);
    if (!access) return res.status(403).json({ success: false, message: 'Không có quyền gửi tin nhắn trong hội thoại này.' });

    const content = (req.body.content || '').trim();
    const file = req.file;
    if (!content && !file) return res.status(400).json({ success: false, message: 'Nội dung tin nhắn trống.' });
    if (content.length > 4000) return res.status(400).json({ success: false, message: 'Tin nhắn quá dài.' });

    const { conversation, role } = access;
    const replyToMessageId = req.body.replyToMessageId || null;
    if (replyToMessageId) {
      const replied = await db.query(
        `select id from chat_messages where id = $1 and conversation_id = $2`,
        [replyToMessageId, conversation.id]
      );
      if (!replied.rowCount) return res.status(400).json({ success: false, message: 'Tin nhắn được trả lời không hợp lệ.' });
    }

    let attachmentId = null;
    if (file) {
      const attachRes = await db.query(
        `insert into chat_attachments (data) values ($1) returning id`,
        [file.buffer]
      );
      attachmentId = attachRes.rows[0].id;
    }

    const r = await db.query(
      `insert into chat_messages (conversation_id, sender_user_id, content, attachment_id, attachment_mime, attachment_filename, reply_to_message_id)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, sender_user_id, content, created_at, read_at, attachment_id, attachment_mime, attachment_filename, reply_to_message_id`,
      [conversation.id, req.user.sub, content, attachmentId, file?.mimetype || null, file?.originalname || null, replyToMessageId]
    );

    const preview = content ? content.slice(0, 200) : attachmentPreviewLabel(file?.mimetype);
    await db.query(
      `update chat_conversations set last_message_at = now(), last_message_preview = $2 where id = $1`,
      [conversation.id, preview]
    );

    // Người gửi là CLIENT -> dò tín hiệu khủng hoảng trong tin nhắn, dùng lại đúng bộ phát
    // hiện đang chạy cho AI chat/sàng lọc (ai.safety.js) để feed vào RiskEngineService.
    if (role === 'client') {
      const crisisSignals = detectCrisisSignals(content);
      if (crisisSignals.length) {
        logCrisisFlag(req.user.sub, crisisSignals, { source: 'expert_chat' });
      }
    }

    // Báo cho phía còn lại — fire-and-forget, không chặn response.
    (async () => {
      const recipientId = role === 'client'
        ? (await db.query(`select user_id from experts where id = $1`, [conversation.expert_id])).rows[0]?.user_id
        : conversation.user_id;
      if (!recipientId) return;

      const senderName = (await db.query(
        `select coalesce(display_name, full_name, 'Ai đó') as name from users where id = $1`,
        [req.user.sub]
      )).rows[0]?.name || 'Ai đó';

      const msg = `${senderName} đã gửi tin nhắn mới cho bạn.`;
      await insertNotification(recipientId, senderName, 'chat_message', conversation.id, msg, {
        code: 'chat_message', actorName: senderName, conversationId: conversation.id
      });

      const pushLocale = await getUserLocale(recipientId);
      const pushTitle = pushLocale === 'en' ? '💬 New message' : '💬 Tin nhắn mới';
      sendPushToUser(recipientId, pushTitle, msg, '/messages').catch(() => {});
    })().catch((e) => console.error('[BG] chat message notify:', e.message));

    return res.json({ success: true, data: r.rows[0] });
  } catch (error) {
    console.error('Send chat message error:', error);
    return res.status(500).json({ success: false, message: 'Không gửi được tin nhắn.' });
  }
});

// Phục vụ lại bytes của 1 đính kèm — xác thực người gọi thuộc đúng hội thoại chứa tin nhắn đó
// (join attachment -> message -> conversation), không public như ảnh bìa bài viết vì nội dung
// chat là riêng tư giữa 2 người.
router.get('/chat/attachments/:id', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select ca.data, cm.attachment_mime, cm.attachment_filename, cm.conversation_id
       from chat_attachments ca
       join chat_messages cm on cm.attachment_id = ca.id
       where ca.id = $1`,
      [req.params.id]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).end();

    const access = await resolveParticipant(req.user.sub, row.conversation_id);
    if (!access) return res.status(403).end();

    const isInline = (row.attachment_mime || '').startsWith('image/') || (row.attachment_mime || '').startsWith('audio/');
    res.set('Content-Type', row.attachment_mime || 'application/octet-stream');
    res.set('Content-Disposition', isInline ? 'inline' : `attachment; filename="${encodeURIComponent(row.attachment_filename || 'file')}"`);
    res.set('Cache-Control', 'private, max-age=86400');
    return res.send(row.data);
  } catch (error) {
    console.error('Get chat attachment error:', error);
    return res.status(500).end();
  }
});

router.post('/chat/conversations/:id/read', requireAuth, async (req, res) => {
  try {
    const access = await resolveParticipant(req.user.sub, req.params.id);
    if (!access) return res.status(403).json({ success: false, message: 'Không có quyền thao tác hội thoại này.' });

    await db.query(
      `update chat_messages set read_at = now()
       where conversation_id = $1 and sender_user_id != $2 and read_at is null`,
      [req.params.id, req.user.sub]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Mark chat messages read error:', error);
    return res.status(500).json({ success: false, message: 'Không đánh dấu đã đọc được.' });
  }
});

export default router;
