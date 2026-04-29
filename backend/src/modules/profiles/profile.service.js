import * as profileRepository from './profile.repository.js';

/**
 * Lấy profile của user
 */
export async function getProfile(userId) {
  return profileRepository.findByUserId(userId);
}

/**
 * Cập nhật profile
 */
export async function updateProfile(userId, data) {
  const updated = await profileRepository.update(userId, data);
  if (!updated) {
    throw Object.assign(new Error('Profile not found'), { status: 404 });
  }
  return updated;
}
