import { db } from '../../config/db.js';

// Phải trùng TERMS_VERSION ở frontend-vue/src/lib/legalTerms.js. Đổi khi sửa nội dung điều khoản →
// khách hàng được yêu cầu đồng ý lại ở lần mở app kế tiếp (Điều 12).
export const TERMS_VERSION = '2026-11-06';

const clip = (s, n) => (s ? String(s).slice(0, n) : null);

// Ghi một dòng đồng ý. Không bao giờ ném lỗi ra ngoài khi gọi kèm luồng chính (đặt lịch, gửi hồ sơ)
// trừ khi strict=true — luồng /consents/accept cần biết ghi thành công hay không.
export async function recordConsent({ userId, kind, granted = true, version = TERMS_VERSION, context = null, req = null, strict = false }) {
  try {
    await db.query(
      `insert into user_consents (user_id, kind, version, granted, context, ip, user_agent)
       values ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
      [userId, kind, version, granted, context ? JSON.stringify(context) : null, clip(req?.ip, 64), clip(req?.get?.('user-agent'), 400)]
    );
  } catch (e) {
    console.error('[CONSENT_LOG_FAIL]', kind, userId, e.message);
    if (strict) throw e;
  }
}

export async function getConsentStatus(userId) {
  const { rows } = await db.query(
    `select distinct on (kind) kind, version, granted, created_at
     from user_consents where user_id = $1 and kind in ('terms', 'sensitive_data')
     order by kind, created_at desc`,
    [userId]
  );
  const terms = rows.find((r) => r.kind === 'terms');
  const sensitive = rows.find((r) => r.kind === 'sensitive_data');
  return {
    termsVersion: TERMS_VERSION,
    termsAccepted: !!(terms && terms.granted && terms.version === TERMS_VERSION),
    termsAcceptedAt: terms?.granted ? terms.created_at : null,
    sensitiveData: !!sensitive?.granted
  };
}
