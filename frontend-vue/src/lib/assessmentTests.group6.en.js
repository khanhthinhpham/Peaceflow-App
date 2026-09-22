// Group 6 — English version. Same shape/key order/indices/scores/classes as
// group6_vi.js — only human-readable text is translated. Kept manually in sync with
// the Vietnamese source (Vietnam MOH clinical procedure guideline, tests 35 and 44).
//
// IMPORTANT SCORING NOTES (full detail in group6_meta.md):
// - EPI: only the "neuroticism" subscale (24 items, column N/KOD in the source answer
//   key — ALL 24 are keyed "Yes") fits the engine's standard scoring shape (sum over
//   indices using one shared likertOptions). The other two subscales — "extraversion"
//   (E, 24 items) and "lie" (S, 9 items) — are REVERSE-KEYED per item (some items score
//   a point for "Yes", others for "No", per the source's answer key). The current
//   engine (single multiplier, no per-item sign flip) cannot express this, so scoring
//   for "extraversion" and "lie" is DELIBERATELY OMITTED here — see the full answer key
//   and algorithm in group6_meta.md.
// - Vanderbilt: per the source's exact instructions, all 5 domains are screened by
//   COUNTING how many items score 2-3 against a COUNT THRESHOLD (e.g. 6/9, 4/8, 3/14,
//   3/7), NOT by summing a total score against a band as other scales do. The
//   `scoring.levels` shape (total-score bands) cannot express this count-threshold
//   algorithm, so `scoring` is left EMPTY — see the full algorithm in words in
//   group6_meta.md.

export const TESTS = {
    epi: {
        name: 'EPI', fullname: 'Eysenck Personality Inventory',
        icon: '🎭', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'In general, about yourself', totalQ: 57, maxScore: 24,
        subscales: ['neuroticism'],
        questions: [
            { text: 'You often crave new and exciting experiences.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You need friends who can understand, encourage, and comfort you.', cat: 'n', catLabel: 'Neuroticism' },
            { text: "You are carefree and don't worry about anything.", cat: 'e', catLabel: 'Extraversion' },
            { text: 'You find it difficult to refuse something.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You think things through carefully before making a decision.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You always keep your promises, whether or not it is convenient for you.', cat: 's', catLabel: 'Lie/Validity' },
            { text: 'Your mood often changes unpredictably.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You often act or speak quickly without thinking.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You often feel unhappy for no clear reason.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You usually defend your opinion to the end in an argument.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You often feel shy or embarrassed talking to an unfamiliar member of the opposite sex.', cat: 'n', catLabel: 'Neuroticism' },
            { text: "Sometimes you can't hold back and lose your temper.", cat: 's', catLabel: 'Lie/Validity' },
            { text: 'You often act impulsively.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You are often troubled by having done something you should not have done.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You prefer reading books to meeting people.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You are easily hurt or offended.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You like joining in with friends.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'Sometimes you have thoughts you would not want others to know at first.', cat: 's', catLabel: 'Lie/Validity' },
            { text: 'Sometimes you feel full of energy and enthusiasm for everything, but at other times you feel completely worn out.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You would rather have a few close friends than many.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You often daydream.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You react right away when someone speaks harshly to you.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You are often troubled when you have done something wrong.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'All of your habits are good and necessary.', cat: 's', catLabel: 'Lie/Validity' },
            { text: 'You have the ability to inspire and make people laugh in your group of friends.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You are a sensitive person.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You are a lively, cheerful person.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'After doing something important, you often feel you could have done it better.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You are often quiet around strangers.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You sometimes spread gossip or rumors.', cat: 's', catLabel: 'Lie/Validity' },
            { text: "You often can't sleep because of various thoughts running through your mind.", cat: 'n', catLabel: 'Neuroticism' },
            { text: 'If you want to know something, you prefer to find out for yourself rather than ask others.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You often feel nervous or on edge.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You like work that requires continuous concentration.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'Sometimes you tremble with joy or fear.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You always pay the full transport fare even when there is no one checking.', cat: 's', catLabel: 'Lie/Validity' },
            { text: 'You feel uncomfortable in places where people tease each other.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You get angry easily.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You like work that requires quick action.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You feel anxious when you sense something unfavorable might happen.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You walk in a relaxed, unhurried manner.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'There have been times you arrived late to an appointment or to work.', cat: 's', catLabel: 'Lie/Validity' },
            { text: 'You often have nightmares.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You enjoy conversation so much that you never miss a chance to talk even to strangers.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You worry about some ache or pain in your body.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You feel miserable when you go a long time without socializing widely with people.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You are an irritable person.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'Among your acquaintances there are some people you dislike.', cat: 's', catLabel: 'Lie/Validity' },
            { text: 'You are a very self-confident person.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You are easily offended when someone points out your flaws.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You think it is hard to truly feel at ease at parties.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You feel uneasy when you fall behind your friends in some way.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You can easily liven up a rather dull gathering.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You often talk about matters you are not really sure about.', cat: 's', catLabel: 'Lie/Validity' },
            { text: 'You worry about your health.', cat: 'n', catLabel: 'Neuroticism' },
            { text: 'You enjoy teasing other people.', cat: 'e', catLabel: 'Extraversion' },
            { text: 'You suffer from insomnia.', cat: 'n', catLabel: 'Neuroticism' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Yes', score: 1 },
            { emoji: '❌', label: 'No', score: 0 }
        ],
        // Only the "neuroticism" subscale (24 items, column N/KOD in the source answer
        // key) scores in one direction (all 24 items score 1 point for "Yes"), so it is
        // the only one that fits the standard indices/multiplier shape. "extraversion"
        // (E, 24 items) and "lie" (S, 9 items) are reverse-keyed per item — NOT included
        // here; see group6_meta.md for the full answer key and how to implement it.
        scoring: {
            neuroticism: {
                indices: [1, 3, 6, 8, 10, 13, 15, 18, 20, 22, 25, 27, 30, 32, 34, 37, 39, 42, 44, 46, 49, 51, 54, 56],
                multiplier: 1,
                levels: [
                    { max: 7, 'label': 'Stable (low)', 'class': 'level-0' },
                    { max: 16, 'label': 'Average', 'class': 'level-1' },
                    { max: 999, 'label': 'Unstable (high)', 'class': 'level-2' }
                ]
            }
        },
        prevScores: null
    },
    vanderbilt: {
        name: 'Vanderbilt', fullname: 'Vanderbilt ADHD Diagnostic Parent Rating Scale',
        icon: '⚡', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: 'Past 6 months', totalQ: 47, maxScore: 141,
        subscales: ['inattention', 'hyperactivity', 'oppositional', 'conduct', 'anxiety_depression'],
        questions: [
            { text: 'Does not pay attention to details or makes careless mistakes, for example, with homework', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Has difficulty keeping attention on what needs to be done', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Does not seem to listen when spoken to directly', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Does not follow through on instructions and fails to finish schoolwork or chores', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Has difficulty organizing tasks and activities', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Avoids, dislikes, or does not want to start tasks that require ongoing mental effort', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Loses things necessary for tasks or activities (toys, assignments, pencils, or books)', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Is easily distracted by noises or other stimuli', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Is forgetful in daily activities', cat: 'inattention', catLabel: 'Inattention' },
            { text: 'Fidgets with hands or feet or squirms in seat', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Leaves seat when remaining seated is expected', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Runs about or climbs too much when remaining seated is expected', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Has difficulty playing or beginning quiet play activities', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Is "on the go" or often acts as if "driven by a motor"', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Talks too much', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Blurts out answers before questions have been completed', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Has difficulty waiting his or her turn', cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: "Interrupts or intrudes in on others' conversations and/or activities", cat: 'hyperactivity', catLabel: 'Hyperactivity/Impulsivity' },
            { text: 'Argues with adults', cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: 'Loses temper', cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: "Actively defies or refuses to go along with adults' requests or rules", cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: 'Deliberately annoys people', cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: 'Blames others for his or her mistakes or misbehaviors', cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: 'Is touchy or easily annoyed by others', cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: 'Is angry or resentful', cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: 'Is spiteful and wants to get even', cat: 'oppositional', catLabel: 'Oppositional Defiant' },
            { text: 'Bullies, threatens, or intimidates others', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Starts physical fights', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Lies to get out of trouble or to avoid obligations (i.e., "cons" others)', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Skips school without permission (truancy)', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Is physically cruel to people', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Has stolen things that have value', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: "Deliberately destroys others' property", cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Has used a weapon that can cause serious harm (bat, knife, brick, gun)', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Is physically cruel to animals', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Has deliberately set fires to cause damage', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: "Has broken into someone else's home, business, or car", cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Has stayed out at night without permission', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Has run away from home overnight', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Has forced someone into sexual activity', cat: 'conduct', catLabel: 'Conduct Problems' },
            { text: 'Is fearful, anxious, or worried', cat: 'anxiety_depression', catLabel: 'Anxiety/Depression' },
            { text: 'Is afraid to try new things for fear of making mistakes', cat: 'anxiety_depression', catLabel: 'Anxiety/Depression' },
            { text: 'Feels worthless or inferior', cat: 'anxiety_depression', catLabel: 'Anxiety/Depression' },
            { text: 'Blames self for problems, feels guilty', cat: 'anxiety_depression', catLabel: 'Anxiety/Depression' },
            { text: 'Feels lonely, unwanted, or unloved; complains that "no one loves him or her"', cat: 'anxiety_depression', catLabel: 'Anxiety/Depression' },
            { text: 'Is sad, unhappy, or depressed', cat: 'anxiety_depression', catLabel: 'Anxiety/Depression' },
            { text: 'Is self-conscious or easily embarrassed', cat: 'anxiety_depression', catLabel: 'Anxiety/Depression' }
        ],
        likertOptions: [
            { emoji: '🙂', label: 'Never', score: 0 },
            { emoji: '😐', label: 'Occasionally', score: 1 },
            { emoji: '😟', label: 'Often', score: 2 },
            { emoji: '😣', label: 'Very often', score: 3 }
        ],
        // DELIBERATELY EMPTY: all 5 domains are scored by COUNTING how many items score
        // 2 ("Often") or 3 ("Very often") against a COUNT THRESHOLD (6/9, 6/9, 4/8,
        // 3/14, 3/7) — not by summing a total score against a band, unlike the engine's
        // standard `scoring.levels`. See the full algorithm in group6_meta.md.
        scoring: {},
        prevScores: null
    }
};


