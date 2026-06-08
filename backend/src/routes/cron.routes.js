import { Router } from 'express';
import { runStreakJob } from '../jobs/streak.job.js';
import { runTaskExpiryJob } from '../jobs/task-expiry.job.js';
import { runRecalculateRiskJob } from '../jobs/recalculate-risk.job.js';
import { runReportCacheJob } from '../jobs/report-cache.job.js';
import { runStreakWarningJob, runStreakLostNotificationJob } from '../jobs/streak-notification.job.js';

const router = Router();

function verifyCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, message: 'CRON_SECRET chưa được cấu hình' });
    }
    return next();
  }
  if (req.headers['authorization'] !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// GET /api/v1/cron/run-jobs — Vercel gọi endpoint này mỗi giờ
router.get('/cron/run-jobs', verifyCronSecret, async (req, res) => {
  // Giờ UTC+7 (Vietnam) = UTC + 7
  const utcHour = new Date().getUTCHours();
  const vnHour = (utcHour + 7) % 24;

  const results = {};

  // Task expiry: chạy mỗi giờ
  try {
    await runTaskExpiryJob();
    results.task_expiry = 'ok';
  } catch (e) {
    results.task_expiry = e.message;
  }

  // Streak warning: chạy lúc 20:xx giờ Việt Nam — cảnh báo trước nửa đêm 4 tiếng
  if (vnHour === 20) {
    try {
      const r = await runStreakWarningJob();
      results.streak_warning = `ok (sent=${r.sent})`;
    } catch (e) {
      results.streak_warning = e.message;
    }
  }

  // Streak reset: chỉ chạy lúc 00:xx giờ Việt Nam
  if (vnHour === 0) {
    // Gửi thông báo "mất streak" trước khi reset
    try {
      const r = await runStreakLostNotificationJob();
      results.streak_lost = `ok (sent=${r.sent})`;
    } catch (e) {
      results.streak_lost = e.message;
    }

    try {
      await runStreakJob();
      results.streak = 'ok';
    } catch (e) {
      results.streak = e.message;
    }
  }

  // Recalculate risk: mỗi 6 giờ (0, 6, 12, 18 giờ VN)
  if (vnHour % 6 === 0) {
    try {
      await runRecalculateRiskJob();
      results.recalculate_risk = 'ok';
    } catch (e) {
      results.recalculate_risk = e.message;
    }
  }

  // Report cache: mỗi 12 giờ (0, 12 giờ VN)
  if (vnHour % 12 === 0) {
    try {
      await runReportCacheJob();
      results.report_cache = 'ok';
    } catch (e) {
      results.report_cache = e.message;
    }
  }

  console.log(`[CRON] vnHour=${vnHour}`, results);
  return res.json({ success: true, data: results });
});


export default router;
