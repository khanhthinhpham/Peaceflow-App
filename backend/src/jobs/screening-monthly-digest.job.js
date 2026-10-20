import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { sendScreeningMonthlyDigestEmail } from '../common/services/email.service.js';
import { buildScreeningExcelBuffer } from '../common/services/screening-export.service.js';

// Gửi 1 email tổng hợp CUỐI THÁNG cho đầu mối quản trị (env.screeningAdminEmails), kèm file
// Excel đầy đủ — gộp CẢ 3 mức Đỏ/Vàng/Xanh của tháng vừa qua (mức Đỏ đã được báo riêng
// ngay lúc phát sinh ở screening.routes.js, nhưng vẫn xuất hiện lại ở đây vì đây là báo
// cáo tổng kết định kỳ, không phải cảnh báo tức thời).
export async function runScreeningMonthlyDigestJob() {
  try {
    if (!env.screeningAdminEmails.length) {
      console.log('[SCREENING_MONTHLY_DIGEST_JOB] Bỏ qua — chưa cấu hình SCREENING_ADMIN_EMAIL');
      return { sent: 0, skipped: 'no_admin_email' };
    }

    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const periodLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(from);

    const statsRes = await db.query(
      `select
         count(*)::int as total,
         count(*) filter (where risk_band = 'do')::int as do_count,
         count(*) filter (where risk_band = 'vang')::int as vang_count,
         count(*) filter (where risk_band = 'xanh')::int as xanh_count,
         count(distinct school_id)::int as school_count
       from screening_responses
       where created_at >= $1 and created_at < $2`,
      [from, to]
    );
    const stats = statsRes.rows[0];

    if (!stats.total) {
      console.log(`[SCREENING_MONTHLY_DIGEST_JOB] Không có phiếu nào trong ${periodLabel}, bỏ qua gửi mail.`);
      return { sent: 0, total: 0 };
    }

    const buffer = await buildScreeningExcelBuffer({ from, to });
    await sendScreeningMonthlyDigestEmail({
      to: env.screeningAdminEmails,
      periodLabel,
      total: stats.total,
      doCount: stats.do_count,
      vangCount: stats.vang_count,
      xanhCount: stats.xanh_count,
      schoolCount: stats.school_count,
      attachment: { filename: `sang-loc-truong-hoc-${periodLabel.replace(/\s+/g, '-')}.xlsx`, content: buffer }
    });

    console.log(`[SCREENING_MONTHLY_DIGEST_JOB] Sent digest for ${periodLabel} (${stats.total} phiếu, ${stats.school_count} trường)`);
    return { sent: 1, total: stats.total };
  } catch (error) {
    console.error('[SCREENING_MONTHLY_DIGEST_JOB] Failed:', error.message);
    throw error;
  }
}
