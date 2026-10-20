import { Router } from 'express';
import { db } from '../../config/db.js';
import { verifyAccessToken } from '../../common/utils/jwt.js';
import { findUserById } from '../auth/auth.repository.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';

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
    const band = riskBandFromScore(total);

    const gender = ['male', 'female', 'unspecified'].includes(body.gender) ? body.gender : 'unspecified';
    const referralRiskLevel = ['xanh', 'vang', 'do'].includes(body.referralRiskLevel) ? body.referralRiskLevel : null;

    const r = await db.query(
      `insert into screening_responses (
        school_id, user_id, student_name, grade, class_name, gender, contact,
        wellbeing_scores, wellbeing_total, risk_band,
        difficulties, difficulties_other, support_needs, support_needs_other,
        share_note, consent_contact,
        referral_categories, referral_risk_level, referral_support_format, referral_phone, referral_description,
        confirm_note
      ) values (
        $1, $2, $3, $4, $5, $6, $7,
        $8::jsonb, $9, $10,
        $11::jsonb, $12, $13::jsonb, $14,
        $15, $16,
        $17::jsonb, $18, $19::jsonb, $20, $21,
        $22
      ) returning id, created_at`,
      [
        body.schoolId || null, req.user?.id || null, body.studentName || null, body.grade || null, body.className || null, gender, body.contact || null,
        JSON.stringify(scores), total, band,
        JSON.stringify(pickKnownKeys(body.difficulties, DIFFICULTY_KEYS)), body.difficultiesOther || null,
        JSON.stringify(pickKnownKeys(body.supportNeeds, SUPPORT_NEED_KEYS)), body.supportNeedsOther || null,
        body.shareNote || null, Boolean(body.consentContact),
        JSON.stringify(pickKnownKeys(body.referralCategories, REFERRAL_CATEGORY_KEYS)), referralRiskLevel,
        JSON.stringify(pickKnownKeys(body.referralSupportFormat, REFERRAL_SUPPORT_FORMAT_KEYS)), body.referralPhone || null, body.referralDescription || null,
        body.confirmNote || null
      ]
    );

    return res.json({ success: true, data: { id: r.rows[0].id, riskBand: band, total } });
  } catch (error) {
    console.error('Submit screening response error:', error);
    return res.status(500).json({ success: false, message: 'Không gửi được phiếu khảo sát.' });
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
