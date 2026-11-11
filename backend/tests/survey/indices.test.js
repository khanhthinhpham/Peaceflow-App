
import test from 'node:test';
import assert from 'node:assert/strict';
import { countAnswers, computeIndices, mergeCounts, provincialIndex, round1 } from '../../src/modules/survey/lib/indices.js';

const ans = (component, values) => values.map((value) => ({ component, value }));

test('chỉ số thành phần: (số câu 4–5) / (số câu 1–5) × 100', () => {
  const c = countAnswers([...ans('A1', [5, 4, 3, 2])]);
  assert.deepEqual(c.A1, { pos: 2, valid: 4 });
  const ix = computeIndices(c);
  assert.equal(ix.components.A1, 50);
});

test('câu trả lời 0 (không sử dụng/không ý kiến) bị loại khỏi cả tử và mẫu', () => {
  const c = countAnswers(ans('A1', [5, 0, 0, 1]));
  assert.deepEqual(c.A1, { pos: 1, valid: 2 });
  assert.equal(computeIndices(c).components.A1, 50);
  // chỉ toàn 0 → không có dữ liệu (null), không phải 0%
  const z = computeIndices(countAnswers(ans('A2', [0, 0, 0])));
  assert.equal(z.components.A2, null);
  assert.equal(z.method1, null);
  assert.equal(z.method2, null);
});

test('giá trị ngoài 0–5 không được tính', () => {
  const c = countAnswers(ans('A1', [6, -1, 4]));
  assert.deepEqual(c.A1, { pos: 1, valid: 1 });
});

test('cách 1 (TB cộng A1–A5) khác cách 2 (gộp) khi số câu mỗi thành phần khác nhau', () => {
  // A1: 1/1 = 100%; A2: 1/4 = 25%
  const c = countAnswers([...ans('A1', [5]), ...ans('A2', [4, 1, 2, 3])]);
  const ix = computeIndices(c);
  assert.equal(ix.components.A1, 100);
  assert.equal(ix.components.A2, 25);
  assert.equal(ix.method1, 62.5); // (100 + 25) / 2 — chỉ tính thành phần có dữ liệu
  assert.equal(ix.method2, 40); // 2 / 5
});

test('cách 1 và cách 2 trùng nhau khi mỗi thành phần có cùng số câu hợp lệ', () => {
  const c = countAnswers([...ans('A1', [5, 1]), ...ans('A2', [4, 4]), ...ans('A3', [1, 1]), ...ans('A4', [5, 3]), ...ans('A5', [4, 5])]);
  const ix = computeIndices(c);
  assert.equal(ix.method1, ix.method2);
  assert.equal(ix.method2, 60);
});

test('chỉ số chung KCB của đơn vị = gộp câu trả lời nội trú + ngoại trú', () => {
  const noi = countAnswers(ans('A1', [5, 5, 5, 1])); // 3/4
  const ngoai = countAnswers(ans('A1', [1, 1, 1, 1, 1, 5])); // 1/6
  const ix = computeIndices(mergeCounts(noi, ngoai));
  assert.equal(ix.method2, 40); // 4/10, không phải TB (75 + 16,7)/2
});

test('chỉ số tỉnh = trung bình cộng không gia quyền của các đơn vị có dữ liệu', () => {
  assert.equal(provincialIndex([80, 90, null, 100]), 90);
  assert.equal(provincialIndex([null, undefined]), null);
  assert.equal(provincialIndex([]), null);
  // không gia quyền theo số phiếu: đơn vị 1000 phiếu và đơn vị 10 phiếu có trọng số như nhau
  const big = computeIndices(countAnswers(ans('A1', Array(1000).fill(5)))).method2; // 100
  const small = computeIndices(countAnswers(ans('A1', [...Array(5).fill(5), ...Array(5).fill(1)]))).method2; // 50
  assert.equal(provincialIndex([big, small]), 75);
});

test('làm tròn 1 chữ số thập phân', () => {
  assert.equal(round1(83.65081), 83.7);
  assert.equal(round1(null), null);
});
