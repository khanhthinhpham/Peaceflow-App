import { db } from '../config/db.js';
import { computeMetricValue } from '../modules/community/challenge-metrics.js';

// Kiem tra thu thach cong dong dang active — neu da dat du muc tieu (100%) thi tu dong
// chuyen sang thu thach TIEP THEO trong hang doi (theo queue_order, vong lai tu dau neu het
// danh sach). Chua dat thi giu nguyen, KHONG tu doi khi het tuan — dung yeu cau cua admin.
export async function runCommunityWeeklyChallengeJob() {
  try {
    const stateRes = await db.query(
      `select s.current_challenge_id, s.started_at, c.goal_amount, c.metric_type, c.task_ids
       from community_weekly_challenge_state s
       left join community_weekly_challenges c on c.id = s.current_challenge_id
       where s.id = true`
    );
    const state = stateRes.rows[0];
    if (!state || !state.current_challenge_id) {
      return { advanced: false, reason: 'no_current_challenge' };
    }

    const currentValue = await computeMetricValue(state.metric_type, state.started_at, null, state.task_ids);
    if (currentValue < state.goal_amount) {
      return { advanced: false, progress: currentValue, goal: state.goal_amount };
    }

    // Da dat muc tieu — tim thu thach active tiep theo trong hang doi (queue_order lon hon
    // thu thach hien tai), vong lai thu thach active dau tien neu da la thu thach cuoi.
    const currentOrderRes = await db.query(
      `select queue_order from community_weekly_challenges where id = $1`,
      [state.current_challenge_id]
    );
    const currentOrder = currentOrderRes.rows[0]?.queue_order ?? 0;

    const nextRes = await db.query(
      `select id from community_weekly_challenges
       where active = true and queue_order > $1
       order by queue_order asc
       limit 1`,
      [currentOrder]
    );
    let nextId = nextRes.rows[0]?.id;
    if (!nextId) {
      const firstRes = await db.query(
        `select id from community_weekly_challenges where active = true order by queue_order asc limit 1`
      );
      nextId = firstRes.rows[0]?.id;
    }
    if (!nextId) {
      return { advanced: false, reason: 'no_next_challenge_available' };
    }

    await db.query(
      `update community_weekly_challenge_state set current_challenge_id = $1, started_at = now() where id = true`,
      [nextId]
    );
    console.log(`[COMMUNITY_WEEKLY_CHALLENGE_JOB] Advanced from ${state.current_challenge_id} to ${nextId} (goal ${state.goal_amount} reached)`);
    return { advanced: true, from: state.current_challenge_id, to: nextId };
  } catch (error) {
    console.error('[COMMUNITY_WEEKLY_CHALLENGE_JOB] Failed:', error.message);
    throw error;
  }
}
