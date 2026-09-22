// Group 5 (English) — clinician-administered rating scales (source: Vietnamese Ministry of
// Health mental-health clinical procedure guideline). Same shape/key order/indices/scores/
// classes as group5_vi.js — only human-readable text is translated.
//
// Only 3/5 scales are encoded here: aims, hachinski, himmelbach.
// `barnes` and `ciwa` are NOT encoded (see group5_meta.md for full reasoning and structure):
// both mix items with different maximum per-item scores within a single test, and the engine's
// shared `likertOptions` (one option list applied to every item) only produces correct scores
// when every item shares one numeric scale. Forcing them into the standard shape would allow
// invalid/over-range scores (e.g. CIWA's Orientation item is 0-4 but would inherit a shared
// 0-7 option list) — this could misclassify alcohol-withdrawal or akathisia severity, a real
// clinical-safety concern.
//
// For `hachinski` and `himmelbach`: each item is a yes/no checklist criterion with a per-item
// point WEIGHT (1, 2, or 3 if present). Since the engine sums answers[idx] once per entry in
// the `indices` array (no per-item multiplier), an item's index is repeated N times in
// `indices` so it contributes exactly N points when answered "Yes" — this is an EXACT
// arithmetic transformation, not an approximation.

export const GROUP5_TESTS = {
    aims: {
        name: 'AIMS', fullname: 'Abnormal Involuntary Movement Scale',
        icon: '🕺', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Current', totalQ: 10, maxScore: 40,
        subscales: ['orofacial', 'extremity', 'trunk', 'global'],
        questions: [
            { text: 'Facial expression muscles: movements of forehead, eyebrows, periorbital area, cheeks… including frowning, blinking, grimacing', cat: 'orofacial', catLabel: 'Facial & Oral Movements' },
            { text: 'Lips and perioral area: puckering, pouting', cat: 'orofacial', catLabel: 'Facial & Oral Movements' },
            { text: 'Jaw: biting, clenching, chewing, mouth opening, lateral movement', cat: 'orofacial', catLabel: 'Facial & Oral Movements' },
            { text: 'Tongue: increased movement in and out of the mouth, inability to sustain movement', cat: 'orofacial', catLabel: 'Facial & Oral Movements' },
            { text: 'Upper extremities (arms, wrists, hands, fingers): including choreic movements (rapid, purposeless, irregular) or athetoid movements (slow, irregular, complex, serpentine); excludes tremor', cat: 'extremity', catLabel: 'Extremity Movements' },
            { text: 'Lower extremities (legs, knees, ankles, toes): lateral knee movement, foot tapping, heel dropping, foot squirming, inversion and eversion of the foot', cat: 'extremity', catLabel: 'Extremity Movements' },
            { text: 'Neck, shoulders, hips: rocking, twisting, squirming, pelvic gyrations; includes diaphragmatic movement', cat: 'trunk', catLabel: 'Trunk Movement' },
            { text: 'Overall severity of the abnormal movements, based on the single highest score observed among the items above', cat: 'global', catLabel: 'Global Judgments' },
            { text: 'Degree of incapacitation due to abnormal movements (0: None/normal, 1: Minimal, 2: Mild, 3: Moderate, 4: Severe)', cat: 'global', catLabel: 'Global Judgments' },
            { text: "Patient's awareness of the abnormal movements and associated distress (0: Not aware, 1: Aware - no distress, 2: Aware - mild distress, 3: Aware - moderate distress, 4: Aware - severe distress)", cat: 'global', catLabel: 'Global Judgments' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'None', score: 0 },
            { emoji: '🟡', label: 'Minimal', score: 1 },
            { emoji: '🟠', label: 'Mild', score: 2 },
            { emoji: '🔴', label: 'Moderate', score: 3 },
            { emoji: '🚨', label: 'Severe', score: 4 }
        ],
        scoring: {
            orofacial: { indices: [0, 1, 2, 3], multiplier: 1, levels: [{ max: 999, 'label': 'Facial & Oral Movements', 'class': 'level-1' }] },
            extremity: { indices: [4, 5], multiplier: 1, levels: [{ max: 999, 'label': 'Extremity Movements', 'class': 'level-2' }] },
            trunk: { indices: [6], multiplier: 1, levels: [{ max: 999, 'label': 'Trunk Movement', 'class': 'level-3' }] },
            global: { indices: [7, 8, 9], multiplier: 1, levels: [{ max: 999, 'label': 'Global Judgments', 'class': 'level-4' }] },
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 999, 'label': 'AIMS total score (for monitoring clinical course — source gives no severity cutoffs)', 'class': 'level-1' }] }
        },
        prevScores: null
    },
    hachinski: {
        name: 'HACHINSKI', fullname: 'Hachinski Ischemic Score',
        icon: '🩸', iconBg: 'var(--coral-light)', iconBorder: 'var(--coral)',
        timeRef: 'Current', totalQ: 13, maxScore: 18,
        subscales: ['ischemic'],
        questions: [
            { text: 'Abrupt onset of symptoms', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Stepwise deterioration (e.g., decline - plateau - decline)', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Fluctuating course', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Nocturnal confusion', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Relative preservation of personality', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Depression', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Somatic complaints (e.g., body aches, chest pain)', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Emotional incontinence', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'History of hypertension', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'History of stroke', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Evidence of associated atherosclerosis (e.g., peripheral arterial disease [PAD], myocardial infarction [MI])', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Focal neurological symptoms (e.g., hemiparesis, homonymous hemianopia, aphasia)', cat: 'ischemic', catLabel: 'Ischemic Score' },
            { text: 'Focal neurological signs (e.g., unilateral weakness, sensory loss, asymmetric reflexes, Babinski sign)', cat: 'ischemic', catLabel: 'Ischemic Score' }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Absent', score: 0 },
            { emoji: '✅', label: 'Present', score: 1 }
        ],
        scoring: {
            // Source weights: items 0,2,9,11,12 = 2 points; remaining items = 1 point.
            // An index repeated N times = that item's weight N (see file header note).
            ischemic: { indices: [0, 0, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 9, 10, 11, 11, 12, 12], multiplier: 1, levels: [{ max: 3, 'label': 'Suggestive of primary (Alzheimer-type) dementia', 'class': 'level-0' }, { max: 7, 'label': 'Indeterminate / Mixed dementia', 'class': 'level-2' }, { max: 999, 'label': 'Suggestive of vascular dementia', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    himmelbach: {
        name: 'HIMMELBACH', fullname: 'Himmelbach Withdrawal Scale',
        icon: '💉', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: 'Current', totalQ: 12, maxScore: 24,
        subscales: ['withdrawal'],
        questions: [
            { text: 'Yawning', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Lacrimation, rhinorrhea', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Increased body temperature', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Sweating, chills, piloerection (goosebumps)', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Drug craving', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Joint/muscle aches, abdominal cramping', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Insomnia', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Diarrhea', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Tachycardia (> 90 beats/min)', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Nausea, vomiting', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Paresthesia (formication - crawling sensation under the skin/in the bones)', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' },
            { text: 'Mydriasis (pupil dilation)', cat: 'withdrawal', catLabel: 'Withdrawal Syndrome' }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Absent', score: 0 },
            { emoji: '✅', label: 'Present', score: 1 }
        ],
        scoring: {
            // Source weights: items 0,1,2 = 1 point; items 3-8 = 2 points; items 9,10,11 = 3 points.
            // An index repeated N times = that item's weight N (see file header note).
            withdrawal: { indices: [0, 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11], multiplier: 1, levels: [{ max: 7, 'label': 'Mild withdrawal', 'class': 'level-1' }, { max: 16, 'label': 'Moderate withdrawal', 'class': 'level-2' }, { max: 999, 'label': 'Severe withdrawal', 'class': 'level-3' }] }
        },
        prevScores: null
    }
};


