import app from './app.js';
import { env } from './config/env.js';
import { runStreakJob } from './jobs/streak.job.js';
import { runTaskExpiryJob } from './jobs/task-expiry.job.js';
import { runRecalculateRiskJob } from './jobs/recalculate-risk.job.js';
import { runReportCacheJob } from './jobs/report-cache.job.js';

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 PeaceFlow API running perfectly on http://${HOST}:${PORT}`);
  scheduleJobs();
});

function scheduleJobs() {
  // Task expiry: chạy ngay khi khởi động, sau đó mỗi giờ
  runTaskExpiryJob().catch(console.error);
  setInterval(() => runTaskExpiryJob().catch(console.error), 60 * 60 * 1000);
  console.log('[JOB] task-expiry: mỗi 1 giờ');

  // Streak reset: chạy lúc 00:05 mỗi đêm
  scheduleDaily(0, 5, () => runStreakJob().catch(console.error));
  console.log('[JOB] streak: hàng đêm lúc 00:05');

  // Risk recalculate: mỗi 6 giờ
  setInterval(() => runRecalculateRiskJob().catch(console.error), 6 * 60 * 60 * 1000);
  console.log('[JOB] recalculate-risk: mỗi 6 giờ');

  // Report cache: mỗi 12 giờ
  setInterval(() => runReportCacheJob().catch(console.error), 12 * 60 * 60 * 1000);
  console.log('[JOB] report-cache: mỗi 12 giờ');
}

// Hẹn giờ chạy job vào giờ cố định mỗi ngày
function scheduleDaily(hour, minute, fn) {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const msUntilNext = next - now;
  setTimeout(() => {
    fn();
    setInterval(fn, 24 * 60 * 60 * 1000);
  }, msUntilNext);
}
