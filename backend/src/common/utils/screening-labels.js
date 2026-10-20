// Nhãn tiếng Việt dùng chung cho mọi nơi backend cần hiển thị dữ liệu sàng lọc trường học
// (email cảnh báo đỏ, email tổng hợp cuối tháng, file Excel xuất kèm) — khớp với các map
// hiển thị bên admin (AdminScreeningView.vue), tách riêng 1 file vì backend/frontend khác
// runtime, không import chéo được.
export const DIFFICULTY_LABELS = {
  ap_luc_hoc_tap: 'Áp lực học tập, thi cử', lo_lang_cang_thang: 'Lo lắng, căng thẳng',
  buon_chan_mat_hung_thu: 'Buồn chán, mất hứng thú', kho_kiem_soat_cam_xuc: 'Khó kiểm soát cảm xúc',
  mau_thuan_ban_be: 'Mâu thuẫn với bạn bè', mau_thuan_gia_dinh: 'Mâu thuẫn với cha mẹ/người thân',
  bi_treu_choc_bat_nat: 'Bị trêu chọc, bắt nạt hoặc cô lập', kho_khan_mang_xa_hoi: 'Khó khăn khi sử dụng mạng xã hội',
  kho_khan_dinh_huong_nghe_nghiep: 'Khó khăn về định hướng nghề nghiệp', kho_khan_hoan_canh_gia_dinh: 'Khó khăn về hoàn cảnh gia đình',
  khong_co_kho_khan: 'Không có khó khăn đáng kể'
};
export const SUPPORT_NEED_LABELS = {
  ky_nang_quan_ly_cang_thang: 'Kỹ năng quản lý căng thẳng', ky_nang_hoc_tap: 'Kỹ năng học tập hiệu quả',
  ky_nang_dieu_hoa_cam_xuc: 'Kỹ năng điều hoà cảm xúc', ky_nang_giao_tiep: 'Kỹ năng giao tiếp và giải quyết mâu thuẫn',
  phong_chong_bao_luc: 'Phòng chống bạo lực học đường', an_toan_mang: 'An toàn trên môi trường mạng',
  tu_van_huong_nghiep: 'Tư vấn hướng nghiệp', tro_chuyen_rieng: 'Trò chuyện riêng với thầy/cô hoặc tổ tư vấn',
  khong_co_nhu_cau: 'Không có nhu cầu hiện tại'
};
export const REFERRAL_CATEGORY_LABELS = { hoc_tap: 'Học tập', huong_nghiep: 'Hướng nghiệp', giao_tiep: 'Giao tiếp và các mối quan hệ', phat_trien_ban_than: 'Phát triển bản thân' };
export const SUPPORT_FORMAT_LABELS = { tai_lieu: 'Tài liệu/hướng dẫn', tu_van_truong: 'Tư vấn/hỗ trợ tại trường', ket_noi_chuyen_gia: 'Kết nối chuyên gia', ho_tro_khan: 'Hỗ trợ khẩn' };
export const BAND_LABELS = { do: 'Đỏ — cần ưu tiên', vang: 'Vàng — cần quan tâm', xanh: 'Xanh — nhẹ' };

export const difficultyLabel = (k) => DIFFICULTY_LABELS[k] || k;
export const supportNeedLabel = (k) => SUPPORT_NEED_LABELS[k] || k;
export const referralCategoryLabel = (k) => REFERRAL_CATEGORY_LABELS[k] || k;
export const supportFormatLabel = (k) => SUPPORT_FORMAT_LABELS[k] || k;
export const bandLabel = (b) => BAND_LABELS[b] || b;
