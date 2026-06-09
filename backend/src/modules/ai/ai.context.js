import { db } from '../../config/db.js';

const contextCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ

export async function buildUserContext(userId) {
    const cached = contextCache.get(userId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return cached.data;
    }

    const [
        progress,
        moodTrend,
        taskPatterns,
        badges,
        communityBehavior,
        profile,
        topRatedTasks,
        completionRates,
        preferredTime,
        activeDaysThisWeek,
        untriedCategories,
        assessmentTrend,
    ] = await Promise.all([
        queryProgress(userId),
        queryMoodTrend(userId),
        queryTaskPatterns(userId),
        queryBadges(userId),
        queryCommunityBehavior(userId),
        queryProfile(userId),
        queryTopRatedTasks(userId),
        queryCompletionRates(userId),
        queryPreferredTime(userId),
        queryActiveDaysThisWeek(userId),
        queryUntriedCategories(userId),
        queryAssessmentTrend(userId),
    ]);

    const data = {
        progress,
        moodTrend,
        taskPatterns,
        badges,
        communityBehavior,
        profile,
        topRatedTasks,
        completionRates,
        preferredTime,
        activeDaysThisWeek,
        untriedCategories,
        assessmentTrend,
    };

    contextCache.set(userId, { data, cachedAt: Date.now() });
    return data;
}

export function invalidateContext(userId) {
    contextCache.delete(userId);
}

// --- Queries ---

async function queryProgress(userId) {
    const { rows } = await db.query(
        `select total_xp, current_level, current_streak, longest_streak, badges_count
         from user_progress where user_id = $1`,
        [userId]
    );
    return rows[0] ?? { total_xp: 0, current_level: 1, current_streak: 0, longest_streak: 0, badges_count: 0 };
}

async function queryMoodTrend(userId) {
    const { rows } = await db.query(
        `select
            round(avg(mood_score)::numeric, 1)    as mood_avg,
            round(avg(anxiety_score)::numeric, 1) as anxiety_avg,
            round(avg(stress_score)::numeric, 1)  as stress_avg,
            round(avg(energy_score)::numeric, 1)  as energy_avg,
            count(*)::int                         as checkin_count,
            round(avg(case when created_at >= now() - interval '3 days'
                           then mood_score end)::numeric, 1) as mood_recent,
            round(avg(case when created_at < now() - interval '3 days'
                           then mood_score end)::numeric, 1) as mood_earlier
         from mood_checkins
         where user_id = $1 and created_at >= now() - interval '14 days'`,
        [userId]
    );
    const row = rows[0] ?? {};
    const trend =
        row.mood_recent == null || row.mood_earlier == null ? 'unknown'
        : row.mood_recent > row.mood_earlier + 0.5 ? 'improving'
        : row.mood_recent < row.mood_earlier - 0.5 ? 'declining'
        : 'stable';

    return {
        mood_avg: row.mood_avg,
        anxiety_avg: row.anxiety_avg,
        stress_avg: row.stress_avg,
        energy_avg: row.energy_avg,
        checkin_count: row.checkin_count ?? 0,
        trend,
    };
}

async function queryTaskPatterns(userId) {
    const { rows } = await db.query(
        `select
            t.category,
            count(*)::int                                 as completions,
            round(avg(tc.self_rating_after)::numeric, 1) as avg_rating_after,
            round(avg(tc.duration_actual)::numeric)       as avg_duration_min
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.user_id = $1 and tc.created_at >= now() - interval '30 days'
         group by t.category
         order by completions desc`,
        [userId]
    );
    const total = rows.reduce((s, r) => s + r.completions, 0);
    return {
        total_completions_30d: total,
        by_category: rows,
        favorite_category: rows[0]?.category ?? null,
    };
}

async function queryBadges(userId) {
    const { rows } = await db.query(
        `select b.code, b.name, b.rarity, ub.earned_at
         from user_badges ub
         join badges b on b.id = ub.badge_id
         where ub.user_id = $1
         order by ub.earned_at desc
         limit 10`,
        [userId]
    );
    return rows;
}

async function queryCommunityBehavior(userId) {
    const posts = await db.query(
        `select category, count(*)::int as count
         from community_posts
         where user_id = $1 and created_at >= now() - interval '30 days'
         group by category order by count desc`,
        [userId]
    );
    const reactions = await db.query(
        `select reaction_type, count(*)::int as count
         from community_reactions
         where user_id = $1 and created_at >= now() - interval '30 days'
         group by reaction_type order by count desc`,
        [userId]
    );
    return {
        posts_by_category: posts.rows,
        reactions_given: reactions.rows,
        favorite_post_category: posts.rows[0]?.category ?? null,
    };
}

async function queryProfile(userId) {
    const { rows } = await db.query(
        `select preferred_task_duration, sleep_target_hours,
                goals, support_preferences
         from user_profiles where user_id = $1`,
        [userId]
    );
    return rows[0] ?? {};
}

// Top 5 bài tập user tự đánh giá cao nhất (rating >= 4)
async function queryTopRatedTasks(userId) {
    const { rows } = await db.query(
        `select t.title, t.category, t.duration_minutes,
                round(avg(tc.self_rating_after)::numeric, 1) as avg_rating,
                count(*)::int as times_done
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.user_id = $1 and tc.self_rating_after >= 4
         group by t.id, t.title, t.category, t.duration_minutes
         order by avg_rating desc, times_done desc
         limit 5`,
        [userId]
    );
    return rows;
}

// Tỷ lệ hoàn thành theo category (completions / assignments)
async function queryCompletionRates(userId) {
    const { rows } = await db.query(
        `select
            t.category,
            count(distinct tc.id)::int  as completions,
            count(distinct ua.id)::int  as assignments,
            case
                when count(distinct ua.id) = 0 then null
                else round(count(distinct tc.id)::numeric / count(distinct ua.id) * 100)::int
            end as completion_rate_pct
         from tasks t
         left join user_task_assignments ua on ua.task_id = t.id and ua.user_id = $1
         left join task_completions tc      on tc.task_id = t.id and tc.user_id = $1
         where t.active = true
         group by t.category
         order by completions desc`,
        [userId]
    );
    return rows;
}

// Khung giờ hay làm bài nhất trong 30 ngày
async function queryPreferredTime(userId) {
    const { rows } = await db.query(
        `select
            case
                when extract(hour from created_at) between 5  and 11 then 'morning'
                when extract(hour from created_at) between 12 and 17 then 'afternoon'
                when extract(hour from created_at) between 18 and 21 then 'evening'
                else 'night'
            end as time_of_day,
            count(*)::int as count
         from task_completions
         where user_id = $1 and created_at >= now() - interval '30 days'
         group by time_of_day
         order by count desc
         limit 1`,
        [userId]
    );
    return rows[0]?.time_of_day ?? null;
}

// Số ngày active trong 7 ngày gần nhất (checkin hoặc hoàn thành bài)
async function queryActiveDaysThisWeek(userId) {
    const { rows } = await db.query(
        `select count(distinct day)::int as active_days
         from (
             select date(created_at) as day
             from mood_checkins
             where user_id = $1 and created_at >= now() - interval '7 days'
             union
             select date(created_at) as day
             from task_completions
             where user_id = $1 and created_at >= now() - interval '7 days'
         ) activity`,
        [userId]
    );
    return rows[0]?.active_days ?? 0;
}

// Category chưa bao giờ hoàn thành bài nào
async function queryUntriedCategories(userId) {
    const { rows } = await db.query(
        `select distinct t.category
         from tasks t
         where t.active = true
           and t.category not in (
               select distinct t2.category
               from task_completions tc
               join tasks t2 on t2.id = tc.task_id
               where tc.user_id = $1
           )
         order by t.category`,
        [userId]
    );
    return rows.map(r => r.category);
}

// Xu hướng mức độ nghiêm trọng từ kết quả đánh giá (so sánh 30 ngày gần vs 30 ngày trước)
const SEVERITY_SCORE = { none: 0, minimal: 1, mild: 2, moderate: 3, severe: 4, very_severe: 5 };

async function queryAssessmentTrend(userId) {
    const { rows } = await db.query(
        `select
            severity,
            created_at >= now() - interval '30 days' as is_recent
         from assessment_results
         where user_id = $1 and created_at >= now() - interval '60 days'
         order by created_at desc`,
        [userId]
    );

    if (!rows.length) return { trend: 'unknown', count: 0 };

    const recent  = rows.filter(r => r.is_recent).map(r => SEVERITY_SCORE[r.severity] ?? 2);
    const earlier = rows.filter(r => !r.is_recent).map(r => SEVERITY_SCORE[r.severity] ?? 2);

    if (!recent.length || !earlier.length) return { trend: 'unknown', count: rows.length };

    const avgRecent  = recent.reduce((s, v) => s + v, 0) / recent.length;
    const avgEarlier = earlier.reduce((s, v) => s + v, 0) / earlier.length;

    const trend =
        avgRecent < avgEarlier - 0.3 ? 'improving'
        : avgRecent > avgEarlier + 0.3 ? 'worsening'
        : 'stable';

    return { trend, count: rows.length };
}
