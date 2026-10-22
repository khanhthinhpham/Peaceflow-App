import { Router } from 'express';
import { db } from '../../config/db.js';
import { verifyAccessToken } from '../../common/utils/jwt.js';
import { findUserById } from '../auth/auth.repository.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { sendScreeningRedAlertEmail, sendScreeningSelfHelpEmail } from '../../common/services/email.service.js';
import { env } from '../../config/env.js';
import { getScreeningAiSummary } from '../ai/ai.service.js';
import { detectCrisisSignals, logCrisisFlag } from '../ai/ai.safety.js';
import { nextCaseCode } from '../../common/utils/case-code.js';

const router = Router();

const DIFFICULTY_KEYS = [
  'ap_luc_hoc_tap', 'lo_lang_cang_thang', 'buon_chan_mat_hung_thu', 'kho_kiem_soat_cam_xuc',
  'mau_thuan_ban_be', 'mau_thuan_gia_dinh', 'bi_treu_choc_bat_nat', 'kho_khan_mang_xa_hoi',
  'kho_khan_dinh_huong_nghe_nghiep', 'kho_khan_hoan_canh_gia_dinh', 'khong_co_kho_khan'
];
const SUPPORT_NEED_KEYS = [
  'ky_nang_quan_ly_cang_thang', 'ky_nang_hoc_tap', 'ky_nang_dieu_hoa_cam_xuc',
  'ky_nang_giao_tiep', 'phong_chong_bao_luc', 'an_toan_mang', 'tu_van_huong_nghiep',
  'tro_chuyen_rieng', 'khong_co_nhu_cau'
];
const REFERRAL_CATEGORY_KEYS = ['hoc_tap', 'huong_nghiep', 'giao_tiep', 'phat_trien_ban_than'];
const REFERRAL_SUPPORT_FORMAT_KEYS = ['tai_lieu', 'tu_van_truong', 'ket_noi_chuyen_gia', 'ho_tro_khan'];

function pickKnownKeys(input, allowed) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((v) => allowed.includes(v)))];
}

// Form công khai, học sinh có thể chưa có tài khoản — nếu có token hợp lệ thì gắn user_id,
// không có/token hỏng thì vẫn cho nộp phiếu bình thường (ẩn danh).
async function attachUserIfPresent(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      const user = await findUserById(payload.sub);
      if (user) req.user = { id: user.id };
    } catch (_error) {
      // Token hỏng/hết hạn -> coi như chưa đăng nhập, không chặn nộp phiếu.
    }
  }
  next();
}

// Ngưỡng xếp màu theo tổng điểm Phần 2 (6 câu x 1-5, điểm càng cao càng ổn) — nhà trường
// cho: <=10 đỏ (cần ưu tiên), 11-19 vàng (cần quan tâm), 20-30 xanh (mức nhẹ).
function riskBandFromScore(total) {
  if (total <= 10) return 'do';
  if (total <= 19) return 'vang';
  return 'xanh';
}

// Theo tài liệu "Cổng dữ liệu số tư vấn học đường Nghệ An": Đỏ phải tự động bật cho CẢ
// "bạo lực, xâm hại, đe dọa" — không chỉ dựa vào điểm số Phần 2 (1 học sinh có thể điểm
// không quá thấp nhưng vẫn đang bị bắt nạt/bạo lực nghiêm trọng).
const FORCE_RED_DIFFICULTY_KEYS = new Set(['bi_treu_choc_bat_nat']);

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

// ===== CÔNG KHAI =====

router.get('/screening/schools', async (_req, res) => {
  try {
    const r = await db.query(
      `select id, name from screening_schools where active = true order by name asc`
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('List screening schools error:', error);
    return res.status(500).json({ success: false, message: 'Không tải được danh sách trường.' });
  }
});

router.post('/screening/responses', attachUserIfPresent, async (req, res) => {
  try {
    const body = req.body || {};

    const scoresRaw = Array.isArray(body.wellbeingScores) ? body.wellbeingScores : [];
    const scores = scoresRaw.map((n) => Math.min(5, Math.max(1, parseInt(n, 10) || 0)));
    if (scores.length !== 6 || scores.some((n) => !n)) {
      return res.status(400).json({ success: false, message: 'Vui lòng trả lời đủ 6 câu ở Phần 2.' });
    }
    const total = scores.reduce((sum, n) => sum + n, 0);

    const gender = ['male', 'female', 'unspecified'].includes(body.gender) ? body.gender : 'unspecified';
    const referralRiskLevel = ['xanh', 'vang', 'do'].includes(body.referralRiskLevel) ? body.referralRiskLevel : null;
    const difficulties = pickKnownKeys(body.difficulties, DIFFICULTY_KEYS);
    const supportNeeds = pickKnownKeys(body.supportNeeds, SUPPORT_NEED_KEYS);
    const referralCategories = pickKnownKeys(body.referralCategories, REFERRAL_CATEGORY_KEYS);
    const referralSupportFormat = pickKnownKeys(body.referralSupportFormat, REFERRAL_SUPPORT_FORMAT_KEYS);

    // Đỏ tự động: điểm thấp (riskBandFromScore), HOẶC đã chọn khó khăn thuộc nhóm bắt
    // nạt/bạo lực (FORCE_RED_DIFFICULTY_KEYS), HOẶC "Chia sẻ thêm" có dấu hiệu khủng hoảng —
    // bất kể điểm số, vì 1 trong 3 điều kiện này đã đủ nghiêm trọng (đúng yêu cầu tài liệu).
    const crisisSignals = detectCrisisSignals(body.shareNote);
    const forcedRedByDifficulty = difficulties.some((d) => FORCE_RED_DIFFICULTY_KEYS.has(d));
    const band = (forcedRedByDifficulty || crisisSignals.length) ? 'do' : riskBandFromScore(total);

    const caseCode = await nextCaseCode();

    const r = await db.query(
      `insert into screening_responses (
        case_code, school_id, user_id, student_name, grade, class_name, gender, contact,
        wellbeing_scores, wellbeing_total, risk_band,
        difficulties, difficulties_other, support_needs, support_needs_other,
        share_note, consent_contact,
        referral_categories, referral_risk_level, referral_support_format, referral_phone, referral_description,
        confirm_note
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::jsonb, $10, $11,
        $12::jsonb, $13, $14::jsonb, $15,
        $16, $17,
        $18::jsonb, $19, $20::jsonb, $21, $22,
        $23
      ) returning id, created_at`,
      [
        caseCode, body.schoolId || null, req.user?.id || null, body.studentName || null, body.grade || null, body.className || null, gender, body.contact || null,
        JSON.stringify(scores), total, band,
        JSON.stringify(difficulties), body.difficultiesOther || null,
        JSON.stringify(supportNeeds), body.supportNeedsOther || null,
        body.shareNote || null, Boolean(body.consentContact),
        JSON.stringify(referralCategories), referralRiskLevel,
        JSON.stringify(referralSupportFormat), body.referralPhone || null, body.referralDescription || null,
        body.confirmNote || null
      ]
    );

    if (crisisSignals.length) logCrisisFlag(req.user?.id || null, crisisSignals, { source: 'screening_submit' });

    // Đỏ HOẶC Vàng -> báo ngay cho tổ tư vấn (đầu mối trường) + admin, không đợi tổng hợp
    // cuối tháng — đúng luồng tài liệu ("Vàng: gửi email thông báo cho tổ tư vấn" ngay khi
    // phát sinh, không gộp chờ). Mức Xanh xử lý riêng bên dưới (tự trả lời người nộp).
    if (band === 'do' || band === 'vang') {
      (async () => {
        const school = body.schoolId
          ? (await db.query(`select name, contact_email from screening_schools where id = $1`, [body.schoolId])).rows[0]
          : null;

        const basePayload = {
          caseCode, schoolName: school?.name,
          studentName: body.studentName,
          grade: body.grade,
          className: body.className,
          createdAt: r.rows[0].created_at,
          total, wellbeingScores: scores, band, crisisDetected: crisisSignals.length > 0,
          difficulties, difficultiesOther: body.difficultiesOther,
          supportNeeds, supportNeedsOther: body.supportNeedsOther,
          shareNote: body.shareNote, consentContact: Boolean(body.consentContact), contact: body.contact,
          referralCategories, referralRiskLevel, referralSupportFormat
        };

        if (school?.contact_email) {
          await sendScreeningRedAlertEmail({ ...basePayload, to: school.contact_email, includeAdminLink: false });
        }
        if (env.screeningAdminEmails.length) {
          await sendScreeningRedAlertEmail({ ...basePayload, to: env.screeningAdminEmails, includeAdminLink: true });
        }
      })().catch((error) => console.error('Send screening red alert email error:', error?.message || error));
    }

    // Xanh -> tự động gửi email tài liệu tự trợ giúp CHO NGƯỜI NỘP (nếu ô liên hệ điền
    // đúng định dạng email) — đúng luồng tài liệu ("Xanh: gửi email phản hồi và tài liệu
    // phù hợp"). Phiếu để ô liên hệ tự do (SĐT hoặc email) nên phải tự nhận diện định dạng.
    if (band === 'xanh' && looksLikeEmail(body.contact)) {
      sendScreeningSelfHelpEmail({ to: body.contact, studentName: body.studentName, locale: req.locale })
        .catch((error) => console.error('Send screening self-help email error:', error?.message || error));
    }

    return res.json({ success: true, data: { id: r.rows[0].id, caseCode, riskBand: band, total } });
  } catch (error) {
    console.error('Submit screening response error:', error);
    return res.status(500).json({ success: false, message: 'Không gửi được phiếu khảo sát.' });
  }
});

// Nhận xét AI cho TOÀN BỘ phiếu, không chỉ điểm Phần 2 — kết hợp cả khó khăn đang gặp
// (Phần 3), nhu cầu hỗ trợ (Phần 4), chia sẻ thêm (Phần 5), và phiếu đăng ký hỗ trợ tự
// chọn (Phần 6) để AI nhìn được bức tranh đầy đủ, không chỉ mỗi con số. Public (không cần
// đăng nhập) vì form sàng lọc tự nó đã công khai — chỉ cần biết id phiếu vừa nộp (uuid) là
// xem được, không có gì nhạy cảm hơn những gì chính phiếu đó chứa.
router.post('/screening/responses/:id/ai-summary', async (req, res) => {
  try {
    const result = await db.query(
      `select wellbeing_scores, wellbeing_total, risk_band,
              difficulties, difficulties_other, support_needs, support_needs_other,
              share_note, referral_categories, referral_risk_level, referral_support_format
       from screening_responses where id = $1 limit 1`,
      [req.params.id]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu này.' });
    }

    const { summary, interpretation } = await getScreeningAiSummary({
      userId: req.user?.id || null,
      wellbeingScores: row.wellbeing_scores || [],
      total: row.wellbeing_total,
      band: row.risk_band,
      difficulties: row.difficulties || [], difficultiesOther: row.difficulties_other,
      supportNeeds: row.support_needs || [], supportNeedsOther: row.support_needs_other,
      shareNote: row.share_note,
      referralCategories: row.referral_categories || [], referralRiskLevel: row.referral_risk_level,
      referralSupportFormat: row.referral_support_format || [],
      locale: req.locale
    });

    return res.json({ success: true, data: { summary, interpretation } });
  } catch (error) {
    console.error('Screening AI summary error:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo nhận xét AI lúc này.' });
  }
});

// ===== ADMIN =====

router.get('/admin/screening/schools', requireAuth, async (req, res) => {
  try {
    if (!req.user?.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(
      `select s.id, s.name, s.contact_name, s.contact_email, s.contact_phone, s.active, s.created_at,
              count(r.id)::int as response_count
       from screening_schools s
       left join screening_responses r on r.school_id = s.id
       group by s.id
       order by s.name asc`
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('Admin list screening schools error:', error);
    return res.status(500).json({ success: false, message: 'Không tải được danh sách trường.' });
  }
});

router.post('/admin/screening/schools', requireAuth, async (req, res) => {
  try {
    if (!req.user?.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Thiếu tên trường.' });
    const r = await db.query(
      `insert into screening_schools (name, contact_name, contact_email, contact_phone)
       values ($1, $2, $3, $4) returning id`,
      [name, req.body?.contactName || null, req.body?.contactEmail || null, req.body?.contactPhone || null]
    );
    return res.json({ success: true, data: { id: r.rows[0].id } });
  } catch (error) {
    console.error('Admin create screening school error:', error);
    return res.status(500).json({ success: false, message: 'Không tạo được trường.' });
  }
});

router.patch('/admin/screening/schools/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user?.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const fields = [];
    const params = [];
    const map = { name: 'name', contactName: 'contact_name', contactEmail: 'contact_email', contactPhone: 'contact_phone', active: 'active' };
    for (const [key, col] of Object.entries(map)) {
      if (req.body?.[key] !== undefined) {
        params.push(req.body[key]);
        fields.push(`${col} = $${params.length}`);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Không có gì để cập nhật.' });
    params.push(req.params.id);
    await db.query(`update screening_schools set ${fields.join(', ')} where id = $${params.length}`, params);
    return res.json({ success: true });
  } catch (error) {
    console.error('Admin update screening school error:', error);
    return res.status(500).json({ success: false, message: 'Không cập nhật được trường.' });
  }
});

router.delete('/admin/screening/schools/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user?.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    await db.query(`delete from screening_schools where id = $1`, [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Admin delete screening school error:', error);
    return res.status(500).json({ success: false, message: 'Không xoá được trường.' });
  }
});

router.get('/admin/screening/responses', requireAuth, async (req, res) => {
  try {
    if (!req.user?.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const conditions = [];
    const params = [];

    if (req.query.schoolId) {
      params.push(req.query.schoolId);
      conditions.push(`r.school_id = $${params.length}`);
    }
    if (['xanh', 'vang', 'do'].includes(req.query.riskBand)) {
      params.push(req.query.riskBand);
      conditions.push(`r.risk_band = $${params.length}`);
    }
    if (req.query.from) {
      params.push(req.query.from);
      conditions.push(`r.created_at >= $${params.length}`);
    }
    if (req.query.to) {
      params.push(req.query.to);
      conditions.push(`r.created_at <= $${params.length}`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const countRes = await db.query(`select count(*)::int as total from screening_responses r ${where}`, params);

    params.push(limit, offset);
    const r = await db.query(
      `select r.*, s.name as school_name
       from screening_responses r
       left join screening_schools s on s.id = r.school_id
       ${where}
       order by r.created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params
    );

    return res.json({ success: true, data: { total: countRes.rows[0]?.total || 0, limit, offset, items: r.rows } });
  } catch (error) {
    console.error('Admin list screening responses error:', error);
    return res.status(500).json({ success: false, message: 'Không tải được danh sách phiếu.' });
  }
});

// Tổng hợp theo trường + khoảng thời gian — dữ liệu để admin xem/xuất gửi đầu mối trường
// (gửi tự động hàng tháng để sau, hiện tại admin tự xuất CSV và gửi thủ công).
router.get('/admin/screening/summary', requireAuth, async (req, res) => {
  try {
    if (!req.user?.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });

    const conditions = [];
    const params = [];
    if (req.query.schoolId) {
      params.push(req.query.schoolId);
      conditions.push(`r.school_id = $${params.length}`);
    }
    if (req.query.from) {
      params.push(req.query.from);
      conditions.push(`r.created_at >= $${params.length}`);
    }
    if (req.query.to) {
      params.push(req.query.to);
      conditions.push(`r.created_at <= $${params.length}`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const [byBand, byDifficulty, bySupportNeed, total] = await Promise.all([
      db.query(`select risk_band, count(*)::int as count from screening_responses r ${where} group by risk_band`, params),
      db.query(
        `select key as difficulty, count(*)::int as count
         from screening_responses r, jsonb_array_elements_text(r.difficulties) as key
         ${where}
         group by key order by count desc`,
        params
      ),
      db.query(
        `select key as support_need, count(*)::int as count
         from screening_responses r, jsonb_array_elements_text(r.support_needs) as key
         ${where}
         group by key order by count desc`,
        params
      ),
      db.query(`select count(*)::int as total from screening_responses r ${where}`, params)
    ]);

    return res.json({
      success: true,
      data: {
        total: total.rows[0]?.total || 0,
        byBand: byBand.rows,
        byDifficulty: byDifficulty.rows,
        bySupportNeed: bySupportNeed.rows
      }
    });
  } catch (error) {
    console.error('Admin screening summary error:', error);
    return res.status(500).json({ success: false, message: 'Không tạo được bản tổng hợp.' });
  }
});

export default router;
