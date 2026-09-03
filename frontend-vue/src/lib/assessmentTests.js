// Dữ liệu các bài test chuẩn hóa — trích xuất nguyên văn từ frontend/pages/mood-assessment.html
// (không sửa đổi nội dung câu hỏi, thang điểm hay ngưỡng phân loại)

export const TESTS = {
    dass21: {
        name: 'DASS-21', fullname: 'Depression Anxiety Stress Scales',
        icon: '📊', iconBg: 'var(--peach-light)', iconBorder: 'var(--peach)',
        timeRef: '2 tuần qua', totalQ: 21, maxScore: 42,
        subscales: ['depression', 'anxiety', 'stress'],
        questions: [
            { text: 'Tôi không thể cảm nhận được bất kỳ cảm xúc tích cực nào', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Tôi cảm thấy khô miệng', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi không thể trải nghiệm bất kỳ cảm giác tích cực nào', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Tôi gặp khó khăn trong việc thở (thở gấp, khó thở dù không vận động)', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi thấy khó có thể bắt đầu làm bất cứ việc gì', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Tôi có xu hướng phản ứng thái quá với các tình huống', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Tôi cảm thấy run rẩy (ví dụ: tay run)', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy mình đang tiêu tốn nhiều năng lượng thần kinh', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Tôi lo lắng về những tình huống có thể khiến tôi hoảng sợ hoặc bị coi là ngốc nghếch', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy không có gì để mong đợi', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Tôi thấy bản thân trở nên kích động', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Tôi thấy khó thư giãn', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Tôi cảm thấy buồn bã và chán nản', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Tôi không kiên nhẫn khi bị gián đoạn', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Tôi cảm thấy gần như hoảng loạn', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi không thể hào hứng với bất cứ điều gì', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Tôi cảm thấy mình không có giá trị như một con người', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Tôi cảm thấy khá dễ bị kích thích', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Tôi nhận thức được nhịp tim của mình dù không vận động thể chất', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy sợ hãi mà không có lý do chính đáng', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy cuộc sống vô nghĩa', cat: 'depression', catLabel: 'Trầm cảm' }
        ],
        likertOptions: [
            { emoji: '😊', label: 'Không xảy ra', score: 0 },
            { emoji: '😐', label: 'Đôi khi', score: 1 },
            { emoji: '😟', label: 'Thường xuyên', score: 2 },
            { emoji: '😰', label: 'Hầu hết lúc', score: 3 }
        ],
        scoring: {
            depression: { indices: [0, 2, 4, 9, 12, 15, 16, 20], multiplier: 2, levels: [{ max: 9, 'label': 'Bình thường', 'class': 'level-0' }, { max: 13, 'label': 'Nhẹ', 'class': 'level-1' }, { max: 20, 'label': 'Vừa', 'class': 'level-2' }, { max: 27, 'label': 'Nặng', 'class': 'level-3' }, { max: 999, 'label': 'Rất nặng', 'class': 'level-4' }] },
            anxiety: { indices: [1, 3, 6, 8, 14, 18, 19], multiplier: 2, levels: [{ max: 7, 'label': 'Bình thường', 'class': 'level-0' }, { max: 9, 'label': 'Nhẹ', 'class': 'level-1' }, { max: 14, 'label': 'Vừa', 'class': 'level-2' }, { max: 19, 'label': 'Nặng', 'class': 'level-3' }, { max: 999, 'label': 'Rất nặng', 'class': 'level-4' }] },
            stress: { indices: [5, 7, 10, 11, 13, 17], multiplier: 2, levels: [{ max: 14, 'label': 'Bình thường', 'class': 'level-0' }, { max: 18, 'label': 'Nhẹ', 'class': 'level-1' }, { max: 25, 'label': 'Vừa', 'class': 'level-2' }, { max: 33, 'label': 'Nặng', 'class': 'level-3' }, { max: 999, 'label': 'Rất nặng', 'class': 'level-4' }] }
        },
        prevScores: { depression: 6, anxiety: 8, stress: 10 }
    },
    gad7: {
        name: 'GAD-7', fullname: 'Generalized Anxiety Disorder 7-item',
        icon: '😰', iconBg: 'var(--sky-light)', iconBorder: 'var(--sky)',
        timeRef: '2 tuần qua', totalQ: 7, maxScore: 21,
        subscales: ['anxiety'],
        questions: [
            { text: 'Cảm thấy lo lắng, bồn chồn hoặc căng thẳng', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Không thể ngừng hoặc kiểm soát được sự lo lắng', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Lo lắng quá mức về nhiều thứ khác nhau', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Khó thư giãn', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Bồn chồn đến mức khó ngồi yên', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Dễ bực bội hoặc cáu kỉnh', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Cảm thấy sợ hãi như thể có điều gì đó tồi tệ sắp xảy ra', cat: 'anxiety', catLabel: 'Lo âu' }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Không bao giờ', score: 0 },
            { emoji: '😐', label: 'Vài ngày', score: 1 },
            { emoji: '😟', label: 'Hơn nửa số ngày', score: 2 },
            { emoji: '😰', label: 'Gần như mọi ngày', score: 3 }
        ],
        scoring: {
            anxiety: { indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1, levels: [{ max: 4, 'label': 'Bình thường', 'class': 'level-0' }, { max: 9, 'label': 'Nhẹ', 'class': 'level-1' }, { max: 14, 'label': 'Vừa', 'class': 'level-2' }, { max: 21, 'label': 'Nặng', 'class': 'level-3' }, { max: 999, 'label': 'Rất nặng', 'class': 'level-4' }] }
        },
        prevScores: { anxiety: 7 }
    },
    hars: {
        name: 'HARS', fullname: 'Hamilton Anxiety Rating Scale',
        icon: '🧠', iconBg: 'var(--lavender-light)', iconBorder: 'var(--lavender)',
        timeRef: 'Gần đây', totalQ: 14, maxScore: 56,
        subscales: ['somatic', 'psychic'],
        questions: [
            { text: 'Tâm trạng lo âu (lo lắng, linh cảm xấu, sợ hãi thái quá)', cat: 'psychic', catLabel: 'Tâm lý' },
            { text: 'Căng thẳng (hay giật mình, dễ khóc, run rẩy, bồn chồn)', cat: 'psychic', catLabel: 'Tâm lý' },
            { text: 'Sợ hãi (sợ bóng tối, người lạ, ở một mình, đám đông)', cat: 'psychic', catLabel: 'Tâm lý' },
            { text: 'Mất ngủ (khó ngủ, ngủ không sâu, hay gặp ác mộng, mệt mỏi khi dậy)', cat: 'psychic', catLabel: 'Tâm lý' },
            { text: 'Nhận thức và suy nghĩ (khó tập trung, trí nhớ kém)', cat: 'psychic', catLabel: 'Tâm lý' },
            { text: 'Tâm trạng trầm cảm (mất hứng thú, không thấy vui, dậy sớm)', cat: 'psychic', catLabel: 'Tâm lý' },
            { text: 'Triệu chứng cơ bắp (đau nhức cơ, co giật, căng cứng)', cat: 'somatic', catLabel: 'Thể chất' },
            { text: 'Triệu chứng giác quan (ù tai, mờ mắt, nóng lạnh bất thường)', cat: 'somatic', catLabel: 'Thể chất' },
            { text: 'Triệu chứng tim mạch (tim đập nhanh, đau ngực, mạch đập mạnh)', cat: 'somatic', catLabel: 'Thể chất' },
            { text: 'Triệu chứng hô hấp (khó thở, ngột ngạt, nghẹn họng)', cat: 'somatic', catLabel: 'Thể chất' },
            { text: 'Triệu chứng tiêu hóa (khó nuốt, đau dạ dày, buồn nôn, tiêu chảy)', cat: 'somatic', catLabel: 'Thể chất' },
            { text: 'Hệ bài tiết/Sinh dục (đi tiểu nhiều, giảm ham muốn)', cat: 'somatic', catLabel: 'Thể chất' },
            { text: 'Triệu chứng thần kinh thực vật (khô miệng, đổ mồ hôi, đỏ mặt, tái nhợt)', cat: 'somatic', catLabel: 'Thể chất' },
            { text: 'Hành vi bồn chồn (thở dài, nuốt liên tục, run rẩy khi giao tiếp)', cat: 'psychic', catLabel: 'Tâm lý' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Không có', score: 0 },
            { emoji: '🟡', label: 'Nhẹ', score: 1 },
            { emoji: '🟠', label: 'Vừa phải', score: 2 },
            { emoji: '🔴', label: 'Nặng', score: 3 },
            { emoji: '🚨', label: 'Rất nặng', score: 4 }
        ],
        scoring: {
            psychic: { indices: [0, 1, 2, 3, 4, 5, 13], multiplier: 1, levels: [{ max: 999, 'label': 'Tâm lý', 'class': 'level-1' }] },
            somatic: { indices: [6, 7, 8, 9, 10, 11, 12], multiplier: 1, levels: [{ max: 999, 'label': 'Thể chất', 'class': 'level-2' }] },
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], multiplier: 1, levels: [{ max: 17, 'label': 'Bình thường / Nhẹ', 'class': 'level-0' }, { max: 24, 'label': 'Vừa', 'class': 'level-2' }, { max: 30, 'label': 'Nặng', 'class': 'level-3' }, { max: 999, 'label': 'Rất nặng', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    phq9: {
        name: 'PHQ-9', fullname: 'Patient Health Questionnaire-9',
        icon: '🌧️', iconBg: 'var(--mint-light)', iconBorder: 'var(--mint)',
        timeRef: '2 tuần qua', totalQ: 9, maxScore: 27,
        subscales: ['depression'],
        questions: [
            { text: 'Ít hứng thú hoặc niềm vui khi làm việc / sinh hoạt', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Cảm thấy buồn bã, chán nản hoặc tuyệt vọng', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Khó đi vào giấc ngủ, ngủ không sâu giấc, hoặc ngủ quá nhiều', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Cảm thấy mệt mỏi hoặc ít năng lượng', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Chán ăn hoặc ăn quá mức', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Cảm thấy tồi tệ về bản thân - hoặc cảm thấy mình là kẻ thất bại, làm gia đình thất vọng', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Khó tập trung vào mọi việc (ví dụ: đọc báo, công việc, xem tivi)', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Di chuyển hoặc nói chuyện chậm chạp đến mức người khác cũng chú ý. Hoặc ngược lại - bồn chồn, đi lại liên tục', cat: 'depression', catLabel: 'Trầm cảm' },
            { text: 'Có ý nghĩ thà chết đi cho xong hoặc muốn tự làm hại bản thân bằng một cách nào đó', cat: 'depression', catLabel: 'Trầm cảm' }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Không bao giờ', score: 0 },
            { emoji: '😐', label: 'Vài ngày', score: 1 },
            { emoji: '😟', label: 'Hơn nửa số ngày', score: 2 },
            { emoji: '😰', label: 'Gần như mọi ngày', score: 3 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8], multiplier: 1, levels: [{ max: 4, 'label': 'Bình thường', 'class': 'level-0' }, { max: 9, 'label': 'Nhẹ', 'class': 'level-1' }, { max: 14, 'label': 'Vừa', 'class': 'level-2' }, { max: 19, 'label': 'Nặng trung bình', 'class': 'level-3' }, { max: 999, 'label': 'Nghiêm trọng', 'class': 'level-4' }] }
        },
        prevScores: { depression: 5 }
    },
    bdi: {
        name: 'BDI', fullname: 'Thang Đánh Giá Trầm Cảm Beck (Beck Depression Inventory)',
        icon: '🌧️', iconBg: 'var(--mint-light)', iconBorder: 'var(--mint)',
        timeRef: 'hiện tại', totalQ: 21, maxScore: 63,
        subscales: ['depression'],
        questions: [
            { text: 'Cảm xúc buồn', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy buồn.', score: 0 },
                { emoji: '😐', label: 'Tôi cảm thấy buồn.', score: 1 },
                { emoji: '😟', label: 'Tôi luôn cảm thấy buồn và không thể thoát khỏi cảm giác đó.', score: 2 },
                { emoji: '😰', label: 'Tôi buồn và đau khổ đến mức không thể chịu đựng được.', score: 3 }
            ] },
            { text: 'Bi quan về tương lai', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không đặc biệt bi quan về tương lai.', score: 0 },
                { emoji: '😐', label: 'Tôi cảm thấy bi quan về tương lai.', score: 1 },
                { emoji: '😟', label: 'Tôi cảm thấy mình không còn điều gì để mong đợi trong tương lai.', score: 2 },
                { emoji: '😰', label: 'Tôi cảm thấy tương lai hoàn toàn vô vọng và mọi việc không thể cải thiện.', score: 3 }
            ] },
            { text: 'Cảm giác thất bại', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy mình là người thất bại.', score: 0 },
                { emoji: '😐', label: 'Tôi cảm thấy mình thất bại nhiều hơn một người bình thường.', score: 1 },
                { emoji: '😟', label: 'Khi nhìn lại cuộc đời mình, tôi chỉ thấy rất nhiều thất bại.', score: 2 },
                { emoji: '😰', label: 'Tôi cảm thấy mình hoàn toàn là một người thất bại.', score: 3 }
            ] },
            { text: 'Mất hứng thú và khả năng cảm nhận sự hài lòng', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi vẫn cảm thấy hài lòng với mọi việc như trước đây.', score: 0 },
                { emoji: '😐', label: 'Tôi không còn thấy thích thú với mọi việc như trước đây.', score: 1 },
                { emoji: '😟', label: 'Tôi không còn thực sự cảm thấy hài lòng với bất cứ điều gì nữa.', score: 2 },
                { emoji: '😰', label: 'Tôi cảm thấy không hài lòng hoặc buồn chán với mọi thứ.', score: 3 }
            ] },
            { text: 'Cảm giác có lỗi', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy đặc biệt có lỗi.', score: 0 },
                { emoji: '😐', label: 'Tôi cảm thấy có lỗi trong một khoảng thời gian đáng kể.', score: 1 },
                { emoji: '😟', label: 'Tôi cảm thấy khá có lỗi trong phần lớn thời gian.', score: 2 },
                { emoji: '😰', label: 'Tôi luôn luôn cảm thấy có lỗi.', score: 3 }
            ] },
            { text: 'Cảm giác bị trừng phạt', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy mình đang bị trừng phạt.', score: 0 },
                { emoji: '😐', label: 'Tôi cảm thấy mình có thể bị trừng phạt.', score: 1 },
                { emoji: '😟', label: 'Tôi nghĩ rằng mình sẽ bị trừng phạt.', score: 2 },
                { emoji: '😰', label: 'Tôi cảm thấy mình đang bị trừng phạt.', score: 3 }
            ] },
            { text: 'Không hài lòng với bản thân', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy thất vọng về bản thân.', score: 0 },
                { emoji: '😐', label: 'Tôi thất vọng về bản thân.', score: 1 },
                { emoji: '😟', label: 'Tôi cảm thấy ghê tởm và chán ghét bản thân.', score: 2 },
                { emoji: '😰', label: 'Tôi ghét chính bản thân mình.', score: 3 }
            ] },
            { text: 'Tự phê phán bản thân', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy mình kém hơn bất kỳ ai khác.', score: 0 },
                { emoji: '😐', label: 'Tôi tự phê phán bản thân vì những điểm yếu hoặc sai lầm của mình.', score: 1 },
                { emoji: '😟', label: 'Tôi luôn tự trách mình về những khuyết điểm của bản thân.', score: 2 },
                { emoji: '😰', label: 'Tôi tự trách mình về mọi điều tồi tệ xảy ra.', score: 3 }
            ] },
            { text: 'Ý nghĩ về cái chết hoặc tự sát', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không có bất kỳ ý nghĩ nào về việc tự sát.', score: 0 },
                { emoji: '😐', label: 'Tôi có ý nghĩ tự sát, nhưng tôi sẽ không thực hiện điều đó.', score: 1 },
                { emoji: '😟', label: 'Tôi muốn tự sát.', score: 2 },
                { emoji: '😰', label: 'Tôi sẽ tự sát nếu có cơ hội.', score: 3 }
            ] },
            { text: 'Khóc', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không khóc nhiều hơn bình thường.', score: 0 },
                { emoji: '😐', label: 'Hiện nay tôi khóc nhiều hơn trước đây.', score: 1 },
                { emoji: '😟', label: 'Hiện nay tôi gần như luôn khóc.', score: 2 },
                { emoji: '😰', label: 'Trước đây tôi có thể khóc, nhưng hiện giờ tôi không thể khóc được dù rất muốn.', score: 3 }
            ] },
            { text: 'Dễ cáu gắt', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không dễ bị mọi việc làm khó chịu hoặc cáu gắt hơn trước đây.', score: 0 },
                { emoji: '😐', label: 'Hiện nay tôi dễ cáu gắt hơn bình thường một chút.', score: 1 },
                { emoji: '😟', label: 'Tôi khá khó chịu hoặc cáu gắt trong phần lớn thời gian.', score: 2 },
                { emoji: '😰', label: 'Tôi cảm thấy cáu gắt gần như mọi lúc.', score: 3 }
            ] },
            { text: 'Mất hứng thú với người khác', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không mất hứng thú với những người khác.', score: 0 },
                { emoji: '😐', label: 'Tôi ít quan tâm đến những người khác hơn trước đây.', score: 1 },
                { emoji: '😟', label: 'Tôi đã mất phần lớn sự quan tâm đến những người khác.', score: 2 },
                { emoji: '😰', label: 'Tôi hoàn toàn không còn hứng thú với những người khác.', score: 3 }
            ] },
            { text: 'Khó khăn trong việc ra quyết định', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi vẫn có thể đưa ra quyết định tốt như trước đây.', score: 0 },
                { emoji: '😐', label: 'Tôi trì hoãn việc đưa ra quyết định nhiều hơn trước đây.', score: 1 },
                { emoji: '😟', label: 'Tôi gặp khó khăn trong việc đưa ra quyết định nhiều hơn trước đây.', score: 2 },
                { emoji: '😰', label: 'Tôi hoàn toàn không thể đưa ra quyết định nữa.', score: 3 }
            ] },
            { text: 'Thay đổi về ngoại hình', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy mình trông xấu hơn trước đây.', score: 0 },
                { emoji: '😐', label: 'Tôi lo lắng rằng mình đang trở nên già đi hoặc kém hấp dẫn.', score: 1 },
                { emoji: '😟', label: 'Tôi cảm thấy ngoại hình của mình đã có những thay đổi lâu dài khiến tôi trở nên kém hấp dẫn.', score: 2 },
                { emoji: '😰', label: 'Tôi tin rằng mình trông rất xấu.', score: 3 }
            ] },
            { text: 'Khả năng làm việc', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi vẫn có thể làm việc tốt như trước đây.', score: 0 },
                { emoji: '😐', label: 'Tôi phải cố gắng thêm mới có thể bắt đầu làm một việc gì đó.', score: 1 },
                { emoji: '😟', label: 'Tôi phải thúc ép bản thân rất nhiều mới có thể làm bất cứ việc gì.', score: 2 },
                { emoji: '😰', label: 'Tôi hoàn toàn không thể làm việc được.', score: 3 }
            ] },
            { text: 'Giấc ngủ', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi có thể ngủ tốt như bình thường.', score: 0 },
                { emoji: '😐', label: 'Tôi ngủ không ngon như trước đây.', score: 1 },
                { emoji: '😟', label: 'Tôi thức dậy sớm hơn bình thường khoảng 1–2 giờ và khó ngủ lại.', score: 2 },
                { emoji: '😰', label: 'Tôi thức dậy sớm hơn bình thường vài giờ và không thể ngủ lại.', score: 3 }
            ] },
            { text: 'Mệt mỏi', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không cảm thấy mệt hơn bình thường.', score: 0 },
                { emoji: '😐', label: 'Tôi dễ mệt hơn trước đây.', score: 1 },
                { emoji: '😟', label: 'Tôi cảm thấy mệt ngay cả khi làm hầu hết các việc.', score: 2 },
                { emoji: '😰', label: 'Tôi quá mệt để có thể làm bất cứ việc gì.', score: 3 }
            ] },
            { text: 'Cảm giác thèm ăn', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Khẩu vị của tôi không thay đổi so với bình thường.', score: 0 },
                { emoji: '😐', label: 'Tôi ăn không ngon miệng như trước đây.', score: 1 },
                { emoji: '😟', label: 'Hiện nay khẩu vị của tôi giảm đi nhiều.', score: 2 },
                { emoji: '😰', label: 'Tôi hoàn toàn không còn cảm giác thèm ăn.', score: 3 }
            ] },
            { text: 'Thay đổi cân nặng', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Gần đây tôi không giảm cân đáng kể, nếu có thì cũng rất ít.', score: 0 },
                { emoji: '😐', label: 'Tôi đã giảm hơn 5 pound (khoảng 2,3 kg).', score: 1 },
                { emoji: '😟', label: 'Tôi đã giảm hơn 10 pound (khoảng 4,5 kg).', score: 2 },
                { emoji: '😰', label: 'Tôi đã giảm hơn 15 pound (khoảng 6,8 kg).', score: 3 }
            ] },
            { text: 'Lo lắng về sức khỏe', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không lo lắng về sức khỏe của mình nhiều hơn bình thường.', score: 0 },
                { emoji: '😐', label: 'Tôi lo lắng về các vấn đề thể chất như đau nhức, đau đớn, khó chịu ở dạ dày hoặc táo bón.', score: 1 },
                { emoji: '😟', label: 'Tôi rất lo lắng về các vấn đề thể chất và khó nghĩ đến những chuyện khác.', score: 2 },
                { emoji: '😰', label: 'Tôi quá lo lắng về các vấn đề thể chất của mình đến mức không thể nghĩ đến bất cứ điều gì khác.', score: 3 }
            ] },
            { text: 'Hứng thú tình dục', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi không nhận thấy gần đây có bất kỳ thay đổi nào trong sự quan tâm của mình đối với tình dục.', score: 0 },
                { emoji: '😐', label: 'Tôi ít hứng thú với tình dục hơn trước đây.', score: 1 },
                { emoji: '😟', label: 'Tôi hầu như không còn hứng thú với tình dục.', score: 2 },
                { emoji: '😰', label: 'Tôi hoàn toàn mất hứng thú với tình dục.', score: 3 }
            ] }
        ],
        scoring: {
            depression: { indices: Array.from({ length: 21 }, (_, i) => i), multiplier: 1, levels: [
                { max: 10, label: 'Bình thường', class: 'level-0' },
                { max: 16, label: 'Rối loạn khí sắc nhẹ', class: 'level-1' },
                { max: 20, label: 'Trầm cảm lâm sàng mức giới hạn', class: 'level-2' },
                { max: 30, label: 'Trầm cảm mức độ vừa', class: 'level-3' },
                { max: 40, label: 'Trầm cảm nặng', class: 'level-4' },
                { max: 999, label: 'Trầm cảm rất nặng', class: 'level-5' }
            ] }
        }
    },
    psqi: {
        name: 'PSQI', fullname: 'Pittsburgh Sleep Quality Index (Bản chuẩn hóa trắc nghiệm)',
        icon: '😴', iconBg: 'var(--peach-light)', iconBorder: 'var(--kraft)',
        timeRef: '1 tháng qua', totalQ: 10, maxScore: 30,
        subscales: ['sleep'],
        questions: [
            { text: 'Bạn đánh giá chất lượng giấc ngủ tổng thể của mình ở mức nào?', cat: 'sleep', catLabel: 'Giấc ngủ', likertOptions: [{ emoji: '😀', label: 'Rất tốt', score: 0 }, { emoji: '🙂', label: 'Khá tốt', score: 1 }, { emoji: '😟', label: 'Khá kém', score: 2 }, { emoji: '😰', label: 'Rất kém', score: 3 }] },
            { text: 'Bạn thường mất bao lâu để chìm vào giấc ngủ mỗi đêm?', cat: 'sleep', catLabel: 'Giấc ngủ', likertOptions: [{ emoji: '⏱️', label: '< 15 phút', score: 0 }, { emoji: '⏱️', label: '16 - 30 phút', score: 1 }, { emoji: '⏱️', label: '31 - 60 phút', score: 2 }, { emoji: '⏱️', label: '> 60 phút', score: 3 }] },
            { text: 'Bạn thực sự ngủ được bao nhiêu tiếng mỗi đêm? (Không tính thời gian nằm trằn trọc)', cat: 'sleep', catLabel: 'Giấc ngủ', likertOptions: [{ emoji: '🛌', label: '> 7 tiếng', score: 0 }, { emoji: '🛌', label: '6 - 7 tiếng', score: 1 }, { emoji: '🛌', label: '5 - 6 tiếng', score: 2 }, { emoji: '🛌', label: '< 5 tiếng', score: 3 }] },
            { text: 'Tần suất bạn không thể chìm vào giấc ngủ trong vòng 30 phút?', cat: 'sleep', catLabel: 'Giấc ngủ' },
            { text: 'Tần suất bạn thức giấc giữa đêm hoặc dậy quá sớm vào buổi sáng?', cat: 'sleep', catLabel: 'Giấc ngủ' },
            { text: 'Tần suất bạn phải thức dậy đi lại để đi vệ sinh?', cat: 'sleep', catLabel: 'Giấc ngủ' },
            { text: 'Tần suất bạn gặp khó khăn do ho, khó thở hoặc ngáy to?', cat: 'sleep', catLabel: 'Giấc ngủ' },
            { text: 'Tần suất bạn ngủ không ngon vì gặp ác mộng, hoặc cảm thấy quá nóng/quá lạnh?', cat: 'sleep', catLabel: 'Giấc ngủ' },
            { text: 'Tần suất bạn phải dùng thuốc (được kê đơn hoặc không) để dễ ngủ?', cat: 'sleep', catLabel: 'Giấc ngủ' },
            { text: 'Tần suất bạn cảm thấy buồn ngủ, mệt mỏi vào ban ngày khi làm việc, lái xe hay giao tiếp?', cat: 'sleep', catLabel: 'Giấc ngủ' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Không bao giờ trong tháng qua', score: 0 },
            { emoji: '🟡', label: 'Tuyệt đối hiếm (< 1 lần/tuần)', score: 1 },
            { emoji: '🟠', label: 'Vài lần (1-2 lần/tuần)', score: 2 },
            { emoji: '🚨', label: 'Thường xuyên (≥ 3 lần/tuần)', score: 3 }
        ],
        scoring: {
            sleep: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 4, 'label': 'Rất tốt', 'class': 'level-0' }, { max: 7, 'label': 'Đạt tiêu chuẩn', 'class': 'level-1' }, { max: 14, 'label': 'Nguy cơ Mất ngủ', 'class': 'level-2' }, { max: 20, 'label': 'Mất ngủ trầm trọng', 'class': 'level-3' }, { max: 999, 'label': 'Đặc biệt nghiêm trọng', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    pss: {
        name: 'PSS', fullname: 'Perceived Stress Scale — Thang đo stress cảm nhận',
        icon: '😣', iconBg: 'var(--coral-light)', iconBorder: 'var(--coral)',
        timeRef: '1 tháng qua', totalQ: 10, maxScore: 40,
        subscales: ['stress'],
        questions: [
            { text: 'Bạn có thường xuyên buồn phiền vì điều gì đó bất ngờ xảy ra không?', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Bạn có thường cảm thấy mình không thể kiểm soát được những việc quan trọng trong cuộc sống của mình không?', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Bạn có thường xuyên cảm thấy lo lắng và căng thẳng không?', cat: 'stress', catLabel: 'Căng thẳng' },
            {
                text: 'Bạn cảm thấy tự tin về khả năng xử lý các vấn đề cá nhân của mình như thế nào?', cat: 'stress', catLabel: 'Căng thẳng',
                likertOptions: [
                    { emoji: '❌', label: 'Không bao giờ', score: 4 },
                    { emoji: '🔹', label: 'Hầu như không bao giờ', score: 3 },
                    { emoji: '🔸', label: 'Thỉnh thoảng', score: 2 },
                    { emoji: '🔶', label: 'Khá thường xuyên', score: 1 },
                    { emoji: '🔴', label: 'Rất thường xuyên', score: 0 }
                ]
            },
            {
                text: 'Bạn cảm thấy mọi việc diễn ra theo ý mình ở mức nào?', cat: 'stress', catLabel: 'Căng thẳng',
                likertOptions: [
                    { emoji: '❌', label: 'Không bao giờ', score: 4 },
                    { emoji: '🔹', label: 'Hầu như không bao giờ', score: 3 },
                    { emoji: '🔸', label: 'Thỉnh thoảng', score: 2 },
                    { emoji: '🔶', label: 'Khá thường xuyên', score: 1 },
                    { emoji: '🔴', label: 'Rất thường xuyên', score: 0 }
                ]
            },
            { text: 'Bạn có thấy rằng mình không thể đương đầu với tất cả những việc phải làm không?', cat: 'stress', catLabel: 'Căng thẳng' },
            {
                text: 'Bạn có thường xuyên kiểm soát được những cơn cáu gắt trong cuộc sống của bạn không?', cat: 'stress', catLabel: 'Căng thẳng',
                likertOptions: [
                    { emoji: '❌', label: 'Không bao giờ', score: 4 },
                    { emoji: '🔹', label: 'Hầu như không bao giờ', score: 3 },
                    { emoji: '🔸', label: 'Thỉnh thoảng', score: 2 },
                    { emoji: '🔶', label: 'Khá thường xuyên', score: 1 },
                    { emoji: '🔴', label: 'Rất thường xuyên', score: 0 }
                ]
            },
            {
                text: 'Bao lâu rồi bạn cảm thấy rằng mình đang ở trên đỉnh của mọi thứ?', cat: 'stress', catLabel: 'Căng thẳng',
                likertOptions: [
                    { emoji: '❌', label: 'Không bao giờ', score: 4 },
                    { emoji: '🔹', label: 'Hầu như không bao giờ', score: 3 },
                    { emoji: '🔸', label: 'Thỉnh thoảng', score: 2 },
                    { emoji: '🔶', label: 'Khá thường xuyên', score: 1 },
                    { emoji: '🔴', label: 'Rất thường xuyên', score: 0 }
                ]
            },
            { text: 'Bạn có thường tức giận vì những việc xảy ra ngoài tầm kiểm soát của mình không?', cat: 'stress', catLabel: 'Căng thẳng' },
            { text: 'Bạn có thường cảm thấy khó khăn chồng chất đến mức không thể vượt qua được?', cat: 'stress', catLabel: 'Căng thẳng' }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Không bao giờ', score: 0 },
            { emoji: '🔹', label: 'Hầu như không bao giờ', score: 1 },
            { emoji: '🔸', label: 'Thỉnh thoảng', score: 2 },
            { emoji: '🔶', label: 'Khá thường xuyên', score: 3 },
            { emoji: '🔴', label: 'Rất thường xuyên', score: 4 }
        ],
        scoring: {
            stress: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 13, 'label': 'Thấp', 'class': 'level-0' }, { max: 26, 'label': 'Trung bình', 'class': 'level-2' }, { max: 999, 'label': 'Nghiêm trọng', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    sdq25: {
        name: 'SDQ-25', fullname: 'Bảng hỏi Điểm mạnh & Khó khăn (Tự đánh giá)',
        icon: '🧒', iconBg: 'var(--sky-light)', iconBorder: 'var(--lavender)',
        timeRef: '2 tuần qua', totalQ: 25, maxScore: 40,
        subscales: ['emotional', 'conduct', 'hyperactivity', 'peer', 'prosocial'],
        questions: [
            { text: 'Em đối xử tốt với người khác, quan tâm đến cảm xúc của họ', cat: 'prosocial', catLabel: 'Xã hội tích cực' },
            { text: 'Em hay bồn chồn, quá hiếu động, không thể ngồi yên một chỗ lâu', cat: 'hyperactivity', catLabel: 'Tăng động' },
            { text: 'Em hay than phiền đau đầu, đau bụng hoặc cảm thấy ốm mệt', cat: 'emotional', catLabel: 'Cảm xúc' },
            { text: 'Em sẵn lòng chia sẻ với các bạn khác (đồ chơi, đồ ăn, bút...)', cat: 'prosocial', catLabel: 'Xã hội tích cực' },
            { text: 'Em hay nổi cơn cáu giận hoặc tức giận', cat: 'conduct', catLabel: 'Hành vi' },
            { text: 'Em khá đơn độc, thường thích chơi một mình', cat: 'peer', catLabel: 'Bạn bè' },
            {
                text: 'Nhìn chung em khá ngoan, thường làm theo lời người lớn chỉ bảo', cat: 'conduct', catLabel: 'Hành vi',
                likertOptions: [
                    { emoji: '🔲', label: 'Không đúng', score: 2 },
                    { emoji: '➖', label: 'Đúng một phần', score: 1 },
                    { emoji: '✔️', label: 'Chắc chắn đúng', score: 0 }
                ]
            },
            { text: 'Em có nhiều điều lo lắng, thường tỏ ra lo lắng', cat: 'emotional', catLabel: 'Cảm xúc' },
            { text: 'Em sẵn sàng giúp đỡ nếu có ai đó bị đau, buồn hoặc ốm', cat: 'prosocial', catLabel: 'Xã hội tích cực' },
            { text: 'Em luôn bồn chồn, ngọ nguậy tay chân liên tục, khó ngồi yên', cat: 'hyperactivity', catLabel: 'Tăng động' },
            {
                text: 'Em có ít nhất một người bạn thân', cat: 'peer', catLabel: 'Bạn bè',
                likertOptions: [
                    { emoji: '🔲', label: 'Không đúng', score: 2 },
                    { emoji: '➖', label: 'Đúng một phần', score: 1 },
                    { emoji: '✔️', label: 'Chắc chắn đúng', score: 0 }
                ]
            },
            { text: 'Em thường đánh nhau với bạn khác hoặc bắt ép bạn làm theo ý mình', cat: 'conduct', catLabel: 'Hành vi' },
            { text: 'Em thường không vui, hay buồn bã hoặc dễ khóc', cat: 'emotional', catLabel: 'Cảm xúc' },
            {
                text: 'Nhìn chung các bạn khác thích chơi cùng em', cat: 'peer', catLabel: 'Bạn bè',
                likertOptions: [
                    { emoji: '🔲', label: 'Không đúng', score: 2 },
                    { emoji: '➖', label: 'Đúng một phần', score: 1 },
                    { emoji: '✔️', label: 'Chắc chắn đúng', score: 0 }
                ]
            },
            { text: 'Em dễ bị sao nhãng, khó tập trung chú ý', cat: 'hyperactivity', catLabel: 'Tăng động' },
            { text: 'Em hồi hộp, dễ mất tự tin trong những tình huống mới', cat: 'emotional', catLabel: 'Cảm xúc' },
            { text: 'Em tử tế, thân thiện với các em nhỏ tuổi hơn', cat: 'prosocial', catLabel: 'Xã hội tích cực' },
            { text: 'Em thường bị nói là hay nói dối hoặc gian lận', cat: 'conduct', catLabel: 'Hành vi' },
            { text: 'Em hay bị bạn khác trêu chọc hoặc bắt nạt', cat: 'peer', catLabel: 'Bạn bè' },
            { text: 'Em thường tự nguyện giúp đỡ người khác (bố mẹ, thầy cô, bạn bè...)', cat: 'prosocial', catLabel: 'Xã hội tích cực' },
            {
                text: 'Em suy nghĩ kỹ hoặc cân nhắc trước khi làm một việc gì đó', cat: 'hyperactivity', catLabel: 'Tăng động',
                likertOptions: [
                    { emoji: '🔲', label: 'Không đúng', score: 2 },
                    { emoji: '➖', label: 'Đúng một phần', score: 1 },
                    { emoji: '✔️', label: 'Chắc chắn đúng', score: 0 }
                ]
            },
            { text: 'Em hay lấy những thứ không phải của mình ở nhà, trường học hoặc nơi khác', cat: 'conduct', catLabel: 'Hành vi' },
            {
                text: 'Em dễ hòa đồng với người lớn hơn là với các bạn cùng lứa', cat: 'peer', catLabel: 'Bạn bè',
                likertOptions: [
                    { emoji: '🔲', label: 'Không đúng', score: 2 },
                    { emoji: '➖', label: 'Đúng một phần', score: 1 },
                    { emoji: '✔️', label: 'Chắc chắn đúng', score: 0 }
                ]
            },
            { text: 'Em hay sợ hãi, dễ hoảng sợ', cat: 'emotional', catLabel: 'Cảm xúc' },
            {
                text: 'Em làm việc được giao đến nơi đến chốn, tập trung chú ý tốt', cat: 'hyperactivity', catLabel: 'Tăng động',
                likertOptions: [
                    { emoji: '🔲', label: 'Không đúng', score: 2 },
                    { emoji: '➖', label: 'Đúng một phần', score: 1 },
                    { emoji: '✔️', label: 'Chắc chắn đúng', score: 0 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '🔲', label: 'Không đúng', score: 0 },
            { emoji: '➖', label: 'Đúng một phần', score: 1 },
            { emoji: '✔️', label: 'Chắc chắn đúng', score: 2 }
        ],
        scoring: {
            emotional: { indices: [2, 7, 12, 15, 23], multiplier: 1, levels: [{ max: 3, 'label': 'Bình thường', 'class': 'level-0' }, { max: 10, 'label': 'Cần chú ý', 'class': 'level-2' }] },
            conduct: { indices: [4, 6, 11, 17, 21], multiplier: 1, levels: [{ max: 2, 'label': 'Bình thường', 'class': 'level-0' }, { max: 10, 'label': 'Cần chú ý', 'class': 'level-2' }] },
            hyperactivity: { indices: [1, 9, 14, 20, 24], multiplier: 1, levels: [{ max: 5, 'label': 'Bình thường', 'class': 'level-0' }, { max: 10, 'label': 'Cần chú ý', 'class': 'level-2' }] },
            peer: { indices: [5, 10, 13, 18, 22], multiplier: 1, levels: [{ max: 2, 'label': 'Bình thường', 'class': 'level-0' }, { max: 10, 'label': 'Cần chú ý', 'class': 'level-2' }] },
            prosocial: { indices: [0, 3, 8, 16, 19], multiplier: 1, levels: [{ max: 4, 'label': 'Cần hỗ trợ thêm kỹ năng xã hội', 'class': 'level-2' }, { max: 10, 'label': 'Tốt', 'class': 'level-0' }] },
            total: { indices: [2, 7, 12, 15, 23, 4, 6, 11, 17, 21, 1, 9, 14, 20, 24, 5, 10, 13, 18, 22], multiplier: 1, levels: [{ max: 15, 'label': 'Bình thường', 'class': 'level-0' }, { max: 19, 'label': 'Ranh giới', 'class': 'level-1' }, { max: 999, 'label': 'Bất thường', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    mmse: {
        name: 'MMSE', fullname: 'Mini-Mental State Exam — Trạng thái tâm thần tối thiểu',
        icon: '🧠', iconBg: 'var(--lavender-light)', iconBorder: 'var(--lavender)',
        timeRef: 'Hiện tại', totalQ: 19, maxScore: 30,
        subscales: ['total'],
        questions: [
            { text: 'Hôm nay là thứ mấy?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Hôm nay là ngày bao nhiêu?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Tháng này là tháng mấy?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Năm nay là năm nào?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Mùa này là mùa gì?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Chỗ này là chỗ nào? (tên nơi đang ở)', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Khoa gì? Tầng mấy?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Tỉnh, thành phố nào?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Miền nào? (Bắc/Trung/Nam)', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Nước nào?', cat: 'total', catLabel: 'Định hướng', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            {
                text: 'Nói to, rõ 3 từ (con mèo, cây lúa, đồng xu), yêu cầu nhắc lại ngay — nhắc đúng mấy từ?', cat: 'total', catLabel: 'Ghi nhận',
                likertOptions: [0, 1, 2, 3].map((n) => ({ emoji: '🔢', label: `Đúng ${n} từ`, score: n }))
            },
            {
                text: 'Làm phép trừ 7 liên tiếp từ 100 (100-93-86-79-72-65) — đúng mấy phép?', cat: 'total', catLabel: 'Chú ý & tính toán',
                likertOptions: [0, 1, 2, 3, 4, 5].map((n) => ({ emoji: '🔢', label: `Đúng ${n} phép`, score: n }))
            },
            {
                text: 'Yêu cầu nhớ lại 3 từ đã ghi nhận ở trên (không cần đúng thứ tự) — nhớ đúng mấy từ?', cat: 'total', catLabel: 'Nhớ lại',
                likertOptions: [0, 1, 2, 3].map((n) => ({ emoji: '🔢', label: `Nhớ đúng ${n} từ`, score: n }))
            },
            {
                text: 'Đưa và yêu cầu gọi tên 2 đồ vật (đồng hồ, cây viết) — gọi đúng mấy đồ vật?', cat: 'total', catLabel: 'Ngôn ngữ',
                likertOptions: [0, 1, 2].map((n) => ({ emoji: '🔢', label: `Đúng ${n} đồ vật`, score: n }))
            },
            { text: 'Yêu cầu nhắc lại câu: "Không có nếu và hoặc nhưng mãi"', cat: 'total', catLabel: 'Ngôn ngữ', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            {
                text: 'Yêu cầu thực hiện mệnh lệnh 3 bước: "Cầm tờ giấy bằng tay phải, gấp đôi lại, rồi đưa cho tôi" — đúng mấy bước?', cat: 'total', catLabel: 'Ngôn ngữ',
                likertOptions: [0, 1, 2, 3].map((n) => ({ emoji: '🔢', label: `Đúng ${n} bước`, score: n }))
            },
            { text: 'Yêu cầu đọc thầm và làm theo mệnh lệnh viết sẵn: "Hãy nhắm mắt lại"', cat: 'total', catLabel: 'Ngôn ngữ', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Yêu cầu viết một câu tuỳ ý (có nghĩa, đủ chủ ngữ - vị ngữ)', cat: 'total', catLabel: 'Ngôn ngữ', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] },
            { text: 'Yêu cầu vẽ lại 2 hình ngũ giác giao nhau', cat: 'total', catLabel: 'Thị giác không gian', likertOptions: [{ emoji: '❌', label: 'Sai', score: 0 }, { emoji: '✅', label: 'Đúng', score: 1 }] }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Sai', score: 0 },
            { emoji: '✅', label: 'Đúng', score: 1 }
        ],
        scoring: {
            total: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], multiplier: 1,
                levels: [
                    { max: 13, 'label': 'Suy giảm nặng', 'class': 'level-3' },
                    { max: 19, 'label': 'Suy giảm vừa', 'class': 'level-2' },
                    { max: 23, 'label': 'Suy giảm nhẹ', 'class': 'level-1' },
                    { max: 999, 'label': 'Không suy giảm nhận thức', 'class': 'level-0' }
                ]
            }
        },
        prevScores: null
    },
    isi: {
        name: 'ISI', fullname: 'Insomnia Severity Index — Mức độ mất ngủ',
        icon: '😴', iconBg: 'var(--peach-light)', iconBorder: 'var(--peach)',
        timeRef: '1 tháng qua', totalQ: 7, maxScore: 28,
        subscales: ['total'],
        questions: [
            { text: 'Khó vào giấc', cat: 'total', catLabel: 'Mất ngủ' },
            { text: 'Khó duy trì giấc', cat: 'total', catLabel: 'Mất ngủ' },
            { text: 'Tỉnh giấc quá sớm', cat: 'total', catLabel: 'Mất ngủ' },
            {
                text: 'Bạn hài lòng/không hài lòng với giấc ngủ hiện tại của mình ở mức độ nào?', cat: 'total', catLabel: 'Mất ngủ',
                likertOptions: [
                    { emoji: '😀', label: 'Rất hài lòng', score: 0 },
                    { emoji: '🙂', label: 'Hài lòng', score: 1 },
                    { emoji: '😐', label: 'Hài lòng vừa phải', score: 2 },
                    { emoji: '😟', label: 'Không hài lòng', score: 3 },
                    { emoji: '😣', label: 'Rất không hài lòng', score: 4 }
                ]
            },
            {
                text: 'Người khác nhận thấy vấn đề giấc ngủ ảnh hưởng đến chất lượng cuộc sống của bạn ở mức độ nào?', cat: 'total', catLabel: 'Mất ngủ',
                likertOptions: [
                    { emoji: '✅', label: 'Không dễ nhận thấy chút nào', score: 0 },
                    { emoji: '🟡', label: 'Dễ nhận thấy một chút', score: 1 },
                    { emoji: '🟠', label: 'Dễ nhận thấy vừa phải', score: 2 },
                    { emoji: '🔴', label: 'Rất dễ nhận thấy', score: 3 },
                    { emoji: '🚨', label: 'Cực kỳ dễ nhận thấy', score: 4 }
                ]
            },
            {
                text: 'Bạn cảm thấy lo lắng/căng thẳng với vấn đề giấc ngủ hiện tại ở mức độ nào?', cat: 'total', catLabel: 'Mất ngủ',
                likertOptions: [
                    { emoji: '✅', label: 'Không lo lắng chút nào', score: 0 },
                    { emoji: '🟡', label: 'Lo lắng một chút', score: 1 },
                    { emoji: '🟠', label: 'Lo lắng vừa phải', score: 2 },
                    { emoji: '🔴', label: 'Rất lo lắng', score: 3 },
                    { emoji: '🚨', label: 'Cực kỳ lo lắng', score: 4 }
                ]
            },
            {
                text: 'Vấn đề giấc ngủ đang ảnh hưởng đến hoạt động hằng ngày của bạn (mệt mỏi, giảm tập trung...) ở mức độ nào?', cat: 'total', catLabel: 'Mất ngủ',
                likertOptions: [
                    { emoji: '✅', label: 'Không ảnh hưởng chút nào', score: 0 },
                    { emoji: '🟡', label: 'Ảnh hưởng một chút', score: 1 },
                    { emoji: '🟠', label: 'Ảnh hưởng vừa phải', score: 2 },
                    { emoji: '🔴', label: 'Ảnh hưởng rất nhiều', score: 3 },
                    { emoji: '🚨', label: 'Ảnh hưởng cực kỳ nhiều', score: 4 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Không', score: 0 },
            { emoji: '🟡', label: 'Nhẹ', score: 1 },
            { emoji: '🟠', label: 'Vừa', score: 2 },
            { emoji: '🔴', label: 'Nặng', score: 3 },
            { emoji: '🚨', label: 'Rất nặng', score: 4 }
        ],
        scoring: {
            total: { indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1, levels: [{ max: 7, 'label': 'Không có mất ngủ', 'class': 'level-0' }, { max: 14, 'label': 'Mất ngủ nhẹ', 'class': 'level-1' }, { max: 21, 'label': 'Mất ngủ trung bình', 'class': 'level-2' }, { max: 999, 'label': 'Mất ngủ nghiêm trọng', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    iat: {
        name: 'IAT', fullname: 'Internet Addiction Test — Mức độ nghiện Internet',
        icon: '📱', iconBg: 'var(--sky-light)', iconBorder: 'var(--sky)',
        timeRef: '1 tháng qua', totalQ: 20, maxScore: 100,
        subscales: ['total'],
        questions: [
            { text: 'Bạn thường thấy rằng mình sử dụng internet nhiều hơn dự định', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường bỏ bê công việc gia đình để dành nhiều thời gian hơn sử dụng internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường thích thú với internet hơn là thân thiết với bạn bè', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường có các mối quan hệ mới với những người sử dụng internet khác', cat: 'total', catLabel: 'Internet' },
            { text: 'Những người xung quanh bạn thường xuyên phàn nàn về thời lượng bạn sử dụng internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Điểm số hoặc công việc của bạn thường xuyên bị ảnh hưởng vì lượng thời gian bạn dành cho internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường kiểm tra email trước khi làm việc khác', cat: 'total', catLabel: 'Internet' },
            { text: 'Hiệu suất và năng suất công việc của bạn thường xuyên bị ảnh hưởng vì internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường đề phòng hoặc bí mật khi ai đó hỏi bạn đã làm những gì trên internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường loại bỏ những suy nghĩ buồn phiền trong cuộc sống bằng những suy nghĩ nhẹ nhàng về internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường mong chờ đến lúc được sử dụng internet lại', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường lo sợ rằng cuộc sống không có internet sẽ buồn chán, trống rỗng và không có niềm vui', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường cáu kỉnh, la hét hoặc tỏ ra khó chịu khi có ai đó làm phiền lúc bạn đang sử dụng internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường xuyên bị mất ngủ vì sử dụng internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường cảm thấy suy nghĩ nhiều về internet khi không online, hoặc tưởng tượng về việc đang sử dụng internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường tự nói "chỉ vài phút nữa thôi" khi đang sử dụng internet', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường cố gắng cắt giảm thời gian sử dụng internet và thất bại', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường cố giấu việc mình đã sử dụng internet bao lâu', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường chọn dành thời gian sử dụng internet nhiều hơn là đi chơi với người khác', cat: 'total', catLabel: 'Internet' },
            { text: 'Bạn thường cảm thấy chán nản, ủ rũ hoặc lo lắng khi không sử dụng internet, và cảm giác này biến mất khi dùng internet trở lại', cat: 'total', catLabel: 'Internet' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Không bao giờ', score: 0 },
            { emoji: '🔹', label: 'Hiếm khi', score: 1 },
            { emoji: '🔸', label: 'Thỉnh thoảng', score: 2 },
            { emoji: '🟠', label: 'Thường xuyên', score: 3 },
            { emoji: '🔴', label: 'Rất thường xuyên', score: 4 },
            { emoji: '🚨', label: 'Luôn luôn', score: 5 }
        ],
        scoring: {
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], multiplier: 1, levels: [{ max: 30, 'label': 'Sử dụng internet bình thường', 'class': 'level-0' }, { max: 49, 'label': 'Phụ thuộc nhẹ vào internet', 'class': 'level-1' }, { max: 79, 'label': 'Phụ thuộc vừa vào internet', 'class': 'level-2' }, { max: 999, 'label': 'Phụ thuộc nghiêm trọng vào internet', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    audit: {
        name: 'AUDIT', fullname: 'Alcohol Use Disorders Identification Test — Mức độ sử dụng rượu bia',
        icon: '🍺', iconBg: 'var(--kraft-light)', iconBorder: 'var(--kraft)',
        timeRef: '12 tháng qua', totalQ: 10, maxScore: 36,
        subscales: ['total'],
        questions: [
            {
                text: 'Mức độ uống rượu/bia của bạn trong 12 tháng vừa qua?', cat: 'total', catLabel: 'Rượu bia',
                likertOptions: [
                    { emoji: '✅', label: 'Chưa bao giờ', score: 0 },
                    { emoji: '🔹', label: 'Ít hơn 1 lần/tháng', score: 1 },
                    { emoji: '🔸', label: '2-4 lần/tháng', score: 2 },
                    { emoji: '🟠', label: '2-3 lần/tuần', score: 3 },
                    { emoji: '🔴', label: '≥4 lần/tuần', score: 4 }
                ]
            },
            {
                text: 'Trong một ngày có uống rượu/bia, bạn thường uống bao nhiêu đơn vị? (1 đơn vị = 1 lon/chai bia, 1 cốc rượu vang 120ml, hay 1 chén rượu mạnh 30ml)', cat: 'total', catLabel: 'Rượu bia',
                likertOptions: [
                    { emoji: '✅', label: '1-2 đơn vị', score: 0 },
                    { emoji: '🔹', label: '3-4 đơn vị', score: 1 },
                    { emoji: '🔸', label: '5-6 đơn vị', score: 2 },
                    { emoji: '🟠', label: '7-9 đơn vị', score: 3 },
                    { emoji: '🔴', label: '≥10 đơn vị', score: 4 }
                ]
            },
            { text: 'Tần suất uống từ 6 đơn vị rượu/bia trở lên trong 1 lần uống', cat: 'total', catLabel: 'Rượu bia' },
            { text: 'Tần suất bạn nhận thấy mình không thể tự dừng uống khi đã bắt đầu', cat: 'total', catLabel: 'Rượu bia' },
            { text: 'Tần suất bạn không làm được những việc đã dự định làm vì uống rượu/bia', cat: 'total', catLabel: 'Rượu bia' },
            { text: 'Tần suất buổi sáng ngay sau khi thức dậy bạn cần uống ngay một cốc rượu/bia trước khi nghĩ đến việc khác', cat: 'total', catLabel: 'Rượu bia' },
            { text: 'Tần suất bạn cảm thấy mắc lỗi hoặc áy náy/day dứt/lo lắng về việc uống rượu/bia của bản thân', cat: 'total', catLabel: 'Rượu bia' },
            { text: 'Tần suất bạn ở trong trạng thái sau khi uống rượu/bia không thể nhớ được chuyện gì đã xảy ra trước đó', cat: 'total', catLabel: 'Rượu bia' },
            {
                text: 'Từ trước đến nay, bạn đã bao giờ bị thương do uống rượu/bia chưa?', cat: 'total', catLabel: 'Rượu bia',
                likertOptions: [
                    { emoji: '✅', label: 'Chưa bao giờ', score: 0 },
                    { emoji: '🟡', label: 'Có, nhưng không phải trong năm vừa qua', score: 1 },
                    { emoji: '🔴', label: 'Có, trong năm vừa qua', score: 2 }
                ]
            },
            {
                text: 'Từ trước đến nay, có người thân/bạn bè/bác sĩ nào lo ngại về việc sử dụng rượu/bia của bạn và đề nghị bạn giảm uống không?', cat: 'total', catLabel: 'Rượu bia',
                likertOptions: [
                    { emoji: '✅', label: 'Chưa bao giờ', score: 0 },
                    { emoji: '🟡', label: 'Có, nhưng không phải trong năm vừa qua', score: 1 },
                    { emoji: '🔴', label: 'Có, trong năm vừa qua', score: 2 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Không bao giờ', score: 0 },
            { emoji: '🔹', label: 'Ít hơn 1 lần/tháng', score: 1 },
            { emoji: '🔸', label: 'Hàng tháng', score: 2 },
            { emoji: '🟠', label: 'Hàng tuần', score: 3 },
            { emoji: '🔴', label: 'Hàng ngày hoặc gần như hàng ngày', score: 4 }
        ],
        scoring: {
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 7, 'label': 'Uống rượu bia hợp lý, nguy cơ thấp', 'class': 'level-0' }, { max: 15, 'label': 'Uống rượu bia ở mức nguy cơ', 'class': 'level-1' }, { max: 19, 'label': 'Uống rượu bia ở mức có hại', 'class': 'level-2' }, { max: 999, 'label': 'Nghiện hoặc lệ thuộc rượu bia', 'class': 'level-3' }] }
        },
        prevScores: null
    }
};
