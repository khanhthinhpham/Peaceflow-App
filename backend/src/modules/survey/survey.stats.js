// Tổng hợp số liệu khảo sát hài lòng từ Postgres → chỉ số đơn vị, chỉ số tỉnh, KPI, xu hướng.
// Mọi phép tính chỉ số dùng hàm thuần trong lib/indices.js (QĐ 56/QĐ-BYT mục III).
// Các hàm nhận `q` = đối tượng có q.query(text, params) → { rows } (pg Pool hoặc client).
import { COMPONENTS, emptyCounts, computeIndices, mergeCounts, mean, pct } from './lib/indices.js';
import { kcbSampleSize, nvytSampleSize } from './lib/sampleSize.js';

export const QUY_FORMS = ['noi_tru', 'ngoai_tru', 'nhan_vien'];
export const FORM_LABELS = { noi_tru: 'Người bệnh nội trú', ngoai_tru: 'Người bệnh ngoại trú', nhan_vien: 'Nhân viên y tế' };
export const TARGETS = { 2025: 85, 2030: 90 };

export const formsForRound = () => QUY_FORMS;

/** KCB và NVYT áp dụng cho bệnh viện và TTYT. */
export function formApplies(unit, formCode) { // eslint-disable-line no-unused-vars
  return unit.type !== 'tyt';
}

export const roundLabel = (r) => `Quý ${r.period}/${r.year}`;

function filters({ includeExcluded = false, source = 'tu_do' } = {}) {
  let sql = '';
  if (!includeExcluded) sql += ' and r.excluded = false';
  if (source === 'doc_lap') sql += " and r.mode = 'doc_lap'";
  else if (source !== 'tat_ca') sql += " and r.mode <> 'doc_lap'"; // mặc định: đơn vị tự đo
  return sql;
}

/** Nạp toàn bộ đơn vị một lần (≈40 đơn vị + TYT) để tránh truy vấn lặp. */
export async function loadUnits(q) {
  const { rows } = await q.query('select * from ks_units order by sort, id');
  const byId = new Map(rows.map((u) => [u.id, u]));
  const children = new Map();
  for (const u of rows) {
    if (u.type === 'tyt' && u.active && u.parent_id) {
      if (!children.has(u.parent_id)) children.set(u.parent_id, []);
      children.get(u.parent_id).push(u);
    }
  }
  return { all: rows, byId, children };
}

export function requiredSample(units, unit, formCode) {
  switch (formCode) {
    case 'noi_tru':
      return kcbSampleSize(unit.luot_noi_tru_ngay);
    case 'ngoai_tru':
      return kcbSampleSize(unit.luot_ngoai_tru_ngay);
    case 'nhan_vien':
      return nvytSampleSize(unit.so_nhan_vien);
    default:
      return null;
  }
}

/** Đếm câu trả lời 4–5 / 1–5 theo (đơn vị hoặc TYT, mẫu phiếu, thành phần). */
export async function componentCounts(q, roundIds, opts = {}) {
  const out = new Map();
  if (!roundIds.length) return out;
  const key = opts.groupBy === 'entity' ? 'coalesce(r.tyt_id, r.unit_id)' : 'r.unit_id';
  const params = [roundIds];
  let sql = `select ${key} as uid, r.form_code as form, c.key as comp,
      sum((c.value->>'pos')::int)::int as pos, sum((c.value->>'valid')::int)::int as valid
    from ks_responses r cross join lateral jsonb_each(r.comp_counts) c
    where r.round_id = any($1::int[])${filters(opts)}`;
  if (opts.unitId) {
    params.push(opts.unitId);
    sql += ` and r.unit_id = $${params.length}`;
  }
  sql += ' group by 1, 2, 3';
  const { rows } = await q.query(sql, params);
  for (const row of rows) {
    if (!out.has(row.uid)) out.set(row.uid, {});
    const byForm = out.get(row.uid);
    if (!byForm[row.form]) byForm[row.form] = emptyCounts();
    byForm[row.form][row.comp] = { pos: row.pos, valid: row.valid };
  }
  return out;
}

export async function responseCounts(q, roundIds, opts = {}) {
  const out = new Map();
  if (!roundIds.length) return out;
  const { rows } = await q.query(
    `select r.unit_id as uid, r.form_code as form, count(*)::int as n,
        count(*) filter (where r.flags <> '[]'::jsonb)::int as flagged,
        count(distinct r.tyt_id)::int as tyt_count
     from ks_responses r where r.round_id = any($1::int[])${filters(opts)} group by 1, 2`,
    [roundIds]
  );
  for (const row of rows) {
    if (!out.has(row.uid)) out.set(row.uid, {});
    out.get(row.uid)[row.form] = row;
  }
  return out;
}

async function findRound(q, kind, year, period) {
  const { rows } = await q.query('select * from ks_rounds where kind = $1 and year = $2 and period = $3', [kind, year, period]);
  return rows[0] || null;
}

/** Năm + quý (hoặc id đợt) → đợt quý. */
export async function resolveRounds(q, { year, quarter, roundId }) {
  let quy = null;
  if (roundId) {
    const { rows } = await q.query("select * from ks_rounds where id = $1 and kind = 'quy'", [roundId]);
    quy = rows[0] || null;
  } else if (year && quarter) {
    quy = await findRound(q, 'quy', year, quarter);
  }
  return { quy };
}

/** Bảng tổng hợp toàn bộ đơn vị cho một quý + chỉ số tỉnh + KPI. */
export async function provinceSummary(q, { year, quarter, roundId, unitType = 'all', includeExcluded = false, source = 'tu_do', units: preUnits } = {}) {
  const units = preUnits || (await loadUnits(q));
  const { quy } = await resolveRounds(q, { year, quarter, roundId });
  const opts = { includeExcluded, source };
  const quyIds = quy ? [quy.id] : [];
  const [cQuy, nQuy, impRows] = await Promise.all([
    componentCounts(q, quyIds, opts),
    responseCounts(q, quyIds, opts),
    q.query('select * from ks_improvements where round_id = any($1::int[])', [quyIds]).then((r) => r.rows),
  ]);
  const imp = new Map(impRows.map((r) => [`${r.unit_id}:${r.round_id}`, r]));
  const reporting = units.all.filter((u) => u.type !== 'tyt' && u.active && (unitType === 'all' || u.type === unitType));

  const rows = reporting.map((u) => {
    const fq = cQuy.get(u.id) || {};
    const forms = {};
    for (const f of QUY_FORMS) {
      const ix = fq[f] ? computeIndices(fq[f]) : null;
      forms[f] = { n: (nQuy.get(u.id) || {})[f]?.n || 0, required: requiredSample(units, u, f), index: ix ? ix.method2 : null, method1: ix ? ix.method1 : null, components: ix ? ix.components : null };
    }
    const kcb = computeIndices(mergeCounts(fq.noi_tru, fq.ngoai_tru));
    const iQuy = quy ? imp.get(`${u.id}:${quy.id}`) : null;
    const measuredKcb = forms.noi_tru.n + forms.ngoai_tru.n > 0;
    const measuredAny = measuredKcb || forms.nhan_vien.n > 0;
    return {
      id: u.id,
      code: u.code,
      name: u.name,
      type: u.type,
      co_mau_kcb: forms.noi_tru.n + forms.ngoai_tru.n,
      ap_dung: measuredAny ? !!iQuy?.applied : null,
      chung: kcb.valid ? kcb.method2 : null,
      chung_method1: kcb.valid ? kcb.method1 : null,
      measured_kcb: measuredKcb,
      measured_any: measuredAny,
      forms,
    };
  });

  const province = {
    chung: mean(rows.map((r) => r.chung)),
    noi_tru: mean(rows.map((r) => r.forms.noi_tru.index)),
    ngoai_tru: mean(rows.map((r) => r.forms.ngoai_tru.index)),
    nhan_vien: mean(rows.map((r) => r.forms.nhan_vien.index)),
  };
  const componentsByForm = {};
  for (const f of QUY_FORMS) componentsByForm[f] = Object.fromEntries(COMPONENTS.map((k) => [k, mean(rows.map((r) => r.forms[f].components?.[k] ?? null))]));

  const measured = rows.filter((r) => r.measured_any);
  const nKcb = rows.filter((r) => r.measured_kcb).length;
  const kpi = {
    tong_don_vi: rows.length,
    so_don_vi_do_kcb: nKcb,
    ty_le_don_vi_do_kcb: rows.length ? pct(nKcb, rows.length) : null,
    so_don_vi_da_do: measured.length,
    so_don_vi_ap_dung: measured.filter((r) => r.ap_dung).length,
    ty_le_ap_dung: measured.length ? pct(measured.filter((r) => r.ap_dung).length, measured.length) : null,
  };

  const pending = [];
  if (quy) {
    for (const r of rows) {
      for (const [f, v] of Object.entries(r.forms)) {
        if (v.required === null || v.n < v.required) pending.push({ code: r.code, name: r.name, form: f, n: v.n, required: v.required });
      }
    }
  }
  return { round: quy, rows, province, componentsByForm, kpi, pending, targets: TARGETS, method: 'method2' };
}

export async function provinceTrend(q, { unitType = 'all', source = 'tu_do' } = {}) {
  const units = await loadUnits(q);
  const { rows: all } = await q.query("select * from ks_rounds where kind = 'quy' order by year, period");
  const quarters = [];
  for (const r of all) {
    const s = await provinceSummary(q, { roundId: r.id, unitType, source, units });
    quarters.push({ round_id: r.id, label: roundLabel(r), chung: s.province.chung, noi_tru: s.province.noi_tru, ngoai_tru: s.province.ngoai_tru, nhan_vien: s.province.nhan_vien });
  }
  return { quarters };
}

/** Tiêu chí có tỷ lệ hài lòng thấp nhất (toàn tỉnh hoặc một đơn vị). */
export async function weakestItems(q, roundIds, { unitId = null, unitType = 'all', limit = 10, minValid = 5, includeExcluded = false, source = 'tu_do' } = {}) {
  if (!roundIds.length) return [];
  const params = [roundIds];
  let sql = `select r.form_code as form, a.key as item,
      count(*) filter (where a.value::int >= 4)::int as pos,
      count(*) filter (where a.value::int between 1 and 5)::int as valid
    from ks_responses r join ks_units u on u.id = r.unit_id
    cross join lateral jsonb_each_text(r.answers) a
    where r.round_id = any($1::int[])${filters({ includeExcluded, source })}`;
  if (unitId) {
    params.push(unitId);
    sql += ` and r.unit_id = $${params.length}`;
  }
  if (unitType === 'benh_vien' || unitType === 'ttyt') {
    params.push(unitType);
    sql += ` and u.type = $${params.length}`;
  }
  params.push(minValid);
  sql += ` group by 1, 2 having count(*) filter (where a.value::int between 1 and 5) >= $${params.length}`;
  const { rows } = await q.query(sql, params);
  const withIdx = rows.map((r) => ({ ...r, index: pct(r.pos, r.valid) })).sort((a, b) => a.index - b.index).slice(0, limit);
  const forms = [...new Set(withIdx.map((r) => r.form))];
  const defs = forms.length ? (await q.query('select code, definition from ks_forms where code = any($1::text[])', [forms])).rows : [];
  const text = {};
  for (const d of defs) {
    text[d.code] = {};
    for (const g of d.definition.groups) for (const it of g.items) text[d.code][it.code] = { text: it.text, comp: g.component };
  }
  return withIdx.map((r) => ({ ...r, comp: text[r.form]?.[r.item]?.comp || null, form_name: FORM_LABELS[r.form], text: text[r.form]?.[r.item]?.text || '' }));
}

/** Chi tiết một đơn vị trong một đợt: chỉ số theo 2 cách, thành phần, tiến độ thu phiếu. */
export async function unitDetail(q, unitId, round, opts = {}, preUnits = null) {
  const units = preUnits || (await loadUnits(q));
  const unit = units.byId.get(unitId);
  const counts = (await componentCounts(q, [round.id], { ...opts, unitId })).get(unitId) || {};
  const ns = (await responseCounts(q, [round.id], opts)).get(unitId) || {};
  const forms = {};
  for (const f of formsForRound(round)) {
    if (!formApplies(unit, f)) continue;
    const ix = computeIndices(counts[f] || emptyCounts());
    forms[f] = { label: FORM_LABELS[f], n: ns[f]?.n || 0, flagged: ns[f]?.flagged || 0, required: requiredSample(units, unit, f), method1: ix.method1, method2: ix.method2, components: ix.components };
  }
  const chung = computeIndices(mergeCounts(counts.noi_tru, counts.ngoai_tru));
  return { unit, round: { ...round, label: roundLabel(round) }, forms, chung };
}
