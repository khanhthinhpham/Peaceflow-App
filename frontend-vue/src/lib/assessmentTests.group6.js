// Nhóm 6 — trích xuất từ Quy trình kỹ thuật chuyên ngành Tâm thần (Bộ Y tế):
// 35. TRẮC NGHIỆM NHÂN CÁCH EYSENCK (EPI) và 44. TRẮC NGHIỆM RỐI LOẠN TĂNG ĐỘNG
// GIẢM CHÚ Ý VANDERBILT (VADRS - phiên bản dành cho cha mẹ).
//
// LƯU Ý QUAN TRỌNG VỀ CHẤM ĐIỂM (xem chi tiết đầy đủ trong group6_meta.md):
// - EPI: chỉ tiểu thang "neuroticism" (24 câu, cột N/KOD trong bảng khóa nguồn — TẤT
//   CẢ đều chấm điểm khi trả lời "Có") vừa khớp với khuôn dạng chấm điểm chuẩn của
//   engine (tổng điểm theo indices dùng chung 1 bộ likertOptions). Hai tiểu thang còn
//   lại — "E" (Hướng ngoại, 24 câu) và "S" (Độ tin cậy, 9 câu) — có chấm điểm ĐẢO
//   CHIỀU theo từng câu (một số câu tính điểm khi trả lời "Có", số khác tính điểm khi
//   trả lời "Không", theo đúng "bảng khóa" gốc). Engine hiện tại (chỉ nhân multiplier
//   đơn, không đảo dấu theo từng câu) KHÔNG thể hiện đúng cách chấm này, nên phần
//   scoring cho "extraversion" và "lie" bị BỎ QUA ở đây — xem bảng khóa đầy đủ + thuật
//   toán trong group6_meta.md để lập trình viên tự bổ sung logic tùy biến.
// - Vanderbilt: theo đúng hướng dẫn nguồn, cả 5 lĩnh vực đều được sàng lọc bằng cách
//   ĐẾM SỐ CÂU đạt điểm 2-3 trên một NGƯỠNG SỐ LƯỢNG (ví dụ 6/9, 4/8, 3/14, 3/7),
//   KHÔNG PHẢI cộng tổng điểm rồi so ngưỡng như các thang đo khác. Khuôn dạng
//   `scoring.levels` (dải theo tổng điểm) không biểu diễn được thuật toán đếm-ngưỡng
//   này, nên toàn bộ `scoring` bị BỎ TRỐNG — xem thuật toán đầy đủ bằng lời trong
//   group6_meta.md.

export const TESTS = {
    epi: {
        name: 'EPI', fullname: 'Trắc nghiệm Nhân cách Eysenck (Eysenck Personality Inventory)',
        icon: '🎭', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Nhìn chung, về bản thân bạn', totalQ: 57, maxScore: 24,
        subscales: ['neuroticism'],
        questions: [
            { text: 'Bạn thường mong muốn những điều mới lạ, gây hồi hộp.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cần những người bạn có thể hiểu, động viên, an ủi mình.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn là người vô tư, không bận tâm đến điều gì.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cảm thấy khó khăn trong việc từ chối một điều gì đó.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn có suy nghĩ kỹ trước khi quyết định một việc gì đó.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn luôn giữ lời hứa bất kể điều đó có thuận lợi hay không đối với bạn.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Tâm trạng của bạn thường hay thất thường.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường hành động hay phát ngôn rất nhanh không cần suy nghĩ.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường cảm thấy mình bất hạnh mà không rõ nguyên nhân.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường bảo vệ đến cùng ý kiến của mình trong các cuộc tranh luận.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường cảm thấy rụt rè, ngượng ngùng khi nói chuyện với người khác giới không quen.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Đôi lúc bạn không kiềm chế được và nổi nóng.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Bạn thường hành động một cách bồng bột.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường day dứt vì đã làm một việc lẽ ra không nên làm.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường thích đọc sách hơn là gặp gỡ mọi người.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn dễ tự ái, phật lòng.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích nhập hội với bạn bè.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Đôi lúc bạn có ý nghĩ mà ban đầu không muốn cho người khác biết.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Đôi khi bạn cảm thấy mình đầy nghị lực, nhiệt tình làm mọi việc nhưng có lúc lại hoàn toàn uể oải.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích thà ít bạn nhưng thân còn hơn.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn hay mơ mộng.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn phản ứng lại ngay khi người ta nói nặng lời với bạn.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường day dứt khi mình có lỗi.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Tất cả những thói quen của bạn đều là tốt và cần thiết.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Bạn có khả năng truyền cảm hứng và gây cười trong nhóm bạn bè.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn là một người nhạy cảm.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn là một người hoạt bát, vui vẻ.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Sau khi làm một việc quan trọng, bạn thường có cảm giác rằng lẽ ra có thể làm việc đó tốt hơn.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường im lặng ở chốn có người lạ.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cũng có lúc đồn chuyện, phao tin.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Bạn thường mất ngủ vì những ý nghĩ khác nhau trong đầu.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Nếu muốn biết điều gì đó bạn thường thích tự tìm hiểu hơn là hỏi người khác.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường hay hồi hộp.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích công việc đòi hỏi phải tập trung chú ý liên tục.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Cũng có lúc bạn run lên vì vui sướng hay sợ hãi.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn luôn trả cước phí giao thông đầy đủ mặc dù không bị kiểm soát.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Bạn cảm thấy khó chịu khi ở nơi mà người ta hay châm chọc nhau.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn dễ nổi giận.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích công việc đòi hỏi hành động nhanh chóng.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thấy hồi hộp khi cảm thấy những việc bất lợi có thể xảy ra.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn đi đứng ung dung, chậm rãi.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Đã có lúc bạn đến nơi hẹn hoặc đi làm muộn.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Bạn thường có ác mộng.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích trò chuyện đến nỗi không bao giờ bỏ qua cơ hội bắt chuyện với cả những người không quen biết.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn hay lo lắng vì có chỗ đau nào đó trên cơ thể.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn cảm thấy khổ sở khi lâu không được giao thiệp rộng rãi với mọi người.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn là người dễ cáu kỉnh.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Trong số những người quen có những người bạn không thích.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Bạn là người rất tự tin.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn dễ phật ý khi có người chỉ ra các khuyết điểm của bạn.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn nghĩ rằng khó có thể thực sự thoải mái ở các cuộc liên hoan.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cảm thấy không yên tâm khi thua kém bạn bè ở điểm nào đó.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn dễ dàng mang lại sự vui vẻ cho một cuộc họp mặt khá tẻ nhạt.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường hay nói về những vấn đề mà mình chưa nắm chắc.', cat: 's', catLabel: 'Độ tin cậy' },
            { text: 'Bạn lo lắng về sức khỏe của mình.', cat: 'n', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích trêu đùa người khác.', cat: 'e', catLabel: 'Hướng ngoại' },
            { text: 'Bạn bị mất ngủ.', cat: 'n', catLabel: 'Tính thần kinh' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Có', score: 1 },
            { emoji: '❌', label: 'Không', score: 0 }
        ],
        // Chỉ tiểu thang "neuroticism" (tính thần kinh — 24 câu, cột N/KOD trong bảng khóa
        // nguồn) là chấm điểm 1-chiều (tất cả 24 câu đều tính 1 điểm khi trả lời "Có"),
        // nên vừa khớp khuôn dạng indices/multiplier chuẩn. "extraversion" (E, 24 câu) và
        // "lie" (S, 9 câu) có chấm điểm đảo chiều theo từng câu — KHÔNG đưa vào đây, xem
        // group6_meta.md để biết bảng khóa đầy đủ và cách lập trình bổ sung.
        scoring: {
            neuroticism: {
                indices: [1, 3, 6, 8, 10, 13, 15, 18, 20, 22, 25, 27, 30, 32, 34, 37, 39, 42, 44, 46, 49, 51, 54, 56],
                multiplier: 1,
                levels: [
                    { max: 7, 'label': 'Ổn định (thấp)', 'class': 'level-0' },
                    { max: 16, 'label': 'Trung bình', 'class': 'level-1' },
                    { max: 999, 'label': 'Không ổn định (cao)', 'class': 'level-2' }
                ]
            }
        },
        prevScores: null
    },
    vanderbilt: {
        name: 'Vanderbilt', fullname: 'Thang Đánh giá Rối loạn Tăng động Giảm chú ý Vanderbilt (dành cho cha mẹ)',
        icon: '⚡', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: '6 tháng qua', totalQ: 47, maxScore: 141,
        subscales: ['inattention', 'hyperactivity', 'oppositional', 'conduct', 'anxiety_depression'],
        questions: [
            { text: 'Không tập trung chú ý vào chi tiết hoặc gây ra lỗi do cẩu thả, ví dụ như khi làm bài tập về nhà', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Gặp khó khăn trong việc chú ý vào những việc cần phải làm', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Có vẻ như không lắng nghe khi người khác đang nói trực tiếp với mình', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Không làm theo hướng dẫn và không hoàn thành nhiệm vụ hay bài tập', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Gặp khó khăn trong việc sắp xếp hay tổ chức nhiệm vụ và hoạt động', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Né tránh, không thích hoặc không muốn bắt đầu hay thực hiện các nhiệm vụ hay bài tập đòi hỏi nỗ lực trí tuệ liên tục', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Mất những vật dụng cần cho nhiệm vụ hay hoạt động (bài tập, bút, sách vở)', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Dễ bị sao nhãng bởi âm thanh hoặc những thứ khác', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Hay quên trong các hoạt động hàng ngày', cat: 'inattention', catLabel: 'Giảm chú ý' },
            { text: 'Cựa quậy chân tay hoặc vặn vẹo người khi ngồi', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Rời khỏi chỗ ngồi ở những tình huống cần ngồi yên tại chỗ', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Chạy loanh quanh hoặc leo trèo quá mức trong những tình huống cần phải ngồi yên tại chỗ', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Gặp khó khăn trong việc chơi và bắt đầu chơi các trò chơi đòi hỏi sự yên tĩnh', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Luôn chân luôn tay hoặc hành động như thể "được gắn động cơ"', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Nói quá nhiều', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Buột miệng trả lời khi người hỏi chưa hỏi xong', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Gặp khó khăn trong việc chờ đợi đến lượt mình', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Ngắt quãng hay chen ngang vào khi người khác đang nói chuyện hay chơi trò chơi', cat: 'hyperactivity', catLabel: 'Tăng hoạt động/Xung động' },
            { text: 'Cãi nhau với người lớn', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Tức giận đến mức độ mất kiểm soát', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Chủ động không tuân theo hoặc từ chối làm theo yêu cầu hay quy định của người lớn', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Chủ định quấy rầy người khác', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Đổ tội cho người khác vì lỗi của chính mình', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Tự ái và dễ bực mình bởi người khác', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Tức giận hoặc chua cay', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Hằn học và trả thù', cat: 'oppositional', catLabel: 'Thách thức chống đối' },
            { text: 'Bắt nạt, đe dọa hoặc làm người khác sợ', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Khởi đầu việc đánh nhau', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Nói dối để né tránh rắc rối hoặc tránh nhiệm vụ (ví dụ lừa dối người khác)', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Nghỉ hoặc trốn học mà không có sự cho phép', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đánh, đá hoặc làm thương người khác', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Ăn trộm những thứ có giá trị', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Phá hoại đồ đạc người khác một cách chủ ý', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đã từng sử dụng vũ khí có thể gây hại nghiêm trọng (như gậy, dao, gạch đá, súng)', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đánh, đá hoặc làm thương động vật', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đã đốt lửa để phá hoại một cách có chủ ý', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đã từng đột nhập vào nhà, văn phòng hay xe ôtô của ai đó', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đã từng qua đêm bên ngoài mà không có sự cho phép', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đã từng bỏ nhà đi qua đêm', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Đã từng cưỡng ép ai đó thực hiện hành vi tình dục', cat: 'conduct', catLabel: 'Hành vi ứng xử' },
            { text: 'Sợ hãi, bồn chồn, hoặc lo lắng', cat: 'anxiety_depression', catLabel: 'Lo âu/Trầm cảm' },
            { text: 'Sợ thử những điều mới vì sợ mắc lỗi', cat: 'anxiety_depression', catLabel: 'Lo âu/Trầm cảm' },
            { text: 'Cảm thấy vô dụng hoặc thấp kém', cat: 'anxiety_depression', catLabel: 'Lo âu/Trầm cảm' },
            { text: 'Tự trách bản thân, cảm thấy có tội', cat: 'anxiety_depression', catLabel: 'Lo âu/Trầm cảm' },
            { text: 'Cảm thấy cô đơn, vô ích, không được yêu thương; phàn nàn rằng "không có ai yêu con"', cat: 'anxiety_depression', catLabel: 'Lo âu/Trầm cảm' },
            { text: 'Buồn rầu, sầu não, hoặc trầm cảm', cat: 'anxiety_depression', catLabel: 'Lo âu/Trầm cảm' },
            { text: 'E dè và dễ ngượng ngùng', cat: 'anxiety_depression', catLabel: 'Lo âu/Trầm cảm' }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Không bao giờ', score: 0 },
            { emoji: '😐', label: 'Đôi khi', score: 1 },
            { emoji: '😟', label: 'Thường xuyên', score: 2 },
            { emoji: '😣', label: 'Rất thường xuyên', score: 3 }
        ],
        // BỎ TRỐNG có chủ đích: cả 5 lĩnh vực đều chấm điểm bằng cách ĐẾM số câu đạt điểm
        // 2 ("Thường xuyên") hoặc 3 ("Rất thường xuyên") rồi so với một NGƯỠNG SỐ LƯỢNG
        // (6/9, 6/9, 4/8, 3/14, 3/7) — không phải cộng tổng điểm rồi so dải như
        // `scoring.levels` chuẩn của engine. Xem thuật toán đầy đủ trong group6_meta.md.
        scoring: {},
        prevScores: null
    }
};


