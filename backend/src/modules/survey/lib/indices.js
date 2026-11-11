
/**
 * Tính chỉ số hài lòng theo QĐ 56/QĐ-BYT mục III.
 *  - Chỉ số thành phần Ak = (số câu trả lời mức 4–5 thuộc thành phần k) / (số câu trả lời mức 1–5) × 100.
 *    Câu trả lời 0 ("Không sử dụng / Không ý kiến") bị loại khỏi cả tử và mẫu.
 *  - Cách 1: trung bình cộng các chỉ số thành phần có dữ liệu.
 *  - Cách 2 (mặc định của hệ thống): gộp — tổng câu 4–5 / tổng câu 1–5 × 100.
 *  - Cấp tỉnh: trung bình cộng (không gia quyền) chỉ số của các đơn vị đã đo lường.
 */
const COMPONENTS = ['A1', 'A2', 'A3', 'A4', 'A5'];

function emptyCounts() {
  const c = {};
  for (const k of COMPONENTS) c[k] = { pos: 0, valid: 0 };
  return c;
}

/** Cộng dồn đếm từ danh sách câu trả lời [{component, value}]. */
function countAnswers(answers, counts = emptyCounts()) {
  for (const a of answers) {
    const v = Number(a.value);
    if (!counts[a.component]) counts[a.component] = { pos: 0, valid: 0 };
    if (v >= 1 && v <= 5) {
      counts[a.component].valid += 1;
      if (v >= 4) counts[a.component].pos += 1;
    }
  }
  return counts;
}

function pct(pos, valid) {
  return valid > 0 ? (pos / valid) * 100 : null;
}

/** counts: {A1:{pos,valid},...} → {components, method1, method2, pos, valid} */
function computeIndices(counts) {
  const components = {};
  let pos = 0;
  let valid = 0;
  const avail = [];
  for (const k of COMPONENTS) {
    const c = counts[k] || { pos: 0, valid: 0 };
    components[k] = pct(c.pos, c.valid);
    if (components[k] !== null) avail.push(components[k]);
    pos += c.pos;
    valid += c.valid;
  }
  const method1 = avail.length ? avail.reduce((s, x) => s + x, 0) / avail.length : null;
  const method2 = pct(pos, valid);
  return { components, method1, method2, pos, valid };
}

/** Gộp nhiều bộ đếm (vd. nội trú + ngoại trú → chỉ số KCB chung của đơn vị). */
function mergeCounts(...list) {
  const out = emptyCounts();
  for (const counts of list) {
    if (!counts) continue;
    for (const k of Object.keys(counts)) {
      if (!out[k]) out[k] = { pos: 0, valid: 0 };
      out[k].pos += counts[k].pos;
      out[k].valid += counts[k].valid;
    }
  }
  return out;
}

/** Trung bình cộng (không gia quyền) các giá trị khác null. */
function mean(values) {
  const v = values.filter((x) => x !== null && x !== undefined && Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

const provincialIndex = mean;

function round1(x) {
  return x === null || x === undefined ? null : Math.round(x * 10) / 10;
}

export { COMPONENTS, emptyCounts, countAnswers, computeIndices, mergeCounts, mean, provincialIndex, pct, round1 };
