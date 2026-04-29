import { db } from '../../config/db.js';

export async function getAllAssessments() {
    const { rows } = await db.query(
        `select id, code, name, version, description, active, created_at
     from assessments
     where active = true
     order by code asc`
    );
    return rows;
}

export async function getAssessmentByCode(code) {
    const { rows } = await db.query(
        `select id, code, name, version, description, question_schema, scoring_rules, interpretation_rules, active
     from assessments
     where upper(code) = upper($1)
     limit 1`,
        [code]
    );
    return rows[0] || null;
}

function sumObjectValues(obj) {
    return Object.values(obj).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function interpretBands(score, rules) {
    const bands = rules?.bands || [];
    const matched = bands.find(b => score >= b.min && score <= b.max);
    return matched ? matched.label : null;
}

function scoreDASS21(answers) {
    const dimensionMap = {
        stress: ['q1', 'q4', 'q7', 'q10', 'q13', 'q16', 'q19'],
        anxiety: ['q2', 'q5', 'q8', 'q11', 'q14', 'q17', 'q20'],
        depression: ['q3', 'q6', 'q9', 'q12', 'q15', 'q18', 'q21']
    };

    const dimension_scores = {};
    for (const [dimension, keys] of Object.entries(dimensionMap)) {
        const raw = keys.reduce((sum, key) => sum + (Number(answers[key]) || 0), 0);
        dimension_scores[dimension] = raw * 2;
    }

    const total_score = Object.values(dimension_scores).reduce((a, b) => a + b, 0);

    return {
        total_score,
        dimension_scores,
        severity: null,
        interpreted_result: {
            dimensions: dimension_scores
        }
    };
}

function scoreGeneric(answers, scoringRules, interpretationRules) {
    const total_score = sumObjectValues(answers);
    const severity = interpretBands(total_score, interpretationRules);

    return {
        total_score,
        dimension_scores: {},
        severity,
        interpreted_result: {
            severity,
            score: total_score
        }
    };
}

function scorePSQI(answers, interpretationRules) {
    const total_score = sumObjectValues(answers);
    const severity = interpretBands(total_score, interpretationRules);

    return {
        total_score,
        dimension_scores: {},
        severity,
        interpreted_result: {
            severity,
            score: total_score
        }
    };
}

export function calculateAssessmentResult(assessment, answers) {
    const code = assessment.code.toUpperCase();
    const scoringRules = assessment.scoring_rules || {};
    const interpretationRules = assessment.interpretation_rules || {};

    if (code === 'DASS21') {
        return scoreDASS21(answers);
    }

    if (code === 'PSQI') {
        return scorePSQI(answers, interpretationRules);
    }

    if (scoringRules.method === 'sum') {
        return scoreGeneric(answers, scoringRules, interpretationRules);
    }

    if (scoringRules.method === 'psqi_custom') {
        return scorePSQI(answers, interpretationRules);
    }

    if (scoringRules.method === 'sum_by_dimension_x2') {
        return scoreDASS21(answers);
    }

    return scoreGeneric(answers, scoringRules, interpretationRules);
}

export async function saveAssessmentResult(userId, assessmentId, answers, result) {
    const { rows } = await db.query(
        `insert into assessment_results
      (user_id, assessment_id, raw_answers, total_score, severity, dimension_scores, interpreted_result)
     values ($1, $2, $3::jsonb, $4, $5, $6::jsonb, $7::jsonb)
     returning *`,
        [
            userId,
            assessmentId,
            JSON.stringify(answers),
            result.total_score,
            result.severity,
            JSON.stringify(result.dimension_scores || {}),
            JSON.stringify(result.interpreted_result || {})
        ]
    );
    return rows[0];
}

export async function getMyAssessmentResults(userId) {
    const { rows } = await db.query(
        `select
        ar.id,
        ar.total_score,
        ar.severity,
        ar.dimension_scores,
        ar.interpreted_result,
        ar.created_at,
        a.code,
        a.name,
        a.version
     from assessment_results ar
     join assessments a on a.id = ar.assessment_id
     where ar.user_id = $1
     order by ar.created_at desc`,
        [userId]
    );
    return rows;
}

export async function getLatestAssessmentResults(userId) {
    const { rows } = await db.query(
        `select distinct on (a.code)
        ar.id,
        ar.total_score,
        ar.severity,
        ar.dimension_scores,
        ar.interpreted_result,
        ar.created_at,
        a.code,
        a.name,
        a.version
     from assessment_results ar
     join assessments a on a.id = ar.assessment_id
     where ar.user_id = $1
     order by a.code, ar.created_at desc`,
        [userId]
    );
    return rows;
}
