export const BadgeAwardService = {
  async syncUserBadges(client, userId) {
    const [progressRes, taskStatsRes, journalStatsRes, moodStatsRes, badgesRes] = await Promise.all([
      client.query(
        `select total_xp, current_streak
         from user_progress
         where user_id = $1
         limit 1`,
        [userId]
      ),
      client.query(
        `select
           count(*)::int as tasks_completed,
           count(*) filter (where t.difficulty = 'hard')::int as hard_tasks_completed,
           count(*) filter (
             where t.category = 'meditation'
                or t.tags ? 'meditation'
           )::int as meditation_tasks_completed,
           count(*) filter (
             where t.category = 'kindness'
                or t.tags ? 'kindness'
           )::int as kindness_tasks_completed
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.user_id = $1`,
        [userId]
      ),
      client.query(
        `select count(*)::int as journal_entries_count
         from journal_entries
         where user_id = $1`,
        [userId]
      ),
      client.query(
        `select
           count(*)::int as mood_checkins_count,
           exists(
             select 1
             from mood_checkins old_mood
             where old_mood.user_id = $1
               and old_mood.created_at < now() - interval '14 days'
               and (
                 coalesce(old_mood.stress_score, 0) >= 8
                 or coalesce(old_mood.anxiety_score, 0) >= 8
               )
           ) as had_high_distress,
           exists(
             select 1
             from mood_checkins recent_mood
             where recent_mood.user_id = $1
               and recent_mood.created_at >= now() - interval '14 days'
               and coalesce(recent_mood.stress_score, 10) <= 4
               and coalesce(recent_mood.anxiety_score, 10) <= 4
           ) as has_recent_stable_period
         from mood_checkins
         where user_id = $1`,
        [userId]
      ),
      client.query(
        `select
           b.id,
           b.code,
           b.name,
           b.description,
           b.criteria,
           b.icon,
           ub.earned_at
         from badges b
         left join user_badges ub
           on ub.badge_id = b.id
          and ub.user_id = $1
         order by b.created_at asc, b.name asc`,
        [userId]
      )
    ]);

    const progress = progressRes.rows[0] || {};
    const taskStats = taskStatsRes.rows[0] || {};
    const journalStats = journalStatsRes.rows[0] || {};
    const moodStats = moodStatsRes.rows[0] || {};

    const metrics = {
      total_xp: Number(progress.total_xp || 0),
      current_streak: Number(progress.current_streak || 0),
      tasks_completed: Number(taskStats.tasks_completed || 0),
      hard_tasks_completed: Number(taskStats.hard_tasks_completed || 0),
      meditation_tasks_completed: Number(taskStats.meditation_tasks_completed || 0),
      kindness_tasks_completed: Number(taskStats.kindness_tasks_completed || 0),
      journal_entries_count: Number(journalStats.journal_entries_count || 0),
      mood_checkins_count: Number(moodStats.mood_checkins_count || 0),
      crisis_recovery: moodStats.had_high_distress && moodStats.has_recent_stable_period ? 1 : 0
    };

    const awardedBadges = [];

    for (const badge of badgesRes.rows) {
      if (badge.earned_at) continue;
      if (!isBadgeEarned(badge.criteria || {}, metrics)) continue;

      const insertResult = await client.query(
        `insert into user_badges (user_id, badge_id)
         values ($1, $2)
         on conflict (user_id, badge_id) do nothing
         returning id, earned_at`,
        [userId, badge.id]
      );

      if (insertResult.rows[0]) {
        awardedBadges.push({
          id: badge.id,
          code: badge.code,
          name: badge.name,
          description: badge.description,
          icon: badge.icon || '🏅',
          earned_at: insertResult.rows[0].earned_at
        });
      }
    }

    const badgesCountRes = await client.query(
      `select count(*)::int as badges_count
       from user_badges
       where user_id = $1`,
      [userId]
    );

    const badgesCount = Number(badgesCountRes.rows[0]?.badges_count || 0);

    await client.query(
      `insert into user_progress (user_id, badges_count)
       values ($1, $2)
       on conflict (user_id)
       do update set badges_count = excluded.badges_count`,
      [userId, badgesCount]
    );

    return {
      awardedBadges,
      badgesCount
    };
  }
};

function isBadgeEarned(criteria, metrics) {
  const target = Number(criteria?.value || 1);

  switch (criteria?.type) {
    case 'task_count':
      return Number(metrics.tasks_completed || 0) >= target;
    case 'streak':
      return Number(metrics.current_streak || 0) >= target;
    case 'task_tag_count':
      if (criteria.tag === 'meditation') {
        return Number(metrics.meditation_tasks_completed || 0) >= target;
      }
      if (criteria.tag === 'kindness') {
        return Number(metrics.kindness_tasks_completed || 0) >= target;
      }
      return false;
    case 'task_difficulty_count':
      if (criteria.difficulty === 'hard') {
        return Number(metrics.hard_tasks_completed || 0) >= target;
      }
      return false;
    case 'crisis_recovery':
      return Number(metrics.crisis_recovery || 0) >= target;
    case 'xp':
      return Number(metrics.total_xp || 0) >= target;
    case 'journal_count':
      return Number(metrics.journal_entries_count || 0) >= target;
    case 'mood_checkin_count':
      return Number(metrics.mood_checkins_count || 0) >= target;
    default:
      return false;
  }
}
