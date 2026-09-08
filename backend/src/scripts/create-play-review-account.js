/**
 * Tạo 1 tài khoản test riêng cho Google Play reviewer dùng khi xét duyệt app (mục "Thông tin
 * đăng nhập" trong Play Console) — không dùng tài khoản cá nhân/admin thật theo khuyến cáo
 * của Google. Email đã verified sẵn để reviewer đăng nhập được ngay, không cần xác minh.
 *
 * node src/scripts/create-play-review-account.js
 */

import { db } from '../config/db.js';
import { hashPassword } from '../common/utils/hash.js';
import { createUser, createDefaultProfile, createDefaultProgress, findUserByEmail } from '../modules/auth/auth.repository.js';

const EMAIL = 'playstore.review@peaceflow.vn';
const PASSWORD = 'PlayReview2026!';

async function run() {
  const existing = await findUserByEmail(EMAIL);
  if (existing) {
    console.log('Tài khoản đã tồn tại:', EMAIL);
    console.log('Mật khẩu (không đổi được từ đây nếu quên, xoá user rồi chạy lại script để reset):', PASSWORD);
    process.exit(0);
  }

  const passwordHash = await hashPassword(PASSWORD);
  const user = await createUser({
    email: EMAIL,
    password_hash: passwordHash,
    full_name: 'Play Store Reviewer',
    display_name: 'Reviewer',
    consent_privacy: true,
    consent_terms: true,
    consent_sensitive_data: true,
    email_verified: true
  });

  await createDefaultProfile(user.id);
  await createDefaultProgress(user.id);

  console.log('Đã tạo tài khoản test cho Google Play review:');
  console.log('  Email:', EMAIL);
  console.log('  Mật khẩu:', PASSWORD);
  process.exit(0);
}

run().catch((e) => {
  console.error('Tạo tài khoản thất bại:', e);
  process.exit(1);
});
