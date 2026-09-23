import { db } from '../config/db.js';
import { computeMetricValue } from '../modules/community/challenge-metrics.js';

// Thang xep hang level - trung lap voi progress.routes.js/report.routes.js (khong export ra
// dung chung), giu dong bo thu cong neu doi nguong XP moi level.
const LEVELS = [
  { level: 1, title: 'Người Bắt Đầu', minXP: 0, maxXP: 100 },
  { level: 2, title: 'Người Khám Phá', minXP: 100, maxXP: 300 },
  { level: 3, title: 'Người Kiên Cường', minXP: 300, maxXP: 600 },
  { level: 4, title: 'Người Truyền Cảm Hứng', minXP: 600, maxXP: 1000 },
  { level: 5, title: 'Bậc Thầy Bình Yên', minXP: 1000, maxXP: Infinity }
];
function getLevelForXp(xp) {
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (xp >= LEVELS[index].minXP) return LEVELS[index].level;
  }
  return LEVELS[0].level;
}

// Thuong thu thach cong dong dang active: ai da bam "Tham gia" (co dong trong
// community_challenge_participants, khoa theo challenge_id + cycle_started_at — tuc DUNG
// LAN thu thach nay dang chay, khong phai theo tuan lich) va tu minh dong gop du
// personal_threshold (do theo dung metric_type cua thu thach) thi duoc +reward_xp — chi 1
// lan/nguoi/lan-thu-thach (chan bang community_challenge_rewards).
export async function runCommunityChallengeRewardJob() {
  try {
    const stateRes = await db.query(
      `select c.id as challenge_id, c.metric_type, c.personal_threshold, c.reward_xp, c.task_ids, s.started_at
       from community_weekly_challenge_state s
       join community_weekly_challenges c on c.id = s.current_challenge_id
       where s.id = true`
    );
    const challenge = stateRes.rows[0];
    if (!challenge) return { rewarded: 0, checked: 0, reason: 'no_current_challenge' };
    // Khong dat nguong ca nhan (personal_threshold null) nghia la ai tham gia cung duoc
    // thuong ngay khi ca cong dong dat muc tieu — job nay chi xu ly truong hop CO nguong,
    // truong hop khong nguong se xu ly rieng trong community-weekly-challenge.job.js khi
    // thu thach hoan thanh (chua lam trong pham vi nay, personal_threshold luon duoc dat khi
    // tao qua admin UI).
    if (challenge.personal_threshold === null || challenge.personal_threshold === undefined) {
      return { rewarded: 0, checked: 0, reason: 'no_personal_threshold' };
    }

    const participantsRes = await db.query(
      `select p.user_id
       from community_challenge_participants p
       left join community_challenge_rewards r
         on r.user_id = p.user_id and r.challenge_id = p.challenge_id and r.cycle_started_at = p.cycle_started_at
       where p.challenge_id = $1 and p.cycle_started_at = $2
         and r.user_id is null`,
      [challenge.challenge_id, challenge.started_at]
    );

    let rewarded = 0;
    for (const { user_id: userId } of participantsRes.rows) {
      const value = await computeMetricValue(challenge.metric_type, challenge.started_at, userId, challenge.task_ids);
      if (value < challenge.personal_threshold) continue;

      const client = await db.connect();
      try {
        await client.query('begin');
        const updated = await client.query(
          `update user_progress set total_xp = total_xp + $2 where user_id = $1 returning total_xp`,
          [userId, challenge.reward_xp]
        );
        if (!updated.rows[0]) {
          // Chua co user_progress (chua tung hoan thanh nhiem vu nao) — khong the cong XP,
          // bo qua thay vi ghi nhan thuong "ao".
          await client.query('rollback');
          continue;
        }
        const newLevel = getLevelForXp(updated.rows[0].total_xp);
        await client.query(`update user_progress set current_level = $2 where user_id = $1`, [userId, newLevel]);
        await client.query(
          `insert into community_challenge_rewards (user_id, challenge_id, cycle_started_at, xp_awarded)
           values ($1, $2, $3, $4)
           on conflict (user_id, challenge_id, cycle_started_at) do nothing`,
          [userId, challenge.challenge_id, challenge.started_at, challenge.reward_xp]
        );
        await client.query('commit');
        rewarded += 1;
      } catch (error) {
        await client.query('rollback');
        console.error('[COMMUNITY_CHALLENGE_REWARD_JOB] user', userId, 'failed:', error.message);
      } finally {
        client.release();
      }
    }
    console.log(`[COMMUNITY_CHALLENGE_REWARD_JOB] Rewarded ${rewarded}/${participantsRes.rows.length} eligible participants`);
    return { rewarded, checked: participantsRes.rows.length };
  } catch (error) {
    console.error('[COMMUNITY_CHALLENGE_REWARD_JOB] Failed:', error.message);
    throw error;
  }
}
