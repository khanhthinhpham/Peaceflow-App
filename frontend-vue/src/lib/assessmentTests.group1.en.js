// 4 new tests — English versions (accurate clinical translation, same scoring/cutoffs as the VI source)
// HDRS (Hamilton Depression Rating Scale), CDI (Children's Depression Inventory),
// GDS (Geriatric Depression Scale), EPDS (Edinburgh Postnatal Depression Scale)
// Bare object — to be spread/merged into TESTS in assessmentTests.en.js

const GROUP1_TESTS_EN = {
    hdrs: {
        name: 'HDRS', fullname: 'Hamilton Depression Rating Scale',
        icon: '🌧️', iconBg: 'var(--coral-light)', iconBorder: 'var(--coral)',
        timeRef: 'Past week', totalQ: 17, maxScore: 52,
        subscales: ['depression'],
        questions: [
            {
                text: 'Depressed mood', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No feelings of discomfort or signs of depression', score: 0 },
                    { emoji: '🟡', label: 'Occasional feelings of sadness or worry, no clear signs of depression', score: 1 },
                    { emoji: '🟠', label: 'Appears sad, distressed, pessimistic, occasional crying, fleeting suicidal thoughts, reduced activity', score: 2 },
                    { emoji: '🔴', label: 'Clear physical signs of depression, feelings of hopelessness, suicidal thoughts present', score: 3 },
                    { emoji: '🚨', label: 'Severe depression with pronounced physical signs, delusions related to death or suicide', score: 4 }
                ]
            },
            {
                text: 'Feelings of guilt', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No feelings of guilt', score: 0 },
                    { emoji: '🟡', label: 'Minor regret about past behavior, tends to blame self over trivial matters', score: 1 },
                    { emoji: '🟠', label: 'Feelings of guilt, ruminates, self-reproach over past mistakes or wrongdoing', score: 2 },
                    { emoji: '🔴', label: 'Believes illness is a punishment; delusions of being accused', score: 3 },
                    { emoji: '🚨', label: 'Auditory hallucinations of accusation/denunciation, or threatening visual hallucinations', score: 4 }
                ]
            },
            {
                text: 'Suicide', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'Absent', score: 0 },
                    { emoji: '🟡', label: 'Feels life is not worth living, fleeting suicidal thoughts', score: 1 },
                    { emoji: '🟠', label: 'Suicidal ideas present, views suicide as an acceptable solution', score: 2 },
                    { emoji: '🔴', label: 'Clear suicidal ideas, has made a suicide plan', score: 3 },
                    { emoji: '🚨', label: 'Actively preparing for suicide, or has made a serious suicide attempt', score: 4 }
                ]
            },
            {
                text: 'Insomnia — early (difficulty falling asleep)', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No problem', score: 0 },
                    { emoji: '🟡', label: 'Mild, infrequent disturbance', score: 1 },
                    { emoji: '🔴', label: 'Clear/marked disturbance', score: 2 }
                ]
            },
            {
                text: 'Insomnia — middle (restless, frequent waking)', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No problem', score: 0 },
                    { emoji: '🟡', label: 'Mild, infrequent disturbance', score: 1 },
                    { emoji: '🔴', label: 'Clear/marked disturbance', score: 2 }
                ]
            },
            {
                text: 'Insomnia — late (early waking, unable to fall back asleep)', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No problem', score: 0 },
                    { emoji: '🟡', label: 'Mild, infrequent disturbance', score: 1 },
                    { emoji: '🔴', label: 'Clear/marked disturbance', score: 2 }
                ]
            },
            {
                text: 'Work and activities', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'Normal activity', score: 0 },
                    { emoji: '🟡', label: 'Reduced enthusiasm, reserved, passive, easily discouraged', score: 1 },
                    { emoji: '🟠', label: 'Feels work is a burden, neglects self-care', score: 2 },
                    { emoji: '🔴', label: 'Must force self to do any task, has cancelled many planned activities, very poor self-care', score: 3 },
                    { emoji: '🚨', label: 'Unable to work, confusion/deficits in self-care', score: 4 }
                ]
            },
            {
                text: 'Retardation (psychomotor)', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No complaints about concentration or work performance', score: 0 },
                    { emoji: '🟡', label: 'Mild psychomotor slowing, occasionally admits to being slow or inactive', score: 1 },
                    { emoji: '🟠', label: 'Monotone voice, slow to answer, sits almost motionless but answers correctly', score: 2 },
                    { emoji: '🔴', label: 'Interview prolonged, frequently misses or gives inappropriate answers', score: 3 },
                    { emoji: '🚨', label: 'Cannot be interviewed', score: 4 }
                ]
            },
            {
                text: 'Agitation', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No signs of agitation', score: 0 },
                    { emoji: '🟡', label: 'Restless, fidgety, hyperactive during interview', score: 1 },
                    { emoji: '🟠', label: 'Clearly hyperactive, keeps changing position, wringing hands or plucking at clothing', score: 2 },
                    { emoji: '🔴', label: 'Jumps up during the interview', score: 3 },
                    { emoji: '🚨', label: 'Paces back and forth, pulls at hair/clothing, picks at objects', score: 4 }
                ]
            },
            {
                text: 'Anxiety — psychic', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No complaints', score: 0 },
                    { emoji: '🟡', label: 'Reported only when asked, mild tension or irritability', score: 1 },
                    { emoji: '🟠', label: 'Easily irritated, tense, insecure, sustained over time', score: 2 },
                    { emoji: '🔴', label: 'Persistent feelings of dread or terror, or panic attacks', score: 3 },
                    { emoji: '🚨', label: 'Constant fear, panic from anticipated loss, abandonment, or incapacity', score: 4 }
                ]
            },
            {
                text: 'Anxiety — somatic', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No complaints', score: 0 },
                    { emoji: '🟡', label: 'Mild, infrequent symptoms not interfering with daily activities', score: 1 },
                    { emoji: '🟠', label: 'Moderate, more frequent episodes of physical disturbance', score: 2 },
                    { emoji: '🔴', label: 'Persistent feelings of being unwell, disrupting sleep and daily work', score: 3 },
                    { emoji: '🚨', label: 'Symptoms cause incapacity', score: 4 }
                ]
            },
            {
                text: 'Somatic symptoms — gastrointestinal (appetite)', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No complaints', score: 0 },
                    { emoji: '🟡', label: 'Reduced appetite, change in bowel frequency', score: 1 },
                    { emoji: '🔴', label: 'Loss of appetite, severe constipation', score: 2 }
                ]
            },
            {
                text: 'Somatic symptoms — general (heaviness, aches, fatigue)', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No symptoms', score: 0 },
                    { emoji: '🟡', label: 'Mild-to-moderate symptoms, not disabling', score: 1 },
                    { emoji: '🔴', label: 'Severe symptoms, interfering with activity or disabling', score: 2 }
                ]
            },
            {
                text: 'Genital symptoms (libido, menstrual disturbance)', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No complaints', score: 0 },
                    { emoji: '🟡', label: 'Reduced interest, response, and frequency of sexual activity', score: 1 },
                    { emoji: '🔴', label: 'Complete loss of interest/response, or aversion to sexual activity', score: 2 }
                ]
            },
            {
                text: 'Hypochondriasis', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No complaints', score: 0 },
                    { emoji: '🟡', label: 'Mild complaints, excessive concern about physical health', score: 1 },
                    { emoji: '🟠', label: 'Preoccupied with physical health, believes has an organic illness', score: 2 },
                    { emoji: '🔴', label: 'Focused on physical symptoms, seeks help, convinced of having an organic illness', score: 3 },
                    { emoji: '🚨', label: 'Bizarre delusional content about the body, marked anxiety, fear, hopelessness', score: 4 }
                ]
            },
            {
                text: 'Loss of weight', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'No complaints of weight loss', score: 0 },
                    { emoji: '🟡', label: 'Slight or suspected weight loss', score: 1 },
                    { emoji: '🔴', label: 'Marked/severe weight loss (objectively confirmed)', score: 2 }
                ]
            },
            {
                text: 'Insight', cat: 'depression', catLabel: 'Depression',
                likertOptions: [
                    { emoji: '✅', label: 'Acknowledges being depressed and "mentally ill" (nervous breakdown)', score: 0 },
                    { emoji: '🟡', label: 'Acknowledges illness but attributes it to physical causes', score: 1 },
                    { emoji: '🔴', label: 'Denies any psychiatric problem, believes only physically ill', score: 2 }
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
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], multiplier: 1, levels: [{ max: 7, 'label': 'No depression', 'class': 'level-0' }, { max: 13, 'label': 'Mild depression', 'class': 'level-1' }, { max: 18, 'label': 'Moderate depression', 'class': 'level-2' }, { max: 22, 'label': 'Severe depression', 'class': 'level-3' }, { max: 999, 'label': 'Very severe depression', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    cdi: {
        name: 'CDI', fullname: "Children's Depression Inventory",
        icon: '🧸', iconBg: 'var(--sky-light)', iconBorder: 'var(--sky)',
        timeRef: 'Past 2 weeks', totalQ: 27, maxScore: 54,
        subscales: ['depression'],
        questions: [
            { text: 'Mood', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I am sad once in a while', score: 0 }, { emoji: '😐', label: 'I am sad many times', score: 1 }, { emoji: '😢', label: 'I am sad all the time', score: 2 }] },
            { text: 'Outlook on the future', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'Nothing will ever work out for me', score: 2 }, { emoji: '😐', label: 'I am not sure if things will work out for me', score: 1 }, { emoji: '🙂', label: 'Things will work out for me okay', score: 0 }] },
            { text: 'Sense of failure', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I do most things okay', score: 0 }, { emoji: '😐', label: 'I do many things wrong', score: 1 }, { emoji: '😢', label: 'I do everything wrong', score: 2 }] },
            { text: 'Anhedonia', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I have fun in many things', score: 0 }, { emoji: '😐', label: 'I have fun in some things', score: 1 }, { emoji: '😢', label: 'Nothing is fun at all', score: 2 }] },
            { text: 'Self-image ("being bad")', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I am bad all the time', score: 2 }, { emoji: '😐', label: 'I am bad many times', score: 1 }, { emoji: '🙂', label: 'I am bad only once in a while', score: 0 }] },
            { text: 'Worry about bad things happening', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I rarely think about bad things happening to me', score: 0 }, { emoji: '😐', label: 'I worry that bad things will happen to me', score: 1 }, { emoji: '😢', label: 'I am sure terrible things will happen to me', score: 2 }] },
            { text: 'Self-hatred', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I hate myself', score: 2 }, { emoji: '😐', label: 'I do not like myself', score: 1 }, { emoji: '🙂', label: 'I like myself', score: 0 }] },
            { text: 'Self-blame', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'All bad things are my fault', score: 2 }, { emoji: '😐', label: 'Many bad things are my fault', score: 1 }, { emoji: '🙂', label: 'Bad things are usually not my fault', score: 0 }] },
            { text: 'Crying', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I feel like crying every day', score: 2 }, { emoji: '😐', label: 'I feel like crying many days', score: 1 }, { emoji: '🙂', label: 'I feel like crying once in a while', score: 0 }] },
            { text: 'Irritability', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'Things bother me all the time', score: 2 }, { emoji: '😐', label: 'Things bother me many times', score: 1 }, { emoji: '🙂', label: 'Things bother me once in a while', score: 0 }] },
            { text: 'Being with people', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I like being with people', score: 0 }, { emoji: '😐', label: 'I do not like being with people many times', score: 1 }, { emoji: '😢', label: 'I do not want to be with people at all', score: 2 }] },
            { text: 'Indecisiveness', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I cannot make up my mind about things', score: 2 }, { emoji: '😐', label: 'It is hard to make up my mind about things', score: 1 }, { emoji: '🙂', label: 'I make up my mind about things easily', score: 0 }] },
            { text: 'Body image', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I look okay', score: 0 }, { emoji: '😐', label: 'There are some bad things about my looks', score: 1 }, { emoji: '😢', label: 'I look ugly', score: 2 }] },
            { text: 'Schoolwork effort', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I have to push myself all the time to do my schoolwork', score: 2 }, { emoji: '😐', label: 'I have to push myself many times to do my schoolwork', score: 1 }, { emoji: '🙂', label: 'Doing schoolwork is not a big problem', score: 0 }] },
            { text: 'Sleep', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I have trouble sleeping every night', score: 2 }, { emoji: '😐', label: 'I have trouble sleeping many nights', score: 1 }, { emoji: '🙂', label: 'I sleep pretty well', score: 0 }] },
            { text: 'Fatigue', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I am tired once in a while', score: 0 }, { emoji: '😐', label: 'I am tired many days', score: 1 }, { emoji: '😢', label: 'I am tired all the time', score: 2 }] },
            { text: 'Appetite', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I never feel like eating', score: 2 }, { emoji: '😐', label: 'Many days I do not feel like eating', score: 1 }, { emoji: '🙂', label: 'I eat pretty well', score: 0 }] },
            { text: 'Worry about aches and pains', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I do not worry about aches and pains', score: 0 }, { emoji: '😐', label: 'I worry about aches and pains many times', score: 1 }, { emoji: '😢', label: 'I always worry about aches and pains', score: 2 }] },
            { text: 'Loneliness', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I do not feel alone', score: 0 }, { emoji: '😐', label: 'I feel alone many times', score: 1 }, { emoji: '😢', label: 'I feel alone all the time', score: 2 }] },
            { text: 'Fun at school', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I never have fun at school', score: 2 }, { emoji: '😐', label: 'I have fun at school only once in a while', score: 1 }, { emoji: '🙂', label: 'I have fun at school many times', score: 0 }] },
            { text: 'Friends', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I have plenty of friends', score: 0 }, { emoji: '😐', label: 'I have some friends but I wish I had more', score: 1 }, { emoji: '😢', label: 'I do not have any friends', score: 2 }] },
            { text: 'Schoolwork performance', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'My schoolwork is alright', score: 0 }, { emoji: '😐', label: 'My schoolwork is not as good as before', score: 1 }, { emoji: '😢', label: 'I do very badly in subjects I used to be good in', score: 2 }] },
            { text: 'Comparison to peers', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'I can never be as good as other kids', score: 2 }, { emoji: '😐', label: 'I can be as good as other kids if I want to', score: 1 }, { emoji: '🙂', label: 'I am just as good as other kids', score: 0 }] },
            { text: 'Feeling loved', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '😢', label: 'Nobody really loves me', score: 2 }, { emoji: '😐', label: 'I am not sure if anybody loves me', score: 1 }, { emoji: '🙂', label: 'I am sure that somebody loves me', score: 0 }] },
            { text: 'Obedience', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I usually do what I am told', score: 0 }, { emoji: '😐', label: 'I usually do not do what I am told', score: 1 }, { emoji: '😢', label: 'I never do what I am told', score: 2 }] },
            { text: 'Fighting', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I do not fight much', score: 0 }, { emoji: '😐', label: 'I fight many times', score: 1 }, { emoji: '😢', label: 'I fight all the time', score: 2 }] },
            { text: 'Suicidal ideation', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '🙂', label: 'I do not think about killing myself', score: 0 }, { emoji: '😐', label: 'I think about killing myself but I would not do it', score: 1 }, { emoji: '😢', label: 'I want to kill myself', score: 2 }] }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Rarely', score: 0 },
            { emoji: '😐', label: 'Often', score: 1 },
            { emoji: '😢', label: 'Always', score: 2 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26], multiplier: 1, levels: [{ max: 12, 'label': 'No depression', 'class': 'level-0' }, { max: 19, 'label': 'Depressive symptoms present', 'class': 'level-1' }, { max: 999, 'label': 'Depression', 'class': 'level-2' }] }
        },
        prevScores: null
    },
    gds: {
        name: 'GDS', fullname: 'Geriatric Depression Scale',
        icon: '🍂', iconBg: 'var(--kraft-light)', iconBorder: 'var(--kraft)',
        timeRef: 'Past week', totalQ: 30, maxScore: 30,
        subscales: ['depression'],
        questions: [
            { text: 'Are you basically satisfied with your life?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Have you dropped many of your activities and interests?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you feel that your life is empty?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you often get bored?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Are you hopeful about the future?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: "Are you bothered by thoughts you can't get out of your head?", cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Are you in good spirits most of the time?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Are you afraid that something bad is going to happen to you?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you feel happy most of the time?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Do you often feel helpless?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you often get restless and fidgety?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you prefer to stay at home rather than going out and doing new things?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you frequently worry about the future?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you feel you have more problems with memory than most?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you think it is wonderful to be alive now?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Do you often feel downhearted and blue?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you feel pretty worthless the way you are now?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you worry a lot about the past?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you find life very exciting?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Is it hard for you to get started on new projects?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you feel full of energy?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Do you feel that your situation is hopeless?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you think that most people are better off than you are?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you frequently get upset over little things?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you frequently feel like crying?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you have trouble concentrating?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you enjoy getting up in the morning?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Do you prefer to avoid social gatherings?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 1 }, { emoji: '❌', label: 'No', score: 0 }] },
            { text: 'Do you find it easy to make decisions?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] },
            { text: 'Is your mind as clear as it used to be?', cat: 'depression', catLabel: 'Depression', likertOptions: [{ emoji: '✅', label: 'Yes', score: 0 }, { emoji: '❌', label: 'No', score: 1 }] }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Yes', score: 1 },
            { emoji: '❌', label: 'No', score: 0 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], multiplier: 1, levels: [{ max: 9, 'label': 'No depression', 'class': 'level-0' }, { max: 19, 'label': 'Mild depression', 'class': 'level-1' }, { max: 999, 'label': 'Severe depression', 'class': 'level-2' }] }
        },
        prevScores: null
    },
    epds: {
        name: 'EPDS', fullname: 'Edinburgh Postnatal Depression Scale',
        icon: '🤱', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Past week', totalQ: 10, maxScore: 30,
        subscales: ['depression'],
        questions: [
            {
                text: 'I have been able to laugh and see the funny side of things', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '🙂', label: 'As much as I always could', score: 0 },
                    { emoji: '😐', label: 'Not quite so much now', score: 1 },
                    { emoji: '😟', label: 'Definitely not so much now', score: 2 },
                    { emoji: '😢', label: 'Not at all', score: 3 }
                ]
            },
            {
                text: 'I have looked forward with enjoyment to things', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '🙂', label: 'As much as I ever did', score: 0 },
                    { emoji: '😐', label: 'Rather less than I used to', score: 1 },
                    { emoji: '😟', label: 'Definitely less than I used to', score: 2 },
                    { emoji: '😢', label: 'Hardly at all', score: 3 }
                ]
            },
            {
                text: 'I have blamed myself unnecessarily when things went wrong', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '😢', label: 'Yes, most of the time', score: 3 },
                    { emoji: '😟', label: 'Yes, some of the time', score: 2 },
                    { emoji: '😐', label: 'Not very often', score: 1 },
                    { emoji: '🙂', label: 'No, never', score: 0 }
                ]
            },
            {
                text: 'I have been anxious or worried for no good reason', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '🙂', label: 'No, not at all', score: 0 },
                    { emoji: '😐', label: 'Hardly ever', score: 1 },
                    { emoji: '😟', label: 'Yes, sometimes', score: 2 },
                    { emoji: '😢', label: 'Yes, very often', score: 3 }
                ]
            },
            {
                text: 'I have felt scared or panicky for no very good reason', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '😢', label: 'Yes, quite a lot', score: 3 },
                    { emoji: '😟', label: 'Yes, sometimes', score: 2 },
                    { emoji: '😐', label: 'No, not much', score: 1 },
                    { emoji: '🙂', label: 'No, not at all', score: 0 }
                ]
            },
            {
                text: 'Things have been getting on top of me', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '😢', label: "Yes, most of the time I haven't been able to cope at all", score: 3 },
                    { emoji: '😟', label: "Yes, sometimes I haven't been coping as well as usual", score: 2 },
                    { emoji: '😐', label: 'No, most of the time I have coped quite well', score: 1 },
                    { emoji: '🙂', label: 'No, I have been coping as well as ever', score: 0 }
                ]
            },
            {
                text: 'I have been so unhappy that I have had difficulty sleeping', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '😢', label: 'Yes, most of the time', score: 3 },
                    { emoji: '😟', label: 'Yes, sometimes', score: 2 },
                    { emoji: '😐', label: 'Not very often', score: 1 },
                    { emoji: '🙂', label: 'No, not at all', score: 0 }
                ]
            },
            {
                text: 'I have felt sad or miserable', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '😢', label: 'Yes, most of the time', score: 3 },
                    { emoji: '😟', label: 'Yes, quite often', score: 2 },
                    { emoji: '😐', label: 'Not very often', score: 1 },
                    { emoji: '🙂', label: 'No, not at all', score: 0 }
                ]
            },
            {
                text: 'I have been so unhappy that I have been crying', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '😢', label: 'Yes, most of the time', score: 3 },
                    { emoji: '😟', label: 'Yes, quite often', score: 2 },
                    { emoji: '😐', label: 'Only occasionally', score: 1 },
                    { emoji: '🙂', label: 'No, never', score: 0 }
                ]
            },
            {
                text: 'The thought of harming myself has occurred to me', cat: 'depression', catLabel: 'Postnatal depression',
                likertOptions: [
                    { emoji: '😢', label: 'Yes, quite often', score: 3 },
                    { emoji: '😟', label: 'Sometimes', score: 2 },
                    { emoji: '😐', label: 'Hardly ever', score: 1 },
                    { emoji: '🙂', label: 'Never', score: 0 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'None', score: 0 },
            { emoji: '😐', label: 'Rarely', score: 1 },
            { emoji: '😟', label: 'Sometimes', score: 2 },
            { emoji: '😢', label: 'Often', score: 3 }
        ],
        scoring: {
            depression: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 9, 'label': 'No depression', 'class': 'level-0' }, { max: 12, 'label': 'At risk of depression', 'class': 'level-1' }, { max: 999, 'label': 'Depression', 'class': 'level-2' }] }
        },
        prevScores: null
    }
};

export default GROUP1_TESTS_EN;


