
/** Cờ chất lượng dữ liệu (không xóa phiếu, chỉ đánh dấu). */
const MIN_SECONDS_PATIENT = 30;
const PATIENT_FORMS = new Set(['noi_tru', 'ngoai_tru', 'tcmr']);

function computeFlags({ formCode, durationSec, answers, mode }) {
  const flags = [];
  // Phiếu nhập từ bản giấy không có thời gian làm phiếu thực tế
  if (PATIENT_FORMS.has(formCode) && mode !== 'nhap_giay' && durationSec !== null && durationSec !== undefined && durationSec < MIN_SECONDS_PATIENT) {
    flags.push('qua_nhanh');
  }
  const answered = Object.values(answers).map(Number).filter((v) => v >= 1 && v <= 5);
  if (answered.length >= 5 && answered.every((v) => v === answered[0])) flags.push('tra_loi_mot_kieu');
  return flags;
}

const FLAG_LABELS = {
  qua_nhanh: 'Hoàn thành dưới 30 giây',
  tra_loi_mot_kieu: 'Tất cả câu cùng một mức (straight-lining)',
  trung_so_dien_thoai: 'Trùng số điện thoại trong cùng đợt và đơn vị',
};

export { computeFlags, FLAG_LABELS, MIN_SECONDS_PATIENT };
