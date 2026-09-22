// 4 bài test mới — trích xuất từ tài liệu Quy trình kỹ thuật chuyên ngành Tâm thần (Bộ Y tế)
// HDRS (Hamilton Depression Rating Scale), CDI (Children's Depression Inventory),
// GDS (Geriatric Depression Scale), EPDS (Edinburgh Postnatal Depression Scale)
// Đây là object thuần — dùng để spread/merge vào TESTS trong assessmentTests.js

const GROUP1_TESTS_VI = {
    hdrs: {
        name: 'HDRS', fullname: 'Hamilton Depression Rating Scale',
        icon: '🌧️', iconBg: 'var(--coral-light)', iconBorder: 'var(--coral)',
        timeRef: '1 tuần qua', totalQ: 17, maxScore: 52,
        subscales: ['depression'],
        questions: [
            {
                text: 'Khí sắc trầm cảm', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có cảm giác khó chịu và dấu hiệu trầm cảm', score: 0 },
                    { emoji: '🟡', label: 'Có cảm giác buồn hoặc lo lắng nhất thời, chưa rõ nét', score: 1 },
                    { emoji: '🟠', label: 'Tỏ ra buồn, đau khổ, bi quan, thỉnh thoảng khóc, ý tưởng tự sát thoảng qua', score: 2 },
                    { emoji: '🔴', label: 'Có dấu hiệu cơ thể rõ, cảm giác tuyệt vọng, có ý tưởng tự sát', score: 3 },
                    { emoji: '🚨', label: 'Trầm cảm nặng, hoang tưởng liên quan đến cái chết, tự sát', score: 4 }
                ]
            },
            {
                text: 'Cảm giác tội lỗi', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có cảm giác tội lỗi', score: 0 },
                    { emoji: '🟡', label: 'Hối hận nhỏ về hành vi đã qua, tự buộc tội về chuyện lặt vặt', score: 1 },
                    { emoji: '🟠', label: 'Cảm giác tội lỗi, nghiền ngẫm, tự quở trách về sai lầm', score: 2 },
                    { emoji: '🔴', label: 'Tin bị bệnh là do bị trừng phạt; hoang tưởng bị buộc tội', score: 3 },
                    { emoji: '🚨', label: 'Có ảo thanh buộc tội/tố giác hoặc ảo thị đe dọa', score: 4 }
                ]
            },
            {
                text: 'Ý tưởng tự sát', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có', score: 0 },
                    { emoji: '🟡', label: 'Chán sống, ý tưởng tự sát thoáng qua', score: 1 },
                    { emoji: '🟠', label: 'Có ý tưởng tự sát, coi tự sát là một giải pháp tốt', score: 2 },
                    { emoji: '🔴', label: 'Có ý tưởng tự sát rõ rệt, đã có dự định tự sát', score: 3 },
                    { emoji: '🚨', label: 'Có kế hoạch và tích cực chuẩn bị hoặc đã có mưu toan tự sát nghiêm trọng', score: 4 }
                ]
            },
            {
                text: 'Mất ngủ đầu giấc (khó đi vào giấc ngủ)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có vấn đề gì', score: 0 },
                    { emoji: '🟡', label: 'Có rối loạn nhẹ, không thường xuyên', score: 1 },
                    { emoji: '🔴', label: 'Có rối loạn rõ rệt', score: 2 }
                ]
            },
            {
                text: 'Mất ngủ giữa giấc (trằn trọc, hay thức dậy)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có vấn đề gì', score: 0 },
                    { emoji: '🟡', label: 'Có rối loạn nhẹ, không thường xuyên', score: 1 },
                    { emoji: '🔴', label: 'Có rối loạn rõ rệt', score: 2 }
                ]
            },
            {
                text: 'Mất ngủ cuối giấc (tỉnh dậy quá sớm, không ngủ lại được)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có vấn đề gì', score: 0 },
                    { emoji: '🟡', label: 'Có rối loạn nhẹ, không thường xuyên', score: 1 },
                    { emoji: '🔴', label: 'Có rối loạn rõ rệt', score: 2 }
                ]
            },
            {
                text: 'Công việc và hoạt động', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Hoạt động bình thường', score: 0 },
                    { emoji: '🟡', label: 'Kém nhiệt tình, dè dặt, thụ động, dễ chán nản', score: 1 },
                    { emoji: '🟠', label: 'Cảm thấy công việc là gánh nặng, lơ là chăm sóc bản thân', score: 2 },
                    { emoji: '🔴', label: 'Phải gắng sức trong mọi việc, hủy bỏ nhiều dự định, chăm sóc bản thân kém', score: 3 },
                    { emoji: '🚨', label: 'Không có khả năng làm việc, lú lẫn trong chăm sóc bản thân', score: 4 }
                ]
            },
            {
                text: 'Chậm chạp (tâm lý - vận động)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không phàn nàn về tập trung chú ý, hiệu suất bình thường', score: 0 },
                    { emoji: '🟡', label: 'Giảm thiểu tâm lý - vận động nhẹ, đôi lúc chậm chạp', score: 1 },
                    { emoji: '🟠', label: 'Giọng nói đều đều, trả lời chậm chạp, gần như ngồi im', score: 2 },
                    { emoji: '🔴', label: 'Cuộc phỏng vấn bị kéo dài, thường bỏ sót câu trả lời', score: 3 },
                    { emoji: '🚨', label: 'Không thể phỏng vấn được', score: 4 }
                ]
            },
            {
                text: 'Kích động', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có dấu hiệu kích động', score: 0 },
                    { emoji: '🟡', label: 'Đứng, ngồi không yên, tăng động khi phỏng vấn', score: 1 },
                    { emoji: '🟠', label: 'Tăng động rõ rệt, di chuyển chỗ ngồi, vặn tay hoặc quần áo', score: 2 },
                    { emoji: '🔴', label: 'Đứng bật dậy khi đang phỏng vấn', score: 3 },
                    { emoji: '🚨', label: 'Đi đi lại lại, rứt tóc/quần áo, nhặt đồ lặt vặt', score: 4 }
                ]
            },
            {
                text: 'Lo âu - triệu chứng tâm lý', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không phàn nàn gì', score: 0 },
                    { emoji: '🟡', label: 'Chỉ kể ra khi được hỏi, khó chịu/căng thẳng ở mức độ nhẹ', score: 1 },
                    { emoji: '🟠', label: 'Dễ kích thích, căng thẳng, không an tâm, kéo dài', score: 2 },
                    { emoji: '🔴', label: 'Luôn có cảm giác "bàng hoàng", "kinh hãi" hoặc có cơn lo âu', score: 3 },
                    { emoji: '🚨', label: 'Liên tục sợ hãi, hoảng sợ do chờ đợi sự mất mát, bị bỏ rơi, tàn phế', score: 4 }
                ]
            },
            {
                text: 'Lo âu - triệu chứng cơ thể', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không phàn nàn gì', score: 0 },
                    { emoji: '🟡', label: 'Triệu chứng nhẹ, ít gặp, không cản trở sinh hoạt', score: 1 },
                    { emoji: '🟠', label: 'Rối loạn cơ thể mức độ vừa, thường xuyên hơn', score: 2 },
                    { emoji: '🔴', label: 'Liên tục cảm thấy ốm do rối loạn giấc ngủ và công việc thường ngày', score: 3 },
                    { emoji: '🚨', label: 'Các triệu chứng gây bất lực', score: 4 }
                ]
            },
            {
                text: 'Triệu chứng cơ thể - dạ dày, ruột (ăn uống)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không phàn nàn gì', score: 0 },
                    { emoji: '🟡', label: 'Giảm ngon miệng, số lần đại tiện có thay đổi', score: 1 },
                    { emoji: '🔴', label: 'Mất ngon miệng, táo bón nặng', score: 2 }
                ]
            },
            {
                text: 'Triệu chứng cơ thể chung (nặng nề, đau, mỏi)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có triệu chứng', score: 0 },
                    { emoji: '🟡', label: 'Triệu chứng ở mức độ nhẹ và vừa, không gây bất lực', score: 1 },
                    { emoji: '🔴', label: 'Triệu chứng ở mức độ nặng, cản trở hoạt động hoặc gây bất lực', score: 2 }
                ]
            },
            {
                text: 'Triệu chứng sinh dục (hoạt động tình dục, kinh nguyệt)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có gì phàn nàn', score: 0 },
                    { emoji: '🟡', label: 'Giảm hứng thú, sự đáp ứng và tần số hoạt động tình dục giảm', score: 1 },
                    { emoji: '🔴', label: 'Hoàn toàn mất hứng thú, mất đáp ứng, thực sự chán ghét hoạt động tình dục', score: 2 }
                ]
            },
            {
                text: 'Nghi bệnh', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có gì phàn nàn', score: 0 },
                    { emoji: '🟡', label: 'Phàn nàn rối loạn ở mức độ nhẹ, quá lo lắng về sức khỏe cơ thể', score: 1 },
                    { emoji: '🟠', label: 'Bận tâm nhiều đến sức khỏe cơ thể, cho là mình có bệnh thực tổn', score: 2 },
                    { emoji: '🔴', label: 'Phàn nàn tập trung vào triệu chứng cơ thể, ám ảnh sợ bệnh nặng, tin chắc là mình bị bệnh thực tổn', score: 3 },
                    { emoji: '🚨', label: 'Hoang tưởng nội dung kỳ quái về cơ thể, lo âu, sợ hãi, tuyệt vọng rõ rệt', score: 4 }
                ]
            },
            {
                text: 'Sút cân', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Không có phàn nàn về sút cân', score: 0 },
                    { emoji: '🟡', label: 'Sút cân nhẹ hoặc có nghi ngờ sút cân', score: 1 },
                    { emoji: '🔴', label: 'Sút cân rõ rệt/trầm trọng (được đánh giá khách quan)', score: 2 }
                ]
            },
            {
                text: 'Nhận thức về bệnh (insight)', cat: 'depression', catLabel: 'Trầm cảm',
                likertOptions: [
                    { emoji: '✅', label: 'Thừa nhận bị trầm cảm và "bệnh tâm thần" (suy sụp thần kinh)', score: 0 },
                    { emoji: '🟡', label: 'Thừa nhận có bệnh về trạng thái thần kinh nhưng đổ lỗi cho tình trạng cơ thể', score: 1 },
                    { emoji: '🔴', label: 'Cho là mình không có gì "trục trặc" về thần kinh (tâm thần), chỉ bị bệnh cơ thể', score: 2 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Không có', score: 0 },
            { emoji: '🟡', label: 'Nhẹ', score: 1 },
            { emoji: '🟠', label: 'Vừa', score: 2 },
            { emoji: '🔴', label: 'Nặng', score: 3 },
            { emoji: '🚨', label: 'Rất nặng', score: 4 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], multiplier: 1, levels: [{ max: 7, 'label': 'Không có trầm cảm', 'class': 'level-0' }, { max: 13, 'label': 'Trầm cảm nhẹ', 'class': 'level-1' }, { max: 18, 'label': 'Trầm cảm vừa', 'class': 'level-2' }, { max: 22, 'label': 'Trầm cảm nặng', 'class': 'level-3' }, { max: 999, 'label': 'Trầm cảm rất nặng', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    cdi: {
        name: 'CDI', fullname: "Children's Depression Inventory",
        icon: '🧸', iconBg: 'var(--sky-light)', iconBorder: 'var(--sky)',
        timeRef: '2 tuần qua', totalQ: 27, maxScore: 54,
        subscales: ['depression'],
        questions: [
            { text: 'Tâm trạng buồn', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi ít khi buồn', score: 0 }, { emoji: '😐', label: 'Tôi buồn nhiều', score: 1 }, { emoji: '😢', label: 'Tôi luôn luôn buồn', score: 2 }] },
            { text: 'Suy nghĩ về tương lai', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Chẳng có thứ gì thuận lợi cho tôi', score: 2 }, { emoji: '😐', label: 'Tôi không chắc có thứ gì sẽ thuận lợi cho mình', score: 1 }, { emoji: '🙂', label: 'Mọi thứ sẽ thuận lợi cho tôi', score: 0 }] },
            { text: 'Cảm giác về việc mình làm', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi làm đúng hầu hết mọi thứ', score: 0 }, { emoji: '😐', label: 'Tôi làm sai nhiều thứ', score: 1 }, { emoji: '😢', label: 'Tôi làm sai tất cả mọi thứ', score: 2 }] },
            { text: 'Niềm vui, hứng thú', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi có niềm vui ở nhiều điều', score: 0 }, { emoji: '😐', label: 'Tôi có niềm vui ở một số điều', score: 1 }, { emoji: '😢', label: 'Chẳng có gì là vui đối với tôi cả', score: 2 }] },
            { text: 'Tự đánh giá bản thân là người "tồi tệ"', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi luôn luôn tồi tệ', score: 2 }, { emoji: '😐', label: 'Đôi khi tôi tồi tệ', score: 1 }, { emoji: '🙂', label: 'Ít khi tôi tồi tệ', score: 0 }] },
            { text: 'Lo lắng về điều xấu sẽ xảy ra', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi ít khi nghĩ về những điều xấu sẽ xảy ra với mình', score: 0 }, { emoji: '😐', label: 'Tôi lo rằng những điều xấu sẽ xảy ra với tôi', score: 1 }, { emoji: '😢', label: 'Tôi chắc chắn rằng những điều xấu sẽ xảy ra với tôi', score: 2 }] },
            { text: 'Cảm giác về bản thân', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi ghét bản thân mình', score: 2 }, { emoji: '😐', label: 'Tôi không thích bản thân mình', score: 1 }, { emoji: '🙂', label: 'Tôi thích bản thân mình', score: 0 }] },
            { text: 'Tự đổ lỗi cho bản thân', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tất cả những điều xấu là lỗi của tôi', score: 2 }, { emoji: '😐', label: 'Nhiều điều xấu là lỗi của tôi', score: 1 }, { emoji: '🙂', label: 'Nhiều điều xấu thường không phải là lỗi của tôi', score: 0 }] },
            { text: 'Muốn khóc', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi luôn luôn cảm thấy muốn khóc', score: 2 }, { emoji: '😐', label: 'Tôi thường cảm thấy muốn khóc', score: 1 }, { emoji: '🙂', label: 'Ít khi tôi cảm thấy muốn khóc', score: 0 }] },
            { text: 'Dễ khó chịu', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Mọi thứ luôn luôn làm tôi khó chịu', score: 2 }, { emoji: '😐', label: 'Mọi thứ thường làm tôi khó chịu', score: 1 }, { emoji: '🙂', label: 'Mọi thứ ít khi làm tôi khó chịu', score: 0 }] },
            { text: 'Tiếp xúc với mọi người', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi thích tiếp xúc với mọi người', score: 0 }, { emoji: '😐', label: 'Tôi thường không thích tiếp xúc với mọi người', score: 1 }, { emoji: '😢', label: 'Tôi chẳng muốn tiếp xúc với mọi người tí nào', score: 2 }] },
            { text: 'Khả năng ra quyết định', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi không thể quyết định về thứ gì', score: 2 }, { emoji: '😐', label: 'Tôi không dễ quyết định mọi thứ', score: 1 }, { emoji: '🙂', label: 'Tôi quyết định mọi thứ một cách dễ dàng', score: 0 }] },
            { text: 'Cảm nhận về ngoại hình', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi trông bình thường', score: 0 }, { emoji: '😐', label: 'Có thứ gì đó xấu xí với ngoại hình của tôi', score: 1 }, { emoji: '😢', label: 'Tôi trông xấu xí', score: 2 }] },
            { text: 'Làm bài tập về nhà', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi luôn phải tự ép bản thân mình để làm bài tập về nhà', score: 2 }, { emoji: '😐', label: 'Tôi thường phải ép bản thân mình để làm bài tập về nhà', score: 1 }, { emoji: '🙂', label: 'Làm bài tập về nhà không phải là một vấn đề lớn', score: 0 }] },
            { text: 'Giấc ngủ', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi luôn khó ngủ', score: 2 }, { emoji: '😐', label: 'Tôi thường khó ngủ', score: 1 }, { emoji: '🙂', label: 'Tôi ngủ khá tốt', score: 0 }] },
            { text: 'Mệt mỏi', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi ít khi mệt', score: 0 }, { emoji: '😐', label: 'Tôi thường xuyên mệt', score: 1 }, { emoji: '😢', label: 'Tôi luôn luôn mệt', score: 2 }] },
            { text: 'Ăn uống', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi luôn không muốn ăn', score: 2 }, { emoji: '😐', label: 'Tôi thường không muốn ăn', score: 1 }, { emoji: '🙂', label: 'Tôi ăn khá tốt', score: 0 }] },
            { text: 'Lo lắng về đau đớn cơ thể', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi không lo lắng về những đau đớn', score: 0 }, { emoji: '😐', label: 'Tôi thường lo lắng về những đau đớn', score: 1 }, { emoji: '😢', label: 'Tôi luôn lo lắng về những đau đớn', score: 2 }] },
            { text: 'Cảm giác cô đơn', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi không cảm thấy cô đơn', score: 0 }, { emoji: '😐', label: 'Tôi thường cảm thấy cô đơn', score: 1 }, { emoji: '😢', label: 'Tôi luôn cảm thấy cô đơn', score: 2 }] },
            { text: 'Niềm vui ở trường', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi không bao giờ có niềm vui ở trường', score: 2 }, { emoji: '😐', label: 'Tôi thỉnh thoảng có niềm vui ở trường', score: 1 }, { emoji: '🙂', label: 'Tôi luôn có niềm vui ở trường', score: 0 }] },
            { text: 'Bạn bè', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi có khá nhiều bạn', score: 0 }, { emoji: '😐', label: 'Tôi có một số bạn nhưng tôi ước mình có nhiều hơn', score: 1 }, { emoji: '😢', label: 'Tôi không có bạn nào', score: 2 }] },
            { text: 'Kết quả học tập', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Việc học của tôi đang tốt', score: 0 }, { emoji: '😐', label: 'Việc học tập của tôi không tốt như trước đây', score: 1 }, { emoji: '😢', label: 'Tôi học rất kém những môn mà tôi từng học tốt', score: 2 }] },
            { text: 'So sánh với bạn khác', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Tôi không bao giờ có thể tốt như những bạn khác', score: 2 }, { emoji: '😐', label: 'Tôi có thể tốt như những bạn khác nếu tôi muốn', score: 1 }, { emoji: '🙂', label: 'Tôi cũng tốt như những bạn khác', score: 0 }] },
            { text: 'Cảm giác được yêu thương', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '😢', label: 'Không có ai thực sự yêu thương tôi', score: 2 }, { emoji: '😐', label: 'Tôi không chắc có ai yêu thương mình không', score: 1 }, { emoji: '🙂', label: 'Tôi chắc chắn là có ai đó yêu thương tôi', score: 0 }] },
            { text: 'Vâng lời', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi thường làm những điều tôi được yêu cầu', score: 0 }, { emoji: '😐', label: 'Tôi thường không làm những điều mà tôi được yêu cầu', score: 1 }, { emoji: '😢', label: 'Tôi không bao giờ làm những điều tôi được yêu cầu', score: 2 }] },
            { text: 'Đánh nhau', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi không bao giờ đánh nhau', score: 0 }, { emoji: '😐', label: 'Tôi thường đánh nhau', score: 1 }, { emoji: '😢', label: 'Tôi luôn luôn đánh nhau', score: 2 }] },
            { text: 'Suy nghĩ về tự tử', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '🙂', label: 'Tôi không nghĩ về việc tự tử', score: 0 }, { emoji: '😐', label: 'Tôi nghĩ về việc tự tử', score: 1 }, { emoji: '😢', label: 'Tôi muốn tự tử', score: 2 }] }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Hiếm khi', score: 0 },
            { emoji: '😐', label: 'Thường xuyên', score: 1 },
            { emoji: '😢', label: 'Luôn luôn', score: 2 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26], multiplier: 1, levels: [{ max: 12, 'label': 'Không có trầm cảm', 'class': 'level-0' }, { max: 19, 'label': 'Có dấu hiệu trầm cảm', 'class': 'level-1' }, { max: 999, 'label': 'Có trầm cảm', 'class': 'level-2' }] }
        },
        prevScores: null
    },
    gds: {
        name: 'GDS', fullname: 'Geriatric Depression Scale',
        icon: '🍂', iconBg: 'var(--kraft-light)', iconBorder: 'var(--kraft)',
        timeRef: '1 tuần qua', totalQ: 30, maxScore: 30,
        subscales: ['depression'],
        questions: [
            { text: 'Về cơ bản tôi hài lòng với cuộc sống của mình', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Hiện tôi đã từ bỏ nhiều hoạt động và thú vui', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi cảm thấy cuộc sống của mình thật là trống rỗng', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi thường cảm thấy buồn chán', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi cảm thấy tương lai đầy triển vọng', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Tôi thấy phiền muộn bởi có những ý nghĩ trong đầu không thể dứt ra được', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Hầu hết thời gian tôi thấy thoải mái', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Tôi sợ rằng có một điều tồi tệ sẽ xảy đến với mình', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Phần lớn thời gian tôi cảm thấy hạnh phúc', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Tôi thường cảm thấy không tự lo liệu được', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi thường cảm thấy bồn chồn, bất an', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi thích ở nhà hơn là đi ra ngoài và làm việc gì đó', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi thường thấy lo lắng về tương lai', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi cảm thấy mình có nhiều vấn đề về trí nhớ hơn hầu hết những người có cùng độ tuổi', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi nghĩ cuộc sống hiện tại thật là tuyệt vời', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Tôi cảm thấy chán nản và thất vọng', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi cảm thấy khá vô dụng trong tình trạng hiện tại', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi lo nghĩ nhiều về quá khứ', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi nhận thấy cuộc sống rất thú vị', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Tôi thấy khó để bắt đầu những kế hoạch mới', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi cảm thấy tràn đầy sinh lực', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Tôi cảm thấy tình trạng của mình là tuyệt vọng', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi nghĩ hầu hết mọi người đều tốt hơn tôi', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi thường thấy bối rối cả với những việc nhỏ nhặt', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi thường cảm thấy muốn khóc', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi có vấn đề về tập trung chú ý', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Khi thức dậy vào buổi sáng tôi thấy sảng khoái', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Tôi không thích những chỗ hội họp đông người', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 1 }, { emoji: '❌', label: 'Không đúng', score: 0 }] },
            { text: 'Tôi dễ dàng đưa ra các quyết định', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] },
            { text: 'Trí óc tôi vẫn minh mẫn như trước kia', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [{ emoji: '✅', label: 'Đúng', score: 0 }, { emoji: '❌', label: 'Không đúng', score: 1 }] }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Đúng', score: 1 },
            { emoji: '❌', label: 'Không đúng', score: 0 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], multiplier: 1, levels: [{ max: 9, 'label': 'Không có trầm cảm', 'class': 'level-0' }, { max: 19, 'label': 'Trầm cảm nhẹ', 'class': 'level-1' }, { max: 999, 'label': 'Trầm cảm nặng', 'class': 'level-2' }] }
        },
        prevScores: null
    },
    epds: {
        name: 'EPDS', fullname: 'Edinburgh Postnatal Depression Scale',
        icon: '🤱', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: '1 tuần qua', totalQ: 10, maxScore: 30,
        subscales: ['depression'],
        questions: [
            {
                text: 'Tôi có thể cười và thấy khía cạnh hài hước của mọi chuyện', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '🙂', label: 'Vẫn như trước kia', score: 0 },
                    { emoji: '😐', label: 'Ít hơn trước kia', score: 1 },
                    { emoji: '😟', label: 'Hầu như không còn như trước kia', score: 2 },
                    { emoji: '😢', label: 'Không còn chút nào nữa', score: 3 }
                ]
            },
            {
                text: 'Tôi luôn hào hứng mong chờ mọi điều đến với mình', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '🙂', label: 'Vẫn như trước kia', score: 0 },
                    { emoji: '😐', label: 'Ít hơn một chút so với trước đây', score: 1 },
                    { emoji: '😟', label: 'Ít hơn nhiều so với trước đây', score: 2 },
                    { emoji: '😢', label: 'Rất hiếm khi', score: 3 }
                ]
            },
            {
                text: 'Khi mọi chuyện xấu đi tôi thường đổ lỗi cho bản thân', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '😢', label: 'Đúng, lúc nào cũng vậy', score: 3 },
                    { emoji: '😟', label: 'Đúng, vài lần như vậy', score: 2 },
                    { emoji: '😐', label: 'Hiếm khi như vậy', score: 1 },
                    { emoji: '🙂', label: 'Không bao giờ', score: 0 }
                ]
            },
            {
                text: 'Tôi cảm thấy lo âu hoặc lo lắng mà không rõ nguyên nhân', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '🙂', label: 'Không có', score: 0 },
                    { emoji: '😐', label: 'Hiếm khi', score: 1 },
                    { emoji: '😟', label: 'Đúng, thỉnh thoảng', score: 2 },
                    { emoji: '😢', label: 'Đúng, rất thường xuyên', score: 3 }
                ]
            },
            {
                text: 'Tôi cảm thấy hoảng hốt, sợ hãi một cách vô cớ', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '😢', label: 'Đúng, phần lớn thời gian', score: 3 },
                    { emoji: '😟', label: 'Có, một vài lần', score: 2 },
                    { emoji: '😐', label: 'Không, không nhiều', score: 1 },
                    { emoji: '🙂', label: 'Không có', score: 0 }
                ]
            },
            {
                text: 'Mọi thứ đang đè nặng lên vai tôi', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '😢', label: 'Đúng, hầu hết thời gian tôi không thể làm được việc gì', score: 3 },
                    { emoji: '😟', label: 'Đúng, đôi lúc tôi không thể làm được mọi việc như trước đây', score: 2 },
                    { emoji: '😐', label: 'Không, đa phần tôi vẫn đảm đương tốt mọi việc như trước kia', score: 1 },
                    { emoji: '🙂', label: 'Không, tôi vẫn đảm đương tốt mọi việc như trước kia', score: 0 }
                ]
            },
            {
                text: 'Tôi thường cảm thấy không vui và rất khó ngủ', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '😢', label: 'Đúng, hầu hết thời gian', score: 3 },
                    { emoji: '😟', label: 'Đúng, đôi lúc như thế', score: 2 },
                    { emoji: '😐', label: 'Ít khi như thế', score: 1 },
                    { emoji: '🙂', label: 'Không có', score: 0 }
                ]
            },
            {
                text: 'Tôi cảm thấy buồn bã và bất hạnh', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '😢', label: 'Đúng, hầu hết là như thế', score: 3 },
                    { emoji: '😟', label: 'Đúng, đôi lúc như thế', score: 2 },
                    { emoji: '😐', label: 'Ít khi như thế', score: 1 },
                    { emoji: '🙂', label: 'Không có', score: 0 }
                ]
            },
            {
                text: 'Tôi thấy buồn chán đến phát khóc', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '😢', label: 'Đúng, hầu hết thời gian', score: 3 },
                    { emoji: '😟', label: 'Đúng, rất thường xuyên', score: 2 },
                    { emoji: '😐', label: 'Chỉ tuỳ từng lúc', score: 1 },
                    { emoji: '🙂', label: 'Không bao giờ', score: 0 }
                ]
            },
            {
                text: 'Ý nghĩ tự làm hại bản thân xuất hiện trong đầu tôi', cat: 'depression', catLabel: 'Trầm cảm sau sinh',
                likertOptions: [
                    { emoji: '😢', label: 'Đúng, khá thường xuyên', score: 3 },
                    { emoji: '😟', label: 'Thỉnh thoảng', score: 2 },
                    { emoji: '😐', label: 'Hiếm khi', score: 1 },
                    { emoji: '🙂', label: 'Không bao giờ', score: 0 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Không có', score: 0 },
            { emoji: '😐', label: 'Hiếm khi', score: 1 },
            { emoji: '😟', label: 'Thỉnh thoảng', score: 2 },
            { emoji: '😢', label: 'Thường xuyên', score: 3 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 9, 'label': 'Không có trầm cảm', 'class': 'level-0' }, { max: 12, 'label': 'Có nguy cơ trầm cảm', 'class': 'level-1' }, { max: 999, 'label': 'Có trầm cảm', 'class': 'level-2' }] }
        },
        prevScores: null
    }
};

export default GROUP1_TESTS_VI;


