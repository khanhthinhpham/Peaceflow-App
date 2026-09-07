// English version of assessmentMeta.js — same shape/keys/badge styling, translated text only.
// Kept in sync manually with assessmentMeta.js: id/apiCode/icon/cardClass/iconStyle/className
// must stay identical (they're layout/matching keys, not display text).

export const ASSESSMENT_META = {
    dass21: {
        apiCode: 'DASS21',
        name: 'DASS-21',
        fullname: 'Depression Anxiety Stress Scales',
        icon: '📊',
        cardClass: 'dass',
        iconStyle: 'background:var(--peach-light);border-color:var(--peach);',
        desc: 'Assesses three dimensions at once: Depression, Anxiety, and Stress.',
        badges: [
            { className: 'badge-peach', label: '21 questions' },
            { className: 'badge-mint', label: '~8 min' },
            { style: 'background:var(--sky-light);color:#4a90aa;border:1.5px solid var(--sky);', label: 'Every 2 weeks' }
        ]
    },
    gad7: {
        apiCode: 'GAD7',
        name: 'GAD-7',
        fullname: 'Generalized Anxiety Disorder 7-item',
        icon: '😰',
        cardClass: 'gad',
        iconStyle: 'background:var(--sky-light);border-color:var(--sky);',
        desc: 'Assesses general anxiety with a short scale you can easily repeat weekly.',
        badges: [
            { className: 'badge-sky', label: '7 questions' },
            { className: 'badge-mint', label: '~3 min' },
            { className: 'badge-mint', label: 'Weekly' }
        ]
    },
    hars: {
        apiCode: 'HARS',
        name: 'HARS',
        fullname: 'Hamilton Anxiety Rating Scale',
        icon: '🧠',
        cardClass: 'hars',
        iconStyle: 'background:var(--lavender-light);border-color:var(--lavender);',
        desc: 'Assesses anxiety across both psychological and physical symptoms.',
        badges: [
            { className: 'badge-lavender', label: '14 questions' },
            { className: 'badge-mint', label: '~6 min' },
            { style: 'background:var(--lavender-light);color:#8a6aaa;border:1.5px solid var(--lavender);', label: 'When you need more depth' }
        ]
    },
    phq9: {
        apiCode: 'PHQ9',
        name: 'PHQ-9',
        fullname: 'Patient Health Questionnaire-9',
        icon: '🌧️',
        cardClass: 'phq',
        iconStyle: 'background:var(--mint-light);border-color:var(--mint);',
        desc: 'Screens and rates the severity of depression using a standard scale.',
        badges: [
            { className: 'badge-mint', label: '9 questions' },
            { className: 'badge-mint', label: '~4 min' },
            { className: 'badge-peach', label: 'Every 2 weeks' }
        ]
    },
    bdi: {
        apiCode: 'BDI',
        name: 'BDI',
        fullname: 'Beck Depression Inventory',
        icon: '🌧️',
        cardClass: 'phq',
        iconStyle: 'background:var(--mint-light);border-color:var(--mint);',
        desc: 'An in-depth look at depression severity across 21 areas — emotional, physical, and behavioral.',
        badges: [
            { className: 'badge-mint', label: '21 questions' },
            { className: 'badge-mint', label: '~8 min' },
            { className: 'badge-peach', label: 'As needed' }
        ]
    },
    psqi: {
        apiCode: 'PSQI',
        name: 'PSQI',
        fullname: 'Pittsburgh Sleep Quality Index',
        icon: '😴',
        cardClass: 'psqi',
        iconStyle: 'background:var(--peach-light);border-color:var(--kraft);',
        desc: 'Assesses sleep quality over the past month.',
        badges: [
            { className: 'badge-peach', label: '10 questions' },
            { className: 'badge-mint', label: '~5 min' },
            { style: 'background:var(--kraft-light);color:var(--kraft-dark);border:1.5px solid var(--kraft);', label: 'Monthly' }
        ]
    },
    pss: {
        apiCode: 'PSS',
        name: 'PSS',
        fullname: 'Perceived Stress Scale',
        icon: '😣',
        cardClass: 'pss',
        iconStyle: 'background:var(--coral-light);border-color:var(--coral);',
        desc: 'Assesses how stressed you have felt over the past month.',
        badges: [
            { className: 'badge-peach', label: '10 questions' },
            { className: 'badge-mint', label: '~4 min' },
            { style: 'background:var(--kraft-light);color:var(--kraft-dark);border:1.5px solid var(--kraft);', label: 'Monthly' }
        ]
    },
    sdq25: {
        apiCode: 'SDQ25',
        name: 'SDQ-25',
        fullname: 'Strengths and Difficulties Questionnaire (Self-report)',
        icon: '🧒',
        cardClass: 'sdq',
        iconStyle: 'background:var(--sky-light);border-color:var(--lavender);',
        desc: 'Screens emotional and behavioral strengths and difficulties for teens.',
        badges: [
            { className: 'badge-sky', label: '25 questions' },
            { className: 'badge-mint', label: '~10 min' },
            { className: 'badge-lavender', label: 'Teens' }
        ]
    },
    mmse: {
        apiCode: 'MMSE',
        name: 'MMSE',
        fullname: 'Mini-Mental State Exam',
        icon: '🧠',
        cardClass: 'mmse',
        iconStyle: 'background:var(--lavender-light);border-color:var(--lavender);',
        desc: 'Assesses cognitive function — orientation, memory, attention, language — commonly used for older adults.',
        badges: [
            { className: 'badge-lavender', label: '19 questions' },
            { className: 'badge-mint', label: '~10 min' },
            { style: 'background:var(--lavender-light);color:#8a6aaa;border:1.5px solid var(--lavender);', label: 'Older adults' }
        ]
    },
    isi: {
        apiCode: 'ISI',
        name: 'ISI',
        fullname: 'Insomnia Severity Index',
        icon: '😴',
        cardClass: 'isi',
        iconStyle: 'background:var(--peach-light);border-color:var(--peach);',
        desc: 'Assesses the severity and impact of insomnia over the past month.',
        badges: [
            { className: 'badge-peach', label: '7 questions' },
            { className: 'badge-mint', label: '~3 min' },
            { className: 'badge-peach', label: 'Monthly' }
        ]
    },
    iat: {
        apiCode: 'IAT',
        name: 'IAT',
        fullname: 'Internet Addiction Test',
        icon: '📱',
        cardClass: 'iat',
        iconStyle: 'background:var(--sky-light);border-color:var(--sky);',
        desc: 'Assesses internet addiction over the past month.',
        badges: [
            { className: 'badge-sky', label: '20 questions' },
            { className: 'badge-mint', label: '~7 min' },
            { className: 'badge-sky', label: 'Monthly' }
        ]
    },
    audit: {
        apiCode: 'AUDIT',
        name: 'AUDIT',
        fullname: 'Alcohol Use Disorders Identification Test',
        icon: '🍺',
        cardClass: 'audit',
        iconStyle: 'background:var(--kraft-light);border-color:var(--kraft);',
        desc: 'Screens alcohol use over the past 12 months (WHO).',
        badges: [
            { className: 'badge-peach', label: '10 questions' },
            { className: 'badge-mint', label: '~5 min' },
            { style: 'background:var(--kraft-light);color:var(--kraft-dark);border:1.5px solid var(--kraft);', label: 'Every 12 months' }
        ]
    }
};
