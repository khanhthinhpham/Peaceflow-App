import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { RiskEngineService } from '../risk/risk-engine.service.js';
import { RecommendationEngineService } from '../risk/recommendation-engine.service.js';

const router = Router();

const LEVELS = [
  { level: 1, title: 'Người Bắt Đầu', minXP: 0, maxXP: 100 },
  { level: 2, title: 'Người Khám Phá', minXP: 100, maxXP: 300 },
  { level: 3, title: 'Người Kiên Cường', minXP: 300, maxXP: 600 },
  { level: 4, title: 'Người Truyền Cảm Hứng', minXP: 600, maxXP: 1000 },
  { level: 5, title: 'Bậc Thầy Bình Yên', minXP: 1000, maxXP: Infinity }
];

router.get('/reports/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const [progressRes, latestMoodRes, totalTasksRes, badgesRes, riskRes] = await Promise.all([
      db.query(`select * from user_progress where user_id = $1 limit 1`, [userId])
        .catch((e) => { console.error('[SUMMARY_QUERY] user_progress:', e.message); return { rows: [] }; }),
      db.query(`select * from mood_checkins where user_id = $1 order by created_at desc limit 1`, [userId])
        .catch((e) => { console.error('[SUMMARY_QUERY] mood_checkins:', e.message); return { rows: [] }; }),
      db.query(`select count(*)::int as completed_tasks from task_completions where user_id = $1`, [userId])
        .catch((e) => { console.error('[SUMMARY_QUERY] task_completions:', e.message); return { rows: [] }; }),
      db.query(`select count(*)::int as badges_count from user_badges where user_id = $1`, [userId])
        .catch((e) => { console.error('[SUMMARY_QUERY] user_badges:', e.message); return { rows: [] }; }),
      RiskEngineService.calculateStressIndex(userId).catch(() => ({ stress_index: 0, risk_level: 'low', show_emergency_banner: false }))
    ]);

    return res.json({
      success: true,
      data: {
        progress: progressRes.rows[0] || null,
        latest_mood: latestMoodRes.rows[0] || null,
        completed_tasks: totalTasksRes.rows[0]?.completed_tasks || 0,
        badges_count: badgesRes.rows[0]?.badges_count || 0,
        stress_index: riskRes.stress_index,
        risk_level: riskRes.risk_level,
        show_emergency_banner: Boolean(riskRes.show_emergency_banner)
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch dashboard summary' });
  }
});

router.get('/reports/detail', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const riskSummary = await RiskEngineService.calculateStressIndex(userId).catch(() => ({
      stress_index: 0,
      risk_level: 'low',
      show_emergency_banner: false,
      primary_trigger: null
    }));

    const [
      userRes,
      progressRes,
      latestMoodRes,
      moodHistoryRes,
      journalHistoryRes,
      taskHistoryRes,
      assessmentHistoryRes,
      badgesCountRes
    ] = await Promise.all([
      db.query(
        `select id, email, full_name, display_name, avatar_url
         from users
         where id = $1
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[DETAIL_QUERY] users:', e.message); return { rows: [] }; }),
      db.query(`select * from user_progress where user_id = $1 limit 1`, [userId])
        .catch((e) => { console.error('[DETAIL_QUERY] user_progress:', e.message); return { rows: [] }; }),
      db.query(`select * from mood_checkins where user_id = $1 order by created_at desc limit 1`, [userId])
        .catch((e) => { console.error('[DETAIL_QUERY] mood_checkins latest:', e.message); return { rows: [] }; }),
      db.query(
        `select
           created_at::date as day,
           round(avg(mood_score)::numeric, 1) as mood_score,
           round(avg(stress_score)::numeric, 1) as stress_score,
           round(avg(anxiety_score)::numeric, 1) as anxiety_score,
           round(avg(energy_score)::numeric, 1) as energy_score,
           round(avg(sleep_quality_score)::numeric, 1) as sleep_quality_score
         from mood_checkins
         where user_id = $1
           and created_at >= now() - interval '90 days'
         group by created_at::date
         order by day asc`,
        [userId]
      ).catch((e) => { console.error('[DETAIL_QUERY] mood_checkins history:', e.message); return { rows: [] }; }),
      db.query(
        `select
           id,
           title,
           content,
           tags,
           sentiment_score,
           is_private,
           created_at
         from journal_entries
         where user_id = $1
           and created_at >= now() - interval '90 days'
         order by created_at desc`,
        [userId]
      ).catch((e) => { console.error('[DETAIL_QUERY] journal_entries:', e.message); return { rows: [] }; }),
      db.query(
        `select
           tc.id,
           tc.created_at,
           tc.xp_earned,
           tc.duration_actual,
           tc.self_rating_before,
           tc.self_rating_after,
           t.id as task_id,
           t.code,
           t.title,
           t.category,
           t.difficulty,
           t.duration_minutes
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.user_id = $1
           and tc.created_at >= now() - interval '90 days'
         order by tc.created_at desc`,
        [userId]
      ).catch((e) => { console.error('[DETAIL_QUERY] task_completions:', e.message); return { rows: [] }; }),
      db.query(
        `select
           ar.id,
           ar.total_score,
           ar.severity,
           ar.dimension_scores,
           ar.created_at,
           a.code,
           a.name
         from assessment_results ar
         join assessments a on a.id = ar.assessment_id
         where ar.user_id = $1
         order by ar.created_at desc
         limit 8`,
        [userId]
      ).catch((e) => { console.error('[DETAIL_QUERY] assessment_results:', e.message); return { rows: [] }; }),
      db.query(
        `select count(*)::int as badges_count
         from user_badges
         where user_id = $1`,
        [userId]
      ).catch((e) => { console.error('[DETAIL_QUERY] user_badges:', e.message); return { rows: [] }; })
    ]);

    const storedProgress = progressRes.rows[0] || null;
    const xp = storedProgress?.total_xp || 0;
    const levelInfo = getLevelInfo(xp);

    return res.json({
      success: true,
      data: {
        user: userRes.rows[0] || null,
        progress: storedProgress
          ? {
              ...storedProgress,
              xp,
              level: storedProgress.current_level || levelInfo.level,
              streak: storedProgress.current_streak || 0,
              level_info: {
                ...levelInfo,
                progress_percent: getLevelProgress(xp),
                xp_to_next:
                  levelInfo.maxXP === Infinity ? 0 : Math.max(0, levelInfo.maxXP - xp)
              }
            }
          : {
              total_xp: 0,
              current_level: levelInfo.level,
              current_streak: 0,
              longest_streak: 0,
              xp: 0,
              level: levelInfo.level,
              streak: 0,
              level_info: {
                ...levelInfo,
                progress_percent: getLevelProgress(0),
                xp_to_next: levelInfo.maxXP === Infinity ? 0 : levelInfo.maxXP
              }
            },
        latest_mood: latestMoodRes.rows[0] || null,
        summary: {
          risk_level: riskSummary.risk_level || 'low',
          stress_index: riskSummary.stress_index ?? 0,
          primary_trigger: riskSummary.primary_trigger || null,
          show_emergency_banner: Boolean(riskSummary.show_emergency_banner),
          badges_count: badgesCountRes.rows[0]?.badges_count || 0
        },
        mood_history: moodHistoryRes.rows.map((row) => ({
          day: toISODate(row.day),
          mood_score: row.mood_score === null ? null : Number(row.mood_score),
          stress_score: row.stress_score === null ? null : Number(row.stress_score),
          anxiety_score: row.anxiety_score === null ? null : Number(row.anxiety_score),
          energy_score: row.energy_score === null ? null : Number(row.energy_score),
          sleep_quality_score: row.sleep_quality_score === null ? null : Number(row.sleep_quality_score)
        })),
        journal_history: journalHistoryRes.rows.map((row) => ({
          ...row,
          tags: Array.isArray(row.tags) ? row.tags : []
        })),
        task_history: taskHistoryRes.rows.map((row) => ({
          ...row,
          xp_earned: row.xp_earned === null ? 0 : Number(row.xp_earned),
          duration_actual: row.duration_actual === null ? null : Number(row.duration_actual),
          duration_minutes: row.duration_minutes === null ? null : Number(row.duration_minutes)
        })),
        assessments: assessmentHistoryRes.rows.map((row) => ({
          ...row,
          total_score: row.total_score === null ? null : Number(row.total_score)
        }))
      }
    });
  } catch (error) {
    console.error('Report detail error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch report detail' });
  }
});

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const recommendations = await RecommendationEngineService.recommendTasks(userId).catch((error) => {
      console.error('Dashboard recommendation error:', error);
      return {
        today_priority_tasks: [],
        risk_summary: null,
        show_emergency_banner: false
      };
    });

    const fallbackRisk = recommendations.risk_summary
      ? recommendations.risk_summary
      : await RiskEngineService.calculateStressIndex(userId).catch(() => ({
          stress_index: 0,
          risk_level: 'low',
          show_emergency_banner: false,
          primary_trigger: null
        }));

    const [
      userRes,
      progressRes,
      latestMoodRes,
      moodHistoryRes,
      anxiety14dRes,
      weeklyTasksRes,
      totalTasksRes,
      badgesCountRes,
      badgesRecentRes,
      recentJournalRes,
      topTaskRes,
      upcomingExpertSessionRes
    ] = await Promise.all([
      db.query(
        `select id, email, full_name, display_name, avatar_url
         from users
         where id = $1
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] users:', e.message); return { rows: [] }; }),
      db.query(`select * from user_progress where user_id = $1 limit 1`, [userId])
        .catch((e) => { console.error('[DASHBOARD_QUERY] user_progress:', e.message); return { rows: [] }; }),
      db.query(`select * from mood_checkins where user_id = $1 order by created_at desc limit 1`, [userId])
        .catch((e) => { console.error('[DASHBOARD_QUERY] mood_checkins latest:', e.message); return { rows: [] }; }),
      db.query(
        `select
           created_at::date as day,
           round(avg(mood_score)::numeric, 1) as mood_score,
           round(avg(stress_score)::numeric, 1) as stress_score,
           round(avg(anxiety_score)::numeric, 1) as anxiety_score
         from mood_checkins
         where user_id = $1
           and created_at >= now() - interval '90 days'
         group by created_at::date
         order by day asc`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] mood_checkins history:', e.message); return { rows: [] }; }),
      db.query(
        `select round(avg(anxiety_score)::numeric, 1) as anxiety_average_14d
         from mood_checkins
         where user_id = $1
           and created_at >= now() - interval '14 days'`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] anxiety_14d:', e.message); return { rows: [] }; }),
      db.query(
        `select count(*)::int as weekly_tasks_completed
         from task_completions
         where user_id = $1
           and created_at >= now() - interval '7 days'`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] task_completions weekly:', e.message); return { rows: [] }; }),
      db.query(
        `select count(*)::int as completed_tasks
         from task_completions
         where user_id = $1`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] task_completions total:', e.message); return { rows: [] }; }),
      db.query(
        `select count(*)::int as badges_count
         from user_badges
         where user_id = $1`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] user_badges count:', e.message); return { rows: [] }; }),
      db.query(
        `select b.code, b.name, b.icon, b.rarity, ub.earned_at
         from user_badges ub
         join badges b on b.id = ub.badge_id
         where ub.user_id = $1
         order by ub.earned_at desc
         limit 3`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] badges recent:', e.message); return { rows: [] }; }),
      db.query(
        `select title, content, sentiment_score, created_at
         from journal_entries
         where user_id = $1
         order by created_at desc
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] journal_entries:', e.message); return { rows: [] }; }),
      db.query(
        `select t.id, t.title, count(*)::int as completed_count
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.user_id = $1
           and tc.created_at >= now() - interval '30 days'
         group by t.id, t.title
         order by completed_count desc, t.title asc
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] top_task:', e.message); return { rows: [] }; }),
      db.query(
        `select
           eb.id,
           eb.session_type,
           eb.starts_at,
           eb.duration_minutes,
           eb.price,
           eb.status,
           e.full_name as expert_name
         from expert_bookings eb
         join experts e on e.id = eb.expert_id
         where eb.user_id = $1
           and eb.status in ('pending', 'confirmed')
           and eb.starts_at >= now()
         order by eb.starts_at asc
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[DASHBOARD_QUERY] expert_bookings:', e.message); return { rows: [] }; })
    ]);

    const user = userRes.rows[0] || null;
    const latestMood = latestMoodRes.rows[0] || null;
    const storedProgress = progressRes.rows[0] || null;
    const anxietyAverage14d = anxiety14dRes.rows[0]?.anxiety_average_14d === null || anxiety14dRes.rows[0]?.anxiety_average_14d === undefined
      ? null
      : Number(anxiety14dRes.rows[0].anxiety_average_14d);
    const weeklyTasksCompleted = weeklyTasksRes.rows[0]?.weekly_tasks_completed || 0;
    const totalCompletedTasks = totalTasksRes.rows[0]?.completed_tasks || 0;
    const badgesCount = badgesCountRes.rows[0]?.badges_count || 0;

    const xp = storedProgress?.total_xp || 0;
    const levelInfo = getLevelInfo(xp);
    const progress = storedProgress
      ? {
          ...storedProgress,
          xp,
          level: storedProgress.current_level || levelInfo.level,
          streak: storedProgress.current_streak || 0,
          weekly_tasks_completed: weeklyTasksCompleted
        }
      : {
          total_xp: 0,
          current_level: levelInfo.level,
          current_streak: 0,
          longest_streak: 0,
          xp: 0,
          level: levelInfo.level,
          streak: 0,
          weekly_tasks_completed: weeklyTasksCompleted
        };

    const dailyMoodRows = moodHistoryRes.rows.map((row) => ({
      day: toISODate(row.day),
      mood_score: row.mood_score === null ? null : Number(row.mood_score),
      stress_score: row.stress_score === null ? null : Number(row.stress_score),
      anxiety_score: row.anxiety_score === null ? null : Number(row.anxiety_score)
    }));

    const moodChart = {
      '7d': buildSeries(dailyMoodRows, 7, 1),
      '30d': buildSeries(dailyMoodRows, 30, 5),
      '3m': buildSeries(dailyMoodRows, 90, 15)
    };

    const wellness = buildWellness(latestMood, progress, fallbackRisk);
    const challenge = buildWeeklyChallenge(weeklyTasksCompleted);
    const insight = buildInsight({
      latestMood,
      chart7d: moodChart['7d'],
      chart30d: moodChart['30d'],
      topTask: topTaskRes.rows[0] || null,
      journal: recentJournalRes.rows[0] || null,
      risk: fallbackRisk,
      badgesCount
    });

    return res.json({
      success: true,
      data: {
        user,
        summary: {
          completed_tasks: totalCompletedTasks,
          badges_count: badgesCount,
          risk_level: fallbackRisk.risk_level || 'low',
          stress_index: fallbackRisk.stress_index ?? 0,
          anxiety_average_14d: anxietyAverage14d,
          primary_trigger: fallbackRisk.primary_trigger || null,
          show_emergency_banner: Boolean(
            recommendations.show_emergency_banner ?? fallbackRisk.show_emergency_banner
          )
        },
        progress: {
          ...progress,
          level_info: {
            ...levelInfo,
            progress_percent: getLevelProgress(xp),
            xp_to_next:
              levelInfo.maxXP === Infinity ? 0 : Math.max(0, levelInfo.maxXP - xp)
          }
        },
        latest_mood: latestMood,
        mood_chart: moodChart,
        insight,
        wellness,
        badges_recent: badgesRecentRes.rows,
        challenge,
        expert_session: upcomingExpertSessionRes.rows[0]
          ? {
              ...upcomingExpertSessionRes.rows[0],
              starts_at: formatDateTimeLabel(upcomingExpertSessionRes.rows[0].starts_at)
            }
          : null,
        tasks: recommendations.today_priority_tasks || []
      }
    });
  } catch (error) {
    console.error('Dashboard route error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch dashboard data' });
  }
});

function getLevelInfo(xp) {
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (xp >= LEVELS[index].minXP) return LEVELS[index];
  }
  return LEVELS[0];
}

function getLevelProgress(xp) {
  const level = getLevelInfo(xp);
  if (level.maxXP === Infinity) return 100;
  const range = level.maxXP - level.minXP;
  if (range <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((xp - level.minXP) / range) * 100)));
}

function buildSeries(rows, totalDays, bucketSize) {
  const startDate = addDays(startOfDay(new Date()), -(totalDays - 1));
  const days = [];
  const rowMap = new Map(rows.map((row) => [row.day, row]));

  for (let index = 0; index < totalDays; index += 1) {
    const date = addDays(startDate, index);
    const key = toISODate(date);
    const row = rowMap.get(key);
    days.push({
      date: key,
      label: formatLabel(date, totalDays),
      value: row?.mood_score ?? null
    });
  }

  if (bucketSize <= 1) {
    return {
      range: totalDays === 7 ? '7d' : totalDays === 30 ? '30d' : '3m',
      points: days
    };
  }

  const points = [];

  for (let index = 0; index < days.length; index += bucketSize) {
    const bucket = days.slice(index, index + bucketSize);
    const numericValues = bucket
      .map((day) => day.value)
      .filter((value) => value !== null && value !== undefined);

    points.push({
      date: bucket[bucket.length - 1]?.date || bucket[0]?.date,
      label: formatRangeLabel(bucket[0]?.date, bucket[bucket.length - 1]?.date),
      value: numericValues.length
        ? roundOneDecimal(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length)
        : null
    });
  }

  return {
    range: totalDays === 30 ? '30d' : '3m',
    points
  };
}

function buildWellness(latestMood, progress, risk) {
  const currentStreak = progress?.current_streak || progress?.streak || 0;
  const weeklyTasksCompleted = progress?.weekly_tasks_completed || 0;
  const consistency = Math.min(10, roundOneDecimal((currentStreak * 0.6) + (weeklyTasksCompleted * 0.8)));

  const metrics = [
    makeMetric('emotion', 'Cảm xúc', latestMood?.mood_score, '#7BBF95'),
    makeMetric('energy', 'Năng lượng', latestMood?.energy_score, '#A8D8EA'),
    makeMetric('sleep', 'Giấc ngủ', latestMood?.sleep_quality_score, '#C3AED6'),
    makeMetric('calm', 'Bình tĩnh', invertScore(latestMood?.stress_score), '#FF8B8B'),
    makeMetric('clarity', 'Độ an tâm', invertScore(latestMood?.anxiety_score), '#D4A574'),
    makeMetric('consistency', 'Nhịp độ', consistency, '#FFCBA4')
  ];

  const garden = [
    toGardenMetric(metrics[0]),
    toGardenMetric(metrics[2]),
    toGardenMetric(metrics[3]),
    toGardenMetric(metrics[5])
  ];

  return {
    radar: metrics,
    garden,
    risk_level: risk?.risk_level || 'low'
  };
}

function buildWeeklyChallenge(weeklyTasksCompleted) {
  const weeklyGoal = 7;
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const progressPercent = Math.min(100, Math.round((weeklyTasksCompleted / weeklyGoal) * 100));

  return {
    title: 'Mục tiêu tuần này',
    description: 'Hoàn thành các nhiệm vụ được gợi ý để giữ nhịp chăm sóc bản thân.',
    completed: weeklyTasksCompleted,
    goal: weeklyGoal,
    progress_percent: progressPercent,
    reward_label: 'Giữ nhịp đều trong 7 ngày',
    days_left: daysUntilSunday
  };
}

function buildInsight({ latestMood, chart7d, chart30d, topTask, journal, risk, badgesCount }) {
  const last7Values = chart7d.points.map((point) => point.value).filter((value) => value !== null);
  const recentTrend = last7Values.length >= 2 ? last7Values[last7Values.length - 1] - last7Values[0] : 0;
  const last30Values = chart30d.points.map((point) => point.value).filter((value) => value !== null);
  const average30d = last30Values.length
    ? roundOneDecimal(last30Values.reduce((sum, value) => sum + value, 0) / last30Values.length)
    : null;

  if (!latestMood) {
    return {
      title: 'Chưa có đủ dữ liệu',
      body: 'Hãy hoàn thành mood check-in đầu tiên để dashboard bắt đầu phân tích nhịp cảm xúc và gợi ý phù hợp.',
      tags: ['Chờ check-in', 'Chưa có chuỗi dữ liệu']
    };
  }

  const lines = [];

  if (recentTrend >= 1) {
    lines.push(`Tâm trạng 7 ngày gần đây đang đi lên khoảng ${roundOneDecimal(recentTrend)} điểm.`);
  } else if (recentTrend <= -1) {
    lines.push(`Tâm trạng 7 ngày gần đây đang giảm khoảng ${Math.abs(roundOneDecimal(recentTrend))} điểm.`);
  } else {
    lines.push('Tâm trạng 7 ngày gần đây đang khá ổn định.');
  }

  if (average30d !== null) {
    lines.push(`Mức tâm trạng trung bình trong 30 ngày là ${average30d}/10.`);
  }

  if (topTask?.title) {
    lines.push(`Nhiệm vụ bạn hoàn thành nhiều nhất gần đây là "${topTask.title}".`);
  }

  if (journal?.title || journal?.content) {
    lines.push('Nhật ký gần nhất đã được đưa vào phân tích để điều chỉnh gợi ý theo cảm xúc gần đây.');
  }

  const tags = [];
  if ((risk?.risk_level || 'low') === 'low') tags.push('Rủi ro thấp');
  if ((risk?.risk_level || 'low') === 'moderate') tags.push('Cần giữ nhịp');
  if (['high', 'critical'].includes(risk?.risk_level || 'low')) tags.push('Cần ưu tiên hồi phục');
  if (badgesCount > 0) tags.push(`${badgesCount} huy hiệu`);
  if (latestMood.sleep_quality_score !== null && latestMood.sleep_quality_score !== undefined) {
    tags.push(`Ngủ ${latestMood.sleep_quality_score}/10`);
  }

  return {
    title: 'Insight từ dữ liệu của bạn',
    body: lines.join(' '),
    tags
  };
}

function makeMetric(key, label, rawValue, color) {
  const value = rawValue === null || rawValue === undefined ? null : roundOneDecimal(rawValue);
  return { key, label, value, color, status: getMetricStatus(value) };
}

function toGardenMetric(metric) {
  return {
    ...metric,
    emoji: getGardenEmoji(metric.key, metric.status),
    status_text: getStatusText(metric.status)
  };
}

function getMetricStatus(value) {
  if (value === null || value === undefined) return 'empty';
  if (value >= 8) return 'excellent';
  if (value >= 6) return 'good';
  if (value >= 4) return 'fair';
  return 'needs-care';
}

function getStatusText(status) {
  if (status === 'excellent') return 'Rất tốt';
  if (status === 'good') return 'Ổn định';
  if (status === 'fair') return 'Cần chú ý';
  if (status === 'needs-care') return 'Cần chăm sóc';
  return 'Chưa có dữ liệu';
}

function getGardenEmoji(key, status) {
  if (status === 'empty') return '🌱';

  const emojiMap = {
    emotion: status === 'excellent' ? '🌸' : '🌿',
    sleep: status === 'excellent' ? '🌙' : '😴',
    calm: status === 'excellent' ? '🪷' : '💧',
    consistency: status === 'excellent' ? '🏅' : '🌤️'
  };

  return emojiMap[key] || '🌱';
}

function invertScore(value) {
  if (value === null || value === undefined) return null;
  return Math.max(0, 10 - Number(value));
}

function roundOneDecimal(value) {
  return Math.round(Number(value) * 10) / 10;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

function formatLabel(date, totalDays) {
  if (totalDays <= 7) {
    const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return weekdayLabels[date.getDay()];
  }

  const formatter = new Intl.DateTimeFormat('vi-VN', {
    day: totalDays > 7 ? '2-digit' : undefined,
    month: totalDays > 30 ? '2-digit' : undefined,
    timeZone: 'Asia/Bangkok'
  });

  return formatter.format(date);
}

function formatDateTimeLabel(value) {
  if (!value) return null;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function formatRangeLabel(startDateIso, endDateIso) {
  const start = new Date(`${startDateIso}T00:00:00Z`);
  const end = new Date(`${endDateIso}T00:00:00Z`);
  const startLabel = `${String(start.getUTCDate()).padStart(2, '0')}/${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  const endLabel = `${String(end.getUTCDate()).padStart(2, '0')}/${String(end.getUTCMonth() + 1).padStart(2, '0')}`;
  return startLabel === endLabel ? startLabel : `${startLabel}-${endLabel}`;
}

export default router;
