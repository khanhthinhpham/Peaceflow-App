// English version of assessmentTests.js — standardized clinical scales (DASS-21, GAD-7,
// HARS, PHQ-9, BDI, PSQI, PSS, SDQ-25, MMSE, ISI, IAT, AUDIT).
// Same shape/key order/indices/scores/classes as assessmentTests.js — only human-readable
// text (fullname, timeRef, question text/catLabel, likertOptions labels, scoring level
// labels) is translated. Kept manually in sync with the Vietnamese source.

export const TESTS = {
    dass21: {
        name: 'DASS-21', fullname: 'Depression Anxiety Stress Scales',
        icon: '📊', iconBg: 'var(--peach-light)', iconBorder: 'var(--peach)',
        timeRef: 'Past 2 weeks', totalQ: 21, maxScore: 42,
        subscales: ['depression', 'anxiety', 'stress'],
        questions: [
            { text: "I couldn't feel any positive emotion at all", cat: 'depression', catLabel: 'Depression' },
            { text: 'I was aware of dryness of my mouth', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: "I couldn't experience any positive feelings at all", cat: 'depression', catLabel: 'Depression' },
            { text: 'I had difficulty breathing (rapid breathing, breathlessness without physical exertion)', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I found it difficult to work up the initiative to do things', cat: 'depression', catLabel: 'Depression' },
            { text: 'I tended to over-react to situations', cat: 'stress', catLabel: 'Stress' },
            { text: 'I experienced trembling (e.g. in the hands)', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I felt that I was using a lot of nervous energy', cat: 'stress', catLabel: 'Stress' },
            { text: 'I was worried about situations in which I might panic and make a fool of myself', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I felt that I had nothing to look forward to', cat: 'depression', catLabel: 'Depression' },
            { text: 'I found myself getting agitated', cat: 'stress', catLabel: 'Stress' },
            { text: 'I found it difficult to relax', cat: 'stress', catLabel: 'Stress' },
            { text: 'I felt sad and downhearted', cat: 'depression', catLabel: 'Depression' },
            { text: 'I was intolerant of anything that kept me from getting on with what I was doing', cat: 'stress', catLabel: 'Stress' },
            { text: 'I felt close to panic', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I was unable to become enthusiastic about anything', cat: 'depression', catLabel: 'Depression' },
            { text: "I felt I wasn't worth much as a person", cat: 'depression', catLabel: 'Depression' },
            { text: 'I felt rather touchy', cat: 'stress', catLabel: 'Stress' },
            { text: 'I was aware of the action of my heart in the absence of physical exertion', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I felt scared without any good reason', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I felt that life was meaningless', cat: 'depression', catLabel: 'Depression' }
        ],
        likertOptions: [
            { emoji: '😊', label: 'Never happened', score: 0 },
            { emoji: '😐', label: 'Sometimes', score: 1 },
            { emoji: '😟', label: 'Often', score: 2 },
            { emoji: '😰', label: 'Most of the time', score: 3 }
        ],
        scoring: {
            depression: { indices: [0, 2, 4, 9, 12, 15, 16, 20], multiplier: 2, levels: [{ max: 9, 'label': 'Normal', 'class': 'level-0' }, { max: 13, 'label': 'Mild', 'class': 'level-1' }, { max: 20, 'label': 'Moderate', 'class': 'level-2' }, { max: 27, 'label': 'Severe', 'class': 'level-3' }, { max: 999, 'label': 'Extremely severe', 'class': 'level-4' }] },
            anxiety: { indices: [1, 3, 6, 8, 14, 18, 19], multiplier: 2, levels: [{ max: 7, 'label': 'Normal', 'class': 'level-0' }, { max: 9, 'label': 'Mild', 'class': 'level-1' }, { max: 14, 'label': 'Moderate', 'class': 'level-2' }, { max: 19, 'label': 'Severe', 'class': 'level-3' }, { max: 999, 'label': 'Extremely severe', 'class': 'level-4' }] },
            stress: { indices: [5, 7, 10, 11, 13, 17], multiplier: 2, levels: [{ max: 14, 'label': 'Normal', 'class': 'level-0' }, { max: 18, 'label': 'Mild', 'class': 'level-1' }, { max: 25, 'label': 'Moderate', 'class': 'level-2' }, { max: 33, 'label': 'Severe', 'class': 'level-3' }, { max: 999, 'label': 'Extremely severe', 'class': 'level-4' }] }
        },
        prevScores: { depression: 6, anxiety: 8, stress: 10 }
    },
    gad7: {
        name: 'GAD-7', fullname: 'Generalized Anxiety Disorder 7-item',
        icon: '😰', iconBg: 'var(--sky-light)', iconBorder: 'var(--sky)',
        timeRef: 'Past 2 weeks', totalQ: 7, maxScore: 21,
        subscales: ['anxiety'],
        questions: [
            { text: 'Feeling nervous, anxious, or on edge', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'Not being able to stop or control worrying', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'Worrying too much about different things', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'Trouble relaxing', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: "Being so restless that it's hard to sit still", cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'Becoming easily annoyed or irritable', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'Feeling afraid as if something awful might happen', cat: 'anxiety', catLabel: 'Anxiety' }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Not at all', score: 0 },
            { emoji: '😐', label: 'Several days', score: 1 },
            { emoji: '😟', label: 'More than half the days', score: 2 },
            { emoji: '😰', label: 'Nearly every day', score: 3 }
        ],
        scoring: {
            anxiety: { indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1, levels: [{ max: 4, 'label': 'Normal', 'class': 'level-0' }, { max: 9, 'label': 'Mild', 'class': 'level-1' }, { max: 14, 'label': 'Moderate', 'class': 'level-2' }, { max: 21, 'label': 'Severe', 'class': 'level-3' }, { max: 999, 'label': 'Extremely severe', 'class': 'level-4' }] }
        },
        prevScores: { anxiety: 7 }
    },
    hars: {
        name: 'HARS', fullname: 'Hamilton Anxiety Rating Scale',
        icon: '🧠', iconBg: 'var(--lavender-light)', iconBorder: 'var(--lavender)',
        timeRef: 'Recently', totalQ: 14, maxScore: 56,
        subscales: ['somatic', 'psychic'],
        questions: [
            { text: 'Anxious mood (worry, anticipating the worst, fearful anticipation, irritability)', cat: 'psychic', catLabel: 'Psychological' },
            { text: 'Tension (feeling tense, easily fatigued, unable to relax, trembling, restlessness)', cat: 'psychic', catLabel: 'Psychological' },
            { text: 'Fears (of the dark, strangers, being left alone, crowds)', cat: 'psychic', catLabel: 'Psychological' },
            { text: 'Insomnia (difficulty falling asleep, broken sleep, unsatisfying sleep, nightmares, fatigue on waking)', cat: 'psychic', catLabel: 'Psychological' },
            { text: 'Cognition (poor concentration, memory impairment)', cat: 'psychic', catLabel: 'Psychological' },
            { text: 'Depressed mood (loss of interest, lack of pleasure in hobbies, early waking)', cat: 'psychic', catLabel: 'Psychological' },
            { text: 'Somatic (muscular) symptoms (muscle aches, twitching, stiffness)', cat: 'somatic', catLabel: 'Physical' },
            { text: 'Somatic (sensory) symptoms (ringing in the ears, blurred vision, hot/cold flushes)', cat: 'somatic', catLabel: 'Physical' },
            { text: 'Cardiovascular symptoms (rapid heartbeat, palpitations, chest pain, throbbing vessels)', cat: 'somatic', catLabel: 'Physical' },
            { text: 'Respiratory symptoms (breathlessness, choking sensation, sighing)', cat: 'somatic', catLabel: 'Physical' },
            { text: 'Gastrointestinal symptoms (difficulty swallowing, stomach pain, nausea, diarrhea)', cat: 'somatic', catLabel: 'Physical' },
            { text: 'Genitourinary symptoms (frequent urination, reduced libido)', cat: 'somatic', catLabel: 'Physical' },
            { text: 'Autonomic symptoms (dry mouth, sweating, flushing, pallor)', cat: 'somatic', catLabel: 'Physical' },
            { text: 'Restless behavior (sighing, constant swallowing, trembling voice when talking)', cat: 'psychic', catLabel: 'Psychological' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'None', score: 0 },
            { emoji: '🟡', label: 'Mild', score: 1 },
            { emoji: '🟠', label: 'Moderate', score: 2 },
            { emoji: '🔴', label: 'Severe', score: 3 },
            { emoji: '🚨', label: 'Very severe', score: 4 }
        ],
        scoring: {
            psychic: { indices: [0, 1, 2, 3, 4, 5, 13], multiplier: 1, levels: [{ max: 999, 'label': 'Psychological', 'class': 'level-1' }] },
            somatic: { indices: [6, 7, 8, 9, 10, 11, 12], multiplier: 1, levels: [{ max: 999, 'label': 'Physical', 'class': 'level-2' }] },
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], multiplier: 1, levels: [{ max: 17, 'label': 'Normal / Mild', 'class': 'level-0' }, { max: 24, 'label': 'Moderate', 'class': 'level-2' }, { max: 30, 'label': 'Severe', 'class': 'level-3' }, { max: 999, 'label': 'Very severe', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    phq9: {
        name: 'PHQ-9', fullname: 'Patient Health Questionnaire-9',
        icon: '🌧️', iconBg: 'var(--mint-light)', iconBorder: 'var(--mint)',
        timeRef: 'Past 2 weeks', totalQ: 9, maxScore: 27,
        subscales: ['depression'],
        questions: [
            { text: 'Little interest or pleasure in doing things', cat: 'depression', catLabel: 'Depression' },
            { text: 'Feeling down, depressed, or hopeless', cat: 'depression', catLabel: 'Depression' },
            { text: 'Trouble falling or staying asleep, or sleeping too much', cat: 'depression', catLabel: 'Depression' },
            { text: 'Feeling tired or having little energy', cat: 'depression', catLabel: 'Depression' },
            { text: 'Poor appetite or overeating', cat: 'depression', catLabel: 'Depression' },
            { text: 'Feeling bad about yourself — or that you are a failure, or have let yourself or your family down', cat: 'depression', catLabel: 'Depression' },
            { text: 'Trouble concentrating on things, such as reading or watching TV', cat: 'depression', catLabel: 'Depression' },
            { text: 'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you were moving around a lot more than usual', cat: 'depression', catLabel: 'Depression' },
            { text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', cat: 'depression', catLabel: 'Depression' }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Not at all', score: 0 },
            { emoji: '😐', label: 'Several days', score: 1 },
            { emoji: '😟', label: 'More than half the days', score: 2 },
            { emoji: '😰', label: 'Nearly every day', score: 3 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8], multiplier: 1, levels: [{ max: 4, 'label': 'Minimal', 'class': 'level-0' }, { max: 9, 'label': 'Mild', 'class': 'level-1' }, { max: 14, 'label': 'Moderate', 'class': 'level-2' }, { max: 19, 'label': 'Moderately severe', 'class': 'level-3' }, { max: 999, 'label': 'Severe', 'class': 'level-4' }] }
        },
        prevScores: { depression: 5 }
    },
    bdi: {
        name: 'BDI', fullname: 'Beck Depression Inventory (BDI)',
        icon: '🌧️', iconBg: 'var(--mint-light)', iconBorder: 'var(--mint)',
        timeRef: 'currently', totalQ: 21, maxScore: 63,
        subscales: ['depression'],
        questions: [
            { text: 'Sadness', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I do not feel sad.', score: 0 },
                { emoji: '😐', label: 'I feel sad.', score: 1 },
                { emoji: '😟', label: "I am sad all the time and I can't snap out of it.", score: 2 },
                { emoji: '😰', label: 'I am so sad or unhappy that I can hardly stand it.', score: 3 }
            ] },
            { text: 'Pessimism about the future', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I am not particularly pessimistic or discouraged about my future.', score: 0 },
                { emoji: '😐', label: 'I feel discouraged about my future.', score: 1 },
                { emoji: '😟', label: 'I feel I have nothing to look forward to.', score: 2 },
                { emoji: '😰', label: 'I feel the future is hopeless and that things cannot improve.', score: 3 }
            ] },
            { text: 'Sense of failure', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I do not feel like a failure.', score: 0 },
                { emoji: '😐', label: 'I feel I have failed more than the average person.', score: 1 },
                { emoji: '😟', label: 'As I look back on my life, all I can see is a lot of failures.', score: 2 },
                { emoji: '😰', label: 'I feel I am a complete failure as a person.', score: 3 }
            ] },
            { text: 'Loss of satisfaction / pleasure', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I get as much satisfaction out of things as I used to.', score: 0 },
                { emoji: '😐', label: "I don't enjoy things the way I used to.", score: 1 },
                { emoji: '😟', label: "I don't get real satisfaction out of anything anymore.", score: 2 },
                { emoji: '😰', label: 'I am dissatisfied or bored with everything.', score: 3 }
            ] },
            { text: 'Guilty feelings', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I don't feel particularly guilty.", score: 0 },
                { emoji: '😐', label: 'I feel guilty a good part of the time.', score: 1 },
                { emoji: '😟', label: 'I feel quite guilty most of the time.', score: 2 },
                { emoji: '😰', label: 'I feel guilty all of the time.', score: 3 }
            ] },
            { text: 'Feeling punished', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I don't feel I am being punished.", score: 0 },
                { emoji: '😐', label: 'I feel I may be punished.', score: 1 },
                { emoji: '😟', label: 'I expect to be punished.', score: 2 },
                { emoji: '😰', label: 'I feel I am being punished.', score: 3 }
            ] },
            { text: 'Self-dislike', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I don't feel disappointed in myself.", score: 0 },
                { emoji: '😐', label: 'I am disappointed in myself.', score: 1 },
                { emoji: '😟', label: 'I am disgusted with myself.', score: 2 },
                { emoji: '😰', label: 'I hate myself.', score: 3 }
            ] },
            { text: 'Self-criticalness', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I don't feel I am any worse than anybody else.", score: 0 },
                { emoji: '😐', label: 'I am critical of myself for my weaknesses or mistakes.', score: 1 },
                { emoji: '😟', label: 'I blame myself all the time for my faults.', score: 2 },
                { emoji: '😰', label: 'I blame myself for everything bad that happens.', score: 3 }
            ] },
            { text: 'Suicidal thoughts or wishes', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I do not have any thoughts of harming myself.', score: 0 },
                { emoji: '😐', label: 'I have thoughts of harming myself, but I would not carry them out.', score: 1 },
                { emoji: '😟', label: 'I would like to end my life.', score: 2 },
                { emoji: '😰', label: 'I would end my life if I had the chance.', score: 3 }
            ] },
            { text: 'Crying', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I don't cry any more than usual.", score: 0 },
                { emoji: '😐', label: 'I cry more now than I used to.', score: 1 },
                { emoji: '😟', label: 'I cry all the time now.', score: 2 },
                { emoji: '😰', label: "I used to be able to cry, but now I can't cry even though I want to.", score: 3 }
            ] },
            { text: 'Irritability', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I am no more irritated by things than I used to be.', score: 0 },
                { emoji: '😐', label: 'I get irritated a little more easily than usual now.', score: 1 },
                { emoji: '😟', label: 'I am quite irritated or annoyed a good part of the time.', score: 2 },
                { emoji: '😰', label: 'I feel irritated almost all the time now.', score: 3 }
            ] },
            { text: 'Loss of interest in other people', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I have not lost interest in other people.', score: 0 },
                { emoji: '😐', label: 'I am less interested in other people than I used to be.', score: 1 },
                { emoji: '😟', label: 'I have lost most of my interest in other people.', score: 2 },
                { emoji: '😰', label: 'I have lost all of my interest in other people.', score: 3 }
            ] },
            { text: 'Indecisiveness', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I make decisions about as well as I ever could.', score: 0 },
                { emoji: '😐', label: 'I put off making decisions more than I used to.', score: 1 },
                { emoji: '😟', label: 'I have greater difficulty in making decisions than before.', score: 2 },
                { emoji: '😰', label: "I can't make decisions at all anymore.", score: 3 }
            ] },
            { text: 'Change in body image', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I don't feel that I look any worse than I used to.", score: 0 },
                { emoji: '😐', label: 'I am worried that I am looking older or unattractive.', score: 1 },
                { emoji: '😟', label: 'I feel that there are permanent changes in my appearance that make me look unattractive.', score: 2 },
                { emoji: '😰', label: 'I believe that I look ugly.', score: 3 }
            ] },
            { text: 'Difficulty working', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I can work about as well as before.', score: 0 },
                { emoji: '😐', label: 'It takes extra effort to get started at doing something.', score: 1 },
                { emoji: '😟', label: 'I have to push myself very hard to do anything.', score: 2 },
                { emoji: '😰', label: "I can't do any work at all.", score: 3 }
            ] },
            { text: 'Sleep changes', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I can sleep as well as usual.', score: 0 },
                { emoji: '😐', label: "I don't sleep as well as I used to.", score: 1 },
                { emoji: '😟', label: 'I wake up 1-2 hours earlier than usual and find it hard to get back to sleep.', score: 2 },
                { emoji: '😰', label: 'I wake up several hours earlier than usual and cannot get back to sleep.', score: 3 }
            ] },
            { text: 'Fatigue', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I don't get more tired than usual.", score: 0 },
                { emoji: '😐', label: 'I get tired more easily than I used to.', score: 1 },
                { emoji: '😟', label: 'I get tired from doing almost anything.', score: 2 },
                { emoji: '😰', label: 'I am too tired to do anything.', score: 3 }
            ] },
            { text: 'Appetite', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'My appetite is no worse than usual.', score: 0 },
                { emoji: '😐', label: "My appetite is not as good as it used to be.", score: 1 },
                { emoji: '😟', label: 'My appetite is much worse now.', score: 2 },
                { emoji: '😰', label: 'I have no appetite at all anymore.', score: 3 }
            ] },
            { text: 'Weight loss', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: "I haven't lost much weight, if any, lately.", score: 0 },
                { emoji: '😐', label: 'I have lost more than 5 pounds (about 2.3 kg).', score: 1 },
                { emoji: '😟', label: 'I have lost more than 10 pounds (about 4.5 kg).', score: 2 },
                { emoji: '😰', label: 'I have lost more than 15 pounds (about 6.8 kg).', score: 3 }
            ] },
            { text: 'Somatic preoccupation', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I am no more worried about my health than usual.', score: 0 },
                { emoji: '😐', label: 'I am worried about physical problems such as aches and pains, an upset stomach, or constipation.', score: 1 },
                { emoji: '😟', label: "I am very worried about physical problems and it's hard to think of much else.", score: 2 },
                { emoji: '😰', label: 'I am so worried about my physical problems that I cannot think about anything else.', score: 3 }
            ] },
            { text: 'Loss of interest in sex', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I have not noticed any recent change in my interest in sex.', score: 0 },
                { emoji: '😐', label: 'I am less interested in sex than I used to be.', score: 1 },
                { emoji: '😟', label: 'I am much less interested in sex now.', score: 2 },
                { emoji: '😰', label: 'I have lost interest in sex completely.', score: 3 }
            ] }
        ],
        scoring: {
            depression: { indices: Array.from({ length: 21 }, (_, i) => i), multiplier: 1, levels: [
                { max: 10, label: 'Normal', class: 'level-0' },
                { max: 16, label: 'Mild mood disturbance', class: 'level-1' },
                { max: 20, label: 'Borderline clinical depression', class: 'level-2' },
                { max: 30, label: 'Moderate depression', class: 'level-3' },
                { max: 40, label: 'Severe depression', class: 'level-4' },
                { max: 999, label: 'Extreme depression', class: 'level-5' }
            ] }
        }
    },
    psqi: {
        name: 'PSQI', fullname: 'Pittsburgh Sleep Quality Index (standardized version)',
        icon: '😴', iconBg: 'var(--peach-light)', iconBorder: 'var(--kraft)',
        timeRef: 'Past 1 month', totalQ: 10, maxScore: 30,
        subscales: ['sleep'],
        questions: [
            { text: 'How would you rate your overall sleep quality?', cat: 'sleep', catLabel: 'Sleep', likertOptions: [{ emoji: '😀', label: 'Very good', score: 0 }, { emoji: '🙂', label: 'Fairly good', score: 1 }, { emoji: '😟', label: 'Fairly bad', score: 2 }, { emoji: '😰', label: 'Very bad', score: 3 }] },
            { text: 'How long does it usually take you to fall asleep each night?', cat: 'sleep', catLabel: 'Sleep', likertOptions: [{ emoji: '⏱️', label: '< 15 minutes', score: 0 }, { emoji: '⏱️', label: '16 - 30 minutes', score: 1 }, { emoji: '⏱️', label: '31 - 60 minutes', score: 2 }, { emoji: '⏱️', label: '> 60 minutes', score: 3 }] },
            { text: 'How many hours of actual sleep do you get per night? (not counting time spent tossing and turning)', cat: 'sleep', catLabel: 'Sleep', likertOptions: [{ emoji: '🛌', label: '> 7 hours', score: 0 }, { emoji: '🛌', label: '6 - 7 hours', score: 1 }, { emoji: '🛌', label: '5 - 6 hours', score: 2 }, { emoji: '🛌', label: '< 5 hours', score: 3 }] },
            { text: "How often can you not get to sleep within 30 minutes?", cat: 'sleep', catLabel: 'Sleep' },
            { text: 'How often do you wake up in the middle of the night or too early in the morning?', cat: 'sleep', catLabel: 'Sleep' },
            { text: 'How often do you have to get up to use the bathroom?', cat: 'sleep', catLabel: 'Sleep' },
            { text: 'How often do you have trouble sleeping because of coughing, difficulty breathing, or loud snoring?', cat: 'sleep', catLabel: 'Sleep' },
            { text: 'How often do you sleep poorly because of nightmares, or feeling too hot or too cold?', cat: 'sleep', catLabel: 'Sleep' },
            { text: 'How often do you need to take medicine (prescribed or over-the-counter) to help you sleep?', cat: 'sleep', catLabel: 'Sleep' },
            { text: 'How often do you feel sleepy or tired during the day while working, driving, or socializing?', cat: 'sleep', catLabel: 'Sleep' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Not during the past month', score: 0 },
            { emoji: '🟡', label: 'Less than once a week', score: 1 },
            { emoji: '🟠', label: 'Once or twice a week', score: 2 },
            { emoji: '🚨', label: 'Three or more times a week', score: 3 }
        ],
        scoring: {
            sleep: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 4, 'label': 'Very good', 'class': 'level-0' }, { max: 7, 'label': 'Meets the standard', 'class': 'level-1' }, { max: 14, 'label': 'At risk of insomnia', 'class': 'level-2' }, { max: 20, 'label': 'Severe insomnia', 'class': 'level-3' }, { max: 999, 'label': 'Especially severe', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    pss: {
        name: 'PSS', fullname: 'Perceived Stress Scale',
        icon: '😣', iconBg: 'var(--coral-light)', iconBorder: 'var(--coral)',
        timeRef: 'Past 1 month', totalQ: 10, maxScore: 40,
        subscales: ['stress'],
        questions: [
            { text: 'In the last month, how often have you been upset because of something that happened unexpectedly?', cat: 'stress', catLabel: 'Stress' },
            { text: 'In the last month, how often have you felt unable to control the important things in your life?', cat: 'stress', catLabel: 'Stress' },
            { text: 'In the last month, how often have you felt nervous and stressed?', cat: 'stress', catLabel: 'Stress' },
            {
                text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?', cat: 'stress', catLabel: 'Stress',
                likertOptions: [
                    { emoji: '❌', label: 'Never', score: 4 },
                    { emoji: '🔹', label: 'Almost never', score: 3 },
                    { emoji: '🔸', label: 'Sometimes', score: 2 },
                    { emoji: '🔶', label: 'Fairly often', score: 1 },
                    { emoji: '🔴', label: 'Very often', score: 0 }
                ]
            },
            {
                text: 'In the last month, how often have you felt that things were going your way?', cat: 'stress', catLabel: 'Stress',
                likertOptions: [
                    { emoji: '❌', label: 'Never', score: 4 },
                    { emoji: '🔹', label: 'Almost never', score: 3 },
                    { emoji: '🔸', label: 'Sometimes', score: 2 },
                    { emoji: '🔶', label: 'Fairly often', score: 1 },
                    { emoji: '🔴', label: 'Very often', score: 0 }
                ]
            },
            { text: 'In the last month, how often have you found that you could not cope with all the things you had to do?', cat: 'stress', catLabel: 'Stress' },
            {
                text: 'In the last month, how often have you been able to control irritations in your life?', cat: 'stress', catLabel: 'Stress',
                likertOptions: [
                    { emoji: '❌', label: 'Never', score: 4 },
                    { emoji: '🔹', label: 'Almost never', score: 3 },
                    { emoji: '🔸', label: 'Sometimes', score: 2 },
                    { emoji: '🔶', label: 'Fairly often', score: 1 },
                    { emoji: '🔴', label: 'Very often', score: 0 }
                ]
            },
            {
                text: 'In the last month, how often have you felt that you were on top of things?', cat: 'stress', catLabel: 'Stress',
                likertOptions: [
                    { emoji: '❌', label: 'Never', score: 4 },
                    { emoji: '🔹', label: 'Almost never', score: 3 },
                    { emoji: '🔸', label: 'Sometimes', score: 2 },
                    { emoji: '🔶', label: 'Fairly often', score: 1 },
                    { emoji: '🔴', label: 'Very often', score: 0 }
                ]
            },
            { text: 'In the last month, how often have you been angered because of things that happened that were outside of your control?', cat: 'stress', catLabel: 'Stress' },
            { text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?', cat: 'stress', catLabel: 'Stress' }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Never', score: 0 },
            { emoji: '🔹', label: 'Almost never', score: 1 },
            { emoji: '🔸', label: 'Sometimes', score: 2 },
            { emoji: '🔶', label: 'Fairly often', score: 3 },
            { emoji: '🔴', label: 'Very often', score: 4 }
        ],
        scoring: {
            stress: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 13, 'label': 'Low', 'class': 'level-0' }, { max: 26, 'label': 'Moderate', 'class': 'level-2' }, { max: 999, 'label': 'High', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    sdq25: {
        name: 'SDQ-25', fullname: 'Strengths and Difficulties Questionnaire (Self-report)',
        icon: '🧒', iconBg: 'var(--sky-light)', iconBorder: 'var(--lavender)',
        timeRef: 'Past 2 weeks', totalQ: 25, maxScore: 40,
        subscales: ['emotional', 'conduct', 'hyperactivity', 'peer', 'prosocial'],
        questions: [
            { text: 'I try to be nice to other people, I care about their feelings', cat: 'prosocial', catLabel: 'Prosocial' },
            { text: 'I am restless, I cannot stay still for long', cat: 'hyperactivity', catLabel: 'Hyperactivity' },
            { text: 'I often complain of headaches, stomach-aches, or feeling sick', cat: 'emotional', catLabel: 'Emotional' },
            { text: 'I usually share with other children (toys, food, pens, etc.)', cat: 'prosocial', catLabel: 'Prosocial' },
            { text: 'I get very angry and often lose my temper', cat: 'conduct', catLabel: 'Conduct' },
            { text: 'I am usually on my own — I generally prefer to play alone', cat: 'peer', catLabel: 'Peer' },
            {
                text: 'Generally I am well-behaved, I usually do as adults ask', cat: 'conduct', catLabel: 'Conduct',
                likertOptions: [
                    { emoji: '🔲', label: 'Not true', score: 2 },
                    { emoji: '➖', label: 'Somewhat true', score: 1 },
                    { emoji: '✔️', label: 'Certainly true', score: 0 }
                ]
            },
            { text: 'I worry a lot, I often seem worried', cat: 'emotional', catLabel: 'Emotional' },
            { text: 'I am helpful if someone is hurt, upset, or feeling ill', cat: 'prosocial', catLabel: 'Prosocial' },
            { text: 'I am constantly fidgeting or squirming, I find it hard to sit still', cat: 'hyperactivity', catLabel: 'Hyperactivity' },
            {
                text: 'I have at least one good friend', cat: 'peer', catLabel: 'Peer',
                likertOptions: [
                    { emoji: '🔲', label: 'Not true', score: 2 },
                    { emoji: '➖', label: 'Somewhat true', score: 1 },
                    { emoji: '✔️', label: 'Certainly true', score: 0 }
                ]
            },
            { text: 'I often fight with other children or can make them do what I want', cat: 'conduct', catLabel: 'Conduct' },
            { text: 'I am often unhappy, feeling down, or easily brought to tears', cat: 'emotional', catLabel: 'Emotional' },
            {
                text: 'Other children generally like to play with me', cat: 'peer', catLabel: 'Peer',
                likertOptions: [
                    { emoji: '🔲', label: 'Not true', score: 2 },
                    { emoji: '➖', label: 'Somewhat true', score: 1 },
                    { emoji: '✔️', label: 'Certainly true', score: 0 }
                ]
            },
            { text: 'I am easily distracted, I find it hard to concentrate', cat: 'hyperactivity', catLabel: 'Hyperactivity' },
            { text: 'I get nervous and easily lose confidence in new situations', cat: 'emotional', catLabel: 'Emotional' },
            { text: 'I am kind to children younger than me', cat: 'prosocial', catLabel: 'Prosocial' },
            { text: 'I am often accused of lying or cheating', cat: 'conduct', catLabel: 'Conduct' },
            { text: 'Other children pick on me or bully me', cat: 'peer', catLabel: 'Peer' },
            { text: 'I often volunteer to help others (parents, teachers, friends, etc.)', cat: 'prosocial', catLabel: 'Prosocial' },
            {
                text: 'I think things through carefully before I do them', cat: 'hyperactivity', catLabel: 'Hyperactivity',
                likertOptions: [
                    { emoji: '🔲', label: 'Not true', score: 2 },
                    { emoji: '➖', label: 'Somewhat true', score: 1 },
                    { emoji: '✔️', label: 'Certainly true', score: 0 }
                ]
            },
            { text: 'I often take things that are not mine, at home, school, or elsewhere', cat: 'conduct', catLabel: 'Conduct' },
            {
                text: 'I get on better with adults than with people my own age', cat: 'peer', catLabel: 'Peer',
                likertOptions: [
                    { emoji: '🔲', label: 'Not true', score: 2 },
                    { emoji: '➖', label: 'Somewhat true', score: 1 },
                    { emoji: '✔️', label: 'Certainly true', score: 0 }
                ]
            },
            { text: 'I have many fears, I am easily scared', cat: 'emotional', catLabel: 'Emotional' },
            {
                text: 'I finish the work I am given, my concentration is good', cat: 'hyperactivity', catLabel: 'Hyperactivity',
                likertOptions: [
                    { emoji: '🔲', label: 'Not true', score: 2 },
                    { emoji: '➖', label: 'Somewhat true', score: 1 },
                    { emoji: '✔️', label: 'Certainly true', score: 0 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '🔲', label: 'Not true', score: 0 },
            { emoji: '➖', label: 'Somewhat true', score: 1 },
            { emoji: '✔️', label: 'Certainly true', score: 2 }
        ],
        scoring: {
            emotional: { indices: [2, 7, 12, 15, 23], multiplier: 1, levels: [{ max: 3, 'label': 'Normal', 'class': 'level-0' }, { max: 10, 'label': 'Needs attention', 'class': 'level-2' }] },
            conduct: { indices: [4, 6, 11, 17, 21], multiplier: 1, levels: [{ max: 2, 'label': 'Normal', 'class': 'level-0' }, { max: 10, 'label': 'Needs attention', 'class': 'level-2' }] },
            hyperactivity: { indices: [1, 9, 14, 20, 24], multiplier: 1, levels: [{ max: 5, 'label': 'Normal', 'class': 'level-0' }, { max: 10, 'label': 'Needs attention', 'class': 'level-2' }] },
            peer: { indices: [5, 10, 13, 18, 22], multiplier: 1, levels: [{ max: 2, 'label': 'Normal', 'class': 'level-0' }, { max: 10, 'label': 'Needs attention', 'class': 'level-2' }] },
            prosocial: { indices: [0, 3, 8, 16, 19], multiplier: 1, levels: [{ max: 4, 'label': 'Needs more social-skills support', 'class': 'level-2' }, { max: 10, 'label': 'Good', 'class': 'level-0' }] },
            total: { indices: [2, 7, 12, 15, 23, 4, 6, 11, 17, 21, 1, 9, 14, 20, 24, 5, 10, 13, 18, 22], multiplier: 1, levels: [{ max: 15, 'label': 'Normal', 'class': 'level-0' }, { max: 19, 'label': 'Borderline', 'class': 'level-1' }, { max: 999, 'label': 'Abnormal', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    mmse: {
        name: 'MMSE', fullname: 'Mini-Mental State Exam',
        icon: '🧠', iconBg: 'var(--lavender-light)', iconBorder: 'var(--lavender)',
        timeRef: 'Currently', totalQ: 19, maxScore: 30,
        subscales: ['total'],
        questions: [
            { text: 'What day of the week is it today?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: "What is today's date?", cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'What month is it?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'What year is it?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'What season is it?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'Where are we right now (name of place)?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'What department/ward? What floor?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'What province/city?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'What region? (North/Central/South)', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'What country?', cat: 'total', catLabel: 'Orientation', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            {
                text: 'Clearly say 3 words (cat, rice plant, coin) and ask them to repeat immediately — how many words correct?', cat: 'total', catLabel: 'Registration',
                likertOptions: [0, 1, 2, 3].map((n) => ({ emoji: '🔢', label: `${n} correct words`, score: n }))
            },
            {
                text: 'Subtract 7 serially from 100 (100-93-86-79-72-65) — how many calculations correct?', cat: 'total', catLabel: 'Attention & Calculation',
                likertOptions: [0, 1, 2, 3, 4, 5].map((n) => ({ emoji: '🔢', label: `${n} correct calculations`, score: n }))
            },
            {
                text: 'Ask them to recall the 3 words from earlier (order does not matter) — how many words correctly recalled?', cat: 'total', catLabel: 'Recall',
                likertOptions: [0, 1, 2, 3].map((n) => ({ emoji: '🔢', label: `${n} correctly recalled`, score: n }))
            },
            {
                text: 'Show them and ask them to name 2 objects (watch, pen) — how many named correctly?', cat: 'total', catLabel: 'Language',
                likertOptions: [0, 1, 2].map((n) => ({ emoji: '🔢', label: `${n} correct objects`, score: n }))
            },
            { text: 'Ask them to repeat the phrase: "No ifs, ands, or buts"', cat: 'total', catLabel: 'Language', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            {
                text: 'Give a 3-step command: "Take the paper in your right hand, fold it in half, and hand it back to me" — how many steps correct?', cat: 'total', catLabel: 'Language',
                likertOptions: [0, 1, 2, 3].map((n) => ({ emoji: '🔢', label: `${n} correct steps`, score: n }))
            },
            { text: 'Ask them to silently read and follow the written command: "Close your eyes"', cat: 'total', catLabel: 'Language', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'Ask them to write a sentence of their own choosing (meaningful, with a subject and a verb)', cat: 'total', catLabel: 'Language', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] },
            { text: 'Ask them to copy a drawing of two intersecting pentagons', cat: 'total', catLabel: 'Visuospatial', likertOptions: [{ emoji: '❌', label: 'Incorrect', score: 0 }, { emoji: '✅', label: 'Correct', score: 1 }] }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Incorrect', score: 0 },
            { emoji: '✅', label: 'Correct', score: 1 }
        ],
        scoring: {
            total: {
                indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], multiplier: 1,
                levels: [
                    { max: 13, 'label': 'Severe impairment', 'class': 'level-3' },
                    { max: 19, 'label': 'Moderate impairment', 'class': 'level-2' },
                    { max: 23, 'label': 'Mild impairment', 'class': 'level-1' },
                    { max: 999, 'label': 'No cognitive impairment', 'class': 'level-0' }
                ]
            }
        },
        prevScores: null
    },
    isi: {
        name: 'ISI', fullname: 'Insomnia Severity Index',
        icon: '😴', iconBg: 'var(--peach-light)', iconBorder: 'var(--peach)',
        timeRef: 'Past 1 month', totalQ: 7, maxScore: 28,
        subscales: ['total'],
        questions: [
            { text: 'Difficulty falling asleep', cat: 'total', catLabel: 'Insomnia' },
            { text: 'Difficulty staying asleep', cat: 'total', catLabel: 'Insomnia' },
            { text: 'Waking up too early', cat: 'total', catLabel: 'Insomnia' },
            {
                text: 'How satisfied/dissatisfied are you with your current sleep pattern?', cat: 'total', catLabel: 'Insomnia',
                likertOptions: [
                    { emoji: '😀', label: 'Very satisfied', score: 0 },
                    { emoji: '🙂', label: 'Satisfied', score: 1 },
                    { emoji: '😐', label: 'Moderately satisfied', score: 2 },
                    { emoji: '😟', label: 'Dissatisfied', score: 3 },
                    { emoji: '😣', label: 'Very dissatisfied', score: 4 }
                ]
            },
            {
                text: 'How noticeable do you think your sleep problem is to others, in terms of impairing your quality of life?', cat: 'total', catLabel: 'Insomnia',
                likertOptions: [
                    { emoji: '✅', label: 'Not at all noticeable', score: 0 },
                    { emoji: '🟡', label: 'A little noticeable', score: 1 },
                    { emoji: '🟠', label: 'Somewhat noticeable', score: 2 },
                    { emoji: '🔴', label: 'Much noticeable', score: 3 },
                    { emoji: '🚨', label: 'Very much noticeable', score: 4 }
                ]
            },
            {
                text: 'How worried/distressed are you about your current sleep problem?', cat: 'total', catLabel: 'Insomnia',
                likertOptions: [
                    { emoji: '✅', label: 'Not at all worried', score: 0 },
                    { emoji: '🟡', label: 'A little worried', score: 1 },
                    { emoji: '🟠', label: 'Somewhat worried', score: 2 },
                    { emoji: '🔴', label: 'Much worried', score: 3 },
                    { emoji: '🚨', label: 'Very much worried', score: 4 }
                ]
            },
            {
                text: 'To what extent do you consider your sleep problem to interfere with your daily functioning (e.g. daytime fatigue, concentration, memory)?', cat: 'total', catLabel: 'Insomnia',
                likertOptions: [
                    { emoji: '✅', label: 'Not at all interfering', score: 0 },
                    { emoji: '🟡', label: 'A little interfering', score: 1 },
                    { emoji: '🟠', label: 'Somewhat interfering', score: 2 },
                    { emoji: '🔴', label: 'Much interfering', score: 3 },
                    { emoji: '🚨', label: 'Very much interfering', score: 4 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '✅', label: 'None', score: 0 },
            { emoji: '🟡', label: 'Mild', score: 1 },
            { emoji: '🟠', label: 'Moderate', score: 2 },
            { emoji: '🔴', label: 'Severe', score: 3 },
            { emoji: '🚨', label: 'Very severe', score: 4 }
        ],
        scoring: {
            total: { indices: [0, 1, 2, 3, 4, 5, 6], multiplier: 1, levels: [{ max: 7, 'label': 'No clinically significant insomnia', 'class': 'level-0' }, { max: 14, 'label': 'Subthreshold insomnia', 'class': 'level-1' }, { max: 21, 'label': 'Moderate insomnia', 'class': 'level-2' }, { max: 999, 'label': 'Severe insomnia', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    iat: {
        name: 'IAT', fullname: 'Internet Addiction Test',
        icon: '📱', iconBg: 'var(--sky-light)', iconBorder: 'var(--sky)',
        timeRef: 'Past 1 month', totalQ: 20, maxScore: 100,
        subscales: ['total'],
        questions: [
            { text: 'How often do you find that you stay online longer than you intended?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you neglect household chores to spend more time online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you prefer the excitement of the internet to spending time with friends?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you form new relationships with other internet users?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do people around you complain about the amount of time you spend online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do your grades or work suffer because of the amount of time you spend online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you check your email before doing something else you need to do?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often does your job performance or productivity suffer because of the internet?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you become defensive or secretive when someone asks what you do online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you block out disturbing thoughts about your life with soothing thoughts of the internet?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you find yourself looking forward to going online again?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you fear that life without the internet would be boring, empty, and joyless?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you snap, yell, or act annoyed if someone bothers you while you are online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you lose sleep because of being online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you feel preoccupied with the internet when off-line, or fantasize about being online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you find yourself saying "just a few more minutes" when online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you try to cut down the amount of time you spend online and fail?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you try to hide how long you have been online?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you choose to spend more time online rather than going out with others?', cat: 'total', catLabel: 'Internet' },
            { text: 'How often do you feel depressed, moody, or anxious when you are offline, and it goes away once you go back online?', cat: 'total', catLabel: 'Internet' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Never', score: 0 },
            { emoji: '🔹', label: 'Rarely', score: 1 },
            { emoji: '🔸', label: 'Occasionally', score: 2 },
            { emoji: '🟠', label: 'Frequently', score: 3 },
            { emoji: '🔴', label: 'Often', score: 4 },
            { emoji: '🚨', label: 'Always', score: 5 }
        ],
        scoring: {
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], multiplier: 1, levels: [{ max: 30, 'label': 'Normal internet use', 'class': 'level-0' }, { max: 49, 'label': 'Mild dependence on the internet', 'class': 'level-1' }, { max: 79, 'label': 'Moderate dependence on the internet', 'class': 'level-2' }, { max: 999, 'label': 'Severe dependence on the internet', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    audit: {
        name: 'AUDIT', fullname: 'Alcohol Use Disorders Identification Test',
        icon: '🍺', iconBg: 'var(--kraft-light)', iconBorder: 'var(--kraft)',
        timeRef: 'Past 12 months', totalQ: 10, maxScore: 36,
        subscales: ['total'],
        questions: [
            {
                text: 'How often do you have a drink containing alcohol?', cat: 'total', catLabel: 'Alcohol',
                likertOptions: [
                    { emoji: '✅', label: 'Never', score: 0 },
                    { emoji: '🔹', label: 'Less than once a month', score: 1 },
                    { emoji: '🔸', label: '2-4 times a month', score: 2 },
                    { emoji: '🟠', label: '2-3 times a week', score: 3 },
                    { emoji: '🔴', label: '4 or more times a week', score: 4 }
                ]
            },
            {
                text: 'On a day when you are drinking, how many drinks do you typically have? (1 drink = 1 can/bottle of beer, 1 glass of wine (~120ml), or 1 shot of spirits (~30ml))', cat: 'total', catLabel: 'Alcohol',
                likertOptions: [
                    { emoji: '✅', label: '1-2 drinks', score: 0 },
                    { emoji: '🔹', label: '3-4 drinks', score: 1 },
                    { emoji: '🔸', label: '5-6 drinks', score: 2 },
                    { emoji: '🟠', label: '7-9 drinks', score: 3 },
                    { emoji: '🔴', label: '≥10 drinks', score: 4 }
                ]
            },
            { text: 'How often do you have six or more drinks on one occasion?', cat: 'total', catLabel: 'Alcohol' },
            { text: 'How often during the last year have you found that you were not able to stop drinking once you had started?', cat: 'total', catLabel: 'Alcohol' },
            { text: 'How often during the last year have you failed to do what was normally expected of you because of drinking?', cat: 'total', catLabel: 'Alcohol' },
            { text: 'How often during the last year have you needed a drink first thing in the morning to get going, before thinking of anything else?', cat: 'total', catLabel: 'Alcohol' },
            { text: 'How often during the last year have you had a feeling of guilt or remorse after drinking?', cat: 'total', catLabel: 'Alcohol' },
            { text: 'How often during the last year have you been unable to remember what happened the night before because you had been drinking?', cat: 'total', catLabel: 'Alcohol' },
            {
                text: 'Have you ever been injured as a result of your drinking?', cat: 'total', catLabel: 'Alcohol',
                likertOptions: [
                    { emoji: '✅', label: 'Never', score: 0 },
                    { emoji: '🟡', label: 'Yes, but not in the last year', score: 1 },
                    { emoji: '🔴', label: 'Yes, during the last year', score: 2 }
                ]
            },
            {
                text: 'Has a relative, friend, doctor, or other health worker ever been concerned about your drinking or suggested you cut down?', cat: 'total', catLabel: 'Alcohol',
                likertOptions: [
                    { emoji: '✅', label: 'Never', score: 0 },
                    { emoji: '🟡', label: 'Yes, but not in the last year', score: 1 },
                    { emoji: '🔴', label: 'Yes, during the last year', score: 2 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Never', score: 0 },
            { emoji: '🔹', label: 'Less than monthly', score: 1 },
            { emoji: '🔸', label: 'Monthly', score: 2 },
            { emoji: '🟠', label: 'Weekly', score: 3 },
            { emoji: '🔴', label: 'Daily or almost daily', score: 4 }
        ],
        scoring: {
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 7, 'label': 'Low-risk drinking', 'class': 'level-0' }, { max: 15, 'label': 'Hazardous drinking', 'class': 'level-1' }, { max: 19, 'label': 'Harmful drinking', 'class': 'level-2' }, { max: 999, 'label': 'Possible alcohol dependence', 'class': 'level-3' }] }
        },
        prevScores: null
    }
};
