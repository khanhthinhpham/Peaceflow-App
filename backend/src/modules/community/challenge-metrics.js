import { db } from '../../config/db.js';

// Cac loai chi so admin co the chon khi tao thu thach cong dong moi. Moi loai co 1 cach
// tinh rieng — dung LAI dung nguon du lieu that da co san trong he thong, khong bia so.
export const METRIC_TYPES = {
  meditation_minutes: { labelVi: 'Tổng phút thiền/thở', unitVi: 'phút' },
  journal_entries: { labelVi: 'Số bài nhật ký', unitVi: 'bài nhật ký' },
  task_completions: { labelVi: 'Số nhiệm vụ hoàn thành (bất kỳ)', unitVi: 'nhiệm vụ' },
  specific_tasks: { labelVi: 'Chỉ tính các nhiệm vụ được chọn riêng', unitVi: 'lượt hoàn thành' }
};

const MEDITATION_TITLE_PATTERN = 'thiền|meditat|thở|breath';

// Tinh gia tri hien tai cua 1 chi so, tu thoi diem sinceDate den now(). Neu co userId thi
// chi tinh RIENG nguoi do (dung cho thuong ca nhan); khong co userId thi tinh CA CONG DONG
// (dung cho thanh tien do chung). taskIds chi can thiet khi metricType = 'specific_tasks'.
export async function computeMetricValue(metricType, sinceDate, userId = null, taskIds = null) {
  switch (metricType) {
    case 'meditation_minutes': {
      const params = userId ? [sinceDate, MEDITATION_TITLE_PATTERN, userId] : [sinceDate, MEDITATION_TITLE_PATTERN];
      const r = await db.query(
        `select coalesce(sum(coalesce(tc.duration_actual, t.duration_minutes, 0)), 0)::int as v
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.created_at >= $1
           and (t.title ~* $2)
           ${userId ? 'and tc.user_id = $3' : ''}`,
        params
      );
      return r.rows[0]?.v || 0;
    }
    case 'journal_entries': {
      const params = userId ? [sinceDate, userId] : [sinceDate];
      const r = await db.query(
        `select count(*)::int as v
         from journal_entries
         where created_at >= $1
           ${userId ? 'and user_id = $2' : ''}`,
        params
      );
      return r.rows[0]?.v || 0;
    }
    case 'task_completions': {
      const params = userId ? [sinceDate, userId] : [sinceDate];
      const r = await db.query(
        `select count(*)::int as v
         from task_completions
         where created_at >= $1
           ${userId ? 'and user_id = $2' : ''}`,
        params
      );
      return r.rows[0]?.v || 0;
    }
    case 'specific_tasks': {
      if (!taskIds || !taskIds.length) return 0;
      const params = userId ? [sinceDate, taskIds, userId] : [sinceDate, taskIds];
      const r = await db.query(
        `select count(*)::int as v
         from task_completions tc
         where tc.created_at >= $1
           and tc.task_id = any($2::uuid[])
           ${userId ? 'and tc.user_id = $3' : ''}`,
        params
      );
      return r.rows[0]?.v || 0;
    }
    default:
      return 0;
  }
}

// So nguoi dung KHAC NHAU da dong gop cho chi so nay tu sinceDate — dung cho dong "N nguoi
// tham gia" hien thi tren banner (khac voi "N nguoi da bam Tham gia").
export async function computeParticipants(metricType, sinceDate, taskIds = null) {
  switch (metricType) {
    case 'meditation_minutes': {
      const r = await db.query(
        `select count(distinct tc.user_id)::int as v
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.created_at >= $1 and (t.title ~* $2)`,
        [sinceDate, MEDITATION_TITLE_PATTERN]
      );
      return r.rows[0]?.v || 0;
    }
    case 'journal_entries': {
      const r = await db.query(`select count(distinct user_id)::int as v from journal_entries where created_at >= $1`, [sinceDate]);
      return r.rows[0]?.v || 0;
    }
    case 'task_completions': {
      const r = await db.query(`select count(distinct user_id)::int as v from task_completions where created_at >= $1`, [sinceDate]);
      return r.rows[0]?.v || 0;
    }
    case 'specific_tasks': {
      if (!taskIds || !taskIds.length) return 0;
      const r = await db.query(
        `select count(distinct user_id)::int as v from task_completions where created_at >= $1 and task_id = any($2::uuid[])`,
        [sinceDate, taskIds]
      );
      return r.rows[0]?.v || 0;
    }
    default:
      return 0;
  }
}
