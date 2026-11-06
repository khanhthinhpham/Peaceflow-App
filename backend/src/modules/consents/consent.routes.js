import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { TERMS_VERSION, recordConsent, getConsentStatus } from '../../common/services/consent.service.js';

// Đồng ý điều khoản cho khách hàng đã có tài khoản (đăng nhập Google lần đầu, tài khoản cũ,
// hoặc khi điều khoản đổi phiên bản) + bật/tắt đồng ý xử lý Dữ liệu sức khỏe.
const router = Router();

router.get('/consents/status', requireAuth, async (req, res) => {
  try {
    return res.json({ success: true, data: await getConsentStatus(req.user.sub) });
  } catch (error) {
    console.error('Consent status error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load consent status' });
  }
});

const acceptSchema = z.object({
  version: z.literal(TERMS_VERSION, { errorMap: () => ({ message: 'Điều khoản đã được cập nhật, vui lòng tải lại trang.' }) }),
  terms: z.literal(true, { errorMap: () => ({ message: 'Bạn cần đồng ý điều khoản để tiếp tục.' }) }),
  age_confirmed: z.literal(true, { errorMap: () => ({ message: 'Bạn cần xác nhận độ tuổi.' }) }),
  sensitive_data: z.boolean().optional()
});

router.post('/consents/accept', requireAuth, async (req, res) => {
  try {
    const body = acceptSchema.parse(req.body);
    const userId = req.user.sub;
    await recordConsent({ userId, kind: 'terms', context: { source: 'terms_gate', age_confirmed: true }, req, strict: true });
    await db.query(`update users set consent_terms = true, consent_privacy = true where id = $1`, [userId]);
    if (typeof body.sensitive_data === 'boolean') {
      await recordConsent({ userId, kind: 'sensitive_data', granted: body.sensitive_data, context: { source: 'terms_gate' }, req, strict: true });
      await db.query(`update users set consent_sensitive_data = $2 where id = $1`, [userId, body.sensitive_data]);
    }
    return res.json({ success: true, data: await getConsentStatus(userId) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0]?.message || 'Dữ liệu không hợp lệ' });
    console.error('Consent accept error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not save consent' });
  }
});

// Bật / rút lại đồng ý xử lý Dữ liệu sức khỏe (Điều 7.1 — tách riêng, có thể rút lại bất cứ lúc nào).
router.put('/consents/sensitive-data', requireAuth, async (req, res) => {
  try {
    const { granted } = z.object({ granted: z.boolean() }).parse(req.body);
    await recordConsent({ userId: req.user.sub, kind: 'sensitive_data', granted, context: { source: 'settings' }, req, strict: true });
    await db.query(`update users set consent_sensitive_data = $2 where id = $1`, [req.user.sub, granted]);
    return res.json({ success: true, data: await getConsentStatus(req.user.sub) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    console.error('Consent sensitive error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not save consent' });
  }
});

// ===== Điều 7.3: chia sẻ check-in / kết quả sàng lọc cho TỪNG chuyên gia =====
// Danh sách chuyên gia khách đã từng đặt lịch (trừ lịch huỷ/hết hạn) + trạng thái chia sẻ với từng người.
router.get('/my-expert-shares', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `select e.id as expert_id, e.full_name, e.degree, e.expert_group, e.avatar_emoji,
              (e.avatar_photo is not null) as has_avatar_photo,
              coalesce(s.share_mood, false) as share_mood,
              coalesce(s.share_assessments, false) as share_assessments,
              coalesce(s.share_journal, false) as share_journal,
              s.updated_at
       from experts e
       left join client_expert_shares s on s.expert_id = e.id and s.client_id = $1
       where e.id in (
         select expert_id from expert_bookings
         where user_id = $1 and status not in ('cancelled', 'expired', 'rejected')
       ) or s.client_id is not null
       order by e.full_name`,
      [req.user.sub]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('My expert shares error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load sharing settings' });
  }
});

router.put('/my-expert-shares/:expertId', requireAuth, async (req, res) => {
  try {
    const body = z.object({ share_mood: z.boolean(), share_assessments: z.boolean(), share_journal: z.boolean().default(false) }).parse(req.body);
    const ex = await db.query(`select id from experts where id = $1 limit 1`, [req.params.expertId]);
    if (!ex.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên gia.' });
    await db.query(
      `insert into client_expert_shares (client_id, expert_id, share_mood, share_assessments, share_journal, updated_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (client_id, expert_id)
       do update set share_mood = excluded.share_mood, share_assessments = excluded.share_assessments,
                     share_journal = excluded.share_journal, updated_at = now()`,
      [req.user.sub, req.params.expertId, body.share_mood, body.share_assessments, body.share_journal]
    );
    await recordConsent({
      userId: req.user.sub, kind: 'expert_share', granted: body.share_mood || body.share_assessments || body.share_journal, req,
      context: { expert_id: req.params.expertId, share_mood: body.share_mood, share_assessments: body.share_assessments, share_journal: body.share_journal }
    });
    return res.json({ success: true, data: { expert_id: req.params.expertId, ...body } });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    console.error('Update expert share error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not save sharing setting' });
  }
});

export default router;
