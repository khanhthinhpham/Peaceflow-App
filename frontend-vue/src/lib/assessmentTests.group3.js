// Nhóm 3 — Trắc nghiệm do bác sĩ/cha mẹ thực hiện (clinician- / parent-administered)
// Nguồn: Quy trình kỹ thuật chuyên ngành Tâm thần, Bộ Y tế (bản trích xuất .docx).
// Chỉ 2/4 công cụ được số hóa đầy đủ thành đối tượng test theo khuôn (shape) chuẩn của
// assessmentTests.js — xem group3_meta.md để biết lý do bỏ qua `dsm5asd` và `cbcl`
// (dsm5asd: bảng tiêu chuẩn chẩn đoán, không phải thang điểm; cbcl: nguồn trích xuất
// KHÔNG chứa văn bản 112 câu hỏi gốc, không thể số hóa mà không bịa nội dung).
//
// Engine hỗ trợ ghi đè `likertOptions` theo TỪNG CÂU HỎI (xem
// frontend-vue/src/views/MoodAssessmentView.vue: `currentQuestion.likertOptions ||
// currentTest.likertOptions`) — đã dùng cơ chế này để xử lý các câu chấm điểm ngược
// trong M-CHAT và ASQ-3, tương tự cách `sdq25` đã làm trong assessmentTests.js.
//
// LƯU Ý QUAN TRỌNG (M-CHAT): văn bản nguồn ghi quy ước chấm điểm là "Không=0; Có=1"
// (mặc định) và với câu 2, 5, 12 là "Không=1; Có=0" — tức NGƯỢC với logic lâm sàng
// chuẩn của M-CHAT-R (nơi "Không" là câu trả lời đáng lo ngại ở đa số các câu, và
// "Có" là câu trả lời đáng lo ngại CHỈ ở câu 2, 5, 12 — vì đây là 3 câu hỏi về hành vi
// bất thường, còn lại là các câu hỏi về hành vi phát triển bình thường). Cách chấm bên
// dưới dùng đúng chiều lâm sàng chuẩn (khớp với mô tả trong yêu cầu công việc và khớp
// với bản gốc tiếng Anh M-CHAT-R/F của Robins et al.), KHÔNG dùng nguyên văn quy ước
// "Không=0;Có=1" ghi trong tài liệu nguồn vì áp dụng nguyên văn sẽ đảo ngược ý nghĩa
// lâm sàng của 17/20 câu. Ngưỡng điểm tổng (0-2 / 3-7 / ≥8) lấy đúng nguyên văn từ bảng
// tham chiếu nguồn. Xem group3_meta.md mục M-CHAT để biết chi tiết và khuyến nghị người
// có chuyên môn đối chiếu lại với bản PDF gốc của Bộ Y tế trước khi đưa vào sử dụng lâm
// sàng chính thức.

export const TESTS = {
    mchat: {
        name: 'M-CHAT', fullname: 'Trắc nghiệm sàng lọc tự kỷ cho trẻ nhỏ 16-30 tháng (M-CHAT)',
        icon: '🧩', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Biểu hiện thường thấy ở trẻ (bỏ qua nếu chỉ thấy 1-2 lần)', totalQ: 20, maxScore: 20,
        subscales: ['risk'],
        questions: [
            { text: 'Nếu bạn chỉ vào một điểm trong phòng, con bạn có nhìn theo không? (Ví dụ: nếu bạn chỉ vào đồ chơi hay con vật, con bạn có nhìn vào đồ chơi đó hay con vật đó không?)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            {
                text: 'Bạn có bao giờ tự hỏi liệu con bạn có bị điếc không?', cat: 'risk', catLabel: 'Nguy cơ tự kỷ',
                likertOptions: [
                    { emoji: '✅', label: 'Có', score: 1 },
                    { emoji: '❌', label: 'Không', score: 0 }
                ]
            },
            { text: 'Con bạn có chơi trò tưởng tượng hoặc giả vờ không? (Ví dụ: giả vờ uống nước từ một cái cốc rỗng, giả vờ nói chuyện điện thoại hay giả vờ cho búp bê, thú bông ăn)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có thích leo trèo lên đồ vật không? (Ví dụ: trèo lên đồ đạc trong nhà, đồ chơi ngoài trời hoặc leo cầu thang)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            {
                text: 'Con bạn có làm các cử động ngón tay một cách bất thường gần mắt của trẻ không? (Ví dụ: con bạn có vẫy/đưa qua đưa lại ngón tay gần mắt của trẻ)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ',
                likertOptions: [
                    { emoji: '✅', label: 'Có', score: 1 },
                    { emoji: '❌', label: 'Không', score: 0 }
                ]
            },
            { text: 'Con bạn có dùng ngón tay trỏ của trẻ để yêu cầu việc gì đó, hoặc để muốn được giúp đỡ không? (Ví dụ: chỉ vào bim bim hoặc đồ chơi ngoài tầm với)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có dùng một ngón tay để chỉ cho bạn thứ gì đó thú vị mà trẻ thích thú không? (Ví dụ: chỉ vào máy bay trên bầu trời hoặc một cái xe tải lớn trên đường)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có thích chơi với những đứa trẻ khác không? (Ví dụ: con bạn có quan sát những đứa trẻ khác, cười với những trẻ này hoặc tới chơi với chúng không?)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có khoe với bạn những đồ vật bằng cách cầm hoặc mang chúng đến cho bạn xem, không phải để được bạn giúp đỡ mà chỉ để chia sẻ với bạn không? (Ví dụ: khoe với bạn một bông hoa, thú bông hoặc một cái xe tải đồ chơi)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có đáp lại khi được gọi tên không? (Ví dụ: con bạn có ngước lên tìm người gọi, đáp chuyện hay bập bẹ, hoặc ngừng việc đang làm khi bạn gọi tên của trẻ?)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Khi bạn cười với con bạn, con bạn có cười lại với bạn không?', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            {
                text: 'Con bạn có cảm thấy khó chịu bởi những tiếng ồn xung quanh? (Ví dụ: con bạn có hét lên hay la khóc khi nghe tiếng ồn của máy hút bụi hoặc tiếng nhạc to?)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ',
                likertOptions: [
                    { emoji: '✅', label: 'Có', score: 1 },
                    { emoji: '❌', label: 'Không', score: 0 }
                ]
            },
            { text: 'Con bạn có biết đi không?', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có nhìn vào mắt bạn khi bạn đang nói chuyện với trẻ, chơi cùng trẻ hoặc mặc quần áo cho trẻ không?', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có bắt chước những điều bạn làm không? (Ví dụ: vẫy tay bye bye, vỗ tay hoặc bắt chước tạo ra những âm thanh vui vẻ)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Nếu bạn quay đầu để nhìn gì đó, con bạn có nhìn xung quanh để xem bạn đang nhìn cái gì không?', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có gây sự chú ý để bạn phải nhìn vào trẻ không? (Ví dụ: con bạn có nhìn bạn để được bạn khen ngợi hoặc trẻ nói "nhìn" hay "nhìn con")', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có hiểu bạn nói gì khi bạn yêu cầu con làm không? (Ví dụ: Nếu bạn không chỉ tay, con bạn có hiểu "để sách lên ghế", "đưa mẹ/bố cái chăn" không?)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Nếu có điều gì mới lạ, con bạn có nhìn bạn để xem bạn cảm thấy thế nào về việc xảy ra không? (Ví dụ: nếu trẻ nghe thấy một âm thanh lạ hoặc thú vị, hay nhìn thấy một đồ chơi mới, con bạn có nhìn bạn không?)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' },
            { text: 'Con bạn có thích những hoạt động mang tính chất chuyển động không? (Ví dụ: được lắc lư hoặc nhún nhảy trên đầu gối của bạn)', cat: 'risk', catLabel: 'Nguy cơ tự kỷ' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Có', score: 0 },
            { emoji: '❌', label: 'Không', score: 1 }
        ],
        scoring: {
            risk: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], multiplier: 1, levels: [{ max: 2, 'label': 'Nguy cơ tự kỷ thấp', 'class': 'level-0' }, { max: 7, 'label': 'Có nguy cơ tự kỷ', 'class': 'level-1' }, { max: 999, 'label': 'Nguy cơ tự kỷ cao', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    // asq3: Bộ câu hỏi gồm 9 phiếu theo độ tuổi (0-28 ngày, 3, 6, 9, 12, 24, 36, 48, 60 tháng).
    // Chỉ số hóa PHIẾU 6 (24-35 tháng tuổi) làm đại diện — xem group3_meta.md để biết lý do
    // chọn và danh sách các phiếu còn lại CHƯA được số hóa.
    asq3: {
        name: 'ASQ-3 (24 tháng)', fullname: 'Trắc nghiệm giai đoạn và lứa tuổi cho trẻ em — Phiếu 6, 24-35 tháng tuổi (ASQ-3, bản Có/Không theo Bộ Y tế)',
        icon: '🧸', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: 'Giai đoạn hiện tại của trẻ (24-35 tháng tuổi)', totalQ: 20, maxScore: 20,
        subscales: ['communication', 'grossmotor', 'finemotor', 'imitation', 'personalsocial', 'redflag'],
        questions: [
            { text: 'Trẻ có chỉ đúng vào đồ vật/con vật trong tranh khi được hỏi không? (VD, Con chó đâu? Cái cốc đâu?)', cat: 'communication', catLabel: 'Giao tiếp' },
            { text: 'Trẻ có nói được câu 2-3 từ đúng ngữ cảnh không? (VD, Mẹ về rồi)', cat: 'communication', catLabel: 'Giao tiếp' },
            { text: 'Trẻ có biết làm theo mệnh lệnh đơn giản không? (VD, Cất đồ chơi đi)', cat: 'communication', catLabel: 'Giao tiếp' },
            { text: 'Trẻ có biết bước lên ít nhất 1-2 bậc cửa/cầu thang không?', cat: 'grossmotor', catLabel: 'Vận động thô' },
            { text: 'Trẻ có biết chạy nhanh và dừng lại mà không bị ngã không?', cat: 'grossmotor', catLabel: 'Vận động thô' },
            { text: 'Trẻ có thể giơ chân đá bóng khi bám tay không?', cat: 'grossmotor', catLabel: 'Vận động thô' },
            { text: 'Trẻ có biết dùng thìa xúc thức ăn đưa vào miệng không?', cat: 'finemotor', catLabel: 'Vận động tinh' },
            { text: 'Trẻ có biết xoay núm cửa, xoay nắp đồ chơi không?', cat: 'finemotor', catLabel: 'Vận động tinh' },
            { text: 'Trẻ có biết tự lật trang sách (mỗi lần tự lật một vài trang) không?', cat: 'finemotor', catLabel: 'Vận động tinh' },
            { text: 'Trẻ có biết chơi tưởng tượng không? (VD, Giả vờ gọi điện thoại)', cat: 'imitation', catLabel: 'Bắt chước và học' },
            { text: 'Trẻ có bắt chước vẽ đường thẳng theo bạn không?', cat: 'imitation', catLabel: 'Bắt chước và học' },
            { text: 'Trẻ có biết cất đồ vật vào đúng chỗ không? (VD, Cất đồ chơi vào hộp)', cat: 'imitation', catLabel: 'Bắt chước và học' },
            { text: 'Trẻ có biết uống nước bằng cốc không?', cat: 'personalsocial', catLabel: 'Cá nhân - xã hội' },
            { text: 'Trẻ có biết bắt chước hành động không? (VD: quét nhà, chải tóc…)', cat: 'personalsocial', catLabel: 'Cá nhân - xã hội' },
            { text: 'Trẻ có biết chơi giả vờ với đồ chơi của mình không? (VD, Ru bé ngủ)', cat: 'personalsocial', catLabel: 'Cá nhân - xã hội' },
            {
                text: 'Trẻ có khi nào bị co giật/ngất xỉu không?', cat: 'redflag', catLabel: 'Dấu hiệu cảnh báo',
                likertOptions: [
                    { emoji: '❌', label: 'Không', score: 0 },
                    { emoji: '✅', label: 'Có', score: 1 }
                ]
            },
            {
                text: 'Trẻ có bất thường ở cổ, cột sống, thân mình, tay chân không?', cat: 'redflag', catLabel: 'Dấu hiệu cảnh báo',
                likertOptions: [
                    { emoji: '❌', label: 'Không', score: 0 },
                    { emoji: '✅', label: 'Có', score: 1 }
                ]
            },
            {
                text: 'Trẻ có bất thường ở tai, bệnh về tai hoặc nghe kém không?', cat: 'redflag', catLabel: 'Dấu hiệu cảnh báo',
                likertOptions: [
                    { emoji: '❌', label: 'Không', score: 0 },
                    { emoji: '✅', label: 'Có', score: 1 }
                ]
            },
            {
                text: 'Trẻ có bất thường ở mắt hoặc nhìn kém không?', cat: 'redflag', catLabel: 'Dấu hiệu cảnh báo',
                likertOptions: [
                    { emoji: '❌', label: 'Không', score: 0 },
                    { emoji: '✅', label: 'Có', score: 1 }
                ]
            },
            {
                text: 'Trẻ có các bất thường nào khác không? (VD: mặt, môi/hàm ếch…)', cat: 'redflag', catLabel: 'Dấu hiệu cảnh báo',
                likertOptions: [
                    { emoji: '❌', label: 'Không', score: 0 },
                    { emoji: '✅', label: 'Có', score: 1 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Có', score: 0 },
            { emoji: '❌', label: 'Không', score: 1 }
        ],
        scoring: {
            communication: { indices: [0, 1, 2], multiplier: 1, levels: [{ max: 1, 'label': 'Bình thường', 'class': 'level-0' }, { max: 999, 'label': 'Nghi ngờ chậm phát triển', 'class': 'level-2' }] },
            grossmotor: { indices: [3, 4, 5], multiplier: 1, levels: [{ max: 1, 'label': 'Bình thường', 'class': 'level-0' }, { max: 999, 'label': 'Nghi ngờ chậm phát triển', 'class': 'level-2' }] },
            finemotor: { indices: [6, 7, 8], multiplier: 1, levels: [{ max: 1, 'label': 'Bình thường', 'class': 'level-0' }, { max: 999, 'label': 'Nghi ngờ chậm phát triển', 'class': 'level-2' }] },
            imitation: { indices: [9, 10, 11], multiplier: 1, levels: [{ max: 1, 'label': 'Bình thường', 'class': 'level-0' }, { max: 999, 'label': 'Nghi ngờ chậm phát triển', 'class': 'level-2' }] },
            personalsocial: { indices: [12, 13, 14], multiplier: 1, levels: [{ max: 1, 'label': 'Bình thường', 'class': 'level-0' }, { max: 999, 'label': 'Nghi ngờ chậm phát triển', 'class': 'level-2' }] },
            redflag: { indices: [15, 16, 17, 18, 19], multiplier: 1, levels: [{ max: 0, 'label': 'Bình thường', 'class': 'level-0' }, { max: 999, 'label': 'Có dấu hiệu bất thường — cần khám chuyên khoa', 'class': 'level-3' }] }
        },
        prevScores: null
    }
};


