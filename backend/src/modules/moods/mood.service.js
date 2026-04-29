import * as moodRepository from './mood.repository.js';

/**
 * Tạo mood check-in mới
 */
export async function createCheckin(userId, data) {
  // Validate basic fields
  if (data.mood_score == null || data.mood_score < 0 || data.mood_score > 10) {
    throw Object.assign(new Error('mood_score phải từ 0 đến 10'), { status: 400 });
  }

  return moodRepository.create(userId, {
    mood_score: data.mood_score,
    anxiety_score: data.anxiety_score ?? null,
    stress_score: data.stress_score ?? null,
    energy_score: data.energy_score ?? null,
    sleep_quality_score: data.sleep_quality_score ?? null,
    dominant_emotion: data.dominant_emotion || null,
    triggers: data.triggers || [],
    notes: data.notes || null
  });
}

/**
 * Lấy danh sách mood check-ins
 */
export async function getCheckins(userId, limit = 100) {
  return moodRepository.findByUser(userId, limit);
}

/**
 * Lấy mood check-in gần nhất
 */
export async function getLatestCheckin(userId) {
  return moodRepository.findLatest(userId);
}

/**
 * Xóa mood check-in
 */
export async function deleteCheckin(userId, id) {
  const deleted = await moodRepository.deleteById(userId, id);
  if (!deleted) {
    throw Object.assign(new Error('Không tìm thấy mood check-in'), { status: 404 });
  }
  return true;
}
