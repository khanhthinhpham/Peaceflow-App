import ExcelJS from 'exceljs';
import { db } from '../../config/db.js';

// Nhãn tiếng Việt — trùng với các map hiển thị bên admin (AdminScreeningView.vue), giữ
// riêng 1 bản ở backend vì 2 nơi khác runtime, không import chéo frontend/backend được.
const DIFFICULTY_LABELS = {
  ap_luc_hoc_tap: 'Áp lực học tập, thi cử', lo_lang_cang_thang: 'Lo lắng, căng thẳng',
  buon_chan_mat_hung_thu: 'Buồn chán, mất hứng thú', kho_kiem_soat_cam_xuc: 'Khó kiểm soát cảm xúc',
  mau_thuan_ban_be: 'Mâu thuẫn với bạn bè', mau_thuan_gia_dinh: 'Mâu thuẫn với cha mẹ/người thân',
  bi_treu_choc_bat_nat: 'Bị trêu chọc, bắt nạt hoặc cô lập', kho_khan_mang_xa_hoi: 'Khó khăn khi sử dụng mạng xã hội',
  kho_khan_dinh_huong_nghe_nghiep: 'Khó khăn về định hướng nghề nghiệp', kho_khan_hoan_canh_gia_dinh: 'Khó khăn về hoàn cảnh gia đình',
  khong_co_kho_khan: 'Không có khó khăn đáng kể'
};
const SUPPORT_NEED_LABELS = {
  ky_nang_quan_ly_cang_thang: 'Kỹ năng quản lý căng thẳng', ky_nang_hoc_tap: 'Kỹ năng học tập hiệu quả',
  ky_nang_dieu_hoa_cam_xuc: 'Kỹ năng điều hoà cảm xúc', ky_nang_giao_tiep: 'Kỹ năng giao tiếp và giải quyết mâu thuẫn',
  phong_chong_bao_luc: 'Phòng chống bạo lực học đường', an_toan_mang: 'An toàn trên môi trường mạng',
  tu_van_huong_nghiep: 'Tư vấn hướng nghiệp', tro_chuyen_rieng: 'Trò chuyện riêng với thầy/cô hoặc tổ tư vấn',
  khong_co_nhu_cau: 'Không có nhu cầu hiện tại'
};
const BAND_LABELS = { do: 'Đỏ — cần ưu tiên', vang: 'Vàng — cần quan tâm', xanh: 'Xanh — nhẹ' };

const difficultyLabel = (k) => DIFFICULTY_LABELS[k] || k;
const supportNeedLabel = (k) => SUPPORT_NEED_LABELS[k] || k;
const bandLabel = (b) => BAND_LABELS[b] || b;

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
