// English version of group2_vi.js — same shape/key order/indices/scores/classes, only
// human-readable text translated to standard/official published English wording for
// ZAI (Zung SAS) and HADS. See group2_meta.md for YMRS/SCAS notes (not implemented here).

export const TESTS = {
    zai: {
        name: 'ZAI', fullname: 'Zung Self-Rating Anxiety Scale (SAS)',
        icon: '😟', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Past week', totalQ: 20, maxScore: 100,
        subscales: ['anxiety'],
        questions: [
            { text: 'I feel more nervous and anxious than usual', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I feel afraid for no reason at all', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I get upset easily or feel panicky', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: "I feel like I'm falling apart and going to pieces", cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I feel that everything is all right and nothing bad will happen', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '😊', label: 'Not at all', score: 4 },
                { emoji: '😐', label: 'A little', score: 3 },
                { emoji: '😟', label: 'A good part of the time', score: 2 },
                { emoji: '😰', label: 'Most of the time', score: 1 }
            ] },
            { text: 'My arms and legs shake and tremble', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I am bothered by headaches, neck and back pain', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I feel weak and get tired easily', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I feel calm and can sit still easily', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '😊', label: 'Not at all', score: 4 },
                { emoji: '😐', label: 'A little', score: 3 },
                { emoji: '😟', label: 'A good part of the time', score: 2 },
                { emoji: '😰', label: 'Most of the time', score: 1 }
            ] },
            { text: 'I feel my heart beating fast', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I am bothered by dizziness', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I have fainting spells, or feel like it', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I can breathe in and out easily', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '😊', label: 'Not at all', score: 4 },
                { emoji: '😐', label: 'A little', score: 3 },
                { emoji: '😟', label: 'A good part of the time', score: 2 },
                { emoji: '😰', label: 'Most of the time', score: 1 }
            ] },
            { text: 'I get feelings of numbness and tingling in my fingers and toes', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I am bothered by stomach aches or indigestion', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I have to empty my bladder often', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'My hands are usually dry and warm', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '😊', label: 'Not at all', score: 4 },
                { emoji: '😐', label: 'A little', score: 3 },
                { emoji: '😟', label: 'A good part of the time', score: 2 },
                { emoji: '😰', label: 'Most of the time', score: 1 }
            ] },
            { text: 'My face gets hot and blushes', cat: 'anxiety', catLabel: 'Anxiety' },
            { text: 'I fall asleep easily and get a good night’s rest', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '😊', label: 'Not at all', score: 4 },
                { emoji: '😐', label: 'A little', score: 3 },
                { emoji: '😟', label: 'A good part of the time', score: 2 },
                { emoji: '😰', label: 'Most of the time', score: 1 }
            ] },
            { text: 'I have nightmares', cat: 'anxiety', catLabel: 'Anxiety' }
        ],
        likertOptions: [
            { emoji: '😊', label: 'Not at all', score: 1 },
            { emoji: '😐', label: 'A little', score: 2 },
            { emoji: '😟', label: 'A good part of the time', score: 3 },
            { emoji: '😰', label: 'Most of the time', score: 4 }
        ],
        scoring: {
            anxiety: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], multiplier: 1.25, levels: [
                { max: 44, 'label': 'No clinical anxiety', 'class': 'level-0' },
                { max: 59, 'label': 'Mild to moderate anxiety', 'class': 'level-1' },
                { max: 74, 'label': 'Severe anxiety', 'class': 'level-2' },
                { max: 999, 'label': 'Extreme anxiety', 'class': 'level-3' }
            ] }
        },
        prevScores: null
    },
    hads: {
        name: 'HADS', fullname: 'Hospital Anxiety and Depression Scale',
        icon: '🏥', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: 'Past 1-2 weeks', totalQ: 14, maxScore: 42,
        subscales: ['anxiety', 'depression'],
        questions: [
            { text: "I feel tense or 'wound up'", cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '🙂', label: 'Not at all', score: 0 },
                { emoji: '😐', label: 'From time to time, occasionally', score: 1 },
                { emoji: '😟', label: 'A lot of the time', score: 2 },
                { emoji: '😰', label: 'Most of the time', score: 3 }
            ] },
            { text: 'I still enjoy the things I used to enjoy', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'Definitely as much', score: 0 },
                { emoji: '😐', label: 'Not quite so much', score: 1 },
                { emoji: '😟', label: 'Only a little', score: 2 },
                { emoji: '😰', label: 'Hardly at all', score: 3 }
            ] },
            { text: 'I get a sort of frightened feeling as if something awful is about to happen', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '🙂', label: 'Not at all', score: 0 },
                { emoji: '😐', label: "A little, but it doesn't worry me", score: 1 },
                { emoji: '😟', label: 'Yes, but not too badly', score: 2 },
                { emoji: '😰', label: 'Very definitely and quite badly', score: 3 }
            ] },
            { text: 'I can laugh and see the funny side of things', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'As much as I always could', score: 0 },
                { emoji: '😐', label: 'Not quite so much now', score: 1 },
                { emoji: '😟', label: 'Definitely not so much now', score: 2 },
                { emoji: '😰', label: 'Not at all', score: 3 }
            ] },
            { text: 'Worrying thoughts go through my mind', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '🙂', label: 'Only occasionally', score: 0 },
                { emoji: '😐', label: 'From time to time, but not too often', score: 1 },
                { emoji: '😟', label: 'A lot of the time', score: 2 },
                { emoji: '😰', label: 'A great deal of the time', score: 3 }
            ] },
            { text: 'I feel cheerful', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'Most of the time', score: 0 },
                { emoji: '😐', label: 'Sometimes', score: 1 },
                { emoji: '😟', label: 'Not often', score: 2 },
                { emoji: '😰', label: 'Not at all', score: 3 }
            ] },
            { text: 'I can sit at ease and feel relaxed', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '🙂', label: 'Definitely', score: 0 },
                { emoji: '😐', label: 'Usually', score: 1 },
                { emoji: '😟', label: 'Not often', score: 2 },
                { emoji: '😰', label: 'Not at all', score: 3 }
            ] },
            { text: 'I feel as if I am slowed down', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'Not at all', score: 0 },
                { emoji: '😐', label: 'Sometimes', score: 1 },
                { emoji: '😟', label: 'Very often', score: 2 },
                { emoji: '😰', label: 'Nearly all the time', score: 3 }
            ] },
            { text: "I get a sort of frightened feeling like 'butterflies' in the stomach", cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '🙂', label: 'Not at all', score: 0 },
                { emoji: '😐', label: 'Occasionally', score: 1 },
                { emoji: '😟', label: 'Quite often', score: 2 },
                { emoji: '😰', label: 'Very often', score: 3 }
            ] },
            { text: 'I have lost interest in my appearance', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'I take just as much care as ever', score: 0 },
                { emoji: '😐', label: 'I may not take quite as much care', score: 1 },
                { emoji: '😟', label: "I don't take as much care as I should", score: 2 },
                { emoji: '😰', label: 'Definitely', score: 3 }
            ] },
            { text: 'I feel restless as if I have to be on the move', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '🙂', label: 'Not at all', score: 0 },
                { emoji: '😐', label: 'Not very much', score: 1 },
                { emoji: '😟', label: 'Quite a lot', score: 2 },
                { emoji: '😰', label: 'Very much indeed', score: 3 }
            ] },
            { text: 'I look forward with enjoyment to things', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'As much as I ever did', score: 0 },
                { emoji: '😐', label: 'Rather less than I used to', score: 1 },
                { emoji: '😟', label: 'Definitely less than I used to', score: 2 },
                { emoji: '😰', label: 'Hardly at all', score: 3 }
            ] },
            { text: 'I get sudden feelings of panic', cat: 'anxiety', catLabel: 'Anxiety', likertOptions: [
                { emoji: '🙂', label: 'Not at all', score: 0 },
                { emoji: '😐', label: 'Not very often', score: 1 },
                { emoji: '😟', label: 'Quite often', score: 2 },
                { emoji: '😰', label: 'Very often indeed', score: 3 }
            ] },
            { text: 'I can enjoy a good book or radio or TV programme', cat: 'depression', catLabel: 'Depression', likertOptions: [
                { emoji: '🙂', label: 'Often', score: 0 },
                { emoji: '😐', label: 'Sometimes', score: 1 },
                { emoji: '😟', label: 'Not often', score: 2 },
                { emoji: '😰', label: 'Very seldom', score: 3 }
            ] }
        ],
        scoring: {
            anxiety: { indices: [0, 2, 4, 6, 8, 10, 12], multiplier: 1, levels: [{ max: 999, 'label': 'Anxiety', 'class': 'level-1' }] },
            depression: { indices: [1, 3, 5, 7, 9, 11, 13], multiplier: 1, levels: [{ max: 999, 'label': 'Depression', 'class': 'level-2' }] },
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], multiplier: 1, levels: [
                { max: 7, 'label': 'Normal', 'class': 'level-0' },
                { max: 10, 'label': 'Borderline', 'class': 'level-1' },
                { max: 999, 'label': 'Anxiety/depression present', 'class': 'level-3' }
            ] }
        },
        prevScores: null
    }
};


