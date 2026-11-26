import { Router } from 'express';
import { db } from '../../config/db.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { recordConsent } from '../../common/services/consent.service.js';
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

// Hồ sơ chuyên gia (experts.id) + tài khoản thật đứng sau nó — trước đây phải suy ra qua
// booking, giờ gửi tự do nên tra thẳng từ experts.
async function loadExpertProfile(expertProfileId) {
  const r = await db.query(
    `select e.id, e.user_id as expert_user_id, e.active, e.full_name as expert_name,
            coalesce(eu.display_name, eu.full_name, e.full_name) as expert_display_name
     from experts e
     left join users eu on eu.id = e.user_id
     where e.id = $1`,
    [expertProfileId]
  );
  return r.rows[0] || null;
}

async function getUserDisplayName(userId) {
  const r = await db.query(`select coalesce(display_name, full_name, 'Người dùng') as name from users where id = $1`, [userId]);
  return r.rows[0]?.name || 'Người dùng';
}

// ===== THÂN CHỦ =====
// Gửi tự do cho bất kỳ chuyên gia nào đang hoạt động — không còn bắt buộc phải có lịch
// hẹn đã xác nhận (yêu cầu ban đầu chỉ cho gửi trong lịch hẹn, đã được đổi thành gửi tự
// do, chọn chuyên gia nào thì gửi cho chuyên gia đó, xem thảo luận trong PR).

router.get('/experts/:id/shareable-summary', requireAuth, async (req, res) => {
  try {
    const expert = await loadExpertProfile(req.params.id);
    if (!expert || !expert.active) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên gia.' });
    if (!expert.expert_user_id) {
      return res.status(400).json({ success: false, message: 'Chuyên gia chưa có tài khoản trên hệ thống.' });
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
        expertName: expert.expert_display_name,
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

router.post('/experts/:id/shared-records', requireAuth, async (req, res) => {
  try {
    const expert = await loadExpertProfile(req.params.id);
    if (!expert || !expert.active) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên gia.' });
    if (!expert.expert_user_id) {
      return res.status(400).json({ success: false, message: 'Chuyên gia chưa có tài khoản trên hệ thống.' });
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

    const clientName = await getUserDisplayName(req.user.sub);

    const inserted = await db.query(
      `insert into client_shared_records (client_id, expert_id, snapshot)
       values ($1, $2, $3::jsonb) returning id, sent_at`,
      [req.user.sub, expert.expert_user_id, JSON.stringify(snapshot)]
    );
    const record = inserted.rows[0];
    // Bằng chứng khách đã đồng ý chia sẻ cho ĐÚNG chuyên gia này (Điều 7.3–7.4). Bản app cũ không gửi cờ
    // consent → không ghi (màn xác nhận cũ vẫn có cảnh báo).
    if (req.body.consent === true) {
      await recordConsent({
        userId: req.user.sub, kind: 'share_record', req,
        context: { expert_id: expert.id, expert_user_id: expert.expert_user_id, record_id: record.id, journal: journalRes.rows.length, mood: moodRes.rows.length, assessment: assessmentRes.rows.length }
      });
    }

    const { locale: expertLocale, email: expertEmail } = await getUserLocale(expert.expert_user_id);
    const msg = buildNotificationMessage('shared_record_sent', { clientName }, expertLocale)
      || `${clientName} vừa gửi nhật ký và kết quả test cho bạn.`;
    notify(expert.expert_user_id, clientName, 'shared_record_sent', msg, { code: 'shared_record_sent', recordId: record.id }).catch(() => {});
    sendPushToUser(expert.expert_user_id, '📋 Thân chủ vừa gửi hồ sơ', msg, '/expert/shared-records').catch(() => {});
    sendSharedRecordToExpertEmail({ to: expertEmail, expertName: expert.expert_display_name, clientName, locale: expertLocale })
      .catch((e) => console.error('[SHARED_RECORD_MAIL_FAIL]', e.message));

    return res.json({ success: true, data: { id: record.id, sentAt: record.sent_at } });
  } catch (error) {
    console.error('Create shared record error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not send shared record' });
  }
});

router.get('/my-shared-records', requireAuth, async (req, res) => {
  try {
    const expertProfileId = req.query.expertId || null;
    const params = [req.user.sub];
    let expertFilter = '';
    if (expertProfileId) {
      params.push(expertProfileId);
      expertFilter = `and e.id = $${params.length}`;
    }

    const r = await db.query(
      `select csr.id, csr.status, csr.sent_at, csr.revoked_at,
              coalesce(eu.display_name, eu.full_name, e.full_name) as expert_name
              , (select count(*)::int from client_shared_record_responses resp where resp.shared_record_id = csr.id) as response_count
       from client_shared_records csr
       join experts e on e.user_id = csr.expert_id
       left join users eu on eu.id = csr.expert_id
       where csr.client_id = $1 ${expertFilter}
       order by csr.sent_at desc`,
      params
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

    // Gộp thêm lịch hẹn của ĐÚNG thân chủ này với ĐÚNG bác sĩ này — mô tả tình trạng
    // (notes) + hồ sơ khám đính kèm lúc đặt lịch (MedicalRecordsViewer đọc theo booking id)
    // hiện ngay trong chi tiết hồ sơ gửi, để bác sĩ xem tất cả thông tin thân chủ 1 chỗ,
    // không phải chạy qua lại nhiều tab.
    const bookings = await db.query(
      `select eb.id, eb.session_type, eb.starts_at, eb.status, eb.notes
       from expert_bookings eb
       join experts e on e.id = eb.expert_id
       where eb.user_id = $1 and e.user_id = $2
       order by eb.starts_at desc`,
      [record.client_id, record.expert_id]
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
        responses: responses.rows,
        bookings: bookings.rows
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
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const countRes = await db.query(`select count(*)::int as total from client_shared_records where expert_id = $1`, [req.user.sub]);

    const r = await db.query(
      `select csr.id, csr.status, csr.sent_at, csr.revoked_at,
              coalesce(cu.display_name, cu.full_name, 'Người dùng') as client_name,
              (select count(*)::int from client_shared_record_responses resp where resp.shared_record_id = csr.id) as response_count
       from client_shared_records csr
       join users cu on cu.id = csr.client_id
       where csr.expert_id = $1
       order by csr.sent_at desc
       limit $2 offset $3`,
      [req.user.sub, limit, offset]
    );
    return res.json({ success: true, data: { items: r.rows, total: countRes.rows[0].total } });
  } catch (error) {
    console.error('List expert shared records error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load shared records' });
  }
});

// ===== BÁC SĨ — Hồ sơ thân chủ (gộp "hồ sơ gửi" + dữ liệu chia sẻ tự cập nhật) =====
// Một trang duy nhất cho mỗi thân chủ thay vì 2 tab chồng chéo:
//  - thân chủ ĐÃ ĐẶT LỊCH (lịch confirmed/completed với bác sĩ này): check-in, bài test, nhật ký đọc
//    THẲNG từ dữ liệu gốc khi thân chủ bật chia sẻ (client_expert_shares) → tự cập nhật; cộng thêm
//    những gì họ từng chủ động gửi.
//  - thân chủ CHƯA ĐẶT LỊCH: chỉ những gì họ đã gửi (bản chụp client_shared_records).
// Bản chụp đã bị thân chủ thu hồi thì không tính.
const LIVE_LIMIT = 500; // đủ cho biểu đồ + lịch; quá mức này là dữ liệu nhiều năm

async function expertProfileIdOf(userId) {
  const r = await db.query(`select id from experts where user_id = $1 limit 1`, [userId]);
  return r.rows[0]?.id || null;
}

router.get('/expert-portal/client-records', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const expertId = await expertProfileIdOf(req.user.sub);
    if (!expertId) return res.status(404).json({ success: false, message: 'Expert profile not found' });

    const r = await db.query(
      `with booked as (
         select user_id as client_id, max(starts_at) as last_booking_at
         from expert_bookings
         where expert_id = $1 and status in ('confirmed', 'completed')
         group by user_id
       ),
       sent as (
         select csr.client_id,
                count(*) filter (where csr.status <> 'revoked')::int as record_count,
                max(csr.sent_at) filter (where csr.status <> 'revoked') as last_sent_at,
                (select count(*)::int from client_shared_record_responses resp
                   join client_shared_records c2 on c2.id = resp.shared_record_id
                  where c2.client_id = csr.client_id and c2.expert_id = $2) as response_count
         from client_shared_records csr
         where csr.expert_id = $2
         group by csr.client_id
       ),
       ids as (select client_id from booked union select client_id from sent where record_count > 0)
       select ids.client_id, coalesce(u.display_name, u.full_name, 'Người dùng') as client_name, u.email,
              (b.client_id is not null) as booked, b.last_booking_at,
              coalesce(s.record_count, 0) as record_count, s.last_sent_at, coalesce(s.response_count, 0) as response_count,
              coalesce(sh.share_mood, false) as share_mood,
              coalesce(sh.share_assessments, false) as share_assessments,
              coalesce(sh.share_journal, false) as share_journal
       from ids
       join users u on u.id = ids.client_id
       left join booked b on b.client_id = ids.client_id
       left join sent s on s.client_id = ids.client_id
       left join client_expert_shares sh on sh.client_id = ids.client_id and sh.expert_id = $1
       order by greatest(coalesce(b.last_booking_at, 'epoch'), coalesce(s.last_sent_at, 'epoch')) desc`,
      [expertId, req.user.sub]
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('List expert client records error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load client records' });
  }
});

router.get('/expert-portal/client-records/:clientId', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const expertId = await expertProfileIdOf(req.user.sub);
    if (!expertId) return res.status(404).json({ success: false, message: 'Expert profile not found' });
    const clientId = req.params.clientId;
    if (!/^[0-9a-f-]{36}$/i.test(clientId)) return res.status(400).json({ success: false, message: 'Mã thân chủ không hợp lệ' });

    const [userRes, bookedRes, recordsRes, shareRes, bookingsRes] = await Promise.all([
      db.query(`select id, coalesce(display_name, full_name, 'Người dùng') as name, email from users where id = $1`, [clientId]),
      db.query(`select 1 from expert_bookings where expert_id = $1 and user_id = $2 and status in ('confirmed', 'completed') limit 1`, [expertId, clientId]),
      db.query(
        `select id, status, sent_at, revoked_at, snapshot from client_shared_records
         where client_id = $1 and expert_id = $2 order by sent_at desc`,
        [clientId, req.user.sub]
      ),
      db.query(`select share_mood, share_assessments, share_journal from client_expert_shares where client_id = $1 and expert_id = $2`, [clientId, expertId]),
      db.query(
        `select id, session_type, starts_at, status, notes from expert_bookings
         where user_id = $1 and expert_id = $2 order by starts_at desc`,
        [clientId, expertId]
      )
    ]);
    const client = userRes.rows[0];
    const booked = Boolean(bookedRes.rows[0]);
    const activeRecords = recordsRes.rows.filter((rec) => rec.status !== 'revoked');
    // Chỉ xem được thân chủ có quan hệ với bác sĩ này: đã đặt lịch, hoặc đã gửi hồ sơ (chưa thu hồi hết).
    if (!client || (!booked && !activeRecords.length)) {
      return res.status(403).json({ success: false, message: 'Thân chủ không thuộc danh sách của bạn' });
    }

    // Dữ liệu chia sẻ tự cập nhật (Điều 7.3): chỉ khi đã đặt lịch VÀ thân chủ bật đúng mục cho bác sĩ này.
    const share = shareRes.rows[0] || {};
    const live = { mood: booked && share.share_mood === true, assessments: booked && share.share_assessments === true, journal: booked && share.share_journal === true };
    const [moodRes, testRes, journalRes] = await Promise.all([
      live.mood
        ? db.query(
          `select id, mood_score, anxiety_score, stress_score, energy_score, sleep_quality_score, dominant_emotion, triggers, notes, created_at
           from mood_checkins where user_id = $1 order by created_at desc limit ${LIVE_LIMIT}`,
          [clientId]
        )
        : { rows: [] },
      live.assessments
        ? db.query(
          `select ar.id, a.name as assessment_name, ar.total_score, ar.severity, ar.dimension_scores, ar.interpreted_result, ar.created_at
           from assessment_results ar join assessments a on a.id = ar.assessment_id
           where ar.user_id = $1 and ar.administered_by is null
           order by ar.created_at desc limit ${LIVE_LIMIT}`,
          [clientId]
        )
        : { rows: [] },
      live.journal
        ? db.query(`select id, title, content, created_at from journal_entries where user_id = $1 order by created_at desc limit ${LIVE_LIMIT}`, [clientId])
        : { rows: [] }
    ]);

    // Gộp: bản gốc (tự cập nhật) trước, rồi những mục chỉ có trong hồ sơ gửi (đánh dấu fromRecord).
    const merge = (liveRows, key) => {
      const out = liveRows.map((row) => ({ ...row, total_score: row.total_score !== undefined ? Number(row.total_score || 0) : undefined }));
      const seen = new Set(out.map((row) => String(row.id)));
      for (const rec of activeRecords) {
        for (const item of rec.snapshot?.[key] || []) {
          if (seen.has(String(item.id))) continue;
          seen.add(String(item.id));
          out.push({ ...item, fromRecord: true });
        }
      }
      return out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    };

    const responsesRes = activeRecords.length
      ? await db.query(
        `select id, shared_record_id, content, created_at from client_shared_record_responses
         where shared_record_id = any($1::uuid[]) order by created_at asc`,
        [activeRecords.map((rec) => rec.id)]
      )
      : { rows: [] };

    return res.json({
      success: true,
      data: {
        clientId,
        clientName: client.name,
        clientEmail: client.email,
        booked,
        live,
        journalEntries: merge(journalRes.rows, 'journalEntries'),
        moodCheckins: merge(moodRes.rows, 'moodCheckins'),
        assessmentResults: merge(testRes.rows, 'assessmentResults'),
        bookings: bookingsRes.rows,
        // các lần gửi còn hiệu lực (mới nhất trước) — phản hồi của bác sĩ gắn vào lần gửi mới nhất
        records: activeRecords.map((rec) => ({ id: rec.id, sentAt: rec.sent_at })),
        revokedCount: recordsRes.rows.length - activeRecords.length,
        responses: responsesRes.rows
      }
    });
  } catch (error) {
    console.error('Get expert client record error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load client record' });
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
