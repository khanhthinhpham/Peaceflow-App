// Dữ liệu + thuật toán chấm Raven CPM — trích xuất nguyên văn từ frontend/pages/raven-test.html

const SETS = [
    { prefix: 'A', count: 12 },
    { prefix: 'AB', count: 12 },
    { prefix: 'B', count: 12 }
];

const ITEMS = SETS.flatMap((set) => Array.from({ length: set.count }, (_, i) => ({
    key: `${set.prefix}${i + 1}`,
    image: `/assets/raven/${set.prefix}${i + 1}.png`
})));

// Đáp án đúng (Bảng 1. TEST RAVEN MÀU - KEYS) — theo file "Key test Raven.docx".
const RAVEN_ANSWER_KEY = {
    A: [4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 5, 4],
    AB: [4, 5, 1, 6, 2, 1, 3, 4, 6, 3, 5, 2],
    B: [2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5]
};

// 11 mốc tuổi (tính theo tháng) dùng để tra bảng chuẩn hoá — "KHÓA ĐIỂM RAVEN
// MÀU – TRẺ EM – 2008". Trắc nghiệm chỉ được chuẩn hoá cho trẻ 4-11 tuổi.
const RAVEN_AGE_BRACKETS = [
    { minM: 48, maxM: 53 },   // 4y0m - 4y5m
    { minM: 54, maxM: 59 },   // 4y6m - 4y11m
    { minM: 60, maxM: 65 },   // 5y0m - 5y5m
    { minM: 66, maxM: 71 },   // 5y6m - 5y11m
    { minM: 72, maxM: 77 },   // 6y0m - 6y5m
    { minM: 78, maxM: 83 },   // 6y6m - 6y11m
    { minM: 84, maxM: 95 },   // 7y0m - 7y11m
    { minM: 96, maxM: 107 },  // 8y0m - 8y11m
    { minM: 108, maxM: 119 }, // 9y0m - 9y11m
    { minM: 120, maxM: 131 }, // 10y0m - 10y11m
    { minM: 132, maxM: 143 }  // 11y0m - 11y11m
];

// Mỗi dòng: điểm chuẩn (Standard Score), % Rank, và điểm thô tương ứng cho từng
// mốc tuổi ở trên (theo đúng thứ tự 11 cột trong bảng KHÓA ĐIỂM).
const RAVEN_NORM_TABLE = [
    { ss: 59, label: '<60', pctl: 0.1, values: ['1-6', '1-6', '1-7', '1-7', '1-8', '1-8', '1-11', '1-14', '1-16', '1-18', '1-20'] },
    { ss: 60, label: '60', pctl: 0.4, values: ['7', '7', '8', '8', '9', '9', '12', '15', '17', '19', '21'] },
    { ss: 65, label: '65', pctl: 1, values: ['8', '8', '9', '9', '10', '10', '13', '16-17', '18', '20', '22-23'] },
    { ss: 70, label: '70', pctl: 2.3, values: ['9', '9', '10', '10', '11', '11', '14-15', '18-19', '19', '21', '24-25'] },
    { ss: 75, label: '75', pctl: 5, values: ['10', '10', '11', '11', '12', '12-13', '16-17', '20-21', '20-21', '22-23', '26-27'] },
    { ss: 80, label: '80', pctl: 9, values: ['11', '11', '12', '12', '13-14', '14-15', '18-19', '22-23', '22-23', '24-25', '28'] },
    { ss: 85, label: '85', pctl: 16, values: ['12', '12', '13', '13', '15-16', '16-17', '20-21', '24-25', '24-25', '26-27', '29'] },
    { ss: 90, label: '90', pctl: 25, values: ['13', '13', '14-15', '14-15', '17-18', '18-19', '22-23', '26', '26-27', '28-29', '30'] },
    { ss: 95, label: '95', pctl: 37, values: ['14', '14', '16', '16-17', '19', '20-21', '24-25', '27', '28', '30', '31-32'] },
    { ss: 100, label: '100', pctl: 50, values: ['15', '15', '17-18', '18', '20-21', '22-23', '26-27', '28', '29-30', '31-32', '33'] },
    { ss: 105, label: '105', pctl: 63, values: ['16', '16-17', '19', '19', '22-23', '24-25', '28', '29', '31', '33', '-'] },
    { ss: 110, label: '110', pctl: 75, values: ['17', '18-19', '20-21', '20-21', '24-25', '26-27', '29', '30', '32', '-', '34'] },
    { ss: 115, label: '115', pctl: 84, values: ['18', '20-21', '22-23', '22-23', '26-27', '28', '30-31', '31', '33', '34', '35'] },
    { ss: 120, label: '120', pctl: 91, values: ['19', '22-23', '24', '24-25', '28', '29', '32', '32', '34', '35', '-'] },
    { ss: 125, label: '125', pctl: 95, values: ['20-21', '24', '25-26', '26-27', '29', '30-31', '33', '33', '35', '36', '36'] },
    { ss: 130, label: '130', pctl: 97.7, values: ['22', '25', '27-28', '28-29', '30-31', '32', '34', '34', '-', '-', '-'] },
    { ss: 135, label: '135', pctl: 99, values: ['23-24', '26', '29', '30', '32', '33', '35', '35', '36', '-', '-'] },
    { ss: 140, label: '140', pctl: 99.6, values: ['25', '27-29', '30-31', '31', '33', '34', '36', '36', '-', '-', '-'] },
    { ss: 145, label: '>140', pctl: 99.9, values: ['26-36', '30-36', '32-36', '32-36', '34-36', '35-36', '-', '-', '-', '-', '-'] }
];

const RAVEN_IQ_BANDS = [
    { max: 69, label: 'Có khuyết tật trí tuệ' },
    { max: 79, label: 'Trạng thái ranh giới' },
    { max: 89, label: 'Chỉ số dưới trung bình' },
    { max: 109, label: 'Chỉ số trung bình' },
    { max: 119, label: 'Chỉ số thông minh' },
    { max: 129, label: 'Chỉ số xuất sắc' },
    { max: 999, label: 'Chỉ số rất xuất sắc' }
];

function ravenParseRange(str) {
    if (!str || str === '-') return null;
    const parts = str.split('-').map((s) => Number(s.trim()));
    return parts.length === 1 ? [parts[0], parts[0]] : [parts[0], parts[1]];
}

function ravenFindAgeBracketIndex(totalMonths) {
    const idx = RAVEN_AGE_BRACKETS.findIndex((b) => totalMonths >= b.minM && totalMonths <= b.maxM);
    if (idx >= 0) return idx;
    return totalMonths < RAVEN_AGE_BRACKETS[0].minM ? -1 : (totalMonths > RAVEN_AGE_BRACKETS[RAVEN_AGE_BRACKETS.length - 1].maxM ? -2 : 0);
}

// Tính điểm thô (số câu đúng) theo đáp án gốc, rồi quy đổi sang Standard Score/IQ
// theo đúng độ tuổi (nếu có đủ thông tin tuổi và tuổi nằm trong phạm vi 4-11).
function scoreRavenTest(choices, ageYears, ageMonthsExtra) {
    const bySet = { A: 0, AB: 0, B: 0 };
    let rawTotal = 0;
    ITEMS.forEach((item, i) => {
        const setKey = item.key.replace(/\d+$/, '');
        const itemIndex = Number(item.key.replace(/^\D+/, '')) - 1;
        const correctAnswer = RAVEN_ANSWER_KEY[setKey][itemIndex];
        if (choices[i] === correctAnswer) {
            bySet[setKey] += 1;
            rawTotal += 1;
        }
    });

    const result = {
        rawTotal,
        bySet,
        standardScore: null,
        percentile: null,
        iqLabel: null,
        ageBracketNote: null
    };

    const age = Number(ageYears);
    if (!Number.isFinite(age) || age <= 0) {
        result.ageBracketNote = 'Chưa có tuổi — chỉ tính được điểm thô, chưa quy đổi ra chỉ số IQ.';
        return result;
    }

    const months = Number(ageMonthsExtra) || 0;
    const totalMonths = Math.round(age * 12 + months);
    const bracketIdx = ravenFindAgeBracketIndex(totalMonths);

    if (bracketIdx === -1) {
        result.ageBracketNote = 'Trẻ dưới 4 tuổi — ngoài phạm vi chuẩn hoá của Raven CPM, chỉ tính điểm thô.';
        return result;
    }
    if (bracketIdx === -2) {
        result.ageBracketNote = 'Trên 11 tuổi — ngoài phạm vi chuẩn hoá của Raven CPM, chỉ tính điểm thô.';
        return result;
    }

    let matchedRow = null;
    for (const row of RAVEN_NORM_TABLE) {
        const range = ravenParseRange(row.values[bracketIdx]);
        if (!range) continue;
        if (rawTotal <= range[1]) { matchedRow = row; break; }
    }
    if (!matchedRow) matchedRow = RAVEN_NORM_TABLE[RAVEN_NORM_TABLE.length - 1];

    result.standardScore = matchedRow.ss;
    result.percentile = matchedRow.pctl;
    const iqBand = RAVEN_IQ_BANDS.find((b) => matchedRow.ss <= b.max) || RAVEN_IQ_BANDS[RAVEN_IQ_BANDS.length - 1];
    result.iqLabel = iqBand.label;

    return result;
}

export { SETS, ITEMS, RAVEN_ANSWER_KEY, RAVEN_AGE_BRACKETS, RAVEN_NORM_TABLE, RAVEN_IQ_BANDS, scoreRavenTest };
