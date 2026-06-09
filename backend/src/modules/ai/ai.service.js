import { env } from '../../config/env.js';
import { buildUserContext } from './ai.context.js';

function buildContextText(ctx) {
    const { progress, moodTrend, taskPatterns, badges, communityBehavior, profile } = ctx;
    const lines = [];

    lines.push(`Tiến độ: Level ${progress.current_level}, ${progress.total_xp} XP, streak ${progress.current_streak} ngày (kỷ lục ${progress.longest_streak} ngày)`);

    if (moodTrend.checkin_count > 0) {
        const trendLabel = { improving: 'đang tốt lên', declining: 'đang giảm', stable: 'ổn định', unknown: 'chưa rõ xu hướng' }[moodTrend.trend];
        lines.push(`Tâm trạng 14 ngày: mood ${moodTrend.mood_avg}/10, lo âu ${moodTrend.anxiety_avg}/10, stress ${moodTrend.stress_avg}/10 — ${trendLabel}`);
    } else {
        lines.push('Chưa có dữ liệu mood gần đây');
    }

    if (taskPatterns.total_completions_30d > 0) {
        const cats = taskPatterns.by_category.map(c => `${c.category}(${c.completions})`).join(', ');
        lines.push(`Hoạt động 30 ngày: ${taskPatterns.total_completions_30d} bài tập — ${cats}`);
        if (taskPatterns.favorite_category) lines.push(`Loại ưa thích: ${taskPatterns.favorite_category}`);
    } else {
        lines.push('Chưa hoàn thành bài tập nào trong 30 ngày qua');
    }

    if (badges.length > 0) lines.push(`Huy hiệu gần đây: ${badges.slice(0, 5).map(b => b.name).join(', ')}`);
    if (communityBehavior.favorite_post_category) lines.push(`Hay chia sẻ về: ${communityBehavior.favorite_post_category}`);
    if (profile.goals?.length) lines.push(`Mục tiêu: ${Array.isArray(profile.goals) ? profile.goals.join(', ') : profile.goals}`);
    if (profile.preferred_task_duration) lines.push(`Thời lượng bài tập ưa thích: ${profile.preferred_task_duration} phút`);

    return lines.join('\n');
}

async function callRAG(question, userId) {
    const response = await fetch(`${env.ragBaseUrl}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': env.ragApiKey,
        },
        body: JSON.stringify({
            question,
            session_id: `peaceflow_${userId}_${Date.now()}`,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`RAG ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.answer ?? '';
}

export async function getDailyMessage(userId) {
    const ctx = await buildUserContext(userId);
    const question = `Thông tin người dùng:\n${buildContextText(ctx)}\n\nViết lời nhắn buổi sáng ngắn (2-4 câu), ấm áp, cá nhân hóa dựa trên trạng thái của họ. Chỉ trả về lời nhắn.`;
    return callRAG(question, userId);
}

export async function getRecommendedTask(userId) {
    const ctx = await buildUserContext(userId);
    const question = `Thông tin người dùng:\n${buildContextText(ctx)}\n\nGợi ý 1 loại bài tập phù hợp nhất hôm nay (breathing/meditation/journal/reflection/sleep). Trả về JSON: {"category":"...","reason":"...","duration_minutes":...}. Chỉ trả về JSON.`;
    const raw = await callRAG(question, userId);

    try {
        const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        return JSON.parse(clean);
    } catch {
        return { category: 'meditation', reason: raw, duration_minutes: 10 };
    }
}

export async function getWeeklyInsight(userId) {
    const ctx = await buildUserContext(userId);
    const question = `Dữ liệu tuần của người dùng:\n${buildContextText(ctx)}\n\nViết nhận xét tuần (3-5 câu): điểm tích cực, điểm cần chú ý, và 1 gợi ý cụ thể cho tuần tới. Giọng đồng cảm, không phán xét.`;
    return callRAG(question, userId);
}
