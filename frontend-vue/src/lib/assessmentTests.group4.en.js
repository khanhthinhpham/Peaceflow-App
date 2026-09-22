// Group 4 — English mirror of group4_vi.js. Same shape/key order/indices/scores/classes —
// only human-readable text (fullname, timeRef, question text/catLabel, likertOptions labels,
// scoring level labels) is translated. Item names use the standard, internationally recognized
// English wording for CGI-S / BPRS / PANSS. Keep manually in sync with group4_vi.js.
// See group4_vi.js header comment for the scoring-conversion rationale (integer multiplier +
// scaled thresholds instead of fractional averaging; PANSS has no source severity bands).

export const TESTS = {
    cgis: {
        name: 'CGI-S', fullname: 'Clinical Global Impression - Severity Scale',
        icon: '🎯', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: 'Past 7 days', totalQ: 7, maxScore: 49,
        subscales: ['severity'],
        questions: [
            { text: "The patient's verbal report of symptom severity during the interview", cat: 'severity', catLabel: 'Severity' },
            { text: "The patient's verbal report of their functional status (mobility, daily activities…)", cat: 'severity', catLabel: 'Severity' },
            { text: "Behavioral aspects observed by the examining clinician/staff", cat: 'severity', catLabel: 'Severity' },
            { text: 'Objective rating from a questionnaire (e.g., HDRS/Hamilton score)', cat: 'severity', catLabel: 'Severity' },
            { text: 'Subjective rating from a questionnaire (e.g., BECK score)', cat: 'severity', catLabel: 'Severity' },
            { text: 'Severity of side effects experienced by the patient', cat: 'severity', catLabel: 'Severity' },
            { text: "Comments on the patient from family, healthcare staff, or a prior caregiver", cat: 'severity', catLabel: 'Severity' }
        ],
        likertOptions: [
            { emoji: '✅', label: '1 = Normal — not ill; no psychiatric symptoms in the past 7 days', score: 1 },
            { emoji: '🔹', label: '2 = Borderline — suspected psychiatric pathology', score: 2 },
            { emoji: '🟡', label: '3 = Mildly ill — mild symptoms clearly present, some distress, possible mild social/occupational difficulty', score: 3 },
            { emoji: '🟠', label: '4 = Moderately ill — more pronounced symptoms, noticeable but not severe, some social/occupational impairment, may warrant medication', score: 4 },
            { emoji: '🔶', label: '5 = Markedly ill — clearly impairs social/occupational function or causes marked distress', score: 5 },
            { emoji: '🔴', label: '6 = Severely ill — clearly affects behavior and function, may need help from others', score: 6 },
            { emoji: '🚨', label: '7 = Among the most extremely ill — seriously affects many life functions, may require hospitalization', score: 7 }
        ],
        scoring: {
            severity: {
                indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1,
                levels: [
                    { max: 13.3, 'label': 'Normal', 'class': 'level-0' },
                    { max: 20.3, 'label': 'Borderline', 'class': 'level-1' },
                    { max: 27.3, 'label': 'Mildly ill', 'class': 'level-1' },
                    { max: 34.3, 'label': 'Moderately ill', 'class': 'level-2' },
                    { max: 41.3, 'label': 'Markedly ill', 'class': 'level-2' },
                    { max: 48.3, 'label': 'Severely ill', 'class': 'level-3' },
                    { max: 999, 'label': 'Among the most extremely ill', 'class': 'level-4' }
                ]
            }
        },
        prevScores: null
    },
    bprs: {
        name: 'BPRS', fullname: 'Brief Psychiatric Rating Scale',
        icon: '📋', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'At time of interview', totalQ: 24, maxScore: 168,
        subscales: ['selfReport', 'observed'],
        questions: [
            { text: 'Somatic concern (preoccupation with physical health, whether or not well-founded)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Anxiety (worry, tension, fear, panic)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Depression (sadness, loss of interest, low self-esteem, hopelessness)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Suicidality (expressed wish, intent, or act of self-harm/suicide)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Guilt (preoccupation or remorse over past behavior)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Hostility (contempt, belligerence, threats, arguing, rage, destruction of property)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Elevated mood (pervasive, exaggerated feeling of well-being, elation, optimism out of proportion to the situation)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Grandiosity (inflated self-esteem, exaggerated beliefs about special powers, wealth, or fame)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Suspiciousness (belief that others have acted, or intend to act, maliciously or with discrimination toward oneself)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Hallucinations (perceptions without corresponding external stimuli)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Unusual thought content (unusual, odd, or bizarre thought content; delusions)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Bizarre behavior (unusual, odd, or reportedly criminal behavior arising from psychosis)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Self-neglect (hygiene, appearance, or eating behavior below normal expectations)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Disorientation (confusion or lack of orientation to person, place, or time)', cat: 'selfReport', catLabel: 'Self-report' },
            { text: 'Conceptual disorganization (confused, disconnected, vague, or off-topic speech)', cat: 'observed', catLabel: 'Observed' },
            { text: 'Blunted affect (reduced emotional tone in facial expression, voice, gestures)', cat: 'observed', catLabel: 'Observed' },
            { text: "Emotional withdrawal (deficiency in the patient's ability to relate emotionally during the interview)", cat: 'observed', catLabel: 'Observed' },
            { text: 'Motor retardation (slowed movement and speech, reduced energy level)', cat: 'observed', catLabel: 'Observed' },
            { text: 'Tension (physical/motor manifestations of tension, restlessness, agitation)', cat: 'observed', catLabel: 'Observed' },
            { text: 'Uncooperativeness (resistance and unwillingness to cooperate with the interview)', cat: 'observed', catLabel: 'Observed' },
            { text: 'Excitement (heightened emotional tone or increased reactivity toward the interviewer/topics discussed)', cat: 'observed', catLabel: 'Observed' },
            { text: "Distractibility (the flow of the patient's speech and actions is interrupted by stimuli unrelated to the interview)", cat: 'observed', catLabel: 'Observed' },
            { text: 'Motor hyperactivity (increased energy level shown by more frequent movement, rapid speech)', cat: 'observed', catLabel: 'Observed' },
            { text: 'Mannerisms and posturing (stilted, unusual movements or posture; unnatural or inappropriate posture)', cat: 'observed', catLabel: 'Observed' }
        ],
        likertOptions: [
            { emoji: '✅', label: '1 = Not present', score: 1 },
            { emoji: '🔹', label: '2 = Very mild', score: 2 },
            { emoji: '🟡', label: '3 = Mild', score: 3 },
            { emoji: '🟠', label: '4 = Moderate', score: 4 },
            { emoji: '🔶', label: '5 = Moderately severe', score: 5 },
            { emoji: '🔴', label: '6 = Severe', score: 6 },
            { emoji: '🚨', label: '7 = Extremely severe', score: 7 }
        ],
        scoring: {
            selfReport: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], multiplier: 1,
                levels: [{ max: 999, 'label': 'Self-report items group (raw range 14–98; the source document does not define a separate severity cutoff for this group)', 'class': 'level-1' }]
            },
            observed: {
                indices: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23], multiplier: 1,
                levels: [{ max: 999, 'label': 'Observed-behavior items group (raw range 10–70; the source document does not define a separate severity cutoff for this group)', 'class': 'level-2' }]
            },
            total: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], multiplier: 1,
                levels: [
                    { max: 45.6, 'label': 'Normal', 'class': 'level-0' },
                    { max: 69.6, 'label': 'Borderline', 'class': 'level-1' },
                    { max: 93.6, 'label': 'Mildly ill', 'class': 'level-1' },
                    { max: 117.6, 'label': 'Moderately ill', 'class': 'level-2' },
                    { max: 141.6, 'label': 'Markedly ill', 'class': 'level-2' },
                    { max: 165.6, 'label': 'Severely ill', 'class': 'level-3' },
                    { max: 999, 'label': 'Among the most extremely ill', 'class': 'level-4' }
                ]
            }
        },
        prevScores: null
    },
    panss: {
        name: 'PANSS', fullname: 'Positive and Negative Syndrome Scale',
        icon: '🧩', iconBg: 'var(--coral-light)', iconBorder: 'var(--lavender)',
        timeRef: 'At time of interview', totalQ: 30, maxScore: 210,
        subscales: ['positive', 'negative', 'general'],
        questions: [
            { text: "P1. Delusions (unfounded, idiosyncratic personal beliefs)", cat: 'positive', catLabel: 'Positive' },
            { text: 'P2. Conceptual disorganization (disruption of goal-directed thought — circumstantiality, loose associations, illogicality)', cat: 'positive', catLabel: 'Positive' },
            { text: 'P3. Hallucinatory behavior (verbal or behavioral evidence of perceptions not triggered by external stimuli)', cat: 'positive', catLabel: 'Positive' },
            { text: 'P4. Excitement (heightened emotional responsiveness, hyperactivity, unstable affect)', cat: 'positive', catLabel: 'Positive' },
            { text: 'P5. Grandiosity (exaggerated self-opinion, unrealistic beliefs of superiority, wealth, power, or fame)', cat: 'positive', catLabel: 'Positive' },
            { text: 'P6. Suspiciousness/persecution (unrealistic or exaggerated ideas of persecution, guardedness, distrust)', cat: 'positive', catLabel: 'Positive' },
            { text: 'P7. Hostility (verbal and nonverbal expressions of anger and resentment: sarcasm, passive-aggression, cursing, assault)', cat: 'positive', catLabel: 'Positive' },
            { text: 'N1. Blunted affect (diminished emotional responsiveness in facial expression, tone, gestures)', cat: 'negative', catLabel: 'Negative' },
            { text: 'N2. Emotional withdrawal (lack of interest in or emotional involvement with life events)', cat: 'negative', catLabel: 'Negative' },
            { text: 'N3. Poor rapport (lack of interpersonal empathy, openness, or interest during the interview)', cat: 'negative', catLabel: 'Negative' },
            { text: 'N4. Passive/apathetic social withdrawal (diminished interest and initiative in social interactions due to passivity, apathy, avolition)', cat: 'negative', catLabel: 'Negative' },
            { text: 'N5. Difficulty in abstract thinking (impairment in classification, generalization, and moving beyond concrete thinking)', cat: 'negative', catLabel: 'Negative' },
            { text: 'N6. Lack of spontaneity and flow of conversation (reduced normal verbal flow associated with apathy, avolition, or defensiveness)', cat: 'negative', catLabel: 'Negative' },
            { text: 'N7. Stereotyped thinking (diminished fluidity, spontaneity, and flexibility of thought — rigid, repetitive, or impoverished content)', cat: 'negative', catLabel: 'Negative' },
            { text: 'G1. Somatic concern (physical complaints or beliefs about illness/bodily dysfunction)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G2. Anxiety (subjective experience of nervousness, worry, fear, or unease)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G3. Guilt feelings (remorse or self-blame over real or imagined past misconduct)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G4. Tension (overt physical manifestations of fear, anxiety, and agitation — muscular rigidity, tremor, sweating)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G5. Mannerisms and posturing (unnatural movements or posture — awkward, rigid, or bizarre)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G6. Depression (feelings of sadness, discouragement, worthlessness, pessimism)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G7. Motor retardation (reduction in motor activity — slowed movement and speech, reduced reactivity)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G8. Uncooperativeness (active refusal to comply with authority figures — interviewer, staff, or family)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G9. Unusual thought content (odd, fantastic, or bizarre ideas, from remote to blatantly illogical)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G10. Disorientation (lack of awareness of one’s relationship to the surroundings — person, place, time)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G11. Poor attention (reduced focus and vigilance, easy distraction, difficulty sustaining or shifting attention)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G12. Lack of judgment and insight (impaired awareness or understanding of one’s own mental condition and circumstances)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G13. Disturbance of volition (disruption in the willful initiation, sustenance, and control of thoughts, behavior, movements, and speech)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G14. Poor impulse control (disordered regulation and control of internal impulses, leading to sudden, inappropriate expression)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G15. Preoccupation (absorption with internally generated thoughts and feelings, with autistic experiences, at the expense of reality orientation)', cat: 'general', catLabel: 'General Psychopathology' },
            { text: 'G16. Active social avoidance (diminished social involvement due to unwarranted fear, hostility, or distrust)', cat: 'general', catLabel: 'General Psychopathology' }
        ],
        likertOptions: [
            { emoji: '✅', label: '1 = Absent', score: 1 },
            { emoji: '🔹', label: '2 = Minimal', score: 2 },
            { emoji: '🟡', label: '3 = Mild', score: 3 },
            { emoji: '🟠', label: '4 = Moderate', score: 4 },
            { emoji: '🔶', label: '5 = Moderate severe', score: 5 },
            { emoji: '🔴', label: '6 = Severe', score: 6 },
            { emoji: '🚨', label: '7 = Extreme', score: 7 }
        ],
        scoring: {
            positive: {
                indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1,
                levels: [{ max: 999, 'label': 'Positive syndrome subscale (raw range 7–49; the source document does not define severity cutoffs)', 'class': 'level-1' }]
            },
            negative: {
                indices: [7, 8, 9, 10, 11, 12, 13], multiplier: 1,
                levels: [{ max: 999, 'label': 'Negative syndrome subscale (raw range 7–49; the source document does not define severity cutoffs)', 'class': 'level-2' }]
            },
            general: {
                indices: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], multiplier: 1,
                levels: [{ max: 999, 'label': 'General Psychopathology subscale (raw range 16–112; the source document does not define severity cutoffs)', 'class': 'level-3' }]
            },
            total: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], multiplier: 1,
                levels: [{ max: 999, 'label': 'PANSS total score (raw range 30–210; the source document does not define severity cutoffs)', 'class': 'level-0' }]
            }
        },
        prevScores: null
    }
};


