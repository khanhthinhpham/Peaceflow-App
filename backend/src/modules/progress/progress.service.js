import * as progressRepository from './progress.repository.js';

/**
 * Lấy progress của user (tạo nếu chưa có)
 */
export async function getProgress(userId) {
  let progress = await progressRepository.findByUserId(userId);
  if (!progress) {
    progress = await progressRepository.ensureExists(userId);
  }
  return progress || { total_xp: 0, current_level: 1, current_streak: 0, longest_streak: 0, badges_count: 0 };
}

/**
 * Lấy leaderboard
 */
export async function getLeaderboard(limit = 10) {
  return progressRepository.getLeaderboard(limit);
}
