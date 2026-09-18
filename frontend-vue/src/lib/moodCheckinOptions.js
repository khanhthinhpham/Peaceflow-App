// Danh mục dùng chung cho mọi nơi dựng lại luồng "Check-in nhanh" (trang /mood-checkin
// thật VÀ widget demo trên trang chủ) — tách ra một chỗ để 2 nơi luôn khớp nhau, tránh lặp
// lại lỗi "sửa ở app thật mà quên đồng bộ landing page" đã gặp trước đây.

// `id` ỔN ĐỊNH dùng để so khớp lựa chọn trong UI; `viLabel` là giá trị THẬT gửi lên backend
// làm dominant_emotion — LUÔN LUÔN tiếng Việt, KHÔNG đổi theo ngôn ngữ đang chọn.
// Lý do: backend (expert.routes.js) có dò `emotion.includes('buồn')` để gắn cờ "cần chuyên
// gia trầm cảm" khi ghép chuyên gia phù hợp — nếu gửi nhãn tiếng Anh ("Sad") thì người dùng
// tiếng Anh sẽ không bao giờ được gắn cờ này. `labelKey` chỉ dùng để HIỂN THỊ.
export const MOOD_OPTIONS = [
  { id: 'veryHappy', score: 9, viLabel: 'Rất vui', labelKey: 'moodCheckin.moods.veryHappy', emoji: '😊' },
  { id: 'comfortable', score: 7, viLabel: 'Thoải mái', labelKey: 'moodCheckin.moods.comfortable', emoji: '😌' },
  { id: 'normal', score: 5, viLabel: 'Bình thường', labelKey: 'moodCheckin.moods.normal', emoji: '😐' },
  { id: 'slightlyStressed', score: 4, viLabel: 'Hơi căng', labelKey: 'moodCheckin.moods.slightlyStressed', emoji: '😟' },
  { id: 'veryStressed', score: 2, viLabel: 'Rất căng thẳng', labelKey: 'moodCheckin.moods.veryStressed', emoji: '😰' },
  { id: 'sad', score: 2, viLabel: 'Buồn bã', labelKey: 'moodCheckin.moods.sad', emoji: '😢' },
  { id: 'angry', score: 1, viLabel: 'Tức giận', labelKey: 'moodCheckin.moods.angry', emoji: '😡' }
];

// `id` ở đây CHÍNH LÀ token gửi lên backend làm `triggers`.
export const TAGS = [
  { id: 'work', labelKey: 'moodCheckin.tags.work' },
  { id: 'family', labelKey: 'moodCheckin.tags.family' },
  { id: 'relationship', labelKey: 'moodCheckin.tags.relationship' },
  { id: 'finance', labelKey: 'moodCheckin.tags.finance' },
  { id: 'health', labelKey: 'moodCheckin.tags.health' },
  { id: 'lonely', labelKey: 'moodCheckin.tags.lonely' },
  { id: 'sleep_loss', labelKey: 'moodCheckin.tags.sleep_loss' },
  { id: 'social_media', labelKey: 'moodCheckin.tags.social_media' },
  { id: 'study', labelKey: 'moodCheckin.tags.study' },
  { id: 'unknown', labelKey: 'moodCheckin.tags.unknown' }
];

// Bước 4 (triệu chứng cơ thể): 2 cấp — tag cha bấm vào để MỞ RỘNG tag con (trừ "Mất ngủ"
// không có tag con, bấm là chọn luôn nó làm triệu chứng).
export const BODY_SYMPTOM_GROUPS = [
  { id: 'insomnia', labelKey: 'moodCheckin.bodyGroups.insomnia', children: [] },
  {
    id: 'pain', labelKey: 'moodCheckin.bodyGroups.pain', children: [
      { id: 'migraine', labelKey: 'moodCheckin.bodyTags.migraine' },
      { id: 'severe_headache', labelKey: 'moodCheckin.bodyTags.severe_headache' },
      { id: 'back_pain', labelKey: 'moodCheckin.bodyTags.back_pain' },
      { id: 'fainting', labelKey: 'moodCheckin.bodyTags.fainting' },
      { id: 'unclear_ache', labelKey: 'moodCheckin.bodyTags.unclear_ache' }
    ]
  },
  {
    id: 'palpitations', labelKey: 'moodCheckin.bodyGroups.palpitations', children: [
      { id: 'rapid_heartbeat', labelKey: 'moodCheckin.bodyTags.rapid_heartbeat' },
      { id: 'breathless', labelKey: 'moodCheckin.bodyTags.breathless' },
      { id: 'nervous', labelKey: 'moodCheckin.bodyTags.nervous' },
      { id: 'short_of_breath', labelKey: 'moodCheckin.bodyTags.short_of_breath' },
      { id: 'muscle_tension', labelKey: 'moodCheckin.bodyTags.muscle_tension' },
      { id: 'chest_tightness', labelKey: 'moodCheckin.bodyTags.chest_tightness' },
      { id: 'throat_lump', labelKey: 'moodCheckin.bodyTags.throat_lump' },
      { id: 'dizzy', labelKey: 'moodCheckin.bodyTags.dizzy' }
    ]
  },
  {
    id: 'exhaustion', labelKey: 'moodCheckin.bodyGroups.exhaustion', children: [
      { id: 'easily_sick', labelKey: 'moodCheckin.bodyTags.easily_sick' },
      { id: 'fever', labelKey: 'moodCheckin.bodyTags.fever' },
      { id: 'sweaty_hands', labelKey: 'moodCheckin.bodyTags.sweaty_hands' },
      { id: 'numb_limbs', labelKey: 'moodCheckin.bodyTags.numb_limbs' },
      { id: 'chills', labelKey: 'moodCheckin.bodyTags.chills' },
      { id: 'rapid_weight_gain', labelKey: 'moodCheckin.bodyTags.rapid_weight_gain' },
      { id: 'skin_issues', labelKey: 'moodCheckin.bodyTags.skin_issues' }
    ]
  },
  {
    id: 'appetite_loss', labelKey: 'moodCheckin.bodyGroups.appetite_loss', children: [
      { id: 'indigestion', labelKey: 'moodCheckin.bodyTags.indigestion' },
      { id: 'diarrhea_constipation', labelKey: 'moodCheckin.bodyTags.diarrhea_constipation' },
      { id: 'abdominal_discomfort', labelKey: 'moodCheckin.bodyTags.abdominal_discomfort' },
      { id: 'dry_mouth', labelKey: 'moodCheckin.bodyTags.dry_mouth' }
    ]
  },
  {
    id: 'psychological', labelKey: 'moodCheckin.bodyGroups.psychological', children: [
      { id: 'restless', labelKey: 'moodCheckin.bodyTags.restless' },
      { id: 'hypervigilance', labelKey: 'moodCheckin.bodyTags.hypervigilance' },
      { id: 'poor_concentration', labelKey: 'moodCheckin.bodyTags.poor_concentration' },
      { id: 'sleep_disturbance', labelKey: 'moodCheckin.bodyTags.sleep_disturbance' },
      { id: 'fear_of_losing_control', labelKey: 'moodCheckin.bodyTags.fear_of_losing_control' }
    ]
  }
];

// Công thức chấm điểm phụ (anxiety/stress/energy/sleep) dùng chung khi gửi lên `/moods` —
// tách ra để widget demo trang chủ và trang check-in thật tính ra cùng một kết quả.
export function deriveMoodPayload({ score, moodViLabel, triggerIds, notes = null }) {
  const anxietyScore = score <= 2 ? 9 : score <= 4 ? 7 : score <= 6 ? 5 : 3;
  const stressScore = triggerIds.some((id) => ['work', 'finance', 'study'].includes(id))
    ? Math.min(10, anxietyScore + 1)
    : anxietyScore;
  const energyScore = Math.max(1, Math.min(10, score + (score >= 7 ? 1 : 0)));
  const sleepScore = triggerIds.includes('sleep_loss') ? 3 : null;

  return {
    mood_score: score,
    anxiety_score: anxietyScore,
    stress_score: stressScore,
    energy_score: energyScore,
    sleep_quality_score: sleepScore,
    dominant_emotion: moodViLabel || null,
    triggers: triggerIds,
    notes
  };
}
