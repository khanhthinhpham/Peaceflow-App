import crypto from 'crypto';
import { env } from '../../config/env.js';

export function isPayosEnabled() {
  return Boolean(env.payosClientId && env.payosApiKey && env.payosChecksumKey);
}

function payosHmac(data) {
  return crypto.createHmac('sha256', env.payosChecksumKey).update(data).digest('hex');
}

// Tạo link/QR thanh toán PayOS. Trả về { checkoutUrl, qrCode, ... }
export async function createPayosPayment({ orderCode, amount, description, returnUrl, cancelUrl }) {
  const sigData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  const signature = payosHmac(sigData);
  const res = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': env.payosClientId,
      'x-api-key': env.payosApiKey
    },
    body: JSON.stringify({ orderCode, amount, description, cancelUrl, returnUrl, signature })
  });
  const json = await res.json();
  if (json.code !== '00' || !json.data) {
    throw new Error(`PayOS error: ${json.desc || json.code || 'unknown'}`);
  }
  return json.data;
}

// Xác thực chữ ký webhook PayOS (sắp xếp key của data theo alphabet, HMAC-SHA256).
export function verifyPayosWebhook(body) {
  if (!body || !body.data || !body.signature) return false;
  const data = body.data;
  const sorted = Object.keys(data)
    .sort()
    .map((k) => {
      let v = data[k];
      if (v === null || v === undefined) v = '';
      return `${k}=${v}`;
    })
    .join('&');
  try {
    return payosHmac(sorted) === body.signature;
  } catch (_e) {
    return false;
  }
}

// Tạo ảnh QR từ chuỗi EMV (PayOS trả qrCode dạng chuỗi) — dùng dịch vụ QR miễn phí.
export function qrImageFromString(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(value)}`;
}

// Mã đơn (nội dung chuyển khoản) — 9 chữ số, đủ duy nhất cho MVP.
export function generateOrderCode() {
  return Math.floor(100000000 + Math.random() * 900000000);
}

export function transferContent(orderCode) {
  return `PF${orderCode}`;
}

// Chuẩn hoá tên về ASCII HOA (ngân hàng thường bỏ dấu) để khớp nội dung chính xác.
export function normalizeName(value) {
  return String(value || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Nội dung chuyển khoản: "TÊN PEACEFLOW <mã>" (mã để khớp chính xác khi trùng tên).
export function buildTransferContent(name, orderCode) {
  const n = normalizeName(name);
  return `${n ? n + ' ' : ''}PEACEFLOW ${orderCode}`.trim();
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

// ===== VietQR: tra cứu tên chủ tài khoản =====
export function isVietqrLookupEnabled() {
  return Boolean(env.vietqrClientId && env.vietqrApiKey);
}

// Trả về { ok, accountName } hoặc { ok:false, message }.
export async function lookupBankAccount({ bin, accountNumber }) {
  if (!isVietqrLookupEnabled()) {
    return { ok: false, configured: false, message: 'Tra cứu tên tài khoản chưa được cấu hình.' };
  }
  if (!bin || !accountNumber) {
    return { ok: false, configured: true, message: 'Thiếu ngân hàng hoặc số tài khoản.' };
  }
  try {
    const res = await fetch('https://api.vietqr.io/v2/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': env.vietqrClientId,
        'x-api-key': env.vietqrApiKey
      },
      body: JSON.stringify({ bin: String(bin), accountNumber: String(accountNumber) })
    });
    const json = await res.json().catch(() => ({}));
    if (json?.code === '00' && json?.data?.accountName) {
      return { ok: true, configured: true, accountName: json.data.accountName };
    }
    return { ok: false, configured: true, message: json?.desc || 'Không tra cứu được tên tài khoản. Kiểm tra lại số tài khoản & ngân hàng.' };
  } catch (error) {
    console.error('VietQR lookup error:', error.message);
    return { ok: false, configured: true, message: 'Lỗi kết nối dịch vụ tra cứu.' };
  }
}
