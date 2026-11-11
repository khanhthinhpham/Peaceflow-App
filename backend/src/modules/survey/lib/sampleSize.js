
/**
 * Cỡ mẫu theo QĐ 56/QĐ-BYT (2024), mục 2.2.
 *
 * KCB (nội trú / ngoại trú): công thức cắt ngang n0 = z²·p(1-p)/d² (z=1,96; p=0,85; d=0,05),
 * hiệu chỉnh theo quy mô n0/(1+(n0-1)/N), cộng 10% từ chối (÷0,9), làm tròn,
 * sau đó kẹp vào khoảng của bảng tra trong QĐ 56 để kết quả khớp đúng bảng tại mọi ngưỡng.
 */
const KCB_TABLE = [
  // [N từ, N đến (bao gồm), cỡ mẫu tối thiểu, cỡ mẫu tối đa]
  [0, 49, 43, 43],
  [50, 79, 44, 62],
  [80, 89, 63, 68],
  [90, 99, 69, 73],
  [100, 199, 74, 109],
  [200, 399, 110, 145],
  [400, 599, 146, 163],
  [600, 699, 164, 169],
  [700, 999, 170, 181],
  [1000, 1999, 182, 197],
  [2000, 3999, 198, 207],
  [4000, Infinity, 208, Infinity],
];

const N0 = (1.96 ** 2 * 0.85 * 0.15) / 0.05 ** 2; // ≈195,92

function kcbFormula(N) {
  return N0 / (1 + (N0 - 1) / N) / 0.9;
}

/** Cỡ mẫu KCB theo số lượt nội trú/ngày hoặc số lượt khám ngoại trú/ngày. null nếu chưa khai báo. */
function kcbSampleSize(luotNgay) {
  if (luotNgay === null || luotNgay === undefined || luotNgay === '') return null;
  const N = Math.floor(Number(luotNgay));
  if (!Number.isFinite(N) || N < 0) return null;
  const row = KCB_TABLE.find(([lo, hi]) => N >= lo && N <= hi);
  const [, , min, max] = row;
  if (min === max) return min;
  const v = Math.round(kcbFormula(N));
  return Math.min(max, Math.max(min, v));
}

/**
 * Cỡ mẫu TCMR theo số lượt tiêm/tháng của trạm y tế (QĐ 56 mục 2.2):
 *  <50: toàn bộ cho đến đủ 30 (nếu không đủ 30 thì toàn bộ) → min(30, lượt)
 *  50–<100: 30; 100–<300: 40; 300–<500: 50.
 *  ≥500: QĐ 56 không quy định → áp dụng mức 50 (giả định của hệ thống).
 */
function tcmrSampleSize(luotThang) {
  if (luotThang === null || luotThang === undefined || luotThang === '') return null;
  const L = Math.floor(Number(luotThang));
  if (!Number.isFinite(L) || L < 0) return null;
  if (L < 50) return Math.min(30, L);
  if (L < 100) return 30;
  if (L < 300) return 40;
  return 50;
}

/** NVYT: QĐ 3869 mục 7.1 — chọn mẫu toàn bộ nhân viên; nếu chưa khai báo số NV thì tối thiểu 30 (mục 7.2). */
function nvytSampleSize(soNhanVien) {
  const n = Number(soNhanVien);
  if (!soNhanVien || !Number.isFinite(n) || n <= 0) return 30;
  return Math.floor(n);
}

export { KCB_TABLE, kcbSampleSize, kcbFormula, tcmrSampleSize, nvytSampleSize };
