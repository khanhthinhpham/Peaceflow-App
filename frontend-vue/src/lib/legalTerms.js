// "Điều khoản phân định trách nhiệm đối với Khách hàng" — văn bản pháp lý chính thức (tiếng Việt).
// Nội dung theo tài liệu gốc (Google Doc), đã chuẩn hoá lỗi gõ: địa chỉ (Nghệ An), tên miền PeaceFlow.vn,
// số đường dây hỗ trợ 0931773637, bỏ ngoặc vuông "[15 ngày]", dấu câu.
// Mỗi lần SỬA NỘI DUNG phải đổi TERMS_VERSION (và đổi cùng giá trị ở backend:
// backend/src/common/services/consent.service.js). Khi phiên bản đổi, khách hàng đang dùng sẽ được
// yêu cầu đọc và đồng ý lại (TermsGate) — đáp ứng Điều 12 (thông báo trước khi áp dụng sửa đổi).
export const TERMS_VERSION = '2026-11-06';
export const TERMS_EFFECTIVE_DATE = '06/11/2026';
export const TERMS_PATH = '/dieu-khoan';
export const HOTLINE = '0931773637';

// Mỗi điều: { n, title, intro?, items: [string | { text, sub: [string] }] }
export const TERMS_ARTICLES = [
  {
    n: 1,
    title: 'Giải thích từ ngữ',
    items: [
      '"PeaceFlow" là nền tảng thuộc Doanh nghiệp Minh Vision, mã số doanh nghiệp 2902286055, địa chỉ nhà số 8, ngõ 48, đường Phan Thúc Trực, phường Thành Vinh, tỉnh Nghệ An, là chủ quản nền tảng PeaceFlow tại tên miền PeaceFlow.vn và các ứng dụng liên quan.',
      '"Khách hàng": cá nhân đăng ký tài khoản và sử dụng dịch vụ trên Nền tảng.',
      {
        text: '"Chuyên gia": cá nhân cung cấp dịch vụ chuyên môn trên Nền tảng, gồm hai nhóm:',
        sub: [
          'a) "Chuyên gia tư vấn tâm lý": người cung cấp dịch vụ tham vấn, hỗ trợ tâm lý không mang tính khám bệnh, chữa bệnh.',
          'b) "Người hành nghề": bác sĩ, người hành nghề tâm lý lâm sàng có giấy phép hành nghề khám bệnh, chữa bệnh còn hiệu lực, hoạt động thuộc cơ sở khám bệnh, chữa bệnh được cấp phép.'
        ]
      },
      '"Dịch vụ chuyên môn": buổi tư vấn, tham vấn hoặc khám bệnh, chữa bệnh từ xa do Chuyên gia thực hiện với Khách hàng thông qua Nền tảng.',
      '"Tính năng của Nền tảng": các tính năng do chính PeaceFlow cung cấp, gồm check-in tâm trạng, bài tập tự chăm sóc (thở, thiền, nhật ký), bộ công cụ sàng lọc (DASS-21, GAD-7, PHQ-9…), trợ lý AI PeaceCat, Module Khẩn cấp, biểu đồ diễn biến tâm lý, đặt lịch và thanh toán.',
      '"Dữ liệu sức khỏe": thông tin về tình trạng sức khỏe thể chất, tinh thần, cảm xúc, hành vi của Khách hàng phát sinh trên Nền tảng, là dữ liệu cá nhân nhạy cảm theo pháp luật về bảo vệ dữ liệu cá nhân.'
    ]
  },
  {
    n: 2,
    title: 'Vai trò của các bên',
    items: [
      'PeaceFlow là chủ quản nền tảng thương mại điện tử trung gian, có vai trò kết nối Khách hàng với Chuyên gia và cung cấp các Tính năng của Nền tảng.',
      'PeaceFlow không phải là cơ sở khám bệnh, chữa bệnh. Nhân sự của PeaceFlow không trực tiếp tư vấn, chẩn đoán, kê đơn hay điều trị cho Khách hàng.',
      'Chuyên gia là bên độc lập, tự quyết định và tự chịu trách nhiệm về nội dung chuyên môn của Dịch vụ chuyên môn. Chuyên gia không phải nhân viên của PeaceFlow.',
      'Dịch vụ khám bệnh, chữa bệnh từ xa (nếu có) chỉ do Người hành nghề thuộc cơ sở khám bệnh, chữa bệnh đã công bố đủ điều kiện khám bệnh, chữa bệnh từ xa thực hiện. Tên cơ sở đó được hiển thị rõ trước khi Khách hàng đặt lịch.',
      'Trên hồ sơ mỗi Chuyên gia, PeaceFlow ghi rõ Chuyên gia thuộc nhóm nào trong hai nhóm tại khoản 3 Điều 1, cùng phạm vi dịch vụ họ được phép cung cấp.'
    ]
  },
  {
    n: 3,
    title: 'Trách nhiệm của PeaceFlow đối với Khách hàng',
    intro: 'PeaceFlow chịu trách nhiệm trước Khách hàng về các nội dung sau:',
    items: [
      'Xác minh Chuyên gia: xác thực danh tính; kiểm tra văn bằng, chứng chỉ, giấy phép hành nghề (đối với Người hành nghề) trước khi cho phép hiển thị; định kỳ rà soát tình trạng hiệu lực của giấy phép.',
      'Công khai thông tin: hiển thị đầy đủ, chính xác thông tin Chuyên gia, phạm vi dịch vụ, giá, thời lượng, chính sách hủy và hoàn tiền trước khi Khách hàng đặt lịch; cung cấp thông tin về Chuyên gia khi Khách hàng có yêu cầu.',
      'Kiểm duyệt và xử lý vi phạm: kiểm duyệt thông tin dịch vụ do Chuyên gia đăng tải trước khi hiển thị; tạm khóa, gỡ bỏ hồ sơ Chuyên gia khi phát hiện hoặc nhận phản ánh về hành vi vi phạm pháp luật, vượt phạm vi chuyên môn hoặc xâm phạm quyền lợi Khách hàng.',
      'Vận hành hệ thống: bảo đảm hệ thống đặt lịch, thanh toán, gọi video/thoại hoạt động ổn định, an toàn; chịu trách nhiệm về thiệt hại phát sinh do lỗi kỹ thuật của Nền tảng.',
      'Tính năng của Nền tảng: chịu trách nhiệm về độ chính xác của việc tính điểm, hiển thị kết quả các bộ công cụ sàng lọc theo thang đo gốc; về hoạt động của trợ lý AI PeaceCat và Module Khẩn cấp theo Điều 5 và Điều 6.',
      'Bảo vệ dữ liệu: thu thập, xử lý, lưu trữ, chia sẻ Dữ liệu sức khỏe theo Điều 7 và pháp luật về bảo vệ dữ liệu cá nhân; thông báo cho Khách hàng và cơ quan có thẩm quyền khi xảy ra sự cố lộ, mất dữ liệu theo quy định.',
      'Lưu trữ giao dịch: lưu trữ và cho phép Khách hàng truy cập, tải về hóa đơn, chứng từ, lịch sử đặt lịch và thanh toán.',
      'Đánh giá: cho phép Khách hàng đánh giá Chuyên gia và hiển thị trung thực kết quả đánh giá, trừ nội dung vi phạm pháp luật hoặc đạo đức xã hội.',
      'Tiếp nhận và giải quyết khiếu nại theo Điều 10; phối hợp với Khách hàng, Chuyên gia và cơ quan nhà nước có thẩm quyền khi có tranh chấp.'
    ]
  },
  {
    n: 4,
    title: 'Trách nhiệm của Chuyên gia (để Khách hàng được biết)',
    intro: 'Theo hợp đồng ký với PeaceFlow, Chuyên gia cam kết và chịu trách nhiệm trước Khách hàng về:',
    items: [
      'Nội dung, phương pháp, chất lượng chuyên môn của Dịch vụ chuyên môn.',
      'Chỉ thực hiện dịch vụ trong phạm vi chuyên môn và giấy phép (nếu có) của mình. Chuyên gia tư vấn tâm lý không chẩn đoán bệnh, không kê đơn thuốc và không điều trị.',
      'Giữ bí mật thông tin của Khách hàng theo đạo đức nghề nghiệp và pháp luật.',
      'Khuyến nghị Khách hàng đến cơ sở khám bệnh, chữa bệnh hoặc chuyển tuyến kịp thời khi vấn đề vượt quá phạm vi của mình hoặc khi có dấu hiệu nguy hiểm.',
      'Bồi thường thiệt hại do lỗi chuyên môn của mình gây ra theo quy định pháp luật.'
    ]
  },
  {
    n: 5,
    title: 'Công cụ sàng lọc và trợ lý AI PeaceCat',
    items: [
      'Kết quả các bộ công cụ sàng lọc (DASS-21, GAD-7, PHQ-9…) và các phản hồi, gợi ý của PeaceCat chỉ có giá trị tham khảo, giúp Khách hàng tự theo dõi. Chúng không phải chẩn đoán y khoa và không thay thế đánh giá của Người hành nghề.',
      'Khi Khách hàng trò chuyện với PeaceCat, Nền tảng luôn thông báo rõ rằng Khách hàng đang tương tác với hệ thống trí tuệ nhân tạo, không phải con người.',
      {
        text: 'PeaceFlow chịu trách nhiệm:',
        sub: [
          'a) Thiết kế, kiểm thử và giám sát PeaceCat nhằm hạn chế phản hồi sai lệch, gây hại;',
          'b) Duy trì cơ chế giám sát và can thiệp của con người đối với các tình huống được PeaceCat đánh giá có rủi ro;',
          'c) Thực hiện các nghĩa vụ của nhà cung cấp, bên triển khai hệ thống trí tuệ nhân tạo theo pháp luật về trí tuệ nhân tạo.'
        ]
      },
      'Khách hàng không nên dựa duy nhất vào kết quả sàng lọc hoặc PeaceCat để đưa ra quyết định quan trọng về sức khỏe của mình.'
    ]
  },
  {
    n: 6,
    title: 'Tình huống khẩn cấp',
    items: [
      'PeaceFlow không phải dịch vụ cấp cứu và không thay thế cấp cứu y tế.',
      `Nếu Khách hàng có ý định tự gây hại, gây hại cho người khác hoặc đang gặp nguy hiểm, Khách hàng cần gọi ngay Cấp cứu 115, đến cơ sở y tế gần nhất, hoặc liên hệ đường dây hỗ trợ sử dụng dịch vụ ${HOTLINE}.`,
      'Module Khẩn cấp là công cụ hỗ trợ: hiển thị thông tin liên hệ khẩn cấp, gợi ý hành động an toàn. PeaceFlow vận hành Module này một cách hợp lý, nhưng hiệu quả của Module phụ thuộc vào kết nối mạng, thiết bị và thông tin Khách hàng cung cấp.',
      'Việc liên hệ người thân hoặc người liên hệ khẩn cấp chỉ thực hiện khi Khách hàng đã đồng ý trước, trừ trường hợp khẩn cấp đe dọa tính mạng, sức khỏe mà pháp luật cho phép xử lý dữ liệu không cần sự đồng ý.'
    ]
  },
  {
    n: 7,
    title: 'Dữ liệu sức khỏe và việc chia sẻ với Chuyên gia',
    items: [
      'PeaceFlow chỉ thu thập, xử lý Dữ liệu sức khỏe khi có sự đồng ý riêng, rõ ràng của Khách hàng, tách biệt với việc đồng ý Điều khoản sử dụng.',
      'Việc đồng ý xử lý dữ liệu không phải là điều kiện bắt buộc để sử dụng các tính năng không cần đến dữ liệu đó.',
      'Biểu đồ diễn biến tâm lý, kết quả sàng lọc, nội dung check-in chỉ được chia sẻ cho Chuyên gia cụ thể khi Khách hàng chủ động bật tính năng chia sẻ cho Chuyên gia đó. Khách hàng có thể tắt chia sẻ bất cứ lúc nào.',
      'Nhật ký cá nhân được mã hóa và không chia sẻ cho Chuyên gia hay bên thứ ba, trừ khi Khách hàng tự chọn chia sẻ.',
      'PeaceFlow không bán Dữ liệu sức khỏe và không cung cấp cho đơn vị bảo hiểm, nhà tuyển dụng hay bên quảng cáo.',
      'Chi tiết về mục đích, thời gian lưu trữ, nơi lưu trữ, quyền của chủ thể dữ liệu và cách thực hiện quyền được quy định trong Chính sách bảo vệ dữ liệu cá nhân tại PeaceFlow.vn.'
    ]
  },
  {
    n: 8,
    title: 'Trách nhiệm của Khách hàng',
    items: [
      'Cung cấp thông tin trung thực, chính xác khi đăng ký và khi sử dụng Dịch vụ chuyên môn.',
      'Đủ 18 tuổi trở lên. Người dưới 18 tuổi chỉ được sử dụng khi có sự đồng ý và giám sát của cha, mẹ hoặc người giám hộ theo quy định pháp luật.',
      'Giữ bảo mật tài khoản; không ghi âm, ghi hình, phát tán nội dung buổi tư vấn khi chưa có sự đồng ý của Chuyên gia.',
      'Không sử dụng Nền tảng cho mục đích vi phạm pháp luật, quấy rối hoặc xúc phạm Chuyên gia.'
    ]
  },
  {
    n: 9,
    title: 'Phạm vi trách nhiệm',
    items: [
      {
        text: 'PeaceFlow chịu trách nhiệm đối với thiệt hại phát sinh từ lỗi của chính PeaceFlow, bao gồm nhưng không giới hạn:',
        sub: [
          'a) Không xác minh hoặc xác minh sai thông tin, giấy phép của Chuyên gia;',
          'b) Biết hoặc đã nhận phản ánh về vi phạm của Chuyên gia nhưng không xử lý kịp thời;',
          'c) Lỗi kỹ thuật của hệ thống, của Tính năng của Nền tảng hoặc của PeaceCat;',
          'd) Vi phạm quy định về bảo vệ dữ liệu cá nhân;',
          'đ) Thông tin, quảng cáo do PeaceFlow đăng tải không chính xác.'
        ]
      },
      'Chuyên gia chịu trách nhiệm đối với thiệt hại phát sinh từ nội dung, quyết định chuyên môn và hành vi của mình trong Dịch vụ chuyên môn. Khi Khách hàng khiếu nại về Chuyên gia, PeaceFlow có trách nhiệm tiếp nhận, cung cấp thông tin Chuyên gia, hỗ trợ Khách hàng giải quyết và áp dụng biện pháp xử lý đối với Chuyên gia theo Quy chế.',
      'Trường hợp thiệt hại do lỗi của cả PeaceFlow và Chuyên gia, mỗi bên chịu trách nhiệm tương ứng với mức độ lỗi của mình theo quy định pháp luật.',
      'Không bên nào phải chịu trách nhiệm đối với thiệt hại do sự kiện bất khả kháng hoặc hoàn toàn do lỗi của Khách hàng (ví dụ: cung cấp thông tin sai sự thật, tự ý sử dụng kết quả sàng lọc thay cho chẩn đoán).',
      'Điều khoản này không hạn chế, loại trừ trách nhiệm của PeaceFlow hay Chuyên gia mà pháp luật quy định, và không hạn chế quyền khiếu nại, khởi kiện của Khách hàng. Trường hợp có nội dung nào trái với pháp luật về bảo vệ quyền lợi người tiêu dùng, nội dung đó không được áp dụng; các nội dung còn lại vẫn giữ hiệu lực.'
    ]
  },
  {
    n: 10,
    title: 'Khiếu nại và giải quyết tranh chấp',
    items: [
      'Đầu mối tiếp nhận khiếu nại: tại trang chủ của PeaceFlow.vn.',
      'PeaceFlow xác nhận đã nhận khiếu nại trong vòng 24 giờ và phản hồi kết quả xử lý trong vòng 07 ngày làm việc, trừ trường hợp phức tạp sẽ thông báo thời hạn cụ thể.',
      'Tranh chấp được ưu tiên giải quyết bằng thương lượng. Nếu không thành, Khách hàng có quyền lựa chọn hòa giải, đề nghị cơ quan quản lý nhà nước về bảo vệ quyền lợi người tiêu dùng hỗ trợ, hoặc khởi kiện tại Tòa án có thẩm quyền theo quy định pháp luật.'
    ]
  },
  {
    n: 11,
    title: 'Hoàn tiền',
    items: [
      'Khách hàng được hoàn 100% phí khi: Chuyên gia hủy lịch, không tham gia, hoặc buổi tư vấn không thực hiện được do lỗi của Nền tảng.',
      'Khách hàng hủy lịch trước 24 giờ được hoàn 100%; sau thời hạn này áp dụng theo Chính sách hủy lịch công khai tại PeaceFlow.vn.',
      'Khi khiếu nại về chất lượng Dịch vụ chuyên môn được xác định là có cơ sở, PeaceFlow phối hợp với Chuyên gia hoàn tiền theo kết quả giải quyết.'
    ]
  },
  {
    n: 12,
    title: 'Sửa đổi điều khoản',
    items: [
      'PeaceFlow thông báo cho Khách hàng ít nhất 15 ngày trước khi áp dụng nội dung sửa đổi, qua email và thông báo trong ứng dụng.',
      'Nếu không đồng ý với nội dung sửa đổi, Khách hàng có quyền chấm dứt sử dụng dịch vụ, được hoàn phí cho phần dịch vụ đã thanh toán nhưng chưa sử dụng, và được yêu cầu xóa hoặc xuất dữ liệu của mình.',
      'Các sửa đổi không áp dụng hồi tố đối với các buổi tư vấn đã đặt lịch trước ngày sửa đổi có hiệu lực.'
    ]
  }
];

// Đường dẫn tới một điều cụ thể, vd. termsLink(7) → /dieu-khoan#dieu-7
export const termsLink = (n) => (n ? `${TERMS_PATH}#dieu-${n}` : TERMS_PATH);
