/**
 * Reconstruct streak từ activity thực tế (timezone Asia/Ho_Chi_Minh).
 * Chạy 1 lần để fix user bị ảnh hưởng bởi bug UTC streak.
 *
 * npm run streak:fix
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const QUERY = `
WITH activity_dates AS (
    SELECT user_id, (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS activity_date
    FROM task_completions
    UNION
    SELECT user_id, (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS activity_date
    FROM mood_checkins
    UNION
    SELECT user_id, (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS activity_date
    FROM journal_entries
),
unique_dates AS (
    SELECT DISTINCT user_id, activity_date FROM activity_dates
),
-- Đánh số từ ngày gần nhất. Ngày liên tiếp sẽ có streak_group giống nhau.
ranked AS (
    SELECT
        user_id,
        activity_date,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date DESC) AS rn,
        (activity_date + (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date DESC) - 1)
            * INTERVAL '1 day')::date AS streak_group
    FROM unique_dates
),
-- Ngày gần nhất của mỗi user = streak_group của row đầu tiên
most_recent AS (
    SELECT user_id, MAX(activity_date) AS last_date
    FROM ranked
    GROUP BY user_id
),
-- Đếm số ngày liên tiếp từ ngày gần nhất
streak_lengths AS (
    SELECT r.user_id, COUNT(*)::int AS streak_length, mr.last_date AS last_activity_date
    FROM ranked r
    JOIN most_recent mr ON mr.user_id = r.user_id
    WHERE r.streak_group = mr.last_date
    GROUP BY r.user_id, mr.last_date
),
-- Chỉ giữ streak còn hiệu lực: last_activity là hôm nay hoặc hôm qua (giờ VN)
valid_streaks AS (
    SELECT sl.user_id, sl.streak_length, sl.last_activity_date
    FROM streak_lengths sl
    WHERE sl.last_activity_date >= (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - INTERVAL '1 day'
)
-- Chỉ update khi streak thực tế > streak hiện tại trong DB
UPDATE user_progress up
SET
    current_streak  = vs.streak_length,
    longest_streak  = GREATEST(up.longest_streak, vs.streak_length),
    last_activity_date = vs.last_activity_date
FROM valid_streaks vs
WHERE up.user_id = vs.user_id
  AND vs.streak_length > up.current_streak
RETURNING up.user_id, up.current_streak, up.longest_streak;
`;

async function main() {
    console.log('Fix streaks (timezone Asia/Ho_Chi_Minh)...\n');

    const { rows, rowCount } = await db.query(QUERY);

    if (rowCount === 0) {
        console.log('Không có user nào cần fix.');
    } else {
        console.log(`Đã fix ${rowCount} user:\n`);
        rows.forEach(r =>
            console.log(`  user_id=${r.user_id}  streak=${r.current_streak}  longest=${r.longest_streak}`)
        );
    }

    await db.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
