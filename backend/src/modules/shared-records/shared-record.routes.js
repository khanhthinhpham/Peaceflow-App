import { Router } from 'express';
import { db } from '../../config/db.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { buildNotificationMessage } from '../notifications/notification-messages.js';
import { sendPushToUser } from '../notifications/notification.routes.js';
import { sendSharedRecordToExpertEmail, sendSharedRecordResponseEmail } from '../../common/services/email.service.js';

const router = Router();

async function notify(recipientId, actorName, type, message, params = null) {
  await db.query(
    `insert into notifications (recipient_id, actor_name, type, message, params) values ($1, $2, $3, $4, $5::jsonb)`,
    [recipientId, actorName, type, message, params ? JSON.stringify(params) : null]
  );
}

async function getUserLocale(userId) {
  const r = await db.query(`select locale, email from users where id = $1`, [userId]);
  return { locale: r.rows[0]?.locale === 'en' ? 'en' : 'vi', email: r.rows[0]?.email || null };
}

// Lấy booking + xác định đúng người trong cuộc (thân chủ / bác sĩ) — expert_id trong
// expert_bookings trỏ tới experts.id, cần join ra users.id thật để so khớp req.user.sub.
async function loadBooking(bookingId) {
  const r = await db.query(
    `select eb.id, eb.user_id as client_id, eb.status, eb.starts_at, eb.duration_minutes,
            e.user_id as expert_user_id, e.full_name as expert_name,
            coalesce(cu.display_name, cu.full_name, 'Người dùng') as client_name,
            coalesce(eu.display_name, eu.full_name, e.full_name) as expert_display_name
     from expert_bookings eb
     join experts e on e.id = eb.expert_id
     join users cu on cu.id = eb.user_id
     left join users eu on eu.id = e.user_id
     where eb.id = $1`,
    [bookingId]
  );
  return r.rows[0] || null;
}

// Cửa sổ được phép gửi: lịch đã 'confirmed' VÀ chưa quá hết giờ buổi hẹn (starts_at +
// duration_minutes). Quá giờ hoặc lịch đã completed/cancelled/expired đều không cho gửi.
function isWithinSendWindow(booking) {
  if (!booking || booking.status !== 'confirmed') return false;
  const endsAt = new Date(booking.starts_at).getTime() + booking.duration_minutes * 60000;
  return Date.now() <= endsAt;
}

// ===== THÂN CHỦ =====

router.get('/bookings/:id/shareable-summary', requireAuth, async (req, res) => {
  try {
    const booking = await loadBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (booking.client_id !== req.user.sub) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập lịch hẹn này.' });
    }

    const [journalRes, moodRes, assessmentRes] = await Promise.all([
      db.query(
        `select id, title, content, created_at from journal_entries
         where user_id = $1 order by created_at desc limit 50`,
        [req.user.sub]
      ),
      db.query(
        `select id, mood_score, dominant_emotion, notes, created_at from mood_checkins
         where user_id = $1 order by created_at desc limit 50`,
        [req.user.sub]
      ),
      db.query(
        `select ar.id, a.name as assessment_name, ar.total_score, ar.severity, ar.created_at
         from assessment_results ar
         join assessments a on a.id = ar.assessment_id
         where ar.user_id = $1
         order by ar.created_at desc limit 50`,
        [req.user.sub]
      )
    ]);

    return res.json({
      success: true,
      data: {
        canSend: isWithinSendWindow(booking),
        bookingStatus: booking.status,
        expertName: booking.expert_display_name,
        journalEntries: journalRes.rows,
        moodCheckins: moodRes.rows,
        assessmentResults: assessmentRes.rows
      }
    });
  } catch (error) {
    console.error('Shareable summary error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load shareable summary' });
  }
});

router.post('/bookings/:id/shared-records', requireAuth, async (req, res) => {
  try {
    const booking = await loadBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (booking.client_id !== req.user.sub) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập lịch hẹn này.' });
    }
    if (!booking.expert_user_id) {
      return res.status(400).json({ success: false, message: 'Chuyên gia chưa có tài khoản trên hệ thống.' });
    }
    // Luôn kiểm tra lại ở server — không tin tưởng cờ canSend phía client.
    if (!isWithinSendWindow(booking)) {
      return res.status(400).json({ success: false, message: 'Đã quá thời gian được gửi hồ sơ cho lịch hẹn này.' });
    }

    const journalIds = Array.isArray(req.body.journalEntryIds) ? req.body.journalEntryIds : [];
    const moodIds = Array.isArray(req.body.moodCheckinIds) ? req.body.moodCheckinIds : [];
    const assessmentIds = Array.isArray(req.body.assessmentResultIds) ? req.body.assessmentResultIds : [];
    if (!journalIds.length && !moodIds.length && !assessmentIds.length) {
      return res.status(400).json({ success: false, message: 'Chưa chọn nội dung nào để gửi.' });
    }

    const [journalRes, moodRes, assessmentRes] = await Promise.all([
      journalIds.length
        ? db.query(`select id, title, content, created_at from journal_entries where user_id = $1 and id = any($2::uuid[])`, [req.user.sub, journalIds])
        : { rows: [] },
      moodIds.length
        ? db.query(`select id, mood_score, dominant_emotion, notes, created_at from mood_checkins where user_id = $1 and id = any($2::uuid[])`, [req.user.sub, moodIds])
        : { rows: [] },
      assessmentIds.length
        ? db.query(
          `select ar.id, a.name as assessment_name, ar.total_score, ar.severity, ar.dimension_scores, ar.interpreted_result, ar.created_at
           from assessment_results ar join assessments a on a.id = ar.assessment_id
           where ar.user_id = $1 and ar.id = any($2::uuid[])`,
          [req.user.sub, assessmentIds]
        )
        : { rows: [] }
    ]);

    // Snapshot: sao chép nguyên nội dung TẠI THỜI ĐIỂM GỬI — không tham chiếu sống, để thân
    // chủ sửa/xoá nhật ký gốc sau này không ảnh hưởng bản đã gửi cho bác sĩ.
    const snapshot = {
      journalEntries: journalRes.rows,
      moodCheckins: moodRes.rows,
      assessmentResults: assessmentRes.rows
    };

    const inserted = await db.query(
      `insert into client_shared_records (booking_id, client_id, expert_id, snapshot)
       values ($1, $2, $3, $4::jsonb) returning id, sent_at`,
      [req.params.id, req.user.sub, booking.expert_user_id, JSON.stringify(snapshot)]
    );
    const record = inserted.rows[0];

    const { locale: expertLocale, email: expertEmail } = await getUserLocale(booking.expert_user_id);
    const msg = buildNotificationMessage('shared_record_sent', { clientName: booking.client_name }, expertLocale)
      || `${booking.client_name} vừa gửi nhật ký và kết quả test cho bạn.`;
    notify(booking.expert_user_id, booking.client_name, 'shared_record_sent', msg, { code: 'shared_record_sent', recordId: record.id }).catch(() => {});
    sendPushToUser(booking.expert_user_id, '📋 Thân chủ vừa gửi hồ sơ', msg, '/expert/shared-records').catch(() => {});
    sendSharedRecordToExpertEmail({ to: expertEmail, expertName: booking.expert_display_name, clientName: booking.client_name, locale: expertLocale })
      .catch((e) => console.error('[SHARED_RECORD_MAIL_FAIL]', e.message));

    return res.json({ success: true, data: { id: record.id, sentAt: record.sent_at } });
  } catch (error) {
    console.error('Create shared record error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not send shared record' });
  }
});

router.get('/my-shared-records', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select csr.id, csr.status, csr.sent_at, csr.revoked_at, csr.booking_id,
              coalesce(eu.display_name, eu.full_name, e.full_name) as expert_name,
              (select count(*)::int from client_shared_record_responses resp where resp.shared_record_id = csr.id) as response_count
       from client_shared_records csr
       join expert_bookings eb on eb.id = csr.booking_id
       join experts e on e.id = eb.expert_id
       left join users eu on eu.id = e.user_id
       where csr.client_id = $1
       order by csr.sent_at desc`,
      [req.user.sub]
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('List my shared records error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load shared records' });
  }
});

router.post('/shared-records/:id/revoke', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select csr.id, csr.status, csr.expert_id,
              coalesce(cu.display_name, cu.full_name, 'Người dùng') as client_name
       from client_shared_records csr
       join users cu on cu.id = csr.client_id
       where csr.id = $1 and csr.client_id = $2`,
      [req.params.id, req.user.sub]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đã gửi.' });
    if (r.rows[0].status === 'revoked') return res.json({ success: true });

    await db.query(`update client_shared_records set status = 'revoked', revoked_at = now() where id = $1`, [req.params.id]);

    const { locale } = await getUserLocale(r.rows[0].expert_id);
    const msg = buildNotificationMessage('shared_record_revoked', { clientName: r.rows[0].client_name }, locale)
      || `${r.rows[0].client_name} đã thu hồi hồ sơ đã gửi trước đó.`;
    notify(r.rows[0].expert_id, r.rows[0].client_name, 'shared_record_revoked', msg, { code: 'shared_record_revoked', recordId: req.params.id }).catch(() => {});

    return res.json({ success: true });
  } catch (error) {
    console.error('Revoke shared record error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not revoke shared record' });
  }
});

// ===== DÙNG CHUNG (thân chủ hoặc bác sĩ liên quan) =====

router.get('/shared-records/:id', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select csr.id, csr.status, csr.snapshot, csr.sent_at, csr.revoked_at, csr.client_id, csr.expert_id,
              coalesce(cu.display_name, cu.full_name, 'Người dùng') as client_name,
              coalesce(eu.display_name, eu.full_name, e.full_name) as expert_name
       from client_shared_records csr
       join users cu on cu.id = csr.client_id
       join experts e on e.user_id = csr.expert_id
       left join users eu on eu.id = csr.expert_id
       where csr.id = $1`,
      [req.params.id]
    );
    const record = r.rows[0];
    if (!record) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
    if (record.client_id !== req.user.sub && record.expert_id !== req.user.sub) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem hồ sơ này.' });
    }

    const responses = await db.query(
      `select id, content, created_at from client_shared_record_responses where shared_record_id = $1 order by created_at asc`,
      [req.params.id]
    );

    return res.json({
      success: true,
      data: {
        id: record.id,
        status: record.status,
        sentAt: record.sent_at,
        revokedAt: record.revoked_at,
        clientName: record.client_name,
        expertName: record.expert_name,
        snapshot: record.snapshot,
        responses: responses.rows
      }
    });
  } catch (error) {
    console.error('Get shared record error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load shared record' });
  }
});

// ===== BÁC SĨ =====

router.get('/expert-portal/shared-records', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select csr.id, csr.status, csr.sent_at, csr.revoked_at,
              coalesce(cu.display_name, cu.full_name, 'Người dùng') as client_name,
              (select count(*)::int from client_shared_record_responses resp where resp.shared_record_id = csr.id) as response_count
       from client_shared_records csr
       join users cu on cu.id = csr.client_id
       where csr.expert_id = $1
       order by csr.sent_at desc`,
      [req.user.sub]
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('List expert shared records error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load shared records' });
  }
});

router.post('/shared-records/:id/responses', requireAuth, async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ success: false, message: 'Thiếu nội dung phản hồi.' });

    const r = await db.query(
      `select csr.id, csr.client_id, coalesce(eu.display_name, eu.full_name, e.full_name) as expert_name
       from client_shared_records csr
       join experts e on e.user_id = csr.expert_id
       left join users eu on eu.id = csr.expert_id
       where csr.id = $1 and csr.expert_id = $2`,
      [req.params.id, req.user.sub]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ hoặc bạn không phải bác sĩ phụ trách.' });

    const inserted = await db.query(
      `insert into client_shared_record_responses (shared_record_id, expert_id, content)
       values ($1, $2, $3) returning id, created_at`,
      [req.params.id, req.user.sub, content]
    );

    const { locale: clientLocale, email: clientEmail } = await getUserLocale(r.rows[0].client_id);
    const clientNameRes = await db.query(`select coalesce(display_name, full_name, 'bạn') as name from users where id = $1`, [r.rows[0].client_id]);
    const msg = buildNotificationMessage('shared_record_response', { expertName: r.rows[0].expert_name }, clientLocale)
      || `${r.rows[0].expert_name} vừa phản hồi hồ sơ bạn đã gửi.`;
    notify(r.rows[0].client_id, r.rows[0].expert_name, 'shared_record_response', msg, { code: 'shared_record_response', recordId: req.params.id }).catch(() => {});
    sendPushToUser(r.rows[0].client_id, '💬 Bác sĩ vừa phản hồi', msg, '/experts').catch(() => {});
    sendSharedRecordResponseEmail({ to: clientEmail, clientName: clientNameRes.rows[0]?.name, expertName: r.rows[0].expert_name, locale: clientLocale })
      .catch((e) => console.error('[SHARED_RECORD_RESPONSE_MAIL_FAIL]', e.message));

    return res.json({ success: true, data: inserted.rows[0] });
  } catch (error) {
    console.error('Create shared record response error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not save response' });
  }
});

export default router;
