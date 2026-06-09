import { db } from '../../config/db.js';

// Cache đơn giản in-memory: userId → { data, cachedAt }
const contextCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ

export async function buildUserContext(userId) {
    const cached = contextCache.get(userId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return cached.data;
    }

    const [progress, moodTrend, taskPatterns, badges, communityBehavior, profile] =
        await Promise.all([
            queryProgress(userId),
            queryMoodTrend(userId),
            queryTaskPatterns(userId),
            queryBadges(userId),
            queryCommunityBehavior(userId),
            queryProfile(userId),
        ]);

    const data = { progress, moodTrend, taskPatterns, badges, communityBehavior, profile };

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
            -- So sánh 3 ngày gần nhất vs 3 ngày trước đó để xác định xu hướng
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
            count(*)::int                             as completions,
            round(avg(tc.self_rating_after)::numeric, 1) as avg_rating_after,
            round(avg(tc.duration_actual)::numeric)   as avg_duration_min
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
