import { supabase } from '../../config/supabase.js';
import { findUserByEmail, findUserById } from './auth.repository.js';
import { env } from '../../config/env.js';
import { db } from '../../config/db.js';

export async function register(data) {
  const { email, password, full_name, display_name, ...consents } = data;

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        display_name: display_name || full_name,
        ...consents
      }
    }
  });

  if (error) throw error;

  // Trigger handle_new_user will sync data to public.users.
  // We return the supabase session.
  return {
    user: authData.user,
    session: authData.session
  };
}

export async function login(data) {
  const { email, password } = data;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Sync last_login_at in public.users
  await db.query(
    `update public.users set last_login_at = now() where id = $1`,
    [authData.user.id]
  );

  return {
    user: authData.user,
    session: authData.session
  };
}

export async function syncGoogle(supabaseToken) {
  // Use supabase admin client to get user by token (or just trust the token if middleware does it)
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(supabaseToken);

  if (error || !supabaseUser) {
    throw new Error('Invalid Supabase token');
  }

  const email = supabaseUser.email;

  // Find user in our public.users (synced by trigger)
  let user = await findUserByEmail(email);

  if (!user) {
    // If trigger failed, this is a safety fallback but usually not needed with correct trigger
    throw new Error('User record not synced yet. Please try again in a few seconds.');
  }

  await db.query(
    `update public.users set last_login_at = now() where id = $1`,
    [user.id]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    },
    // We don't sign our own tokens anymore, we use Supabase tokens.
    // However, if the frontend needs our custom session format, we adapt.
    access_token: supabaseToken,
    // Note: refresh_token is not available here if we only have access_token.
    // Usually syncGoogle is for OAuth flow where frontend already has the session.
  };
}
