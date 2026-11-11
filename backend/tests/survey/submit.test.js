
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMS } from '../../src/modules/survey/lib/forms.data.js';
import { buildSchema, phoneHash, makeStartToken, readStartToken } from '../../src/modules/survey/lib/submit.js';
import { computeFlags } from '../../src/modules/survey/lib/quality.js';

const ngoai = FORMS.find((f) => f.code === 'ngoai_tru');
const nvyt = FORMS.find((f) => f.code === 'nhan_vien');

function validBody(def) {
  const answers = {};
  for (const g of def.groups) for (const it of g.items) answers[it.code] = 4;
  return { consent: true, answers, demographics: { gioi_tinh: 1, tuoi: 40, bhyt: 1 } };
}

test('số tiêu chí của các mẫu phiếu', () => {
  const counts = Object.fromEntries(FORMS.map((f) => [f.code, f.groups.map((g) => g.items.length).join('/')]));
  assert.equal(counts.ngoai_tru, '5/10/8/4/4');
  assert.equal(counts.noi_tru, '5/5/9/7/5'); // theo 3869; QĐ 56 yêu cầu 5/7/11/7/6
  assert.equal(counts.tcmr, '4/8/12/5/3');
  assert.equal(counts.nhan_vien, '9/9/12/7/7');
});

test('phiếu hợp lệ được chấp nhận', () => {
  assert.equal(buildSchema(ngoai).safeParse(validBody(ngoai)).success, true);
});

test('người trả lời dưới 18 tuổi bị từ chối', () => {
  const b = validBody(ngoai);
  b.demographics.tuoi = 17;
  const r = buildSchema(ngoai).safeParse(b);
  assert.equal(r.success, false);
  assert.match(r.error.issues[0].message, /18 tuổi/);
});

test('bắt buộc tích đồng ý tham gia', () => {
  const b = validBody(ngoai);
  b.consent = false;
  assert.equal(buildSchema(ngoai).safeParse(b).success, false);
  delete b.consent;
  assert.equal(buildSchema(ngoai).safeParse(b).success, false);
});

test('thiếu câu Likert bị từ chối ở phiếu trực tuyến, giá trị ngoài 0–5 bị từ chối', () => {
  const b = validBody(ngoai);
  delete b.answers.A1;
  assert.equal(buildSchema(ngoai).safeParse(b).success, false);
  assert.equal(buildSchema(ngoai, { allowMissingItems: true }).safeParse(b).success, true);
  const c = validBody(ngoai);
  c.answers.A2 = 7;
  assert.equal(buildSchema(ngoai).safeParse(c).success, false);
});

test('phiếu NVYT không có trường số điện thoại', () => {
  const b = validBody(nvyt);
  b.phone = '0912345678';
  const r = buildSchema(nvyt).safeParse(b);
  assert.equal(r.success, true);
  assert.equal('phone' in r.data, false);
});

test('băm số điện thoại có salt, chuẩn hóa +84/0', () => {
  assert.equal(phoneHash('0912 345 678', 's'), phoneHash('+84912345678', 's'));
  assert.notEqual(phoneHash('0912345678', 's1'), phoneHash('0912345678', 's2'));
  assert.equal(phoneHash('', 's'), null);
});

test('token thời điểm mở phiếu: hợp lệ và chống giả mạo', () => {
  const t = makeStartToken('k');
  assert.equal(readStartToken(t, 'k'), 0);
  assert.equal(readStartToken(t, 'khac'), null);
  assert.equal(readStartToken('abc.def', 'k'), null);
});

test('cờ chất lượng: quá nhanh và trả lời một kiểu', () => {
  assert.deepEqual(computeFlags({ formCode: 'ngoai_tru', durationSec: 12, answers: { A1: 4, A2: 5 }, mode: 'tu_dien' }), ['qua_nhanh']);
  assert.deepEqual(computeFlags({ formCode: 'ngoai_tru', durationSec: 12, answers: { A1: 4 }, mode: 'nhap_giay' }), []);
  assert.deepEqual(computeFlags({ formCode: 'nhan_vien', durationSec: 12, answers: { A1: 4, A2: 5 }, mode: 'tu_dien' }), []);
  const same = { A1: 5, A2: 5, A3: 5, A4: 5, A5: 5, B1: 0 };
  assert.deepEqual(computeFlags({ formCode: 'noi_tru', durationSec: 200, answers: same, mode: 'tu_dien' }), ['tra_loi_mot_kieu']);
});

test('prepareResponse: đếm sẵn câu 4–5 / 1–5 theo thành phần, loại câu 0, NVYT không lưu SĐT', async () => {
  const { prepareResponse } = await import('../../src/modules/survey/lib/submit.js');
  const b = validBody(ngoai);
  b.answers.A1 = 0;
  b.answers.A2 = 2;
  b.phone = '0912345678';
  const r = prepareResponse(ngoai, b, { mode: 'tu_dien', secret: 's', salt: 'x' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.record.comp_counts.A1, { pos: 3, valid: 4 });
  assert.equal(r.record.phone_hash.length, 64);
  const n = validBody(nvyt);
  n.phone = '0912345678';
  const rn = prepareResponse(nvyt, n, { mode: 'tu_dien', secret: 's', salt: 'x' });
  assert.equal(rn.ok, true);
  assert.equal(rn.record.phone_hash, null);
});
