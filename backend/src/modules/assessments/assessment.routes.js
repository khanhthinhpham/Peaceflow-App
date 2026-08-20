import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file ảnh'));
    }
    cb(null, true);
  }
});

const ASSESSMENT_ORDER = ['DASS21', 'GAD7', 'HARS', 'PHQ9', 'PSQI'];

router.get('/assessments', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const result = await db.query(
      `select
         a.id,
         a.code,
         a.name,
         a.version,
         a.description,
         latest_result.id as latest_result_id,
         latest_result.total_score as latest_total_score,
         latest_result.severity as latest_severity,
         latest_result.dimension_scores as latest_dimension_scores,
         latest_result.interpreted_result as latest_interpreted_result,
         latest_result.created_at as latest_taken_at
       from assessments a
       left join lateral (
         select
           ar.id,
           ar.total_score,
           ar.severity,
           ar.dimension_scores,
           ar.interpreted_result,
           ar.created_at
         from assessment_results ar
         where ar.user_id = $1
           and ar.assessment_id = a.id
         order by ar.created_at desc
         limit 1
       ) latest_result on true
       where a.active = true
       order by
         case a.code
           when 'DASS21' then 1
           when 'GAD7' then 2
           when 'HARS' then 3
           when 'PHQ9' then 4
           when 'PSQI' then 5
           else 99
         end,
         a.name asc`,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        latest_total_score: row.latest_total_score === null ? null : Number(row.latest_total_score)
      }))
    });
  } catch (error) {
    console.error('Assessments list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not fetch assessments'
    });
  }
});

router.get('/assessments/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 6)));

    const result = await db.query(
      `select
         ar.id,
         a.code,
         a.name,
         ar.total_score,
         ar.severity,
         ar.dimension_scores,
         ar.interpreted_result,
         ar.respondent_name,
         ar.respondent_age,
         ar.note,
         (ar.attachment_file is not null) as has_attachment,
         ar.created_at
       from assessment_results ar
       join assessments a on a.id = ar.assessment_id
       where ar.user_id = $1
       order by ar.created_at desc
       limit $2`,
      [userId, limit]
    );

    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        total_score: Number(row.total_score || 0)
      }))
    });
  } catch (error) {
    console.error('Assessment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not fetch assessment history'
    });
  }
});

router.post('/assessments/:code/submit', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const assessmentCode = String(req.params.code || '').trim().toUpperCase();
    const {
      raw_answers,
      total_score,
      severity,
      dimension_scores,
      interpreted_result,
      respondent_name,
      respondent_age,
      note
    } = req.body;

    if (!assessmentCode) {
      return res.status(400).json({
        success: false,
        message: 'Assessment code is required'
      });
    }

    if (typeof total_score !== 'number' || Number.isNaN(total_score)) {
      return res.status(400).json({
        success: false,
        message: 'total_score must be a valid number'
      });
    }

    const assessmentRes = await db.query(
      `select id, code, name
       from assessments
       where upper(code) = $1
         and active = true
       limit 1`,
      [assessmentCode]
    );

    const assessment = assessmentRes.rows[0];
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const insertRes = await db.query(
      `insert into assessment_results (
         user_id,
         assessment_id,
         raw_answers,
         total_score,
         severity,
         dimension_scores,
         interpreted_result,
         respondent_name,
         respondent_age,
         note
       )
       values ($1, $2, $3::jsonb, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)
       returning *`,
      [
        userId,
        assessment.id,
        JSON.stringify(raw_answers || []),
        Number(total_score),
        severity || null,
        JSON.stringify(dimension_scores || {}),
        JSON.stringify(interpreted_result || {}),
        respondent_name ? String(respondent_name).slice(0, 255) : null,
        Number.isFinite(Number(respondent_age)) ? Math.round(Number(respondent_age)) : null,
        note ? String(note).slice(0, 2000) : null
      ]
    );

    const historyRes = await db.query(
      `select
         ar.id,
         a.code,
         a.name,
         ar.total_score,
         ar.severity,
         ar.dimension_scores,
         ar.interpreted_result,
         ar.respondent_name,
         ar.respondent_age,
         ar.note,
         ar.created_at
       from assessment_results ar
       join assessments a on a.id = ar.assessment_id
       where ar.user_id = $1
       order by ar.created_at desc
       limit 6`,
      [userId]
    );

    return res.status(201).json({
      success: true,
      data: {
        ...insertRes.rows[0],
        assessment: {
          id: assessment.id,
          code: assessment.code,
          name: assessment.name
        },
        total_score: Number(insertRes.rows[0].total_score || 0),
        recent_history: historyRes.rows.map((row) => ({
          ...row,
          total_score: Number(row.total_score || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Assessment submit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not submit assessment result'
    });
  }
});

// Đính kèm 1 ảnh vào kết quả đã nộp (vd ảnh phiếu trả lời giấy của bài Raven) để
// chuyên gia xem lại khi chấm điểm thủ công. Chỉ chủ sở hữu kết quả mới được đính kèm.
router.post('/assessments/results/:id/attachment', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Thiếu file ảnh' });
    }

    const ownerRes = await db.query(
      `select id from assessment_results where id = $1 and user_id = $2 limit 1`,
      [req.params.id, req.user.sub]
    );
    if (!ownerRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này' });
    }

    await db.query(
      `update assessment_results
       set attachment_file = $2, attachment_filename = $3, attachment_mime = $4
       where id = $1`,
      [req.params.id, req.file.buffer, req.file.originalname || 'anh-dinh-kem', req.file.mimetype]
    );

    return res.json({ success: true, data: { attached: true } });
  } catch (error) {
    if (error.message === 'Chỉ chấp nhận file ảnh') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Assessment attachment upload error:', error);
    return res.status(500).json({ success: false, message: 'Could not upload attachment' });
  }
});

// Xem ảnh đính kèm — chủ sở hữu kết quả, hoặc chuyên gia đã là người chấm (administered_by).
router.get('/assessments/results/:id/attachment', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select attachment_file, attachment_filename, attachment_mime, user_id, administered_by
       from assessment_results
       where id = $1
       limit 1`,
      [req.params.id]
    );
    const row = r.rows[0];
    if (!row || !row.attachment_file) {
      return res.status(404).json({ success: false, message: 'Không có ảnh đính kèm' });
    }
    const isOwner = row.user_id === req.user.sub;
    const isAdministeringExpert = req.user.role === 'expert' && row.administered_by === req.user.sub;
    if (!isOwner && !isAdministeringExpert) {
      return res.status(403).json({ success: false, message: 'Không có quyền xem ảnh này' });
    }

    res.set('Content-Type', row.attachment_mime || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(row.attachment_filename || 'anh-dinh-kem')}"`);
    return res.send(row.attachment_file);
  } catch (error) {
    console.error('Assessment attachment fetch error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch attachment' });
  }
});

export default router;
