import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { db } from '../../config/db.js';

const router = Router();

function safeEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function verifyZoomSignature(req) {
  const secret = env.zoomWebhookSecretToken;
  if (!secret) return false;
  const timestamp = req.header('x-zm-request-timestamp');
  const signature = req.header('x-zm-signature');
  if (!timestamp || !signature) return false;
  const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;
  const expected = `v0=${crypto.createHmac('sha256', secret).update(message).digest('hex')}`;
  return safeEqual(signature, expected);
}

// Zoom endpoint URL validation and meeting event receiver.
// Configure this exact URL in Zoom: /api/v1/zoom/webhook
router.post(['/zoom/webhook', '/webho'], async (req, res) => {
  try {
    if (req.body?.event === 'endpoint.url_validation') {
      const plainToken = req.body?.payload?.plainToken;
      if (!plainToken || !env.zoomWebhookSecretToken) {
        return res.status(400).json({ message: 'Zoom webhook validation is not configured.' });
      }
      const encryptedToken = crypto
        .createHmac('sha256', env.zoomWebhookSecretToken)
        .update(plainToken)
        .digest('hex');
      return res.status(200).json({ plainToken, encryptedToken });
    }

    if (!verifyZoomSignature(req)) {
      return res.status(401).json({ message: 'Invalid Zoom webhook signature.' });
    }

    const event = req.body?.event;
    const meetingId = String(req.body?.payload?.object?.id || '');
    if (meetingId && ['meeting.started', 'meeting.ended', 'meeting.participant_joined', 'meeting.participant_left'].includes(event)) {
      await db.query(
        `update expert_bookings
         set zoom_last_event = $2,
             zoom_last_event_at = now(),
             zoom_started_at = case when $2 = 'meeting.started' then now() else zoom_started_at end,
             zoom_ended_at = case when $2 = 'meeting.ended' then now() else zoom_ended_at end
         where zoom_meeting_id = $1`,
        [meetingId, event]
      );
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('[zoom webhook] failed:', error.message);
    return res.sendStatus(200);
  }
});

export default router;
