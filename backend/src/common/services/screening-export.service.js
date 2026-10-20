import ExcelJS from 'exceljs';
import { db } from '../../config/db.js';
import { difficultyLabel, supportNeedLabel, bandLabel } from '../utils/screening-labels.js';

function dt(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

// Dựng file .xlsx 2 sheet (Tổng hợp + Danh sách phiếu) y hệt kiểu admin tự xuất thủ công ở
// AdminScreeningView.vue — dùng để ĐÍNH KÈM EMAIL (báo đỏ tức thời + tổng hợp cuối tháng).
// KHÔNG nhúng ảnh biểu đồ như bản admin tự export trong trình duyệt: Chart.js cần canvas
// 2D context, Node không có sẵn mà phải cài thêm `canvas` (native binding) — rủi ro vỡ
// build trên Vercel serverless, nên bản server-side này chỉ có bảng số liệu.
export async function buildScreeningExcelBuffer({ from, to } = {}) {
  const conditions = [];
  const params = [];
  if (from) {
    params.push(from);
    conditions.push(`r.created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`r.created_at <= $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const [byBand, byDifficulty, bySupportNeed, bySchool, list] = await Promise.all([
    db.query(`select risk_band, count(*)::int as count from screening_responses r ${where} group by risk_band`, params),
    db.query(
      `select key as difficulty, count(*)::int as count from screening_responses r, jsonb_array_elements_text(r.difficulties) as key ${where} group by key order by count desc`,
      params
    ),
    db.query(
      `select key as support_need, count(*)::int as count from screening_responses r, jsonb_array_elements_text(r.support_needs) as key ${where} group by key order by count desc`,
      params
    ),
    db.query(
      `select coalesce(s.name, 'Chưa rõ trường') as school_name,
              count(*) filter (where r.risk_band = 'do')::int as do_count,
              count(*) filter (where r.risk_band = 'vang')::int as vang_count,
              count(*) filter (where r.risk_band = 'xanh')::int as xanh_count
       from screening_responses r
       left join screening_schools s on s.id = r.school_id
       ${where}
       group by s.name
       order by s.name asc`,
      params
    ),
    db.query(
      `select r.*, s.name as school_name
       from screening_responses r
       left join screening_schools s on s.id = r.school_id
       ${where}
       order by r.created_at desc`,
      params
    )
  ]);

  const wb = new ExcelJS.Workbook();

  const wsSummary = wb.addWorksheet('Tổng hợp');
  wsSummary.addRow(['Tổng số phiếu', list.rowCount]);
  wsSummary.addRow([]);
  wsSummary.addRow(['Mức độ', 'Số lượng']);
  byBand.rows.forEach((r) => wsSummary.addRow([bandLabel(r.risk_band), r.count]));
  wsSummary.addRow([]);
  wsSummary.addRow(['Khó khăn phổ biến', 'Số lượng']);
  byDifficulty.rows.forEach((r) => wsSummary.addRow([difficultyLabel(r.difficulty), r.count]));
  wsSummary.addRow([]);
  wsSummary.addRow(['Nhu cầu hỗ trợ phổ biến', 'Số lượng']);
  bySupportNeed.rows.forEach((r) => wsSummary.addRow([supportNeedLabel(r.support_need), r.count]));
  wsSummary.addRow([]);
  wsSummary.addRow(['Theo trường', 'Đỏ', 'Vàng', 'Xanh']);
  bySchool.rows.forEach((r) => wsSummary.addRow([r.school_name, r.do_count, r.vang_count, r.xanh_count]));

  const wsList = wb.addWorksheet('Danh sách phiếu');
  wsList.addRow(['Trường', 'Học sinh', 'Khối', 'Lớp', 'Giới tính', 'Điểm (Phần 2)', 'Mức độ', 'Khó khăn', 'Nhu cầu hỗ trợ', 'Đồng ý liên hệ', 'Liên hệ', 'Ngày gửi']);
  list.rows.forEach((it) => {
    wsList.addRow([
      it.school_name || '', it.student_name || '', it.grade || '', it.class_name || '', it.gender || '',
      it.wellbeing_total, bandLabel(it.risk_band), (it.difficulties || []).map(difficultyLabel).join('; '),
      (it.support_needs || []).map(supportNeedLabel).join('; '), it.consent_contact ? 'Có' : 'Không', it.contact || '', dt(it.created_at)
    ]);
  });

  return wb.xlsx.writeBuffer();
}
