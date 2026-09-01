// Mã hoá thật cho dữ liệu y tế nhạy cảm (hồ sơ khám cũ, đơn thuốc, ghi chú tình trạng)
// bằng AES-256-GCM. Trước đây UI đặt lịch quảng cáo "🔒 mã hoá AES-256" nhưng cột notes
// chỉ là text thường — module này để lời cam kết đó là thật.
//
// Định dạng lưu: 1 buffer duy nhất = iv(12 byte) + authTag(16 byte) + ciphertext.
// GCM cho luôn khả năng phát hiện dữ liệu bị chỉnh sửa (decrypt sẽ throw nếu authTag sai).
import crypto from 'crypto';
import { env } from '../../config/env.js';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const raw = env.medicalRecordsEncryptionKey;
  if (!raw) {
    throw new Error('MEDICAL_RECORDS_ENCRYPTION_KEY is not configured.');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('MEDICAL_RECORDS_ENCRYPTION_KEY phải là 32 byte dạng base64 (dùng crypto.randomBytes(32).toString("base64")).');
  }
  return key;
}

export function encryptBuffer(plain) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptBuffer(blob) {
  const key = getKey();
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = blob.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function encryptText(text) {
  return encryptBuffer(Buffer.from(String(text), 'utf8'));
}

export function decryptText(blob) {
  if (!blob) return null;
  return decryptBuffer(blob).toString('utf8');
}
