import * as userRepository from './user.repository.js';

/**
 * Lấy thông tin user hiện tại
 */
export async function getCurrentUser(userId) {
  return userRepository.findById(userId);
}

/**
 * Cập nhật thông tin user
 */
export async function updateCurrentUser(userId, data) {
  const updated = await userRepository.update(userId, data);
  if (!updated) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  return updated;
}
