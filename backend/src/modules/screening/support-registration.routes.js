import { Router } from 'express';
import { db } from '../../config/db.js';
import { verifyAccessToken } from '../../common/utils/jwt.js';
import { findUserById } from '../auth/auth.repository.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';

const router = Router();

const INFORMANT_KEYS = ['hoc_sinh', 'cha_me', 'giao_vien', 'khac'];
const ISSUE_CATEGORY_KEYS = ['hoc_tap', 'huong_nghiep', 'giao_tiep', 'phat_trien_ban_than', 'khac'];
const RISK_LEVEL_KEYS = ['xanh', 'vang', 'do', 'khac'];
const SUPPORT_FORMAT_KEYS = ['tai_lieu', 'tu_van_truong', 'ket_noi_chuyen_gia', 'ho_tro_khan', 'khac'];

function pickKnownKeys(input, allowed) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((v) => allowed.includes(v)))];
}

// Form công khai — nếu có token hợp lệ thì gắn user_id, không có/hỏng vẫn cho đăng ký.
async function attachUserIfPresent(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      const user = await findUserById(payload.sub);
      if (user) req.user = { id: user.id };
    } catch (_error) {
      // Token hỏng/hết hạn -> coi như chưa đăng nhập, không chặn đăng ký.
    }
  }
  next();
}

// ===== CÔNG KHAI =====

router.post('/support-registrations', attachUserIfPresent, async (req, res) => {
  try {
    const body = req.body || {};

    const email = (body.email || '').trim();
    const className = (body.className || '').trim();
    const studentName = (body.studentName || '').trim();
    const issueDescription = (body.issueDescription || '').trim();
    const phone = (body.phone || '').trim();

    if (!INFORMANT_KEYS.includes(body.informant)) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn người cung cấp thông tin.' });
    }
    if (!className || !studentName || !issueDescription) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ các trường bắt buộc.' });
    }
    // Học sinh tự điền thường không muốn/không tiện cho liên hệ riêng; cha mẹ/giáo viên thì
    // nhà trường cần liên hệ lại được nên bắt buộc với họ (khớp validate ở frontend).
    const contactRequired = body.informant === 'cha_me' || body.informant === 'giao_vien';
    if (contactRequired && (!email || !phone)) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và số điện thoại.' });
    }
    const riskLevel = RISK_LEVEL_KEYS.includes(body.riskLevel) ? body.riskLevel : null;
    if (!riskLevel) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn mức độ cần hỗ trợ.' });
    }

    const r = await db.query(
      `insert into support_registrations (
        user_id, email, informant, informant_other,
        school_id, school_other, grade, grade_other, class_name, student_name,
        issue_categories, issue_categories_other, issue_description,
        risk_level, risk_level_other,
        support_format, support_format_other,
        phone, consent, confirm_note
      ) values (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11::jsonb, $12, $13,
        $14, $15,
        $16::jsonb, $17,
        $18, $19, $20
      ) returning id, created_at`,
      [
        req.user?.id || null, email || null, body.informant, body.informantOther || null,
        body.schoolId || null, body.schoolOther || null, body.grade || null, body.gradeOther || null, className, studentName,
        JSON.stringify(pickKnownKeys(body.issueCategories, ISSUE_CATEGORY_KEYS)), body.issueCategoriesOther || null, issueDescription,
        riskLevel, body.riskLevelOther || null,
        JSON.stringify(pickKnownKeys(body.supportFormat, SUPPORT_FORMAT_KEYS)), body.supportFormatOther || null,
        phone || null, Boolean(body.consent), body.confirmNote || null
      ]
    );

    return res.json({ success: true, data: { id: r.rows[0].id } });
  } catch (error) {
    console.error('Submit support registration error:', error);
    return res.status(500).json({ success: false, message: 'Không gửi được phiếu đăng ký.' });
  }
});

// ===== ADMIN =====

router.get('/admin/support-registrations', requireAuth, async (req, res) => {
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
    if (['xanh', 'vang', 'do', 'khac'].includes(req.query.riskLevel)) {
      params.push(req.query.riskLevel);
      conditions.push(`r.risk_level = $${params.length}`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const countRes = await db.query(`select count(*)::int as total from support_registrations r ${where}`, params);

    params.push(limit, offset);
    const r = await db.query(
      `select r.*, s.name as school_name
       from support_registrations r
       left join screening_schools s on s.id = r.school_id
       ${where}
       order by r.created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params
    );

    return res.json({ success: true, data: { total: countRes.rows[0]?.total || 0, limit, offset, items: r.rows } });
  } catch (error) {
    console.error('Admin list support registrations error:', error);
    return res.status(500).json({ success: false, message: 'Không tải được danh sách phiếu đăng ký.' });
  }
});

router.get('/admin/support-registrations/summary', requireAuth, async (req, res) => {
  try {
    if (!req.user?.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });

    const conditions = [];
    const params = [];
    if (req.query.schoolId) {
      params.push(req.query.schoolId);
      conditions.push(`r.school_id = $${params.length}`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const [byRisk, byIssue, bySupportFormat, total] = await Promise.all([
      db.query(`select risk_level, count(*)::int as count from support_registrations r ${where} group by risk_level`, params),
      db.query(
        `select key as issue_category, count(*)::int as count
         from support_registrations r, jsonb_array_elements_text(r.issue_categories) as key
         ${where}
         group by key order by count desc`,
        params
      ),
      db.query(
        `select key as support_format, count(*)::int as count
         from support_registrations r, jsonb_array_elements_text(r.support_format) as key
         ${where}
         group by key order by count desc`,
        params
      ),
      db.query(`select count(*)::int as total from support_registrations r ${where}`, params)
    ]);

    return res.json({
      success: true,
      data: {
        total: total.rows[0]?.total || 0,
        byRisk: byRisk.rows,
        byIssue: byIssue.rows,
        bySupportFormat: bySupportFormat.rows
      }
    });
  } catch (error) {
    console.error('Admin support registration summary error:', error);
    return res.status(500).json({ success: false, message: 'Không tạo được bản tổng hợp.' });
  }
});

export default router;
