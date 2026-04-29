import { db } from '../../config/db.js';
import * as badgeService from '../badges/badge.service.js';

export function calculateLevelFromXp(totalXp) {
    if (!totalXp || totalXp < 0) return 1;
    return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1);
}

async function ensureUserProgress(client, userId) {
    await client.query(
        `INSERT INTO user_progress (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
    );
}

export async function updateProgressAfterCompletion(client, userId, xpEarned) {
    await ensureUserProgress(client, userId);

    const { rows } = await client.query(
        `SELECT * FROM user_progress WHERE user_id = $1 FOR UPDATE`,
        [userId]
    );

    const progress = rows[0];
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const lastActivity = progress.last_activity_date
        ? new Date(progress.last_activity_date).toISOString().slice(0, 10)
        : null;

    let newStreak = progress.current_streak || 0;

    if (!lastActivity) {
        newStreak = 1;
    } else if (lastActivity === todayStr) {
        newStreak = progress.current_streak || 1;
    } else {
        const last = new Date(lastActivity);
        const current = new Date(todayStr);
        const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24));
        newStreak = diffDays === 1 ? (progress.current_streak || 0) + 1 : 1;
    }

    const newTotalXp = (progress.total_xp || 0) + (xpEarned || 0);
    const newLevel = calculateLevelFromXp(newTotalXp);
    const newLongestStreak = Math.max(progress.longest_streak || 0, newStreak);

    const { rows: updatedRows } = await client.query(
        `UPDATE user_progress
         SET total_xp = $2, current_level = $3, current_streak = $4,
             longest_streak = $5, last_activity_date = $6, updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        [userId, newTotalXp, newLevel, newStreak, newLongestStreak, todayStr]
    );

    return updatedRows[0];
}

// ─── Task Queries ───

export async function getTasks(filters = {}) {
    let query = `SELECT * FROM tasks WHERE active = true`;
    const params = [];

    if (filters.category) {
        params.push(filters.category);
        query += ` AND category = $${params.length}`;
    }
    if (filters.difficulty) {
        params.push(filters.difficulty);
        query += ` AND difficulty = $${params.length}`;
    }

    query += ` ORDER BY category, duration_minutes`;
    const result = await db.query(query, params);
    return result.rows;
}

export async function getTaskById(taskId) {
    const result = await db.query(
        `SELECT * FROM tasks WHERE id = $1 AND active = true`,
        [taskId]
    );
    return result.rows[0] || null;
}

export async function getRecommendedTasks(userId) {
    const result = await db.query(
        `SELECT t.*
         FROM tasks t
         LEFT JOIN user_task_assignments uta
           ON t.id = uta.task_id AND uta.user_id = $1
         WHERE t.active = true AND uta.id IS NULL
         ORDER BY t.xp_reward DESC
         LIMIT 5`,
        [userId]
    );
    return result.rows;
}

// ─── Task Assignment ───

export async function assignTask(userId, taskId) {
    // Check task exists
    const task = await getTaskById(taskId);
    if (!task) {
        throw Object.assign(new Error('TASK_NOT_FOUND'), { status: 404 });
    }

    // Check not already assigned (pending)
    const existing = await db.query(
        `SELECT id FROM user_task_assignments
         WHERE user_id = $1 AND task_id = $2 AND status = 'pending'`,
        [userId, taskId]
    );
    if (existing.rowCount > 0) {
        throw Object.assign(new Error('Nhiệm vụ này đã được gán và đang chờ hoàn thành'), { status: 409 });
    }

    const result = await db.query(
        `INSERT INTO user_task_assignments (user_id, task_id, status)
         VALUES ($1, $2, 'pending')
         RETURNING *`,
        [userId, taskId]
    );
    return { assignment: result.rows[0], task };
}

export async function getUserAssignments(userId, status = null) {
    let query = `
        SELECT uta.*, t.title, t.description, t.category, t.difficulty,
               t.duration_minutes, t.xp_reward, t.icon, t.tags
        FROM user_task_assignments uta
        JOIN tasks t ON t.id = uta.task_id
        WHERE uta.user_id = $1`;
    const params = [userId];

    if (status) {
        params.push(status);
        query += ` AND uta.status = $${params.length}`;
    }

    query += ` ORDER BY uta.assigned_at DESC`;
    const result = await db.query(query, params);
    return result.rows;
}

export async function skipAssignment(userId, assignmentId) {
    const result = await db.query(
        `UPDATE user_task_assignments
         SET status = 'skipped', updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND status = 'pending'
         RETURNING *`,
        [assignmentId, userId]
    );
    if (result.rowCount === 0) {
        throw Object.assign(new Error('Không tìm thấy assignment hoặc đã hoàn thành'), { status: 404 });
    }
    return result.rows[0];
}

// ─── Task Completion ───

export async function completeTask({
    userId, taskId, assignmentId = null,
    completionNotes = null, selfRatingBefore = null,
    selfRatingAfter = null, durationActual = null
}) {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const taskRes = await client.query(
            `SELECT id, xp_reward FROM tasks WHERE id = $1 AND active = true LIMIT 1`,
            [taskId]
        );
        if (taskRes.rowCount === 0) {
            throw new Error('TASK_NOT_FOUND');
        }

        const task = taskRes.rows[0];
        const xpEarned = task.xp_reward || 0;

        if (assignmentId) {
            await client.query(
                `UPDATE user_task_assignments
                 SET status = 'completed', completed_at = NOW()
                 WHERE id = $1 AND user_id = $2`,
                [assignmentId, userId]
            );
        }

        const completionRes = await client.query(
            `INSERT INTO task_completions
              (user_id, task_id, assignment_id, completion_notes,
               self_rating_before, self_rating_after, duration_actual, xp_earned)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [userId, taskId, assignmentId, completionNotes,
             selfRatingBefore, selfRatingAfter, durationActual, xpEarned]
        );

        const progress = await updateProgressAfterCompletion(client, userId, xpEarned);
        await client.query('COMMIT');

        const badgeResult = await badgeService.evaluateBadges(userId);

        return {
            completion: completionRes.rows[0],
            progress,
            newlyEarnedBadges: badgeResult.newlyEarned || [],
            badgeContext: badgeResult.context || {}
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
