// Group 3 — clinician-/parent-administered instruments (English version).
// Same shape/key order/indices/scores/classes as group3_vi.js — only human-readable text
// is translated. See group3_meta.md for full notes, including why `dsm5asd` and `cbcl`
// were not digitized.

export const TESTS = {
    mchat: {
        name: 'M-CHAT', fullname: 'Modified Checklist for Autism in Toddlers (M-CHAT), 16-30 months',
        icon: '🧩', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: "Child's usual behavior (ignore if seen only 1-2 times)", totalQ: 20, maxScore: 20,
        subscales: ['risk'],
        questions: [
            { text: 'If you point at something across the room, does your child look at it? (For example, if you point at a toy or an animal, does your child look at that toy or animal?)', cat: 'risk', catLabel: 'Autism risk' },
            {
                text: 'Have you ever wondered if your child might be deaf?', cat: 'risk', catLabel: 'Autism risk',
                likertOptions: [
                    { emoji: '✅', label: 'Yes', score: 1 },
                    { emoji: '❌', label: 'No', score: 0 }
                ]
            },
            { text: 'Does your child play pretend or make-believe? (For example, pretend to drink from an empty cup, pretend to talk on the phone, or pretend to feed a doll or stuffed animal?)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child like climbing on things? (For example, furniture, playground equipment, or stairs)', cat: 'risk', catLabel: 'Autism risk' },
            {
                text: 'Does your child make unusual finger movements near his or her eyes? (For example, does your child wiggle his or her fingers close to his or her eyes?)', cat: 'risk', catLabel: 'Autism risk',
                likertOptions: [
                    { emoji: '✅', label: 'Yes', score: 1 },
                    { emoji: '❌', label: 'No', score: 0 }
                ]
            },
            { text: 'Does your child point with one finger to ask for something or to get help? (For example, pointing at a snack or toy that is out of reach)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child point with one finger to show you something interesting? (For example, pointing at an airplane in the sky or a big truck on the road)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Is your child interested in other children? (For example, does your child watch other children, smile at them, or go to them?)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child show you things by bringing them to you or holding them up for you to see — not to get help, but just to share? (For example, showing you a flower, a stuffed animal, or a toy truck)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child respond when you call his or her name? (For example, does he or she look up, talk or babble, or stop what he or she is doing?)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'When you smile at your child, does he or she smile back at you?', cat: 'risk', catLabel: 'Autism risk' },
            {
                text: 'Does your child get upset by everyday noises? (For example, does your child scream or cry at the sound of a vacuum cleaner or loud music?)', cat: 'risk', catLabel: 'Autism risk',
                likertOptions: [
                    { emoji: '✅', label: 'Yes', score: 1 },
                    { emoji: '❌', label: 'No', score: 0 }
                ]
            },
            { text: 'Does your child walk?', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child look you in the eye when you are talking to him or her, playing with him or her, or dressing him or her?', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child try to copy what you do? (For example, wave bye-bye, clap, or make funny sounds when you do)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'If you turn your head to look at something, does your child look around to see what you are looking at?', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child try to get you to watch him or her? (For example, does your child look at you for praise, or say "look" or "watch me"?)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child understand what you say when you ask him or her to do something? (For example, without pointing, does your child understand "put the book on the chair" or "bring me the blanket"?)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'If something new happens, does your child look at your face to see how you feel about it? (For example, if he or she hears a strange or funny sound, or sees a new toy, does he or she look at your face?)', cat: 'risk', catLabel: 'Autism risk' },
            { text: 'Does your child like movement activities? (For example, being swung or bounced on your knee)', cat: 'risk', catLabel: 'Autism risk' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Yes', score: 0 },
            { emoji: '❌', label: 'No', score: 1 }
        ],
        scoring: {
            risk: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], multiplier: 1, levels: [{ max: 2, 'label': 'Low autism risk', 'class': 'level-0' }, { max: 7, 'label': 'Some autism risk', 'class': 'level-1' }, { max: 999, 'label': 'High autism risk', 'class': 'level-3' }] }
        },
        prevScores: null
    },
    asq3: {
        name: 'ASQ-3 (24 months)', fullname: 'Ages and Stages Questionnaires — Form 6, 24-35 months (ASQ-3, MOH Yes/No adaptation)',
        icon: '🧸', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: "Child's current developmental stage (24-35 months)", totalQ: 20, maxScore: 20,
        subscales: ['communication', 'grossmotor', 'finemotor', 'imitation', 'personalsocial', 'redflag'],
        questions: [
            { text: 'Does the child correctly point to an object/animal in a picture when asked? (E.g., "Where\'s the dog?" "Where\'s the cup?")', cat: 'communication', catLabel: 'Communication' },
            { text: 'Does the child say 2-3 word phrases appropriately in context? (E.g., "Mommy\'s home")', cat: 'communication', catLabel: 'Communication' },
            { text: 'Does the child follow simple commands? (E.g., "Put the toys away")', cat: 'communication', catLabel: 'Communication' },
            { text: 'Can the child climb up at least 1-2 steps/stairs?', cat: 'grossmotor', catLabel: 'Gross motor' },
            { text: 'Can the child run and stop without falling?', cat: 'grossmotor', catLabel: 'Gross motor' },
            { text: 'Can the child kick a ball while holding onto something for balance?', cat: 'grossmotor', catLabel: 'Gross motor' },
            { text: 'Can the child use a spoon to scoop food into his/her mouth?', cat: 'finemotor', catLabel: 'Fine motor' },
            { text: "Can the child turn a doorknob or twist off a toy's lid?", cat: 'finemotor', catLabel: 'Fine motor' },
            { text: 'Can the child turn the pages of a book by him/herself (a few pages at a time)?', cat: 'finemotor', catLabel: 'Fine motor' },
            { text: 'Does the child engage in pretend play? (E.g., pretending to talk on the phone)', cat: 'imitation', catLabel: 'Imitation & learning' },
            { text: 'Can the child imitate drawing a straight line after you?', cat: 'imitation', catLabel: 'Imitation & learning' },
            { text: "Can the child put objects back in their proper place? (E.g., putting toys back in the box)", cat: 'imitation', catLabel: 'Imitation & learning' },
            { text: 'Can the child drink from a cup?', cat: 'personalsocial', catLabel: 'Personal-social' },
            { text: 'Can the child imitate actions? (E.g., sweeping, combing hair)', cat: 'personalsocial', catLabel: 'Personal-social' },
            { text: "Does the child engage in pretend play with his/her own toys? (E.g., rocking a doll to sleep)", cat: 'personalsocial', catLabel: 'Personal-social' },
            {
                text: 'Has the child ever had a seizure or a fainting episode?', cat: 'redflag', catLabel: 'Warning signs',
                likertOptions: [
                    { emoji: '❌', label: 'No', score: 0 },
                    { emoji: '✅', label: 'Yes', score: 1 }
                ]
            },
            {
                text: 'Does the child have any abnormality of the neck, spine, torso, or limbs?', cat: 'redflag', catLabel: 'Warning signs',
                likertOptions: [
                    { emoji: '❌', label: 'No', score: 0 },
                    { emoji: '✅', label: 'Yes', score: 1 }
                ]
            },
            {
                text: 'Does the child have any ear abnormality, ear disease, or hearing problem?', cat: 'redflag', catLabel: 'Warning signs',
                likertOptions: [
                    { emoji: '❌', label: 'No', score: 0 },
                    { emoji: '✅', label: 'Yes', score: 1 }
                ]
            },
            {
                text: 'Does the child have any eye abnormality or vision problem?', cat: 'redflag', catLabel: 'Warning signs',
                likertOptions: [
                    { emoji: '❌', label: 'No', score: 0 },
                    { emoji: '✅', label: 'Yes', score: 1 }
                ]
            },
            {
                text: 'Does the child have any other abnormality? (E.g., face, lip/cleft palate…)', cat: 'redflag', catLabel: 'Warning signs',
                likertOptions: [
                    { emoji: '❌', label: 'No', score: 0 },
                    { emoji: '✅', label: 'Yes', score: 1 }
                ]
            }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Yes', score: 0 },
            { emoji: '❌', label: 'No', score: 1 }
        ],
        scoring: {
            communication: { indices: [0, 1, 2], multiplier: 1, levels: [{ max: 1, 'label': 'Normal', 'class': 'level-0' }, { max: 999, 'label': 'Possible developmental delay', 'class': 'level-2' }] },
            grossmotor: { indices: [3, 4, 5], multiplier: 1, levels: [{ max: 1, 'label': 'Normal', 'class': 'level-0' }, { max: 999, 'label': 'Possible developmental delay', 'class': 'level-2' }] },
            finemotor: { indices: [6, 7, 8], multiplier: 1, levels: [{ max: 1, 'label': 'Normal', 'class': 'level-0' }, { max: 999, 'label': 'Possible developmental delay', 'class': 'level-2' }] },
            imitation: { indices: [9, 10, 11], multiplier: 1, levels: [{ max: 1, 'label': 'Normal', 'class': 'level-0' }, { max: 999, 'label': 'Possible developmental delay', 'class': 'level-2' }] },
            personalsocial: { indices: [12, 13, 14], multiplier: 1, levels: [{ max: 1, 'label': 'Normal', 'class': 'level-0' }, { max: 999, 'label': 'Possible developmental delay', 'class': 'level-2' }] },
            redflag: { indices: [15, 16, 17, 18, 19], multiplier: 1, levels: [{ max: 0, 'label': 'Normal', 'class': 'level-0' }, { max: 999, 'label': 'Abnormal sign present — refer for specialist evaluation', 'class': 'level-3' }] }
        },
        prevScores: null
    }
};


