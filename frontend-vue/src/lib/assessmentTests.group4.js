// Group 4 — trắc nghiệm chuyên gia (clinician-administered) trích xuất nguyên văn từ
// tài liệu Quy trình kỹ thuật chuyên ngành Tâm thần của Bộ Y tế (bản .docx đã chuyển sang text).
// Nguồn: 21_CGIS.txt, 22_BPRS.txt, 43_PANSS.txt
//
// GHI CHÚ QUAN TRỌNG VỀ CÁCH TÍNH ĐIỂM (đọc trước khi tích hợp):
// - CGI-S và BPRS: tài liệu nguồn quy định "lấy tổng điểm chia cho tổng số câu để ra điểm
//   trung bình" rồi đối chiếu điểm trung bình đó với bảng 7 mức (1.0–1.9 .. 7). Để tránh dùng
//   multiplier phân số trong engine chấm điểm dùng chung (finalScore = rawSum * multiplier),
//   các mốc "max" trong scoring bên dưới đã được QUY ĐỔI sang thang tổng điểm thô bằng cách
//   nhân mốc trung bình gốc với số câu (N). Ví dụ CGI-S N=7: mốc trung bình 1.9 -> 7*1.9=13.3.
//   Kết quả phân loại hoàn toàn tương đương với việc chia trung bình rồi so sánh — không thay
//   đổi ý nghĩa lâm sàng, chỉ đổi cách biểu diễn để tương thích với engine.
// - PANSS: tài liệu nguồn CHỈ cho khoảng điểm tối thiểu/tối đa của từng nhóm (Dương tính 7–49,
//   Âm tính 7–49, Bệnh lý chung 16–112), KHÔNG có bảng quy đổi mức độ nặng (không như CGI-S/BPRS).
//   Vì vậy các "levels" của PANSS bên dưới CHỈ là mô tả nhóm + khoảng điểm thô, KHÔNG PHẢI
//   ngưỡng phân loại mức độ nặng — không được tự suy diễn/gán nhãn "nhẹ/vừa/nặng" cho PANSS
//   vì tài liệu nguồn không cung cấp. Xem thêm ghi chú chi tiết trong group4_meta.md.

export const TESTS = {
    cgis: {
        name: 'CGI-S', fullname: 'Trắc nghiệm Ấn tượng lâm sàng chung - Mức độ nặng (Clinical Global Impression - Severity Scale)',
        icon: '🎯', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: '7 ngày qua', totalQ: 7, maxScore: 49,
        subscales: ['severity'],
        questions: [
            { text: 'Báo cáo bằng lời nói của người bệnh về mức độ nghiêm trọng của triệu chứng trong khi phỏng vấn', cat: 'severity', catLabel: 'Mức độ nặng' },
            { text: 'Báo cáo bằng lời nói của người bệnh về tình trạng chức năng của họ (vận động, sinh hoạt…)', cat: 'severity', catLabel: 'Mức độ nặng' },
            { text: 'Các khía cạnh quan sát được về hành vi ở người bệnh (do bác sĩ/cán bộ thực hiện trắc nghiệm ghi nhận)', cat: 'severity', catLabel: 'Mức độ nặng' },
            { text: 'Điểm đánh giá khách quan từ bảng hỏi (ví dụ: điểm trắc nghiệm HDRS/Hamilton)', cat: 'severity', catLabel: 'Mức độ nặng' },
            { text: 'Điểm đánh giá chủ quan từ bảng hỏi (ví dụ: điểm thang BECK)', cat: 'severity', catLabel: 'Mức độ nặng' },
            { text: 'Mức độ của tác dụng phụ mà người bệnh trải qua', cat: 'severity', catLabel: 'Mức độ nặng' },
            { text: 'Nhận xét từ quan sát của người nhà, cán bộ y tế hoặc người chăm sóc trước đó về người bệnh', cat: 'severity', catLabel: 'Mức độ nặng' }
        ],
        likertOptions: [
            { emoji: '✅', label: '1 = Bình thường — không bị bệnh, các triệu chứng rối loạn tâm thần không xuất hiện trong 7 ngày qua', score: 1 },
            { emoji: '🔹', label: '2 = Ranh giới — có dấu hiệu nghi ngờ bệnh lý tâm thần', score: 2 },
            { emoji: '🟡', label: '3 = Mức độ nhẹ — triệu chứng nhẹ xuất hiện rõ ràng, buồn phiền, có thể khó khăn nhẹ về chức năng xã hội/nghề nghiệp', score: 3 },
            { emoji: '🟠', label: '4 = Mức độ vừa — triệu chứng rõ rệt hơn, đáng chú ý nhưng chưa nặng, suy giảm chức năng xã hội/nghề nghiệp, có thể cần dùng thuốc', score: 4 },
            { emoji: '🔶', label: '5 = Mức độ rõ rệt — làm suy yếu rõ rệt chức năng xã hội/nghề nghiệp hoặc gây khó chịu rõ rệt ở người bệnh', score: 5 },
            { emoji: '🔴', label: '6 = Mức độ nặng — ảnh hưởng rõ rệt đến hành vi và chức năng, có thể cần sự hỗ trợ của người khác', score: 6 },
            { emoji: '🚨', label: '7 = Mức độ trầm trọng — ảnh hưởng rất nghiêm trọng đến nhiều chức năng sống, có thể phải nhập viện', score: 7 }
        ],
        scoring: {
            severity: {
                indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1,
                levels: [
                    { max: 13.3, 'label': 'Bình thường', 'class': 'level-0' },
                    { max: 20.3, 'label': 'Ranh giới', 'class': 'level-1' },
                    { max: 27.3, 'label': 'Mức độ nhẹ', 'class': 'level-1' },
                    { max: 34.3, 'label': 'Mức độ vừa', 'class': 'level-2' },
                    { max: 41.3, 'label': 'Mức độ rõ rệt', 'class': 'level-2' },
                    { max: 48.3, 'label': 'Mức độ nặng', 'class': 'level-3' },
                    { max: 999, 'label': 'Mức độ trầm trọng', 'class': 'level-4' }
                ]
            }
        },
        prevScores: null
    },
    bprs: {
        name: 'BPRS', fullname: 'Trắc nghiệm Tâm thần rút gọn (Brief Psychiatric Rating Scale)',
        icon: '📋', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Thời điểm phỏng vấn', totalQ: 24, maxScore: 168,
        subscales: ['selfReport', 'observed'],
        questions: [
            { text: 'Lo lắng về cơ thể (bận tâm về sức khỏe thể chất hiện tại, có căn cứ thực tế hay không)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Lo âu (lo lắng, căng thẳng, sợ hãi, hoảng sợ)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Trầm cảm (buồn bã, mất hứng thú, mất lòng tự trọng, cảm giác vô vọng)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Tự sát (bày tỏ mong muốn, ý định hoặc hành vi tự làm hại/tự sát)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Cảm giác tội lỗi (quan tâm hoặc hối hận về hành vi trong quá khứ)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Thù địch (khinh bỉ, hiếu chiến, đe dọa, tranh luận, cơn giận dữ, phá hủy tài sản)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Khí sắc hưng phấn (cảm giác hạnh phúc, vui tươi, sảng khoái, lạc quan không tương xứng với tình huống)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Tự cao (tự phóng đại niềm tin về khả năng đặc biệt, quyền lực, sự giàu có, nổi tiếng)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Sự nghi ngờ (tin rằng người khác đã/đang hành động hiểm độc hoặc phân biệt đối xử với mình)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Ảo giác (cảm nhận tri giác khi không có kích thích bên ngoài tương ứng)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Nội dung tư duy kỳ lạ (nội dung tư duy bất thường, kỳ cục hoặc kỳ quái; hoang tưởng)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Hành vi kỳ dị (hành vi kỳ lạ, bất thường hoặc có tính chất phạm pháp do loạn thần)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Không tự chăm sóc bản thân (vệ sinh, diện mạo, hành vi ăn uống dưới mức bình thường)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Mất phương hướng (không hiểu tình huống, nhầm lẫn về người, địa điểm, thời gian)', cat: 'selfReport', catLabel: 'Tự báo cáo' },
            { text: 'Rối loạn nhận thức (lời nói bị nhầm lẫn, ngắt kết nối, mơ hồ, xa rời chủ đề)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Cảm xúc cùn mòn (hạn chế biểu cảm cảm xúc ở nét mặt, giọng nói, cử chỉ)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Cảm xúc thu mình (thiếu khả năng liên kết cảm xúc trong tình huống phỏng vấn)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Giảm vận động (cử động, lời nói chậm lại, giảm mức năng lượng)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Tình trạng căng thẳng (biểu hiện thể chất/vận động của sự căng thẳng, nóng nảy, kích động)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Không hợp tác (phản kháng, thiếu sẵn sàng hợp tác với cuộc phỏng vấn)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Kích động (mức độ cảm xúc cao hoặc tăng phản ứng cảm xúc với người phỏng vấn/chủ đề thảo luận)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Đãng trí (chuỗi lời nói và hành động bị gián đoạn bởi các kích thích không liên quan đến phỏng vấn)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Tăng hoạt động, vận động (tăng mức năng lượng, hoạt động thường xuyên hơn, nói nhanh)', cat: 'observed', catLabel: 'Quan sát' },
            { text: 'Dáng vẻ cầu kỳ và điệu bộ (hành vi, vận động có vẻ điệu bộ, tư thế bất thường hoặc không phù hợp)', cat: 'observed', catLabel: 'Quan sát' }
        ],
        likertOptions: [
            { emoji: '✅', label: '1 = Không có', score: 1 },
            { emoji: '🔹', label: '2 = Tối thiểu', score: 2 },
            { emoji: '🟡', label: '3 = Nhẹ', score: 3 },
            { emoji: '🟠', label: '4 = Trung bình', score: 4 },
            { emoji: '🔶', label: '5 = Trung bình nặng', score: 5 },
            { emoji: '🔴', label: '6 = Nặng', score: 6 },
            { emoji: '🚨', label: '7 = Rất nặng', score: 7 }
        ],
        scoring: {
            selfReport: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], multiplier: 1,
                levels: [{ max: 999, 'label': 'Nhóm tự báo cáo (thang điểm thô 14–98; tài liệu nguồn không quy định ngưỡng phân loại riêng cho nhóm này)', 'class': 'level-1' }]
            },
            observed: {
                indices: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23], multiplier: 1,
                levels: [{ max: 999, 'label': 'Nhóm quan sát hành vi (thang điểm thô 10–70; tài liệu nguồn không quy định ngưỡng phân loại riêng cho nhóm này)', 'class': 'level-2' }]
            },
            total: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], multiplier: 1,
                levels: [
                    { max: 45.6, 'label': 'Bình thường', 'class': 'level-0' },
                    { max: 69.6, 'label': 'Ranh giới', 'class': 'level-1' },
                    { max: 93.6, 'label': 'Mức độ nhẹ', 'class': 'level-1' },
                    { max: 117.6, 'label': 'Mức độ vừa', 'class': 'level-2' },
                    { max: 141.6, 'label': 'Mức độ rõ rệt', 'class': 'level-2' },
                    { max: 165.6, 'label': 'Mức độ nặng', 'class': 'level-3' },
                    { max: 999, 'label': 'Mức độ trầm trọng', 'class': 'level-4' }
                ]
            }
        },
        prevScores: null
    },
    panss: {
        name: 'PANSS', fullname: 'Thang Hội chứng Dương tính và Âm tính (Positive and Negative Syndrome Scale)',
        icon: '🧩', iconBg: 'var(--coral-light)', iconBorder: 'var(--lavender)',
        timeRef: 'Thời điểm phỏng vấn', totalQ: 30, maxScore: 210,
        subscales: ['positive', 'negative', 'general'],
        questions: [
            { text: 'P1. Hoang tưởng (tin tưởng không có cơ sở, không có thực, khác thường của riêng bệnh nhân)', cat: 'positive', catLabel: 'Dương tính' },
            { text: 'P2. Sự tan rã các ý niệm (gián đoạn tiến trình tư duy hướng tới mục đích: lai nhai, vòng vo, liên tưởng lỏng lẻo, không logic)', cat: 'positive', catLabel: 'Dương tính' },
            { text: 'P3. Hành vi ảo giác (ngôn ngữ/hành vi cho thấy tri giác không do kích thích bên ngoài khởi động)', cat: 'positive', catLabel: 'Dương tính' },
            { text: 'P4. Kích động (gia tăng hoạt động, đáp ứng cao độ với kích thích, cảm xúc rất không ổn định)', cat: 'positive', catLabel: 'Dương tính' },
            { text: 'P5. Ý tưởng tự cao (cường điệu quan điểm về bản thân, tin tưởng phi lý về khả năng siêu việt, giàu có, quyền lực, danh tiếng)', cat: 'positive', catLabel: 'Dương tính' },
            { text: 'P6. Đa nghi/ý tưởng bị ám hại (ý nghĩ bị hại không có thực hoặc phóng đại: thận trọng, ngờ vực, tăng cảnh giác)', cat: 'positive', catLabel: 'Dương tính' },
            { text: 'P7. Sự thù ghét (biểu hiện ngôn ngữ và phi ngôn ngữ của sự giận dữ: châm chọc, gây hấn thụ động, chửi bới, hành hung)', cat: 'positive', catLabel: 'Dương tính' },
            { text: 'N1. Cảm xúc cùn mòn (giảm đáp ứng cảm xúc: giảm biểu hiện nét mặt, thay đổi cảm xúc và cử chỉ giao tiếp)', cat: 'negative', catLabel: 'Âm tính' },
            { text: 'N2. Thu rút cảm xúc (mất hứng thú hoặc biểu lộ tình cảm trong các sự kiện của cuộc sống)', cat: 'negative', catLabel: 'Âm tính' },
            { text: 'N3. Quan hệ kém (mất sự đồng cảm, cởi mở, gần gũi hoặc hứng thú trong giao tiếp với người khác)', cat: 'negative', catLabel: 'Âm tính' },
            { text: 'N4. Thu rút xã hội, thụ động/vô cảm (giảm hứng thú và sáng kiến trong quan hệ xã hội do thụ động, vô cảm, mất ý chí)', cat: 'negative', catLabel: 'Âm tính' },
            { text: 'N5. Tư duy trừu tượng khó khăn (khó khăn trong việc phân loại, tổng quát hóa và tư duy vượt quá mức cụ thể)', cat: 'negative', catLabel: 'Âm tính' },
            { text: 'N6. Mất tính tự phát và trôi chảy của lời nói (giảm sự trôi chảy trong giao tiếp bằng lời, kèm vô cảm, mất ý chí hoặc thiếu sót nhận thức)', cat: 'negative', catLabel: 'Âm tính' },
            { text: 'N7. Tư duy định hình (giảm sự lưu loát, tự phát và mềm dẻo của tư duy: nội dung cứng ngắc, lặp đi lặp lại, nghèo nàn)', cat: 'negative', catLabel: 'Âm tính' },
            { text: 'G1. Sự quan tâm cơ thể (than phiền hoặc bận tâm về bệnh tật, rối loạn chức năng cơ thể)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G2. Lo âu (kinh nghiệm chủ quan về căng thẳng, lo lắng, sợ hãi hoặc bất an)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G3. Cảm giác tội lỗi (cảm giác ăn năn, tự trách về hành vi sai trái có thật hoặc tưởng tượng trong quá khứ)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G4. Căng thẳng (biểu hiện cơ thể rõ rệt của sợ hãi, lo âu và bứt rứt: cứng cơ, run, vã mồ hôi)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G5. Điệu bộ và tư thế (cử động hoặc tư thế không tự nhiên: vụng về, cứng ngắc, lộn xộn hoặc kỳ quái)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G6. Trầm cảm (cảm giác buồn bã, chán nản, vô dụng và bi quan)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G7. Vận động chậm chạp (giảm hoạt động vận động: chậm chạp cử động và ngôn ngữ, giảm trương lực)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G8. Không hợp tác (chủ động từ chối tuân thủ quy định của người có trách nhiệm; ngờ vực, tự vệ, chống đối)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G9. Nội dung tư duy khác thường (ý nghĩ kỳ lạ, ly kỳ hoặc kỳ quái, từ ý nghĩ xa vời đến lệch lạc, vô lý rõ rệt)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G10. Rối loạn định hướng lực (không nhận biết mối liên hệ với môi trường xung quanh: người, không gian, thời gian)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G11. Chú ý kém (giảm tập trung, cảnh giác; dễ bị lôi cuốn bởi kích thích, khó duy trì hoặc chuyển sự chú ý)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G12. Mất khả năng phán đoán và tự nhận thức (giảm nhận thức về tình trạng tâm thần của bản thân; từ chối nhập viện/điều trị)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G13. Rối loạn ý chí (rối loạn khởi đầu, duy trì và kiểm soát ý nghĩ, hành vi, cử động, ngôn ngữ)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G14. Khó kiểm soát xung động (rối loạn điều chỉnh xung động nội tâm: bùng nổ căng thẳng, cảm xúc đột ngột, không phù hợp)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G15. Bận tâm (bị thu hút bởi ý nghĩ, cảm giác nội tâm và kinh nghiệm tự kỷ đến mức ảnh hưởng định hướng thực tại)', cat: 'general', catLabel: 'Bệnh lý chung' },
            { text: 'G16. Tránh né xã hội tích cực (giảm quan hệ xã hội do sợ hãi, thù hằn hoặc ngờ vực vô cớ)', cat: 'general', catLabel: 'Bệnh lý chung' }
        ],
        likertOptions: [
            { emoji: '✅', label: '1 = Không có', score: 1 },
            { emoji: '🔹', label: '2 = Tối thiểu', score: 2 },
            { emoji: '🟡', label: '3 = Nhẹ', score: 3 },
            { emoji: '🟠', label: '4 = Trung bình', score: 4 },
            { emoji: '🔶', label: '5 = Trung bình nặng', score: 5 },
            { emoji: '🔴', label: '6 = Nặng', score: 6 },
            { emoji: '🚨', label: '7 = Cực nặng', score: 7 }
        ],
        scoring: {
            positive: {
                indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1,
                levels: [{ max: 999, 'label': 'Nhóm triệu chứng dương tính (thang điểm thô 7–49; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng)', 'class': 'level-1' }]
            },
            negative: {
                indices: [7, 8, 9, 10, 11, 12, 13], multiplier: 1,
                levels: [{ max: 999, 'label': 'Nhóm triệu chứng âm tính (thang điểm thô 7–49; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng)', 'class': 'level-2' }]
            },
            general: {
                indices: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], multiplier: 1,
                levels: [{ max: 999, 'label': 'Thang bệnh lý tâm thần chung (thang điểm thô 16–112; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng)', 'class': 'level-3' }]
            },
            total: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], multiplier: 1,
                levels: [{ max: 999, 'label': 'Tổng điểm PANSS (thang điểm thô 30–210; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng)', 'class': 'level-0' }]
            }
        },
        prevScores: null
    }
};


