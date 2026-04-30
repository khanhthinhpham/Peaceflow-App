import * as profileRepository from './profile.repository.js';

export async function getProfile(userId) {
  const profile = await profileRepository.findByUserId(userId);
  return profile;
}

export async function updateProfile(userId, payload) {
  const data = {
    full_name: payload.full_name?.trim() || null,
    display_name: payload.display_name?.trim() || null,
    avatar_url: payload.avatar_url?.trim() || null,
    phone: payload.phone?.trim() || null,
    date_of_birth: payload.date_of_birth || null,
    gender: payload.gender || null,
    city: payload.city?.trim() || null,
    country: payload.country?.trim() || null,

    occupation: payload.occupation?.trim() || null,
    relationship_status: payload.relationship_status?.trim() || null,
    sleep_target_hours: payload.sleep_target_hours ?? null,
    preferred_task_duration: payload.preferred_task_duration ?? null,
    stress_triggers: payload.stress_triggers ?? null,
    support_preferences: payload.support_preferences ?? null,
    goals: payload.goals ?? null,
    onboarding_answers: payload.onboarding_answers ?? null,
    personalization_weights: payload.personalization_weights ?? null
  };

  if (data.full_name !== null && data.full_name.length < 2) {
    const err = new Error('Họ tên phải có ít nhất 2 ký tự');
    err.status = 400;
    throw err;
  }

  if (data.display_name !== null && data.display_name.length < 2) {
    const err = new Error('Tên hiển thị phải có ít nhất 2 ký tự');
    err.status = 400;
    throw err;
  }

  const updated = await profileRepository.update(userId, data);
  return updated;
}
