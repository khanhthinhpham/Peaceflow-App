import { env } from '../../config/env.js';

let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  if (!env.zoomAccountId || !env.zoomClientId || !env.zoomClientSecret) {
    throw new Error('Zoom chưa được cấu hình trên backend.');
  }
  const credentials = Buffer.from(`${env.zoomClientId}:${env.zoomClientSecret}`).toString('base64');
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env.zoomAccountId)}`,
    { method: 'POST', headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Zoom OAuth failed (${response.status}): ${payload.reason || payload.message || 'unknown error'}`);
  }
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

export async function createZoomMeeting({ topic, startsAt, durationMinutes }) {
  const token = await getAccessToken();
  const response = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(env.zoomHostUserId)}/meetings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      type: 2,
      start_time: new Date(startsAt).toISOString(),
      duration: Number(durationMinutes),
      timezone: 'Asia/Bangkok',
      settings: { join_before_host: false, waiting_room: true, mute_upon_entry: true }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.join_url) {
    throw new Error(`Zoom meeting creation failed (${response.status}): ${payload.message || 'unknown error'}`);
  }
  return { id: String(payload.id || ''), joinUrl: payload.join_url, startUrl: payload.start_url || payload.join_url, password: payload.password || null };
}
