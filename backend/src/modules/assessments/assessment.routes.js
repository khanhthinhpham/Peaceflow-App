import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

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

export default router;
