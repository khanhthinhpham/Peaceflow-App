// Xuất báo cáo khảo sát hài lòng: xlsx theo mẫu báo cáo quý của Sở Y tế (Q3 demo.xlsx) và CSV dữ liệu thô.
// Tạo hoàn toàn trong bộ nhớ (writeBuffer) — không ghi tệp, phù hợp Vercel serverless.
import ExcelJS from 'exceljs';
import { provinceSummary, roundLabel } from './survey.stats.js';
import { round1 } from './lib/indices.js';

// Mẫu gốc của Sở dùng Times New Roman 13 — giữ nguyên để khớp văn bản hành chính.
const XLSX_FONT = 'Times New Roman';
const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

/**
 * Bố cục giống Q3 demo: cột A–N, tiêu đề 2 dòng (gộp A1:A2, B1:B2, D1:D2…I1:I2, J1:N1),
 * dòng 3 trống, 40 đơn vị ở dòng 4–43, dòng 44 là toàn tỉnh. Sheet "Ghi chú" ghi phương pháp.
 */
export async function buildQuarterXlsx(q, { year, quarter, roundId, source }) {
  const s = await provinceSummary(q, { year, quarter, roundId, source });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PeaceFlow - Khao sat hai long';
  const ws = wb.addWorksheet('Sheet1', { views: [{ state: 'frozen', ySplit: 3, xSplit: 2 }] });
  [6.5, 40, 3, 10.875, 12.125, 9.125, 9.125, 9.125, 9.125, 13.75, 14, 15, 12.5, 14.625].forEach((w, i) => (ws.getColumn(i + 1).width = w));

  ws.getRow(1).values = ['TT', 'Đơn vị', null, 'Cỡ mẫu', 'Cỡ mẫu \nTCMR', 'Số TYT', 'Số \nthực hiện', 'Tỷ lệ trạm y tế', 'Áp dụng \nđịa phương', 'Chỉ số hài lòng', null, null, null, null];
  ws.getRow(2).values = [null, null, null, null, null, null, null, null, null, 'Chỉ số \nhài lòng chung', 'Người bệnh \nnội trú', 'Người bệnh \nngoại trú', 'Nhân viên \nY tế', 'Tiêm chủng\nmở rộng'];
  ws.getRow(2).height = 49.5;
  for (const m of ['A1:A2', 'B1:B2', 'D1:D2', 'J1:N1', 'I1:I2', 'E1:E2', 'H1:H2', 'F1:F2', 'G1:G2']) ws.mergeCells(m);
  for (const r of [1, 2]) {
    for (let c = 1; c <= 14; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: XLSX_FONT, size: 13, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = BORDER;
    }
  }
  const num = (v) => (v === null || v === undefined ? null : round1(v));
  const styleRow = (row, bold) => {
    for (let c = 1; c <= 14; c++) {
      const cell = row.getCell(c);
      cell.font = { name: XLSX_FONT, size: 13, bold };
      cell.border = BORDER;
      cell.alignment = c === 2 ? { horizontal: 'left', vertical: 'middle', wrapText: true } : { horizontal: 'center', vertical: 'middle' };
      if (c >= 8 && c !== 9) cell.numFmt = '0.0';
    }
  };
  s.rows.forEach((r, i) => {
    const row = ws.getRow(4 + i);
    row.values = [
      i + 1, r.name, null, r.co_mau_kcb || null, r.co_mau_tcmr || null, r.so_tyt ?? null, r.so_tyt_thuc_hien ?? null,
      num(r.ty_le_tyt), r.ap_dung === null ? null : r.ap_dung ? 'Có' : 'Chưa',
      num(r.chung), num(r.forms.noi_tru.index), num(r.forms.ngoai_tru.index), num(r.forms.nhan_vien.index), r.forms.tcmr ? num(r.forms.tcmr.index) : null,
    ];
    row.height = 33;
    styleRow(row, false);
  });
  const total = ws.getRow(4 + s.rows.length);
  total.values = [
    null, 'Toàn tỉnh (TB cộng các đơn vị đã đo)', null,
    s.rows.reduce((a, r) => a + (r.co_mau_kcb || 0), 0), s.rows.reduce((a, r) => a + (r.co_mau_tcmr || 0), 0),
    s.kpi.tong_tyt || null, s.kpi.tyt_thuc_hien || null, num(s.kpi.ty_le_tyt_tcmr),
    s.kpi.ty_le_ap_dung === null ? null : `${round1(s.kpi.ty_le_ap_dung)}%`,
    num(s.province.chung), num(s.province.noi_tru), num(s.province.ngoai_tru), num(s.province.nhan_vien), num(s.province.tcmr),
  ];
  styleRow(total, true);

  const notes = wb.addWorksheet('Ghi chú');
  notes.getColumn(1).width = 120;
  [
    `Báo cáo: ${s.round ? roundLabel(s.round) : `Quý ${quarter}/${year} (chưa có đợt)`}${s.tcmrRound ? ` — TCMR: ${roundLabel(s.tcmrRound)}` : ''}`,
    `Xuất lúc: ${new Date().toISOString()}`,
    'Phương pháp (QĐ 56/QĐ-BYT, mục III):',
    '- Chỉ số thành phần A1–A5 = số câu trả lời mức 4–5 / số câu trả lời mức 1–5 × 100 (loại câu "Không sử dụng/Không ý kiến").',
    '- Chỉ số của đơn vị theo từng mẫu phiếu: cách thứ hai (gộp tất cả câu trả lời).',
    '- "Chỉ số hài lòng chung" của đơn vị: gộp câu trả lời nội trú + ngoại trú (dịch vụ khám chữa bệnh).',
    '- Dòng toàn tỉnh: trung bình cộng (không gia quyền) chỉ số của các đơn vị đã đo; TCMR: trung bình các trạm y tế đã đo.',
    '- Cỡ mẫu: số phiếu hợp lệ đã thu (không tính phiếu bị loại do cờ chất lượng).',
    '- Áp dụng: đơn vị đã ghi nhận giải pháp cải tiến cho đợt; tỷ lệ = số đơn vị có giải pháp / số đơn vị đã đo.',
    'Lưu ý: mẫu nội trú đang dùng 31 tiêu chí theo QĐ 3869 (QĐ 56 yêu cầu 36); mẫu TCMR là bản nháp.',
  ].forEach((l, i) => {
    const c = notes.getCell(i + 1, 1);
    c.value = l;
    c.font = { name: XLSX_FONT, size: 12, bold: i === 0 };
  });
  return { buffer: Buffer.from(await wb.xlsx.writeBuffer()), summary: s };
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV dữ liệu thô — không có số điện thoại / mã băm. */
export async function buildResponsesCsv(q, { roundId, formCode, unitId = null, def }) {
  const items = def.groups.flatMap((g) => g.items.map((it) => it.code));
  const demos = (def.demographics || []).map((d) => d.code);
  const params = [roundId, formCode];
  let sql = `select r.*, u.code as unit_code, u.name as unit_name, t.name as tyt_name
    from ks_responses r join ks_units u on u.id = r.unit_id left join ks_units t on t.id = r.tyt_id
    where r.round_id = $1 and r.form_code = $2`;
  if (unitId) {
    params.push(unitId);
    sql += ` and r.unit_id = $${params.length}`;
  }
  sql += ' order by u.sort, r.id';
  const { rows } = await q.query(sql, params);
  const header = ['id', 'ma_don_vi', 'don_vi', 'tram_y_te', 'hinh_thuc', 'thoi_diem', 'thoi_gian_lam_giay', 'co_chat_luong', 'loai_khoi_tinh_toan', ...demos, ...items, 'phan_tram_mong_doi', 'quay_lai', 'y_kien'];
  const out = [header.join(',')];
  for (const r of rows) {
    const demo = r.demographics || {};
    const ans = r.answers || {};
    const meta = r.meta || {};
    out.push(
      [
        r.id, r.unit_code, r.unit_name, r.tyt_name, r.mode, r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
        r.duration_sec, (r.flags || []).join('|'), r.excluded ? 1 : 0,
        ...demos.map((d) => demo[d]), ...items.map((c) => ans[c]), meta.expect_pct, meta.return_intent, r.comment,
      ].map(csvCell).join(',')
    );
  }
  return '﻿' + out.join('\r\n') + '\r\n';
}
