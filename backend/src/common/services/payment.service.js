import { env } from '../../config/env.js';

// Mã đơn (nội dung chuyển khoản) — 9 chữ số, đủ duy nhất cho MVP.
export function generateOrderCode() {
  return Math.floor(100000000 + Math.random() * 900000000);
}

export function transferContent(orderCode) {
  return `PF${orderCode}`;
}

export function platformBankInfo() {
  return {
    bankId: env.platformBankId,
    accountNo: env.platformBankAccount,
    accountName: env.platformBankName
  };
}

// QR động miễn phí của VietQR.io: nhúng sẵn số tiền + nội dung chuyển khoản.
export function buildVietQrUrl({ amount, content }) {
  const bank = encodeURIComponent(env.platformBankId);
  const acc = encodeURIComponent(env.platformBankAccount);
  const name = encodeURIComponent(env.platformBankName);
  const info = encodeURIComponent(content);
  return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`;
}

// Chia doanh thu: nền tảng giữ platformFeePercent%, còn lại là của chuyên gia.
export function computeFee(amount) {
  const fee = Math.round((Number(amount) || 0) * env.platformFeePercent / 100);
  return { gross: Number(amount) || 0, platform_fee: fee, expert_earning: (Number(amount) || 0) - fee };
}
