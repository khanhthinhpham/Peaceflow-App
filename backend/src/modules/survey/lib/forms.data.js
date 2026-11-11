
/**
 * Định nghĩa mẫu phiếu (seed). Được nạp vào bảng `forms` dưới dạng JSON khi khởi tạo CSDL,
 * sau đó có thể chỉnh sửa trong CSDL mà không cần sửa mã nguồn.
 *
 * Nguồn: QĐ 3869/QĐ-BYT (2019) — Mẫu 1 (nội trú), Mẫu 2 (ngoại trú), Mẫu 3 (nhân viên y tế), giữ nguyên câu chữ.
 * Nhóm A–E được gán vào 5 chỉ số thành phần A1–A5 của QĐ 56/QĐ-BYT (2024).
 * Mẫu TCMR là BẢN NHÁP do hệ thống soạn (chưa có văn bản mẫu phiếu chính thức trong tài liệu đầu vào).
 */

const g = (component, code, title, items) => ({
  component,
  code,
  title,
  items: items.map((text, i) => ({ code: `${code}${i + 1}`, text })),
});

const GIOI_TINH = { code: 'gioi_tinh', label: 'Giới tính', type: 'choice', required: true, options: [{ v: 1, l: 'Nam' }, { v: 2, l: 'Nữ' }] };
const TUOI = { code: 'tuoi', label: 'Tuổi', type: 'number', required: true, min: 18, max: 120, hint: 'Người trả lời phải từ 18 tuổi trở lên' };
const BHYT = (lan) => ({ code: 'bhyt', label: `Ông/Bà có sử dụng thẻ BHYT cho lần ${lan} này không?`, type: 'choice', required: true, options: [{ v: 1, l: 'Có' }, { v: 2, l: 'Không' }] });
const KHOANG_CACH = (noi) => ({ code: 'khoang_cach_km', label: `Ước tính khoảng cách từ nơi sinh sống đến ${noi} (km)`, type: 'number', required: false, min: 0, max: 2000 });

const PATIENT_INTRO =
  'Nhằm mục tiêu nâng cao chất lượng khám, chữa bệnh, đáp ứng sự hài lòng người bệnh, Bộ Y tế và bệnh viện tổ chức khảo sát để tìm hiểu nguyện vọng người bệnh. Các ý kiến quý báu này sẽ giúp ngành y tế khắc phục khó khăn, từng bước cải tiến chất lượng để phục vụ người dân tốt hơn. Bộ Y tế bảo đảm giữ bí mật thông tin và không ảnh hưởng đến việc điều trị. Xin trân trọng cảm ơn!';

const CONSENT_PATIENT =
  'Tôi đồng ý tham gia khảo sát. Tôi đã được biết: việc tham gia là tự nguyện, thông tin được giữ bí mật và chỉ dùng để cải tiến chất lượng dịch vụ; số điện thoại (nếu cung cấp) không được lưu dưới dạng đọc được (Nghị định 13/2023/NĐ-CP).';

const noi_tru = {
  code: 'noi_tru',
  name: 'Người bệnh nội trú',
  kind: 'kcb',
  title: 'PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI BỆNH NỘI TRÚ',
  source: 'QĐ 3869/QĐ-BYT — Mẫu số 1 (rút gọn)',
  status: 'can_cap_nhat',
  note: 'Mẫu theo 3869 — QĐ 56 yêu cầu 36 tiêu chí (thiếu 2 ở A2, 2 ở A3, 1 ở A5); cập nhật khi có mẫu chính thức',
  required_counts: { A1: 5, A2: 7, A3: 11, A4: 7, A5: 6 },
  intro: PATIENT_INTRO,
  consent: CONSENT_PATIENT,
  phone: true,
  demographics: [
    { code: 'nguoi_tra_loi', label: 'Người trả lời', type: 'choice', required: true, options: [{ v: 1, l: 'Người bệnh' }, { v: 2, l: 'Người nhà' }] },
    { code: 'khoa', label: 'Tên khoa nằm điều trị trước ra viện', type: 'text', required: false, maxLength: 120 },
    GIOI_TINH,
    TUOI,
    { code: 'so_ngay_nam_vien', label: 'Tổng số ngày nằm viện', type: 'number', required: false, min: 0, max: 365 },
    BHYT('điều trị'),
  ],
  groups: [
    g('A1', 'A', 'Khả năng tiếp cận', [
      'Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm.',
      'Thời gian vào thăm người bệnh được thông báo rõ ràng.',
      'Các khối nhà, cầu thang, buồng bệnh được đánh số rõ ràng, dễ tìm.',
      'Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi.',
      'Người bệnh hỏi và gọi được nhân viên y tế khi cần thiết.',
    ]),
    g('A2', 'B', 'Sự minh bạch thông tin và thủ tục khám bệnh, điều trị', [
      'Quy trình, thủ tục nhập viện rõ ràng, công khai, thuận tiện.',
      'Được phổ biến về nội quy và những thông tin cần thiết khi nằm viện rõ ràng, đầy đủ.',
      'Được giải thích về tình trạng bệnh, phương pháp và thời gian dự kiến điều trị rõ ràng, đầy đủ.',
      'Được giải thích, tư vấn trước khi yêu cầu làm các xét nghiệm, thăm dò, kỹ thuật cao rõ ràng, đầy đủ.',
      'Được công khai và cập nhật thông tin về dùng thuốc và chi phí điều trị.',
    ]),
    g('A3', 'C', 'Cơ sở vật chất và phương tiện phục vụ người bệnh', [
      'Buồng bệnh nằm điều trị khang trang, sạch sẽ, có đầy đủ các thiết bị điều chỉnh nhiệt độ phù hợp như quạt, máy sưởi, hoặc điều hòa.',
      'Giường bệnh, ga, gối đầy đủ cho mỗi người một giường, an toàn, chắc chắn, sử dụng tốt.',
      'Nhà vệ sinh, nhà tắm thuận tiện, sạch sẽ, sử dụng tốt.',
      'Được bảo đảm an toàn, an ninh, trật tự, phòng ngừa trộm cắp, yên tâm khi nằm viện.',
      'Được cung cấp quần áo đầy đủ, sạch sẽ.',
      'Được cung cấp đầy đủ nước uống nóng, lạnh.',
      'Được bảo đảm sự riêng tư khi nằm viện như thay quần áo, khám bệnh, đi vệ sinh tại giường... có rèm che, vách ngăn hoặc nằm riêng.',
      'Căng-tin bệnh viện phục vụ ăn uống và nhu cầu sinh hoạt thiết yếu đầy đủ và chất lượng.',
      'Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp.',
    ]),
    g('A4', 'D', 'Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế', [
      'Bác sỹ, điều dưỡng có lời nói, thái độ, giao tiếp đúng mực.',
      'Nhân viên phục vụ (hộ lý, bảo vệ, kế toán...) có lời nói, thái độ, giao tiếp đúng mực.',
      'Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.',
      'Bác sỹ, điều dưỡng hợp tác tốt và xử lý công việc thành thạo, kịp thời.',
      'Được bác sỹ thăm khám, động viên tại phòng điều trị.',
      'Được tư vấn chế độ ăn, vận động, theo dõi và phòng ngừa biến chứng.',
      'Nhân viên y tế không có biểu hiện gợi ý bồi dưỡng.',
    ]),
    g('A5', 'E', 'Kết quả cung cấp dịch vụ', [
      'Cấp phát thuốc và hướng dẫn sử dụng thuốc đầy đủ, chất lượng.',
      'Trang thiết bị, vật tư y tế đầy đủ, hiện đại, đáp ứng nguyện vọng.',
      'Kết quả điều trị đáp ứng được nguyện vọng.',
      'Ông/Bà đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.',
      'Ông/Bà đánh giá mức độ hài lòng về giá cả dịch vụ y tế.',
    ]),
  ],
  expect: { code: 'G1', label: 'Đánh giá chung, bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà trước khi nằm viện? (điền số từ 0% đến 100% hoặc có thể điền trên 100% nếu bệnh viện điều trị tốt, vượt quá mong đợi của Ông/Bà)' },
  return: {
    code: 'G2',
    label: 'Nếu có nhu cầu khám, chữa những bệnh tương tự, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?',
    options: [
      { v: 1, l: 'Chắc chắn không bao giờ quay lại' },
      { v: 2, l: 'Không muốn quay lại nhưng có ít lựa chọn khác' },
      { v: 3, l: 'Muốn chuyển tuyến sang bệnh viện khác' },
      { v: 4, l: 'Có thể sẽ quay lại' },
      { v: 5, l: 'Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác' },
      { v: 6, l: 'Khác' },
    ],
  },
  comment: { code: 'H', label: 'Ông/Bà có ý kiến gì khác, xin ghi rõ?' },
};

const ngoai_tru = {
  code: 'ngoai_tru',
  name: 'Người bệnh ngoại trú',
  kind: 'kcb',
  title: 'PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI BỆNH NGOẠI TRÚ',
  source: 'QĐ 3869/QĐ-BYT — Mẫu số 2',
  status: 'chinh_thuc',
  note: 'Số tiêu chí 5/10/8/4/4 = 31 khớp yêu cầu QĐ 56. Câu chữ theo Mẫu 2 QĐ 3869 (QĐ 56 đã bãi bỏ Mẫu 1, Mẫu 2 của QĐ 3869 — thay khi có mẫu phiếu mới).',
  required_counts: { A1: 5, A2: 10, A3: 8, A4: 4, A5: 4 },
  intro: PATIENT_INTRO,
  consent: CONSENT_PATIENT,
  phone: true,
  demographics: [GIOI_TINH, TUOI, KHOANG_CACH('bệnh viện'), BHYT('khám bệnh')],
  groups: [
    g('A1', 'A', 'Khả năng tiếp cận', [
      'Các biển báo, chỉ dẫn đường đến bệnh viện rõ ràng, dễ nhìn, dễ tìm.',
      'Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm.',
      'Các khối nhà, cầu thang được đánh số rõ ràng, dễ tìm.',
      'Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi.',
      'Có thể tìm hiểu các thông tin và đăng ký khám qua điện thoại, trang tin điện tử của bệnh viện (website) thuận tiện.',
    ]),
    g('A2', 'B', 'Sự minh bạch thông tin và thủ tục khám bệnh, điều trị', [
      'Quy trình khám bệnh được niêm yết rõ ràng, công khai, dễ hiểu.',
      'Các quy trình, thủ tục khám bệnh được cải cách đơn giản, thuận tiện.',
      'Giá dịch vụ y tế niêm yết rõ ràng, công khai.',
      'Nhân viên y tế tiếp đón, hướng dẫn người bệnh làm các thủ tục niềm nở, tận tình.',
      'Được xếp hàng theo thứ tự trước sau khi làm các thủ tục đăng ký, nộp tiền, khám bệnh, xét nghiệm, chiếu chụp.',
      'Đánh giá thời gian chờ đợi làm thủ tục đăng ký khám.',
      'Đánh giá thời gian chờ tới lượt bác sỹ khám.',
      'Đánh giá thời gian được bác sỹ khám và tư vấn.',
      'Đánh giá thời gian chờ làm xét nghiệm, chiếu chụp.',
      'Đánh giá thời gian chờ nhận kết quả xét nghiệm, chiếu chụp.',
    ]),
    g('A3', 'C', 'Cơ sở vật chất và phương tiện phục vụ người bệnh', [
      'Có phòng/sảnh chờ khám sạch sẽ, thoáng mát vào mùa hè; kín gió và ấm áp vào mùa đông.',
      'Phòng chờ có đủ ghế ngồi cho người bệnh và sử dụng tốt.',
      'Phòng chờ có quạt (điều hòa) đầy đủ, hoạt động thường xuyên.',
      'Phòng chờ có các phương tiện giúp người bệnh có tâm lý thoải mái như ti-vi, tranh ảnh, tờ rơi, nước uống...',
      'Được bảo đảm sự riêng tư khi khám bệnh, chiếu chụp, làm thủ thuật.',
      'Nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ.',
      'Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp.',
      'Khu khám bệnh bảo đảm an ninh, trật tự, phòng ngừa trộm cắp cho người dân.',
    ]),
    g('A4', 'D', 'Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế', [
      'Nhân viên y tế (bác sỹ, điều dưỡng) có lời nói, thái độ, giao tiếp đúng mực.',
      'Nhân viên phục vụ (hộ lý, bảo vệ, kế toán...) có lời nói, thái độ, giao tiếp đúng mực.',
      'Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.',
      'Năng lực chuyên môn của bác sỹ, điều dưỡng đáp ứng mong đợi.',
    ]),
    g('A5', 'E', 'Kết quả cung cấp dịch vụ', [
      'Kết quả khám bệnh đã đáp ứng được nguyện vọng của Ông/Bà.',
      'Các hóa đơn, phiếu thu, đơn thuốc và kết quả khám bệnh được cung cấp đầy đủ, rõ ràng, minh bạch và được giải thích nếu có thắc mắc.',
      'Đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.',
      'Đánh giá mức độ hài lòng về giá cả dịch vụ y tế.',
    ]),
  ],
  expect: { code: 'F', label: 'Đánh giá chung bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi trước khi tới khám bệnh? (điền số từ 0% đến 100% hoặc có thể điền trên 100% nếu bệnh viện điều trị tốt, vượt quá mong đợi của Ông/Bà)' },
  return: {
    code: 'G',
    label: 'Nếu có nhu cầu khám bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?',
    options: [
      { v: 1, l: 'Chắc chắn không bao giờ quay lại' },
      { v: 2, l: 'Không muốn quay lại nhưng có ít lựa chọn khác' },
      { v: 3, l: 'Có thể sẽ quay lại' },
      { v: 4, l: 'Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác' },
      { v: 5, l: 'Khác' },
    ],
  },
  comment: { code: 'H', label: 'Ông/Bà có ý kiến gì khác, xin ghi rõ?' },
};

const tcmr = {
  code: 'tcmr',
  name: 'Tiêm chủng mở rộng',
  kind: 'tcmr',
  title: 'PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI SỬ DỤNG DỊCH VỤ TIÊM CHỦNG MỞ RỘNG',
  source: 'BẢN NHÁP do hệ thống soạn theo cấu trúc QĐ 56 (4/8/12/5/3 tiêu chí)',
  status: 'ban_nhap',
  note: 'Bản nháp — thay bằng mẫu chính thức QĐ 56',
  required_counts: { A1: 4, A2: 8, A3: 12, A4: 5, A5: 3 },
  intro:
    'Nhằm nâng cao chất lượng dịch vụ tiêm chủng mở rộng, ngành y tế tổ chức khảo sát ý kiến của phụ nữ mang thai đi tiêm phòng và người đưa trẻ đi tiêm chủng. Thông tin được giữ bí mật và không ảnh hưởng đến việc tiêm chủng. Xin trân trọng cảm ơn!',
  consent: CONSENT_PATIENT,
  phone: true,
  demographics: [
    { code: 'nguoi_tra_loi', label: 'Người trả lời', type: 'choice', required: true, options: [{ v: 1, l: 'Phụ nữ mang thai đi tiêm phòng' }, { v: 2, l: 'Người đưa trẻ đi tiêm chủng' }] },
    GIOI_TINH,
    TUOI,
    KHOANG_CACH('trạm y tế'),
  ],
  groups: [
    g('A1', 'A', 'Khả năng tiếp cận', [
      'Trạm y tế/điểm tiêm chủng dễ tìm, có biển báo, chỉ dẫn rõ ràng.',
      'Lịch tiêm chủng được thông báo kịp thời, đầy đủ (qua loa truyền thanh, tin nhắn, nhân viên y tế thôn bản...).',
      'Thời gian tổ chức buổi tiêm chủng thuận tiện cho người dân.',
      'Có thể liên hệ, hỏi thông tin về tiêm chủng qua điện thoại hoặc nhân viên y tế khi cần.',
    ]),
    g('A2', 'B', 'Sự minh bạch thông tin và thủ tục tiêm chủng', [
      'Quy trình tiêm chủng (đón tiếp, khám sàng lọc, tiêm, theo dõi sau tiêm) được niêm yết rõ ràng, dễ hiểu.',
      'Thủ tục đăng ký, đón tiếp đơn giản, nhanh chóng.',
      'Được xếp lượt theo thứ tự trước sau.',
      'Được thông báo rõ loại vắc xin, bệnh được phòng ngừa và lịch tiêm mũi tiếp theo.',
      'Được khám sàng lọc và giải thích kết quả khám sàng lọc trước khi tiêm.',
      'Được tư vấn về phản ứng có thể gặp sau tiêm và cách theo dõi, xử trí tại nhà.',
      'Thông tin tiêm chủng được ghi đầy đủ vào sổ/phiếu tiêm chủng hoặc hệ thống tiêm chủng điện tử.',
      'Đánh giá thời gian chờ đợi từ khi đến đến khi được tiêm.',
    ]),
    g('A3', 'C', 'Cơ sở vật chất và phương tiện phục vụ', [
      'Khu vực chờ tiêm sạch sẽ, thoáng mát vào mùa hè; kín gió và ấm áp vào mùa đông.',
      'Khu vực chờ có đủ ghế ngồi và sử dụng tốt.',
      'Có khu vực theo dõi sau tiêm riêng, đủ chỗ ngồi.',
      'Có quạt (điều hòa) đầy đủ, hoạt động tốt.',
      'Được cung cấp đầy đủ nước uống sạch.',
      'Nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ.',
      'Phòng tiêm sạch sẽ, gọn gàng, bảo đảm vô khuẩn.',
      'Có chỗ thay tã, cho trẻ bú hoặc chăm sóc trẻ.',
      'Tài liệu truyền thông (tờ rơi, áp phích) về tiêm chủng đầy đủ, dễ hiểu.',
      'Được bảo đảm sự riêng tư khi khám sàng lọc và tiêm.',
      'Môi trường trong khuôn viên trạm y tế xanh, sạch, đẹp.',
      'Bảo đảm an ninh, trật tự, có chỗ để xe an toàn.',
    ]),
    g('A4', 'D', 'Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế', [
      'Nhân viên y tế có lời nói, thái độ, giao tiếp đúng mực, thân thiện.',
      'Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.',
      'Nhân viên y tế thực hiện tiêm thành thạo, nhẹ nhàng, đúng kỹ thuật.',
      'Nhân viên y tế sẵn sàng giải đáp thắc mắc.',
      'Nhân viên y tế không có biểu hiện gợi ý bồi dưỡng.',
    ]),
    g('A5', 'E', 'Kết quả cung cấp dịch vụ', [
      'Được tiêm đúng, đủ loại vắc xin theo lịch.',
      'Đánh giá mức độ tin tưởng về chất lượng, an toàn của vắc xin và dịch vụ tiêm chủng.',
      'Dịch vụ tiêm chủng mở rộng đáp ứng được mong đợi của Ông/Bà.',
    ]),
  ],
  expect: { code: 'G1', label: 'Đánh giá chung, dịch vụ tiêm chủng đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà? (0% đến 100%, có thể trên 100%)' },
  return: {
    code: 'G2',
    label: 'Ông/Bà có tiếp tục sử dụng dịch vụ tiêm chủng tại đây hoặc giới thiệu cho người khác không?',
    options: [
      { v: 1, l: 'Chắc chắn không' },
      { v: 2, l: 'Không muốn nhưng có ít lựa chọn khác' },
      { v: 3, l: 'Có thể sẽ tiếp tục' },
      { v: 4, l: 'Chắc chắn sẽ tiếp tục hoặc giới thiệu cho người khác' },
      { v: 5, l: 'Khác' },
    ],
  },
  comment: { code: 'H', label: 'Ông/Bà có ý kiến gì khác, xin ghi rõ?' },
};

const nhan_vien = {
  code: 'nhan_vien',
  name: 'Nhân viên y tế',
  kind: 'nvyt',
  title: 'PHIẾU KHẢO SÁT Ý KIẾN CỦA NHÂN VIÊN Y TẾ',
  source: 'QĐ 3869/QĐ-BYT — Mẫu số 3',
  status: 'chinh_thuc',
  note: 'Phiếu ẩn danh hoàn toàn: không ghi tên, không lưu số điện thoại, không lưu địa chỉ IP.',
  required_counts: { A1: 9, A2: 9, A3: 12, A4: 7, A5: 7 },
  intro:
    'Nhằm mục tiêu nâng cao chất lượng khám, chữa bệnh và cải tiến môi trường làm việc của nhân viên y tế, Bộ Y tế và bệnh viện tổ chức khảo sát để tìm hiểu ý kiến nguyện vọng của nhân viên y tế. Bộ Y tế bảo đảm giữ bí mật thông tin. Rất mong Quý đồng nghiệp trả lời đầy đủ, khách quan, chính xác. Xin trân trọng cảm ơn!',
  consent: 'Tôi đồng ý tham gia khảo sát. Phiếu ẩn danh: hệ thống không ghi tên, số điện thoại hay địa chỉ IP của người trả lời.',
  phone: false,
  anonymous: true,
  demographics: [
    { code: 'gioi_tinh', label: 'A1. Giới tính', type: 'choice', required: true, options: [{ v: 1, l: 'Nam' }, { v: 2, l: 'Nữ' }] },
    { code: 'tuoi', label: 'A2. Tuổi', type: 'number', required: true, min: 18, max: 80 },
    { code: 'chuyen_mon', label: 'A3. Chuyên môn đào tạo chính', type: 'choice', required: false, options: [{ v: 1, l: 'Bác sỹ' }, { v: 2, l: 'Dược sỹ' }, { v: 3, l: 'Điều dưỡng, hộ sinh' }, { v: 4, l: 'Kỹ thuật viên' }, { v: 5, l: 'Khác' }] },
    { code: 'bang_cap', label: 'A4. Bằng cấp cao nhất của Ông/Bà', type: 'choice', required: false, options: [{ v: 1, l: 'Trung cấp' }, { v: 2, l: 'Cao đẳng' }, { v: 3, l: 'Đại học' }, { v: 4, l: 'Cao học, CKI' }, { v: 5, l: 'Tiến sỹ, CKII' }, { v: 6, l: 'Khác' }] },
    { code: 'nam_nganh', label: 'A5. Số năm công tác trong ngành Y', type: 'number', required: false, min: 0, max: 60 },
    { code: 'nam_don_vi', label: 'A6. Số năm công tác tại bệnh viện hiện nay', type: 'number', required: false, min: 0, max: 60 },
    { code: 'vi_tri', label: 'A7. Vị trí công tác hiện tại', type: 'choice', required: false, options: [{ v: 1, l: 'Lãnh đạo bệnh viện' }, { v: 2, l: 'Trưởng khoa/phòng/trung tâm' }, { v: 3, l: 'Phó khoa/phòng' }, { v: 4, l: 'NV biên chế/hợp đồng dài hạn' }, { v: 5, l: 'Hợp đồng ngắn hạn' }, { v: 6, l: 'Khác' }] },
    { code: 'pham_vi', label: 'A8. Phạm vi hoạt động chuyên môn', type: 'choice', required: false, options: [{ v: 1, l: 'Khối hành chính' }, { v: 2, l: 'Cận lâm sàng' }, { v: 3, l: 'Nội' }, { v: 4, l: 'Ngoại' }, { v: 5, l: 'Sản' }, { v: 6, l: 'Nhi' }, { v: 7, l: 'Truyền nhiễm' }, { v: 8, l: 'Chuyên khoa lẻ (mắt, TMH, RHM…)' }, { v: 9, l: 'Các khoa không trực tiếp KCB' }, { v: 10, l: 'Dược' }, { v: 11, l: 'Dự phòng' }, { v: 12, l: 'Khác' }] },
    { code: 'kiem_nhiem', label: 'A9. Anh/Chị có được phân công kiêm nhiệm nhiều công việc không?', type: 'choice', required: false, options: [{ v: 1, l: 'Không kiêm nhiệm' }, { v: 2, l: 'Kiêm nhiệm 2 công việc' }, { v: 3, l: 'Kiêm nhiệm từ 3 công việc trở lên' }] },
    { code: 'so_lan_truc', label: 'A10. Trung bình Anh/Chị trực mấy lần trong một tháng?', type: 'number', required: false, min: 0, max: 31 },
  ],
  groups: [
    g('A1', 'A', 'Sự hài lòng về môi trường làm việc', [
      'Phòng làm việc khang trang, sạch sẽ, thoáng mát.',
      'Trang thiết bị văn phòng, bàn ghế làm việc... đầy đủ, các thiết bị cũ, lạc hậu được thay thế kịp thời.',
      'Có bố trí phòng trực cho NVYT.',
      'Phân chia thời gian trực và làm việc ngoài giờ hành chính hợp lý.',
      'Các trang bị bảo hộ cho NVYT (quần áo, khẩu trang, găng tay..) đầy đủ, không bị cũ, nhàu nát, không bị hạn chế sử dụng.',
      'Môi trường học tập tạo điều kiện cho NVYT cập nhật kiến thức, nâng cao trình độ: thư viện, phòng đọc, tra cứu thông tin, truy cập internet...',
      'Môi trường làm việc bảo đảm an toàn cho NVYT.',
      'Bệnh viện bảo đảm an ninh, trật tự cho NVYT làm việc.',
      'Người bệnh và người nhà có thái độ tôn trọng, hợp tác với NVYT trong quá trình điều trị.',
    ]),
    g('A2', 'B', 'Sự hài lòng về lãnh đạo trực tiếp, đồng nghiệp', [
      'Lãnh đạo có năng lực xử lý, điều hành, giải quyết công việc hiệu quả.',
      'Lãnh đạo phân công công việc phù hợp với chuyên môn đào tạo của nhân viên.',
      'Lãnh đạo quan tâm, tôn trọng, đối xử bình đẳng với các NVYT.',
      'Lãnh đạo lắng nghe và tiếp thu ý kiến đóng góp NVYT.',
      'Lãnh đạo động viên, khích lệ nhân viên khi hoàn thành tốt nhiệm vụ, có tiến bộ trong công việc.',
      'Đồng nghiệp có ý thức hợp tác để hoàn thành nhiệm vụ chung.',
      'Môi trường làm việc thân thiện, đoàn kết.',
      'Đồng nghiệp chia sẻ kinh nghiệm, giúp đỡ nhau trong công việc.',
      'Đồng nghiệp quan tâm, giúp đỡ nhau trong cuộc sống.',
    ]),
    g('A3', 'C', 'Sự hài lòng về quy chế nội bộ, tiền lương, phúc lợi', [
      'Các quy định, quy chế làm việc nội bộ của bệnh viện rõ ràng, thực tế và công khai.',
      'Môi trường làm việc tại khoa/phòng và bệnh viện dân chủ.',
      'Quy chế chi tiêu nội bộ công bằng, hợp lý, công khai.',
      'Việc phân phối quỹ phúc lợi công bằng, công khai.',
      'Mức lương tương xứng so với năng lực và cống hiến.',
      'Chế độ phụ cấp nghề và độc hại xứng đáng so với cống hiến.',
      'Thưởng và thu nhập tăng thêm ABC xứng đáng so với cống hiến.',
      'Cách phân chia thu nhập tăng thêm công bằng, khuyến khích nhân viên làm việc tích cực.',
      'Bảo đảm đóng BHXH, BHYT, khám sức khỏe định kỳ và các hình thức hỗ trợ ốm đau, thai sản đầy đủ.',
      'Tổ chức tham quan, nghỉ dưỡng đầy đủ.',
      'Có phong trào thể thao, văn nghệ tích cực.',
      'Công đoàn bệnh viện hoạt động tích cực.',
    ]),
    g('A4', 'D', 'Sự hài lòng về công việc, cơ hội học tập và thăng tiến', [
      'Khối lượng công việc được giao phù hợp.',
      'Công việc chuyên môn đáp ứng nguyện vọng bản thân.',
      'Bệnh viện tạo điều kiện cho NVYT nâng cao trình độ chuyên môn.',
      'Bệnh viện tạo điều kiện cho NVYT học tiếp các bậc cao hơn.',
      'Công khai các tiêu chuẩn cho các chức danh lãnh đạo.',
      'Bổ nhiệm các chức danh lãnh đạo dân chủ, công bằng.',
      'Có cơ hội thăng tiến khi nỗ lực làm việc.',
    ]),
    g('A5', 'E', 'Sự hài lòng chung về bệnh viện', [
      'Cảm thấy tự hào khi được làm việc tại bệnh viện.',
      'Đạt được những thành công cá nhân khi làm việc tại bệnh viện.',
      'Tin tưởng vào sự phát triển của bệnh viện, trong tương lai.',
      'Sẽ gắn bó làm việc tại khoa, phòng hiện tại lâu dài.',
      'Sẽ gắn bó làm việc tại bệnh viện lâu dài.',
      'Mức độ hài lòng nói chung về lãnh đạo bệnh viện.',
      'Tự đánh giá về mức độ hoàn thành công việc tại bệnh viện.',
    ]),
  ],
  expect: null,
  return: null,
  comment: { code: 'G', label: 'Anh/Chị có ý kiến hoặc đề xuất nào khác với Bộ Y tế và lãnh đạo bệnh viện?' },
};

const FORMS = [noi_tru, ngoai_tru, nhan_vien, tcmr];

export { FORMS };
