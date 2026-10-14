// Nhóm 6 — trích xuất từ Quy trình kỹ thuật chuyên ngành Tâm thần (Bộ Y tế):
// 35. TRẮC NGHIỆM NHÂN CÁCH EYSENCK (EPI) và 44. TRẮC NGHIỆM RỐI LOẠN TĂNG ĐỘNG
// GIẢM CHÚ Ý VANDERBILT (VADRS - phiên bản dành cho cha mẹ).
//
// GHI CHÚ VỀ CÁCH CHẤM ĐIỂM (đối chiếu trực tiếp bảng khóa/bảng ngưỡng gốc trong docx):
// - EPI: "extraversion" (E, 24 câu) và "lie" (S, 9 câu) chấm điểm ĐẢO CHIỀU theo từng
//   câu (bảng khóa gốc: 1 số câu tính điểm khi trả lời "Có", số khác tính điểm khi trả
//   lời "Không") — khác "neuroticism" (toàn bộ 24 câu đều tính điểm khi "Có"). Dùng
//   `custom: 'epi_keyed'` + `trueIndices`/`falseIndices` (xem computeKeyedScore() ở
//   MoodAssessmentView.vue) để tính đúng, thay vì khuôn `indices`/`multiplier` chung.
//   Ngưỡng "Trung bình" của Hướng ngoại (7-15đ) và độ tin cậy Lie-scale (≤4 câu trùng
//   khóa = đáng tin cậy) lấy nguyên văn từ mục "Đánh giá"/"Kết quả" của quy trình gốc.
// - Vanderbilt: cả 5 lĩnh vực được sàng lọc bằng cách ĐẾM SỐ CÂU đạt điểm 2 ("Thường
//   xuyên") hoặc 3 ("Rất thường xuyên") rồi so với NGƯỠNG SỐ LƯỢNG ghi trong bảng
//   "VANDERBILT | Điểm đánh giá" của quy trình gốc (Giảm chú ý 6/9, Tăng hoạt động
//   6/9, Thách thức chống đối 4/8, Hành vi ứng xử 3/14, Lo âu/trầm cảm 3/7) — KHÔNG
//   PHẢI cộng tổng điểm rồi so dải như các thang khác. Dùng `custom: 'count_threshold'`
//   (xem computeCountThresholdScore() ở MoodAssessmentView.vue).

export const TESTS = {
    epi: {
        name: 'EPI', fullname: 'Trắc nghiệm Nhân cách Eysenck (Eysenck Personality Inventory)',
        icon: '🎭', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Nhìn chung, về bản thân bạn', totalQ: 57, maxScore: 24,
        subscales: ['neuroticism', 'extraversion', 'lie'],
        questions: [
            { text: 'Bạn thường mong muốn những điều mới lạ, gây hồi hộp.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cần những người bạn có thể hiểu, động viên, an ủi mình.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn là người vô tư, không bận tâm đến điều gì.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cảm thấy khó khăn trong việc từ chối một điều gì đó.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn có suy nghĩ kỹ trước khi quyết định một việc gì đó.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn luôn giữ lời hứa bất kể điều đó có thuận lợi hay không đối với bạn.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Tâm trạng của bạn thường hay thất thường.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường hành động hay phát ngôn rất nhanh không cần suy nghĩ.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường cảm thấy mình bất hạnh mà không rõ nguyên nhân.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường bảo vệ đến cùng ý kiến của mình trong các cuộc tranh luận.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường cảm thấy rụt rè, ngượng ngùng khi nói chuyện với người khác giới không quen.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Đôi lúc bạn không kiềm chế được và nổi nóng.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Bạn thường hành động một cách bồng bột.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường day dứt vì đã làm một việc lẽ ra không nên làm.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường thích đọc sách hơn là gặp gỡ mọi người.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn dễ tự ái, phật lòng.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích nhập hội với bạn bè.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Đôi lúc bạn có ý nghĩ mà ban đầu không muốn cho người khác biết.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Đôi khi bạn cảm thấy mình đầy nghị lực, nhiệt tình làm mọi việc nhưng có lúc lại hoàn toàn uể oải.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích thà ít bạn nhưng thân còn hơn.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn hay mơ mộng.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn phản ứng lại ngay khi người ta nói nặng lời với bạn.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường day dứt khi mình có lỗi.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Tất cả những thói quen của bạn đều là tốt và cần thiết.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Bạn có khả năng truyền cảm hứng và gây cười trong nhóm bạn bè.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn là một người nhạy cảm.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn là một người hoạt bát, vui vẻ.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Sau khi làm một việc quan trọng, bạn thường có cảm giác rằng lẽ ra có thể làm việc đó tốt hơn.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thường im lặng ở chốn có người lạ.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cũng có lúc đồn chuyện, phao tin.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Bạn thường mất ngủ vì những ý nghĩ khác nhau trong đầu.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Nếu muốn biết điều gì đó bạn thường thích tự tìm hiểu hơn là hỏi người khác.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường hay hồi hộp.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích công việc đòi hỏi phải tập trung chú ý liên tục.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Cũng có lúc bạn run lên vì vui sướng hay sợ hãi.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn luôn trả cước phí giao thông đầy đủ mặc dù không bị kiểm soát.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Bạn cảm thấy khó chịu khi ở nơi mà người ta hay châm chọc nhau.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn dễ nổi giận.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích công việc đòi hỏi hành động nhanh chóng.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thấy hồi hộp khi cảm thấy những việc bất lợi có thể xảy ra.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn đi đứng ung dung, chậm rãi.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Đã có lúc bạn đến nơi hẹn hoặc đi làm muộn.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Bạn thường có ác mộng.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích trò chuyện đến nỗi không bao giờ bỏ qua cơ hội bắt chuyện với cả những người không quen biết.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn hay lo lắng vì có chỗ đau nào đó trên cơ thể.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn cảm thấy khổ sở khi lâu không được giao thiệp rộng rãi với mọi người.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn là người dễ cáu kỉnh.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Trong số những người quen có những người bạn không thích.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Bạn là người rất tự tin.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn dễ phật ý khi có người chỉ ra các khuyết điểm của bạn.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn nghĩ rằng khó có thể thực sự thoải mái ở các cuộc liên hoan.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn cảm thấy không yên tâm khi thua kém bạn bè ở điểm nào đó.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn dễ dàng mang lại sự vui vẻ cho một cuộc họp mặt khá tẻ nhạt.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn thường hay nói về những vấn đề mà mình chưa nắm chắc.', cat: 'lie', catLabel: 'Độ tin cậy' },
            { text: 'Bạn lo lắng về sức khỏe của mình.', cat: 'neuroticism', catLabel: 'Tính thần kinh' },
            { text: 'Bạn thích trêu đùa người khác.', cat: 'extraversion', catLabel: 'Hướng ngoại' },
            { text: 'Bạn bị mất ngủ.', cat: 'neuroticism', catLabel: 'Tính thần kinh' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Có', score: 1 },
            { emoji: '❌', label: 'Không', score: 0 }
        ],
        scoring: {
            neuroticism: {
                indices: [1, 3, 6, 8, 10, 13, 15, 18, 20, 22, 25, 27, 30, 32, 34, 37, 39, 42, 44, 46, 49, 51, 54, 56],
                multiplier: 1,
                levels: [
                    { max: 7, 'label': 'Ổn định (thấp)', 'class': 'level-0' },
                    { max: 16, 'label': 'Trung bình', 'class': 'level-1' },
                    { max: 999, 'label': 'Không ổn định (cao)', 'class': 'level-2' }
                ]
            },
            // Khóa "E" (Hướng nội-hướng ngoại): câu tính điểm khi "Có" — 1,3,8,10,13,17,22,
            // 25,27,39,44,46,49,53,56 (gốc) → câu tính điểm khi "Không" — 5,15,20,29,32,34,
            // 37,41,51 (gốc). Ngưỡng "trung bình" 7-15đ lấy nguyên văn mục Đánh giá gốc.
            extraversion: {
                custom: 'epi_keyed',
                trueIndices: [0, 2, 7, 9, 12, 16, 21, 24, 26, 38, 43, 45, 48, 52, 55],
                falseIndices: [4, 14, 19, 28, 31, 33, 36, 40, 50],
                levels: [
                    { max: 6, 'label': 'Hướng nội', 'class': 'level-1' },
                    { max: 15, 'label': 'Trung bình', 'class': 'level-0' },
                    { max: 999, 'label': 'Hướng ngoại', 'class': 'level-1' }
                ]
            },
            // Khóa "S" (Độ tin cậy): câu tính điểm khi "Có" — 6,24,36 (gốc) → câu tính điểm
            // khi "Không" — 12,18,30,42,48,54 (gốc). Quy ước gốc: "Số câu trả lời trùng với
            // S từ 4 trở xuống là kết quả đáng tin cậy".
            lie: {
                custom: 'epi_keyed',
                trueIndices: [5, 23, 35],
                falseIndices: [11, 17, 29, 41, 47, 53],
                levels: [
                    { max: 4, 'label': 'Đáng tin cậy', 'class': 'level-0' },
                    { max: 999, 'label': 'Không đáng tin cậy — có thể đã trả lời thiếu trung thực, nên làm lại', 'class': 'level-2' }
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
        scoring: {
            inattention: {
                custom: 'count_threshold', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8], countThreshold: 6,
                levels: [{ max: 5, 'label': 'Không có dấu hiệu rối loạn', 'class': 'level-0' }, { max: 999, 'label': "Có dấu hiệu rối loạn (≥6/9 câu ở mức 'Thường xuyên' trở lên)", 'class': 'level-3' }]
            },
            hyperactivity: {
                custom: 'count_threshold', indices: [9, 10, 11, 12, 13, 14, 15, 16, 17], countThreshold: 6,
                levels: [{ max: 5, 'label': 'Không có dấu hiệu rối loạn', 'class': 'level-0' }, { max: 999, 'label': "Có dấu hiệu rối loạn (≥6/9 câu ở mức 'Thường xuyên' trở lên)", 'class': 'level-3' }]
            },
            oppositional: {
                custom: 'count_threshold', indices: [18, 19, 20, 21, 22, 23, 24, 25], countThreshold: 4,
                levels: [{ max: 3, 'label': 'Không có dấu hiệu rối loạn', 'class': 'level-0' }, { max: 999, 'label': "Có dấu hiệu rối loạn (≥4/8 câu ở mức 'Thường xuyên' trở lên)", 'class': 'level-3' }]
            },
            conduct: {
                custom: 'count_threshold', indices: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39], countThreshold: 3,
                levels: [{ max: 2, 'label': 'Không có dấu hiệu rối loạn', 'class': 'level-0' }, { max: 999, 'label': "Có dấu hiệu rối loạn (≥3/14 câu ở mức 'Thường xuyên' trở lên)", 'class': 'level-3' }]
            },
            anxiety_depression: {
                custom: 'count_threshold', indices: [40, 41, 42, 43, 44, 45, 46], countThreshold: 3,
                levels: [{ max: 2, 'label': 'Không có dấu hiệu rối loạn', 'class': 'level-0' }, { max: 999, 'label': "Có dấu hiệu rối loạn (≥3/7 câu ở mức 'Thường xuyên' trở lên)", 'class': 'level-3' }]
            }
        },
        prevScores: null
    }
};


