import { db } from '../../config/db.js';

function getPeriodDays(period) {
    switch (period) {
        case 'week':
            return 7;
        case 'month':
            return 30;
        case 'quarter':
            return 90;
        default:
            return 7;
    }
}

export async function getSummaryStats(userId, period = 'week') {
    const days = getPeriodDays(period);

    const query = `
    with mood_stats as (
      select
        round(avg(mood_score)::numeric, 1) as avg_mood,
        round(avg(anxiety_score)::numeric, 1) as avg_anxiety,
        round(avg(stress_score)::numeric, 1) as avg_stress,
        count(*)::int as mood_entries
      from mood_checkins
      where user_id = $1
        and created_at >= now() - ($2 || ' days')::interval
    ),
    task_stats as (
      select
        count(*)::int as completed_tasks,
        coalesce(sum(tc.xp_earned), 0)::int as xp_earned
      from task_completions tc
      where tc.user_id = $1
        and tc.created_at >= now() - ($2 || ' days')::interval
    ),
    journal_stats as (
      select
        count(*)::int as journal_entries
      from journal_entries
      where user_id = $1
        and created_at >= now() - ($2 || ' days')::interval
        and deleted_at is null
    ),
    badge_stats as (
      select
        count(*)::int as badges_earned
      from user_badges
      where user_id = $1
        and earned_at >= now() - ($2 || ' days')::interval
    ),
    progress_stats as (
      select
        total_xp,
        current_level,
        current_streak,
        longest_streak
      from user_progress
      where user_id = $1
      limit 1
    ),
    risk_stats as (
      select
        current_stress_index,
        current_anxiety_index,
        sleep_risk_index,
        burnout_risk_index,
        crisis_risk_level
      from risk_snapshots
      where user_id = $1
      order by calculated_at desc
      limit 1
    )
    select
      ms.avg_mood,
      ms.avg_anxiety,
      ms.avg_stress,
      ms.mood_entries,
      ts.completed_tasks,
      ts.xp_earned,
      js.journal_entries,
      bs.badges_earned,
      ps.total_xp,
      ps.current_level,
      ps.current_streak,
      ps.longest_streak,
      rs.current_stress_index,
      rs.current_anxiety_index,
      rs.sleep_risk_index,
      rs.burnout_risk_index,
      rs.crisis_risk_level
    from mood_stats ms
    cross join task_stats ts
    cross join journal_stats js
    cross join badge_stats bs
    left join progress_stats ps on true
    left join risk_stats rs on true
  `;

    const { rows } = await db.query(query, [userId, String(days)]);
    return rows[0] || null;
}

export async function getPreviousSummaryStats(userId, period = 'week') {
    const days = getPeriodDays(period);

    const query = `
    with mood_stats as (
      select
        round(avg(mood_score)::numeric, 1) as avg_mood,
        round(avg(anxiety_score)::numeric, 1) as avg_anxiety,
        round(avg(stress_score)::numeric, 1) as avg_stress
      from mood_checkins
      where user_id = $1
        and created_at >= now() - (($2 * 2) || ' days')::interval
        and created_at < now() - ($2 || ' days')::interval
    ),
    task_stats as (
      select
        count(*)::int as completed_tasks,
        coalesce(sum(tc.xp_earned), 0)::int as xp_earned
      from task_completions tc
      where tc.user_id = $1
        and tc.created_at >= now() - (($2 * 2) || ' days')::interval
        and tc.created_at < now() - ($2 || ' days')::interval
    ),
    journal_stats as (
      select
        count(*)::int as journal_entries
      from journal_entries
      where user_id = $1
        and created_at >= now() - (($2 * 2) || ' days')::interval
        and created_at < now() - ($2 || ' days')::interval
        and deleted_at is null
    )
    select
      ms.avg_mood,
      ms.avg_anxiety,
      ms.avg_stress,
      ts.completed_tasks,
      ts.xp_earned,
      js.journal_entries
    from mood_stats ms
    cross join task_stats ts
    cross join journal_stats js
  `;

    const { rows } = await db.query(query, [userId, days]);
    return rows[0] || null;
}

export async function getMoodTrend(userId, period = 'week') {
    const days = getPeriodDays(period);

    const query = `
    select
      to_char(date_trunc('day', created_at), 'DD/MM') as label,
      round(avg(mood_score)::numeric, 1) as mood,
      round(avg(anxiety_score)::numeric, 1) as anxiety,
      round(avg(stress_score)::numeric, 1) as stress
    from mood_checkins
    where user_id = $1
      and created_at >= now() - ($2 || ' days')::interval
    group by date_trunc('day', created_at)
    order by date_trunc('day', created_at) asc
  `;

    const { rows } = await db.query(query, [userId, String(days)]);
    return rows;
}

export async function getTaskBreakdown(userId, period = 'week') {
    const days = getPeriodDays(period);

    const query = `
    select
      t.difficulty,
      count(*)::int as total
    from task_completions tc
    join tasks t on t.id = tc.task_id
    where tc.user_id = $1
      and tc.created_at >= now() - ($2 || ' days')::interval
    group by t.difficulty
    order by t.difficulty asc
  `;

    const { rows } = await db.query(query, [userId, String(days)]);
    return rows;
}

export async function getAssessmentHistory(userId) {
    const query = `
    select
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
    order by ar.created_at desc
    limit 20
  `;
    const { rows } = await db.query(query, [userId]);
    return rows;
}

export async function getLatestAssessmentByCode(userId) {
    const query = `
    select distinct on (a.code)
      a.code,
      a.name,
      ar.total_score,
      ar.severity,
      ar.dimension_scores,
      ar.interpreted_result,
      ar.created_at
    from assessment_results ar
    join assessments a on a.id = ar.assessment_id
    where ar.user_id = $1
    order by a.code, ar.created_at desc
  `;
    const { rows } = await db.query(query, [userId]);
    return rows;
}

export async function getMeditationMinutes(userId, period = 'week') {
    const days = getPeriodDays(period);

    const query = `
    select
      coalesce(sum(t.duration_minutes), 0)::int as meditation_minutes
    from task_completions tc
    join tasks t on t.id = tc.task_id
    where tc.user_id = $1
      and tc.created_at >= now() - ($2 || ' days')::interval
      and t.tags @> '["meditation"]'::jsonb
  `;
    const { rows } = await db.query(query, [userId, String(days)]);
    return rows[0]?.meditation_minutes || 0;
}

export async function getGoodMoodDays(userId, period = 'week') {
    const days = getPeriodDays(period);

    const query = `
    select
      count(*)::int as good_days
    from (
      select
        date_trunc('day', created_at) as d,
        avg(mood_score) as avg_mood
      from mood_checkins
      where user_id = $1
        and created_at >= now() - ($2 || ' days')::interval
      group by date_trunc('day', created_at)
    ) x
    where avg_mood >= 7
  `;
    const { rows } = await db.query(query, [userId, String(days)]);
    return rows[0]?.good_days || 0;
}

export { getPeriodDays };
