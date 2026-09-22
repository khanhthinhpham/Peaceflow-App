import { ADDITIONAL_TESTS } from './assessmentTests.additional.js';

const category = { hdrs: 'clinician', cdi: 'child_teen', gds: 'depression', epds: 'depression', zai: 'anxiety', hads: 'anxiety', mchat: 'child_teen', asq3: 'child_teen', cgis: 'clinician', bprs: 'clinician', panss: 'clinician', aims: 'clinician', hachinski: 'cognitive', himmelbach: 'substance', epi: 'personality', vanderbilt: 'child_teen' };
const card = (apiCode, name, fullname, icon, kind, desc, count, duration, iconStyle, mode = null, specialistNote = '') => ({
  apiCode, name, fullname, icon, category: kind, desc, cardClass: 'dass', iconStyle,
  badges: [{ className: 'badge-peach', label: `${count} câu hỏi` }, { className: 'badge-mint', label: duration }],
  ...(mode ? { mode, specialistNote } : {})
});
const scored = Object.fromEntries(Object.entries(ADDITIONAL_TESTS).map(([key, test]) => [key, card(
  key.toUpperCase(), test.name, test.fullname, test.icon, category[key] || 'clinician',
  'Bài đánh giá theo tài liệu hướng dẫn Bộ Y tế.', test.totalQ, '~Theo quy trình',
  `background:${test.iconBg || 'var(--sky-light)'};border-color:${test.iconBorder || 'var(--sky)'};`
)]));
const specialist = {
  ymrs: ['YMRS', 'Young Mania Rating Scale', '🌤️', 'clinician'], scas: ['SCAS', 'Spence Children’s Anxiety Scale', '🧒', 'child_teen'], denver2: ['DENVER2', 'Denver Developmental Screening Test II', '🧩', 'child_teen'], cars: ['CARS', 'Childhood Autism Rating Scale', '🧩', 'child_teen'], dsm5asd: ['DSM5ASD', 'DSM-5 Autism Spectrum Disorder Diagnostic Criteria', '📖', 'clinician'], cbcl: ['CBCL', 'Child Behavior Checklist', '🧒', 'child_teen'], wais: ['WAIS', 'Wechsler Adult Intelligence Scale', '🧠', 'cognitive'], wisc: ['WISC', 'Wechsler Intelligence Scale for Children', '🧠', 'child_teen'], wms: ['WMS', 'Wechsler Memory Scale', '🧠', 'cognitive'], bourdon: ['BOURDON', 'Bourdon Attention Test', '🔎', 'cognitive'], pictogram: ['PICTOGRAM', 'Pictogram Memory Test', '🖼️', 'cognitive'], mmpi: ['MMPI', 'Minnesota Multiphasic Personality Inventory', '🎭', 'personality'], rorschach: ['RORSCHACH', 'Rorschach Inkblot Test', '🖋️', 'personality'], cat: ['CAT', 'Children’s Apperception Test', '🖼️', 'personality'], tat: ['TAT', 'Thematic Apperception Test', '🖼️', 'personality'], cattell: ['CATTELL', 'Cattell Personality Questionnaire', '🎭', 'personality'], barnes: ['BARNES', 'Barnes Akathisia Rating Scale', '🧍', 'clinician'], ciwa: ['CIWA', 'Clinical Institute Withdrawal Assessment for Alcohol', '🍺', 'clinician']
};
const guided = Object.fromEntries(Object.entries(specialist).map(([key, [apiCode, fullname, icon, kind]]) => [key, card(
  apiCode, apiCode, fullname, icon, kind, 'Đánh giá chuyên môn; không tự chấm điểm.', 'Chuyên gia', 'Không tự chấm',
  'background:var(--gold-light);border-color:var(--gold);', 'specialist',
  'Cần chuyên gia thực hiện bằng bộ công cụ, bảng chuẩn và quy trình được cơ sở y tế phê duyệt.'
)]));
export const ADDITIONAL_ASSESSMENT_META = { ...scored, ...guided };
