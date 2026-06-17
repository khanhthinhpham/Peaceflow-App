import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

const LEVELS = [
  { level: 1, title: 'Người Bắt Đầu', minXP: 0, maxXP: 100 },
  { level: 2, title: 'Người Khám Phá', minXP: 100, maxXP: 300 },
  { level: 3, title: 'Người Kiến Cường', minXP: 300, maxXP: 600 },
  { level: 4, title: 'Người Truyền Cảm Hứng', minXP: 600, maxXP: 1000 },
  { level: 5, title: 'Bậc Thầy Bình Yên', minXP: 1000, maxXP: Infinity }
];

// GET /api/v1/progress
router.get('/progress', requireAuth, async (req, res) => {
  try {
  const userId = req.user.sub;

  // --- Streak check-in: chi can vao app la tinh streak (khong can lam nhiem vu) ---
  const now = new Date();
  const todayIso = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const yesterdayIso = new Date(now - 864e5).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

  const existing = await db.query(
    `select current_streak, longest_streak, last_activity_date
     from user_progress where user_id = $1 limit 1`,
    [userId]
  ).catch((e) => { console.error('[PROGRESS_CHECKIN] read:', e.message); return { rows: [] }; });

  const prev = existing.rows[0];
  const lastActivity = formatDateOnly(prev?.last_activity_date);

  if (lastActivity !== todayIso) {
    let nextStreak;
    if (lastActivity === yesterdayIso) {
      nextStreak = (prev?.current_streak || 0) + 1;
    } else {
      nextStreak = 1;
    }
    const longestStreak = Math.max(prev?.longest_streak || 0, nextStreak);

    await db.query(
      `insert into user_progress (user_id, current_streak, longest_streak, last_activity_date)
       values ($1, $2, $3, $4)
       on conflict (user_id)
       do update set
         current_streak = excluded.current_streak,
         longest_streak = excluded.longest_streak,
         last_activity_date = excluded.last_activity_date`,
      [userId, nextStreak, longestStreak, todayIso]
    ).catch((e) => { console.error('[PROGRESS_CHECKIN] write:', e.message); });
  }
  // --- het phan check-in ---

  const result = await db.query(
    `select * from user_progress where user_id = $1 limit 1`,
    [userId]
  ).catch((e) => { console.error('[PROGRESS_QUERY] user_progress:', e.message); return { rows: [] }; });
  const weeklyTasks = await db.query(
    `select count(*)::int as count
     from task_completions
     where user_id = $1 and created_at > now() - interval '7 days'`,
    [req.user.sub]
  ).catch((e) => { console.error('[PROGRESS_QUERY] task_completions:', e.message); return { rows: [] }; });

  const progress = result.rows[0];
  const weeklyTasksCompleted = weeklyTasks.rows[0]?.count || 0;

  return res.json({
    success: true,
    data: progress
      ? {
          ...progress,
          xp: progress.total_xp,
          level: progress.current_level,
          streak: progress.current_streak,
          weekly_tasks_completed: weeklyTasksCompleted
        }
      : {
          total_xp: 0,
          current_level: 1,
          current_streak: 0,
          xp: 0,
          level: 1,
          streak: 0,
          weekly_tasks_completed: weeklyTasksCompleted
        }
  });
  } catch (error) {
    console.error('Progress route error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch progress' });
  }
});

// GET /api/v1/achievements
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const [
      userRes,
      progressRes,
      badgesRes,
      taskStatsRes,
      journalStatsRes,
      moodStatsRes,
      activityCalendarRes,
      activityTotalRes,
      weeklyActivityRes,
      leaderboardTopRes,
      leaderboardRankRes
    ] = await Promise.all([
      db.query(
        `select id, email, full_name, display_name, avatar_url
         from users
         where id = $1
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] users:', e.message); return { rows: [] }; }),
      db.query(
        `select *
         from user_progress
         where user_id = $1
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] user_progress:', e.message); return { rows: [] }; }),
      db.query(
        `select
           b.id,
           b.code,
           b.name,
           b.description,
           b.criteria,
           b.icon,
           b.rarity,
           ub.earned_at
         from badges b
         left join user_badges ub
           on ub.badge_id = b.id
          and ub.user_id = $1
         order by b.created_at asc, b.name asc`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] badges:', e.message); return { rows: [] }; }),
      db.query(
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
      ).catch((e) => { console.error('[ACH_QUERY] task_completions:', e.message); return { rows: [] }; }),
      db.query(
        `select count(*)::int as journal_entries_count
         from journal_entries
         where user_id = $1`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] journal_entries:', e.message); return { rows: [] }; }),
      db.query(
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
      ).catch((e) => { console.error('[ACH_QUERY] mood_checkins:', e.message); return { rows: [] }; }),
      db.query(
        `select activity_day
         from (
           select created_at::date as activity_day
           from task_completions
           where user_id = $1
             and created_at >= current_date - interval '41 days'
           union
           select created_at::date as activity_day
           from journal_entries
           where user_id = $1
             and created_at >= current_date - interval '41 days'
           union
           select created_at::date as activity_day
           from mood_checkins
           where user_id = $1
             and created_at >= current_date - interval '41 days'
         ) activities
         order by activity_day asc`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] activity_calendar:', e.message); return { rows: [] }; }),
      db.query(
        `select count(*)::int as active_days
         from (
           select created_at::date as activity_day
           from task_completions
           where user_id = $1
           union
           select created_at::date as activity_day
           from journal_entries
           where user_id = $1
           union
           select created_at::date as activity_day
           from mood_checkins
           where user_id = $1
         ) activities`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] activity_total:', e.message); return { rows: [] }; }),
      db.query(
        `select
           (select count(*)::int from task_completions where user_id = $1 and created_at >= now() - interval '7 days') as tasks_last_7d,
           (select count(*)::int from journal_entries where user_id = $1 and created_at >= now() - interval '7 days') as journals_last_7d,
           (select count(*)::int from mood_checkins where user_id = $1 and created_at >= now() - interval '7 days') as moods_last_7d`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] weekly_activity:', e.message); return { rows: [] }; }),
      db.query(
        `with badge_counts as (
           select user_id, count(*)::int as badges_count
           from user_badges
           group by user_id
         ),
         ranked as (
           select
             up.user_id,
             up.total_xp,
             up.current_level,
             up.current_streak,
             coalesce(badge_counts.badges_count, up.badges_count, 0) as badges_count,
             dense_rank() over (
               order by up.total_xp desc, up.current_level desc, up.updated_at asc
             ) as rank
           from user_progress up
           left join badge_counts on badge_counts.user_id = up.user_id
         )
         select
           ranked.rank,
           ranked.user_id,
           ranked.total_xp,
           ranked.current_level,
           ranked.current_streak,
           ranked.badges_count,
           u.display_name,
           u.full_name,
           u.avatar_url
         from ranked
         join users u on u.id = ranked.user_id
         where ranked.rank <= 5
         order by ranked.rank asc, ranked.total_xp desc`,
        []
      ).catch((e) => { console.error('[ACH_QUERY] leaderboard_top:', e.message); return { rows: [] }; }),
      db.query(
        `with badge_counts as (
           select user_id, count(*)::int as badges_count
           from user_badges
           group by user_id
         ),
         ranked as (
           select
             up.user_id,
             up.total_xp,
             up.current_level,
             up.current_streak,
             coalesce(badge_counts.badges_count, up.badges_count, 0) as badges_count,
             dense_rank() over (
               order by up.total_xp desc, up.current_level desc, up.updated_at asc
             ) as rank,
             count(*) over ()::int as total_users
           from user_progress up
           left join badge_counts on badge_counts.user_id = up.user_id
         )
         select
           ranked.rank,
           ranked.total_users,
           ranked.total_xp,
           ranked.current_level,
           ranked.current_streak,
           ranked.badges_count
         from ranked
         where ranked.user_id = $1
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[ACH_QUERY] leaderboard_rank:', e.message); return { rows: [] }; })
    ]);

    const user = userRes.rows[0] || null;
    const storedProgress = progressRes.rows[0] || null;
    const xp = storedProgress?.total_xp || 0;
    const levelInfo = getLevelInfo(xp);
    const progress = {
      total_xp: xp,
      current_level: storedProgress?.current_level || levelInfo.level,
      current_streak: storedProgress?.current_streak || 0,
      longest_streak: storedProgress?.longest_streak || 0,
      last_activity_date: storedProgress?.last_activity_date || null,
      xp,
      level: storedProgress?.current_level || levelInfo.level,
      streak: storedProgress?.current_streak || 0,
      level_info: {
        ...levelInfo,
        progress_percent: getLevelProgress(xp),
        xp_to_next: levelInfo.maxXP === Infinity ? 0 : Math.max(0, levelInfo.maxXP - xp)
      }
    };

    const taskStats = taskStatsRes.rows[0] || {};
    const journalStats = journalStatsRes.rows[0] || {};
    const moodStats = moodStatsRes.rows[0] || {};
    const activeDays = Number(activityTotalRes.rows[0]?.active_days || 0);
    const weeklyActivity = weeklyActivityRes.rows[0] || {};

    const metrics = {
      total_xp: xp,
      current_streak: progress.current_streak,
      tasks_completed: Number(taskStats.tasks_completed || 0),
      hard_tasks_completed: Number(taskStats.hard_tasks_completed || 0),
      meditation_tasks_completed: Number(taskStats.meditation_tasks_completed || 0),
      kindness_tasks_completed: Number(taskStats.kindness_tasks_completed || 0),
      journal_entries_count: Number(journalStats.journal_entries_count || 0),
      mood_checkins_count: Number(moodStats.mood_checkins_count || 0),
      crisis_recovery: moodStats.had_high_distress && moodStats.has_recent_stable_period ? 1 : 0
    };

    const badges = badgesRes.rows.map((badge) => {
      const progressInfo = computeBadgeProgress(badge.criteria || {}, metrics);
      const earned = Boolean(badge.earned_at) || progressInfo.earned;

      return {
        id: badge.id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon || '🏅',
        rarity: badge.rarity || 'common',
        category: getBadgeCategory(badge.criteria || {}),
        criteria: badge.criteria || {},
        condition: describeBadgeCriteria(badge.criteria || {}),
        target_value: progressInfo.target,
        current_value: progressInfo.current,
        progress_percent: progressInfo.progressPercent,
        earned,
        earned_at: badge.earned_at || null,
        is_new: Boolean(badge.earned_at) && isRecentBadge(badge.earned_at),
        unlocked_without_record: !badge.earned_at && progressInfo.earned
      };
    });

    const earnedBadges = badges
      .filter((badge) => badge.earned)
      .sort((left, right) => {
        const leftTime = left.earned_at ? new Date(left.earned_at).getTime() : 0;
        const rightTime = right.earned_at ? new Date(right.earned_at).getTime() : 0;
        return rightTime - leftTime || left.name.localeCompare(right.name);
      });

    const nextBadge = badges
      .filter((badge) => !badge.earned)
      .sort((left, right) => {
        return right.progress_percent - left.progress_percent
          || left.target_value - right.target_value
          || left.name.localeCompare(right.name);
      })[0] || null;

    const activityDaysSet = new Set(
      activityCalendarRes.rows.map((row) => toISODate(row.activity_day))
    );

    const streak = {
      current: progress.current_streak,
      longest: progress.longest_streak,
      active_days: activeDays,
      month_label: formatMonthLabel(new Date()),
      calendar: buildCalendarDays(activityDaysSet, new Date())
    };

    const challenges = buildChallenges(weeklyActivity);
    const completedChallenges = challenges.filter((item) => item.completed).length;
    const leaderboardTop = leaderboardTopRes.rows.map((row) => ({
      rank: Number(row.rank),
      user_id: row.user_id,
      name: row.display_name || row.full_name || 'Nguoi dung',
      avatar_url: row.avatar_url || null,
      total_xp: Number(row.total_xp || 0),
      current_level: Number(row.current_level || 1),
      current_streak: Number(row.current_streak || 0),
      badges_count: Number(row.badges_count || 0),
      is_current_user: row.user_id === userId
    }));

    const userRank = leaderboardRankRes.rows[0]
      ? {
          rank: Number(leaderboardRankRes.rows[0].rank || 0),
          total_users: Number(leaderboardRankRes.rows[0].total_users || 0),
          total_xp: Number(leaderboardRankRes.rows[0].total_xp || 0),
          current_level: Number(leaderboardRankRes.rows[0].current_level || 1),
          current_streak: Number(leaderboardRankRes.rows[0].current_streak || 0),
          badges_count: Number(leaderboardRankRes.rows[0].badges_count || 0)
        }
      : null;

    return res.json({
      success: true,
      data: {
        user,
        progress,
        summary: {
          badges_earned: earnedBadges.length,
          badges_total: badges.length,
          completed_tasks: metrics.tasks_completed,
          current_streak: progress.current_streak,
          longest_streak: progress.longest_streak,
          active_days: activeDays
        },
        badges,
        recent_badges: earnedBadges.slice(0, 4),
        next_badge: nextBadge,
        levels: LEVELS.map((level) => ({
          ...level,
          is_completed: progress.level > level.level || xp >= level.maxXP,
          is_current: progress.level === level.level,
          is_locked: progress.level < level.level,
          progress_percent: getLevelProgressWithinLevel(xp, level)
        })),
        streak,
        challenges: challenges.map((challenge) => ({
          ...challenge,
          completed_count: completedChallenges
        })),
        leaderboard: {
          top_users: leaderboardTop,
          user_rank: userRank
        }
      }
    });
  } catch (error) {
    console.error('Achievements route error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Could not fetch achievements data'
    });
  }
});

function computeBadgeProgress(criteria, metrics) {
  const target = Number(criteria?.value || 1);
  let current = 0;

  switch (criteria?.type) {
    case 'task_count':
      current = Number(metrics.tasks_completed || 0);
      break;
    case 'streak':
      current = Number(metrics.current_streak || 0);
      break;
    case 'task_tag_count':
      if (criteria.tag === 'meditation') current = Number(metrics.meditation_tasks_completed || 0);
      else if (criteria.tag === 'kindness') current = Number(metrics.kindness_tasks_completed || 0);
      break;
    case 'task_difficulty_count':
      if (criteria.difficulty === 'hard') current = Number(metrics.hard_tasks_completed || 0);
      break;
    case 'crisis_recovery':
      current = Number(metrics.crisis_recovery || 0);
      break;
    case 'xp':
      current = Number(metrics.total_xp || 0);
      break;
    case 'journal_count':
      current = Number(metrics.journal_entries_count || 0);
      break;
    case 'mood_checkin_count':
      current = Number(metrics.mood_checkins_count || 0);
      break;
    default:
      current = 0;
      break;
  }

  const safeTarget = target > 0 ? target : 1;

  return {
    current,
    target: safeTarget,
    earned: current >= safeTarget,
    progressPercent: Math.max(0, Math.min(100, Math.round((current / safeTarget) * 100)))
  };
}

function getBadgeCategory(criteria) {
  switch (criteria?.type) {
    case 'streak':
      return 'streak';
    case 'task_count':
    case 'task_tag_count':
    case 'task_difficulty_count':
      return 'task';
    case 'journal_count':
      return 'journal';
    case 'mood_checkin_count':
      return 'mood';
    case 'crisis_recovery':
    case 'xp':
    default:
      return 'milestone';
  }
}

function describeBadgeCriteria(criteria) {
  const value = Number(criteria?.value || 0);

  switch (criteria?.type) {
    case 'task_count':
      return `Hoan thanh ${value} nhiem vu`;
    case 'streak':
      return `Duy tri streak ${value} ngay lien tuc`;
    case 'task_tag_count':
      if (criteria.tag === 'meditation') return `Hoan thanh ${value} bai thien`;
      if (criteria.tag === 'kindness') return `Hoan thanh ${value} nhiem vu tu te`;
      return `Hoan thanh ${value} nhiem vu thuoc nhom ${criteria.tag || 'dac biet'}`;
    case 'task_difficulty_count':
      if (criteria.difficulty === 'hard') return `Hoan thanh ${value} nhiem vu muc kho`;
      return `Hoan thanh ${value} nhiem vu do kho ${criteria.difficulty || 'bat ky'}`;
    case 'crisis_recovery':
      return 'Vuot qua giai doan stress cao va on dinh lai trong 14 ngay gan day';
    case 'xp':
      return `Dat tong cong ${value} XP`;
    case 'journal_count':
      return `Viet ${value} nhat ky`;
    case 'mood_checkin_count':
      return `Hoan thanh ${value} lan check-in tam trang`;
    default:
      return 'Hoan thanh dieu kien dac biet';
  }
}

function buildChallenges(weeklyActivity) {
  const tasksLast7d = Number(weeklyActivity.tasks_last_7d || 0);
  const journalsLast7d = Number(weeklyActivity.journals_last_7d || 0);
  const moodsLast7d = Number(weeklyActivity.moods_last_7d || 0);

  return [
    makeChallenge({
      code: 'weekly_tasks',
      icon: '🎯',
      title: 'Nhip hoan thanh nhiem vu',
      description: 'Hoan thanh 5 nhiem vu trong 7 ngay de giu nhip phuc hoi.',
      current: tasksLast7d,
      target: 5,
      reward: 'Tang toc XP va giu streak'
    }),
    makeChallenge({
      code: 'weekly_journal',
      icon: '📝',
      title: 'Nhat ky deu',
      description: 'Viet it nhat 2 entry trong 7 ngay de luu vet cam xuc.',
      current: journalsLast7d,
      target: 2,
      reward: 'Lam day hon phan insight'
    }),
    makeChallenge({
      code: 'weekly_mood',
      icon: '💚',
      title: 'Check-in tam trang',
      description: 'Hoan thanh 4 lan mood check-in trong 7 ngay.',
      current: moodsLast7d,
      target: 4,
      reward: 'Cai thien chat luong goi y'
    })
  ];
}

function makeChallenge({ code, icon, title, description, current, target, reward }) {
  const progressPercent = Math.max(0, Math.min(100, Math.round((current / target) * 100)));

  return {
    code,
    icon,
    title,
    description,
    reward,
    current,
    target,
    progress_percent: progressPercent,
    completed: current >= target
  };
}

function buildCalendarDays(activityDaysSet, referenceDate) {
  const today = startOfDay(referenceDate);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      label: '',
      iso_date: null,
      state: 'empty'
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const isoDate = toISODate(date);
    const isToday = isoDate === toISODate(today);
    const isFuture = date > today;
    const isDone = activityDaysSet.has(isoDate);

    let state = 'missed';
    if (isFuture) state = 'future';
    else if (isToday) state = isDone ? 'today done' : 'today';
    else if (isDone) state = 'done';

    cells.push({
      label: String(day),
      iso_date: isoDate,
      state
    });
  }

  return cells;
}

function getLevelInfo(xp) {
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (xp >= LEVELS[index].minXP) return LEVELS[index];
  }
  return LEVELS[0];
}

function getLevelProgress(xp) {
  const level = getLevelInfo(xp);
  return getLevelProgressWithinLevel(xp, level);
}

function getLevelProgressWithinLevel(xp, level) {
  if (level.maxXP === Infinity) return 100;
  const range = level.maxXP - level.minXP;
  if (range <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((xp - level.minXP) / range) * 100)));
}

function formatMonthLabel(date) {
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  });
  return formatter.format(date);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toISODate(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isRecentBadge(value) {
  const earnedAt = new Date(value);
  const now = Date.now();
  const diff = now - earnedAt.getTime();
  return diff >= 0 && diff <= (7 * 24 * 60 * 60 * 1000);
}

function formatDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default router;
