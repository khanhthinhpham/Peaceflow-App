import * as reportRepository from './report.repository.js';

function safeNum(v, fallback = 0) {
    return v == null ? fallback : Number(v);
}

function calcDelta(current, previous) {
    if (current == null || previous == null) return null;
    return Number((Number(current) - Number(previous)).toFixed(1));
}

function normalizeTaskBreakdown(rows) {
    const base = {
        easy: 0,
        medium: 0,
        hard: 0,
        community: 0,
        emergency: 0
    };

    for (const row of rows) {
        const key = String(row.difficulty || '').toLowerCase();
        if (key in base) {
            base[key] = Number(row.total || 0);
        }
    }

    return base;
}

function buildRadar(latestAssessments, summary) {
    const latestMap = Object.fromEntries(
        latestAssessments.map(item => [item.code, item])
    );

    const gad7 = latestMap.GAD7 ? safeNum(latestMap.GAD7.total_score) : null;
    const phq9 = latestMap.PHQ9 ? safeNum(latestMap.PHQ9.total_score) : null;
    const psqi = latestMap.PSQI ? safeNum(latestMap.PSQI.total_score) : null;
    const stress = safeNum(summary?.current_stress_index);
    const anxiety = safeNum(summary?.current_anxiety_index);
    const sleepRisk = safeNum(summary?.sleep_risk_index);

    const anxietyScore = gad7 != null ? Math.max(0, 100 - Math.round((gad7 / 21) * 100)) : Math.max(0, 100 - Math.round(anxiety));
    const depressionScore = phq9 != null ? Math.max(0, 100 - Math.round((phq9 / 27) * 100)) : 70;
    const stressScore = Math.max(0, 100 - Math.round(stress));
    const sleepScore = psqi != null ? Math.max(0, 100 - Math.round((psqi / 21) * 100)) : Math.max(0, 100 - Math.round(sleepRisk));
    const physicalScore = Math.max(30, Math.min(100, 60 + Math.round((safeNum(summary?.completed_tasks) || 0) * 1.5)));
    const socialScore = Math.max(30, Math.min(100, 50 + Math.round((safeNum(summary?.journal_entries) || 0) * 2)));

    return {
        labels: ['Lo âu', 'Trầm cảm', 'Stress', 'Giấc ngủ', 'Thể chất', 'Xã hội'],
        values: [
            anxietyScore,
            depressionScore,
            stressScore,
            sleepScore,
            physicalScore,
            socialScore
        ]
    };
}

function buildInsights({ summary, previous, moodTrend, meditationMinutes, goodMoodDays, period }) {
    const insights = [];

    const moodDelta = calcDelta(summary?.avg_mood, previous?.avg_mood);
    if (moodDelta != null) {
        if (moodDelta > 0) {
            insights.push(`Tâm trạng trung bình đã cải thiện ${moodDelta} điểm so với kỳ trước.`);
        } else if (moodDelta < 0) {
            insights.push(`Tâm trạng trung bình giảm ${Math.abs(moodDelta)} điểm so với kỳ trước, nên chú ý các yếu tố gây áp lực gần đây.`);
        }
    }

    const taskDelta = calcDelta(summary?.completed_tasks, previous?.completed_tasks);
    if (taskDelta != null && taskDelta > 0) {
        insights.push(`Số nhiệm vụ hoàn thành tăng ${taskDelta}, cho thấy mức độ chủ động chăm sóc bản thân đang tốt hơn.`);
    }

    if (meditationMinutes > 0) {
        insights.push(`Bạn đã dành ${meditationMinutes} phút cho các hoạt động thiền/thở trong kỳ ${period}.`);
    }

    if (goodMoodDays > 0) {
        const totalDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
        insights.push(`Có ${goodMoodDays}/${totalDays} ngày tâm trạng trung bình đạt mức tốt.`);
    }

    if (Array.isArray(moodTrend) && moodTrend.length >= 3) {
        const sorted = [...moodTrend].sort((a, b) => (a.anxiety || 0) < (b.anxiety || 0) ? 1 : -1);
        const peak = sorted[0];
        if (peak && peak.anxiety != null) {
            insights.push(`Mức lo âu cao nhất trong kỳ rơi vào ${peak.label} với điểm trung bình ${peak.anxiety}.`);
        }
    }

    if (!insights.length) {
        insights.push('Chưa có đủ dữ liệu để tạo insight sâu. Hãy tiếp tục check-in, làm bài test và hoàn thành nhiệm vụ.');
    }

    return insights;
}

export async function getSummary(userId, period = 'week') {
    const [summary, previous, meditationMinutes, goodMoodDays] = await Promise.all([
        reportRepository.getSummaryStats(userId, period),
        reportRepository.getPreviousSummaryStats(userId, period),
        reportRepository.getMeditationMinutes(userId, period),
        reportRepository.getGoodMoodDays(userId, period)
    ]);

    return {
        period,
        summary: {
            avg_mood: safeNum(summary?.avg_mood, 0),
            avg_anxiety: safeNum(summary?.avg_anxiety, 0),
            avg_stress: safeNum(summary?.avg_stress, 0),
            completed_tasks: safeNum(summary?.completed_tasks, 0),
            journal_entries: safeNum(summary?.journal_entries, 0),
            xp_earned: safeNum(summary?.xp_earned, 0),
            total_xp: safeNum(summary?.total_xp, 0),
            current_level: safeNum(summary?.current_level, 1),
            current_streak: safeNum(summary?.current_streak, 0),
            longest_streak: safeNum(summary?.longest_streak, 0),
            badges_earned: safeNum(summary?.badges_earned, 0),
            current_stress_index: safeNum(summary?.current_stress_index, 0),
            current_anxiety_index: safeNum(summary?.current_anxiety_index, 0),
            sleep_risk_index: safeNum(summary?.sleep_risk_index, 0),
            burnout_risk_index: safeNum(summary?.burnout_risk_index, 0),
            crisis_risk_level: summary?.crisis_risk_level || 'low',
            meditation_minutes: meditationMinutes,
            good_mood_days: goodMoodDays
        },
        deltas: {
            avg_mood: calcDelta(summary?.avg_mood, previous?.avg_mood),
            avg_anxiety: calcDelta(previous?.avg_anxiety, summary?.avg_anxiety) == null
                ? null
                : Number((Number(previous?.avg_anxiety || 0) - Number(summary?.avg_anxiety || 0)).toFixed(1)),
            completed_tasks: calcDelta(summary?.completed_tasks, previous?.completed_tasks),
            journal_entries: calcDelta(summary?.journal_entries, previous?.journal_entries),
            xp_earned: calcDelta(summary?.xp_earned, previous?.xp_earned)
        }
    };
}

export async function getMoodTrend(userId, period = 'week') {
    return reportRepository.getMoodTrend(userId, period);
}

export async function getTaskBreakdown(userId, period = 'week') {
    const rows = await reportRepository.getTaskBreakdown(userId, period);
    return normalizeTaskBreakdown(rows);
}

export async function getAssessmentHistory(userId) {
    return reportRepository.getAssessmentHistory(userId);
}

export async function getRadar(userId, period = 'week') {
    const [summaryWrap, latestAssessments] = await Promise.all([
        getSummary(userId, period),
        reportRepository.getLatestAssessmentByCode(userId)
    ]);

    return buildRadar(latestAssessments, summaryWrap.summary);
}

export async function getInsights(userId, period = 'week') {
    const [summaryWrap, moodTrend] = await Promise.all([
        getSummary(userId, period),
        reportRepository.getMoodTrend(userId, period)
    ]);

    const insights = buildInsights({
        summary: summaryWrap.summary,
        previous: null,
        moodTrend,
        meditationMinutes: summaryWrap.summary.meditation_minutes,
        goodMoodDays: summaryWrap.summary.good_mood_days,
        period
    });

    return insights;
}

export async function exportJson(userId, period = 'week') {
    const [summary, moodTrend, taskBreakdown, assessmentHistory, radar, insights] = await Promise.all([
        getSummary(userId, period),
        getMoodTrend(userId, period),
        getTaskBreakdown(userId, period),
        getAssessmentHistory(userId),
        getRadar(userId, period),
        getInsights(userId, period)
    ]);

    return {
        generated_at: new Date().toISOString(),
        period,
        summary,
        mood_trend: moodTrend,
        task_breakdown: taskBreakdown,
        assessment_history: assessmentHistory,
        radar,
        insights
    };
}
