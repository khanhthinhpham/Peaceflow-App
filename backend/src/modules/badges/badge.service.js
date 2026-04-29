import { db } from '../../config/db.js';

export async function getAllBadges() {
    const { rows } = await db.query(
        `select id, code, name, description, criteria, icon, rarity, created_at
     from badges
     order by created_at asc`
    );
    return rows;
}

export async function getMyBadges(userId) {
    const { rows } = await db.query(
        `select 
        ub.id,
        ub.earned_at,
        b.code,
        b.name,
        b.description,
        b.criteria,
        b.icon,
        b.rarity
     from user_badges ub
     join badges b on b.id = ub.badge_id
     where ub.user_id = $1
     order by ub.earned_at desc`,
        [userId]
    );
    return rows;
}

async function getUserProgress(userId) {
    const { rows } = await db.query(
        `select * from user_progress where user_id = $1 limit 1`,
        [userId]
    );
    return rows[0] || null;
}

async function getTaskStats(userId) {
    const query = `
    select
      count(*)::int as total_completed,
      coalesce(sum(case when t.difficulty = 'hard' then 1 else 0 end), 0)::int as hard_completed,
      coalesce(sum(case when t.tags @> '["meditation"]'::jsonb then 1 else 0 end), 0)::int as meditation_completed,
      coalesce(sum(case when t.tags @> '["kindness"]'::jsonb then 1 else 0 end), 0)::int as kindness_completed
    from task_completions tc
    join tasks t on t.id = tc.task_id
    where tc.user_id = $1
  `;
    const { rows } = await db.query(query, [userId]);
    return rows[0];
}

async function hasRecoveredFromCrisis(userId) {
    const query = `
    with recent as (
      select crisis_risk_level, calculated_at
      from risk_snapshots
      where user_id = $1
      order by calculated_at desc
      limit 10
    )
    select
      exists (
        select 1
        from recent
        where crisis_risk_level in ('high', 'critical')
      ) as had_high,
      exists (
        select 1
        from recent
        where crisis_risk_level = 'low'
      ) as now_low
  `;
    const { rows } = await db.query(query, [userId]);
    const row = rows[0] || { had_high: false, now_low: false };
    return row.had_high && row.now_low;
}

function matchCriteria(criteria, context) {
    const type = criteria?.type;

    switch (type) {
        case 'task_count':
            return (context.total_completed || 0) >= (criteria.value || 0);

        case 'streak':
            return (context.current_streak || 0) >= (criteria.value || 0);

        case 'task_tag_count':
            if (criteria.tag === 'meditation') {
                return (context.meditation_completed || 0) >= (criteria.value || 0);
            }
            if (criteria.tag === 'kindness') {
                return (context.kindness_completed || 0) >= (criteria.value || 0);
            }
            return false;

        case 'task_difficulty_count':
            if (criteria.difficulty === 'hard') {
                return (context.hard_completed || 0) >= (criteria.value || 0);
            }
            return false;

        case 'crisis_recovery':
            return !!context.crisis_recovery;

        default:
            return false;
    }
}

export async function evaluateBadges(userId) {
    const [badgesRes, userBadgesRes, progress, taskStats, crisisRecovery] = await Promise.all([
        getAllBadges(),
        getMyBadges(userId),
        getUserProgress(userId),
        getTaskStats(userId),
        hasRecoveredFromCrisis(userId)
    ]);

    const ownedCodes = new Set(userBadgesRes.map(b => b.code));

    const context = {
        current_streak: progress?.current_streak || 0,
        total_completed: taskStats?.total_completed || 0,
        hard_completed: taskStats?.hard_completed || 0,
        meditation_completed: taskStats?.meditation_completed || 0,
        kindness_completed: taskStats?.kindness_completed || 0,
        crisis_recovery: crisisRecovery
    };

    const newlyEarned = [];

    for (const badge of badgesRes) {
        if (ownedCodes.has(badge.code)) continue;

        const ok = matchCriteria(badge.criteria, context);
        if (!ok) continue;

        const insertResult = await db.query(
            `insert into user_badges (user_id, badge_id)
       values ($1, $2)
       on conflict (user_id, badge_id) do nothing
       returning id`,
            [userId, badge.id]
        );

        if (insertResult.rowCount > 0) {
            newlyEarned.push(badge);
        }
    }

    if (newlyEarned.length > 0) {
        await db.query(
            `update user_progress
       set badges_count = (
         select count(*) from user_badges where user_id = $1
       ),
       updated_at = now()
       where user_id = $1`,
            [userId]
        );
    }

    return {
        newlyEarned,
        context
    };
}
