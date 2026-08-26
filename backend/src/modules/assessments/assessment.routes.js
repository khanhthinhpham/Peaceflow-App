import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { getAssessmentAiSummary } from '../ai/ai.service.js';

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

// Tổng kết nhận xét bằng AI (Gemini) cho 1 kết quả đã nộp — gọi riêng, không chặn
// lúc nộp bài, để nếu Gemini lỗi/chậm thì không ảnh hưởng việc lưu kết quả test.
router.post('/assessments/results/:id/ai-summary', requireAuth, async (req, res) => {
  try {
    const resultRes = req.user.role === 'admin'
      ? await db.query(
          `select ar.total_score, ar.severity, ar.dimension_scores, a.name as assessment_name
           from assessment_results ar
           join assessments a on a.id = ar.assessment_id
           where ar.id = $1 limit 1`,
          [req.params.id]
        )
      : await db.query(
          `select ar.total_score, ar.severity, ar.dimension_scores, a.name as assessment_name
           from assessment_results ar
           join assessments a on a.id = ar.assessment_id
           where ar.id = $1 and ar.user_id = $2 limit 1`,
          [req.params.id, req.user.sub]
        );

    const result = resultRes.rows[0];
    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });
    }

    // TẠM: giả lập kết quả AI để xem UI trong lúc chưa nạp credit Gemini — bỏ dòng
    // này và mở lại lời gọi getAssessmentAiSummary() thật khi tài khoản Gemini có credit.
    const summary = `Kết quả bài "${result.assessment_name}" của bạn cho thấy mức độ ${result.severity || 'ở ngưỡng cần lưu ý'} với ${result.total_score} điểm. Đây là dấu hiệu bạn nên chú ý hơn đến trạng thái tâm lý của mình trong những ngày gần đây, đặc biệt là giấc ngủ và cách bạn phản ứng với áp lực. Đừng quá lo lắng — những cảm giác này là bình thường và có thể cải thiện được. Hôm nay, hãy thử dành 10 phút ngồi yên hít thở sâu hoặc ghi lại 3 điều khiến bạn thấy nhẹ nhõm hơn.`;
    /* const summary = await getAssessmentAiSummary({
      assessmentName: result.assessment_name,
      totalScore: Number(result.total_score || 0),
      severity: result.severity,
      dimensionScores: result.dimension_scores
    }); */

    return res.json({ success: true, data: { summary } });
  } catch (error) {
    console.error('Assessment AI summary error:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo nhận xét AI lúc này.' });
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

// Chuyên gia sửa lại kết quả đã nộp (đánh nhầm câu trả lời, sai điểm, sai tên/tuổi...).
// Chỉ được sửa kết quả nằm dưới chính tài khoản của mình (kết quả tự nhập cho khách khi
// khám trực tiếp). Ghi lại người sửa + thời điểm sửa để có dấu vết trên hồ sơ.
router.patch('/assessments/results/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ chuyên gia hoặc admin mới có thể sửa kết quả.' });
    }

    // Admin sửa được bất kỳ kết quả nào (kiểm duyệt/hỗ trợ); chuyên gia chỉ sửa được
    // kết quả do chính mình nhập.
    const ownerRes = req.user.role === 'admin'
      ? await db.query(`select id from assessment_results where id = $1 limit 1`, [req.params.id])
      : await db.query(`select id from assessment_results where id = $1 and user_id = $2 limit 1`, [req.params.id, req.user.sub]);
    if (!ownerRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });
    }

    const sets = [];
    const params = [req.params.id];
    const pushSet = (col, value) => { params.push(value); sets.push(`${col} = $${params.length}`); };

    if (req.body.respondent_name !== undefined) {
      pushSet('respondent_name', req.body.respondent_name ? String(req.body.respondent_name).slice(0, 255) : null);
    }
    if (req.body.respondent_age !== undefined) {
      const age = Number(req.body.respondent_age);
      pushSet('respondent_age', req.body.respondent_age === null || req.body.respondent_age === '' || !Number.isFinite(age) ? null : Math.round(age));
    }
    if (req.body.note !== undefined) {
      pushSet('note', req.body.note ? String(req.body.note).slice(0, 2000) : null);
    }
    if (req.body.total_score !== undefined) {
      const score = Number(req.body.total_score);
      if (!Number.isFinite(score)) {
        return res.status(400).json({ success: false, message: 'Điểm tổng không hợp lệ.' });
      }
      pushSet('total_score', score);
    }
    if (req.body.severity !== undefined) {
      pushSet('severity', req.body.severity ? String(req.body.severity).slice(0, 255) : null);
    }
    if (req.body.raw_answers !== undefined) {
      if (!Array.isArray(req.body.raw_answers)) {
        return res.status(400).json({ success: false, message: 'raw_answers phải là một danh sách.' });
      }
      params.push(JSON.stringify(req.body.raw_answers));
      sets.push(`raw_answers = $${params.length}::jsonb`);
    }

    if (!sets.length) {
      return res.status(400).json({ success: false, message: 'Không có thay đổi nào.' });
    }

    params.push(req.user.sub);
    sets.push(`edited_by = $${params.length}`);
    sets.push(`edited_at = now()`);

    const r = await db.query(
      `update assessment_results set ${sets.join(', ')} where id = $1
       returning id, total_score, severity, respondent_name, respondent_age, note, raw_answers, edited_at`,
      params
    );
    return res.json({ success: true, data: r.rows[0] });
  } catch (error) {
    console.error('Edit assessment result error:', error);
    return res.status(500).json({ success: false, message: 'Could not update result' });
  }
});

// Xoá 1 kết quả — chỉ chủ sở hữu (chuyên gia đã tự nhập cho khách) mới xoá được.
router.delete('/assessments/results/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Chỉ chuyên gia mới có thể xoá kết quả.' });
    }
    const r = await db.query(
      `delete from assessment_results where id = $1 and user_id = $2 returning id`,
      [req.params.id, req.user.sub]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Delete assessment result error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete result' });
  }
});

// Đánh dấu / bỏ đánh dấu 1 kết quả — chủ sở hữu hoặc người được chia sẻ đều bấm được.
router.patch('/assessments/results/:id/flag', requireAuth, async (req, res) => {
  try {
    if (typeof req.body.flagged !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Thiếu trường flagged.' });
    }
    const access = req.user.role === 'admin'
      ? await db.query(`select id from assessment_results where id = $1 limit 1`, [req.params.id])
      : await db.query(
          `select ar.id from assessment_results ar
           where ar.id = $1
             and (ar.user_id = $2 or exists (
               select 1 from assessment_result_shares s where s.result_id = ar.id and s.shared_with_user_id = $2
             ))`,
          [req.params.id, req.user.sub]
        );
    if (!access.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });

    const r = await db.query(
      `update assessment_results set flagged = $2 where id = $1 returning id, flagged`,
      [req.params.id, req.body.flagged]
    );
    return res.json({ success: true, data: r.rows[0] });
  } catch (error) {
    console.error('Flag assessment result error:', error);
    return res.status(500).json({ success: false, message: 'Could not update flag' });
  }
});

// Chia sẻ 1 kết quả cho 1 chuyên gia khác cùng xem — cả 2 bên đều giữ quyền xem, chỉ chủ
// sở hữu mới được chia sẻ/gỡ chia sẻ (tránh việc người được chia sẻ lại đi chia sẻ tiếp).
// Chia sẻ cho 1 hoặc nhiều chuyên gia cùng lúc (target_user_ids: string[], hoặc
// target_user_id: string cho tương thích cũ).
// Admin thao tác được trên bất kỳ kết quả nào (kiểm duyệt/hỗ trợ); chuyên gia chỉ thao
// tác được trên kết quả do chính mình nhập.
async function findOwnedResult(req) {
  const r = req.user.role === 'admin'
    ? await db.query(`select id from assessment_results where id = $1 limit 1`, [req.params.id])
    : await db.query(`select id from assessment_results where id = $1 and user_id = $2 limit 1`, [req.params.id, req.user.sub]);
  return r.rows[0] || null;
}

router.post('/assessments/results/:id/share', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ chuyên gia hoặc admin mới có thể chia sẻ kết quả.' });
    }
    const targetUserIds = Array.isArray(req.body.target_user_ids)
      ? req.body.target_user_ids
      : (req.body.target_user_id ? [req.body.target_user_id] : []);
    const uniqueTargets = [...new Set(targetUserIds)].filter((id) => id && id !== req.user.sub);
    if (!uniqueTargets.length) {
      return res.status(400).json({ success: false, message: 'Thiếu người nhận chia sẻ.' });
    }

    if (!(await findOwnedResult(req))) return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });

    const validTargets = await db.query(
      `select id from users where id = any($1::uuid[]) and role = 'expert'`,
      [uniqueTargets]
    );
    if (!validTargets.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên gia nào hợp lệ.' });
    }

    await Promise.all(validTargets.rows.map((row) => db.query(
      `insert into assessment_result_shares (result_id, shared_with_user_id, shared_by_user_id)
       values ($1, $2, $3)
       on conflict (result_id, shared_with_user_id) do nothing`,
      [req.params.id, row.id, req.user.sub]
    )));
    return res.json({ success: true, data: { shared: validTargets.rows.length } });
  } catch (error) {
    console.error('Share assessment result error:', error);
    return res.status(500).json({ success: false, message: 'Could not share result' });
  }
});

// Chuyển hẳn quyền sở hữu 1 kết quả cho chuyên gia khác — khác với chia sẻ (share), sau
// khi chuyển thì chủ cũ KHÔNG còn thấy kết quả này trong danh sách của mình nữa.
router.post('/assessments/results/:id/transfer', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ chuyên gia hoặc admin mới có thể chuyển hồ sơ.' });
    }
    const targetUserId = req.body.target_user_id;
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Thiếu người nhận chuyển giao.' });
    }
    if (targetUserId === req.user.sub) {
      return res.status(400).json({ success: false, message: 'Không thể tự chuyển cho chính mình.' });
    }

    if (!(await findOwnedResult(req))) return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });

    const targetRes = await db.query(`select id from users where id = $1 and role = 'expert' limit 1`, [targetUserId]);
    if (!targetRes.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên gia này.' });

    await db.query(`update assessment_results set user_id = $2 where id = $1`, [req.params.id, targetUserId]);
    // Chủ mới giờ đã có toàn quyền, xoá bản ghi chia sẻ cũ tới đúng người này (nếu có) cho gọn.
    await db.query(
      `delete from assessment_result_shares where result_id = $1 and shared_with_user_id = $2`,
      [req.params.id, targetUserId]
    );
    return res.json({ success: true, data: { transferred: true } });
  } catch (error) {
    console.error('Transfer assessment result error:', error);
    return res.status(500).json({ success: false, message: 'Could not transfer result' });
  }
});

// Xem đang chia sẻ với ai + gỡ chia sẻ.
router.get('/assessments/results/:id/shares', requireAuth, async (req, res) => {
  try {
    if (!(await findOwnedResult(req))) return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });

    const r = await db.query(
      `select s.shared_with_user_id, coalesce(u.display_name, u.full_name) as full_name, u.email, s.created_at
       from assessment_result_shares s
       join users u on u.id = s.shared_with_user_id
       where s.result_id = $1
       order by s.created_at desc`,
      [req.params.id]
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('List assessment result shares error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch shares' });
  }
});

router.delete('/assessments/results/:id/share/:targetUserId', requireAuth, async (req, res) => {
  try {
    if (!(await findOwnedResult(req))) return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });

    await db.query(
      `delete from assessment_result_shares where result_id = $1 and shared_with_user_id = $2`,
      [req.params.id, req.params.targetUserId]
    );
    return res.json({ success: true, data: { removed: true } });
  } catch (error) {
    console.error('Unshare assessment result error:', error);
    return res.status(500).json({ success: false, message: 'Could not remove share' });
  }
});

// ===== ADMIN: quản lý toàn bộ kết quả bài test trong hệ thống =====
// Giống danh sách "Khách hàng tự làm test" bên portal chuyên gia, nhưng admin thấy TẤT
// CẢ kết quả của mọi tài khoản, không chỉ của riêng mình — để rà soát/hỗ trợ khi cần.
router.get('/admin/assessment-results', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const wantAll = req.query.limit === '0';
    const limit = wantAll ? 5000 : Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = wantAll ? 0 : Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const conditions = [];
    const params = [];

    const search = (req.query.search || '').trim();
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`ar.respondent_name ilike $${params.length}`);
    }
    const code = (req.query.code || '').trim().toUpperCase();
    if (code) {
      params.push(code);
      conditions.push(`a.code = $${params.length}`);
    }
    const ageMin = parseInt(req.query.age_min, 10);
    if (Number.isFinite(ageMin)) {
      params.push(ageMin);
      conditions.push(`ar.respondent_age >= $${params.length}`);
    }
    const ageMax = parseInt(req.query.age_max, 10);
    if (Number.isFinite(ageMax)) {
      params.push(ageMax);
      conditions.push(`ar.respondent_age <= $${params.length}`);
    }
    if (req.query.flagged === 'true') {
      conditions.push(`ar.flagged = true`);
    }
    const owner = (req.query.owner || '').trim();
    if (owner) {
      params.push(`%${owner}%`);
      conditions.push(`(u.email ilike $${params.length} or coalesce(u.display_name, u.full_name) ilike $${params.length})`);
    }
    // Chọn chính xác 1 hoặc nhiều tài khoản đã nhập — dùng khi admin muốn xuất Excel chỉ
    // từ những tài khoản cụ thể thay vì toàn bộ hệ thống.
    const ownerIds = (req.query.owner_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (ownerIds.length) {
      params.push(ownerIds);
      conditions.push(`ar.user_id = any($${params.length}::uuid[])`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const countRes = await db.query(
      `select count(*)::int as total
       from assessment_results ar
       join assessments a on a.id = ar.assessment_id
       join users u on u.id = ar.user_id
       ${where}`,
      params
    );

    params.push(limit, offset);
    const r = await db.query(
      `select
         ar.id,
         a.code,
         a.name,
         ar.total_score,
         ar.severity,
         ar.dimension_scores,
         ar.interpreted_result,
         ar.raw_answers,
         ar.respondent_name,
         ar.respondent_age,
         ar.note,
         ar.flagged,
         (ar.attachment_file is not null) as has_attachment,
         ar.edited_at,
         ar.created_at,
         u.id as owner_user_id,
         u.email as owner_email,
         coalesce(u.display_name, u.full_name) as owner_name
       from assessment_results ar
       join assessments a on a.id = ar.assessment_id
       join users u on u.id = ar.user_id
       ${where}
       order by ar.created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params
    );

    return res.json({
      success: true,
      data: {
        total: countRes.rows[0]?.total || 0,
        limit,
        offset,
        items: r.rows.map((row) => ({ ...row, total_score: Number(row.total_score || 0) }))
      }
    });
  } catch (error) {
    console.error('Admin list assessment results error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch assessment results' });
  }
});

// Danh sách các tài khoản đã từng nhập kết quả (kèm số lượng) — dùng để admin chọn chính
// xác tài khoản nào muốn xuất Excel, thay vì luôn xuất toàn bộ hệ thống.
router.get('/admin/assessment-results/owners', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(
      `select u.id as owner_user_id, u.email as owner_email, u.role as owner_role,
              coalesce(u.display_name, u.full_name) as owner_name,
              count(*)::int as result_count
       from assessment_results ar
       join users u on u.id = ar.user_id
       group by u.id, u.email, u.role, coalesce(u.display_name, u.full_name)
       order by owner_name asc`
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('List assessment result owners error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch owners' });
  }
});

// Admin xoá 1 kết quả bất kỳ trong hệ thống (kiểm duyệt/hỗ trợ) — không giới hạn theo chủ sở hữu.
router.delete('/admin/assessment-results/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(`delete from assessment_results where id = $1 returning id`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả này.' });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Admin delete assessment result error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete result' });
  }
});

export default router;
