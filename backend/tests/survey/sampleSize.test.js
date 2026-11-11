
import test from 'node:test';
import assert from 'node:assert/strict';
import { kcbSampleSize, tcmrSampleSize, nvytSampleSize, KCB_TABLE } from '../../src/modules/survey/lib/sampleSize.js';

test('bảng cỡ mẫu KCB khớp QĐ 56 tại mọi ngưỡng', () => {
  const expected = [
    [0, 43], [1, 43], [49, 43],
    [50, 44], [79, 62],
    [80, 63], [89, 68],
    [90, 69], [99, 73],
    [100, 74], [199, 109],
    [200, 110], [399, 145],
    [400, 146], [599, 163],
    [600, 164], [699, 169],
    [700, 170], [999, 181],
    [1000, 182], [1999, 197],
    [2000, 198], [3999, 207],
    [4000, 208],
  ];
  for (const [N, n] of expected) assert.equal(kcbSampleSize(N), n, `N=${N}`);
});

test('cỡ mẫu KCB luôn nằm trong khoảng của bảng và không giảm khi quy mô tăng', () => {
  let prev = 0;
  for (let N = 0; N <= 6000; N++) {
    const n = kcbSampleSize(N);
    const [, , min, max] = KCB_TABLE.find(([lo, hi]) => N >= lo && N <= hi);
    assert.ok(n >= min && n <= max, `N=${N} → ${n} ngoài [${min}, ${max}]`);
    assert.ok(n >= prev, `N=${N} giảm`);
    prev = n;
  }
  assert.ok(kcbSampleSize(10000) >= 208);
});

test('cỡ mẫu KCB: chưa khai báo hoặc không hợp lệ → null', () => {
  assert.equal(kcbSampleSize(null), null);
  assert.equal(kcbSampleSize(''), null);
  assert.equal(kcbSampleSize(-5), null);
  assert.equal(kcbSampleSize('abc'), null);
});

test('cỡ mẫu TCMR theo lượt tiêm/tháng', () => {
  assert.equal(tcmrSampleSize(20), 20); // <50 và không đủ 30 → toàn bộ
  assert.equal(tcmrSampleSize(30), 30);
  assert.equal(tcmrSampleSize(49), 30);
  assert.equal(tcmrSampleSize(50), 30);
  assert.equal(tcmrSampleSize(99), 30);
  assert.equal(tcmrSampleSize(100), 40);
  assert.equal(tcmrSampleSize(299), 40);
  assert.equal(tcmrSampleSize(300), 50);
  assert.equal(tcmrSampleSize(499), 50);
  assert.equal(tcmrSampleSize(800), 50); // QĐ 56 không quy định ≥500 → giữ 50
  assert.equal(tcmrSampleSize(null), null);
});

test('cỡ mẫu NVYT: toàn bộ nhân viên, mặc định tối thiểu 30', () => {
  assert.equal(nvytSampleSize(null), 30);
  assert.equal(nvytSampleSize(120), 120);
});
