import * as userRepository from './user.repository.js';

export async function getCurrentUser(userId) {
  const user = await userRepository.findCurrentUserById(userId);
  return user;
}

export async function updateCurrentUser(userId, payload) {
  const data = {
    full_name: payload.full_name?.trim() || null,
    display_name: payload.display_name?.trim() || null,
    avatar_url: payload.avatar_url?.trim() || null,
    phone: payload.phone?.trim() || null,
    city: payload.city?.trim() || null,
    country: payload.country?.trim() || null
  };

  const updated = await userRepository.updateCurrentUser(userId, data);
  return updated;
}
