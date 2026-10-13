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

    // Zoom báo buổi gọi đã kết thúc → tự hoàn thành booking luôn, không đợi chuyên gia bấm
    // tay "Hoàn thành" nữa (lý do ban đầu phải bấm tay: tránh trả tiền cho buổi chưa diễn ra
    // — giờ có tín hiệu thật từ Zoom rồi nên an toàn để tự động).
    if (meetingId && event === 'meeting.ended') {
      const bookingRes = await db.query(
        `select id, expert_id, user_id from expert_bookings where zoom_meeting_id = $1 and status = 'confirmed' limit 1`,
        [meetingId]
      );
      const booking = bookingRes.rows[0];
      if (booking) {
        await db.query(`update expert_bookings set status = 'completed' where id = $1`, [booking.id]);
        await db.query(`update expert_ledger set status = 'payable' where booking_id = $1 and status = 'pending'`, [booking.id]);
        await db.query(
          `update experts set balance = coalesce(balance, 0) + coalesce((select expert_earning from expert_ledger where booking_id = $1 limit 1), 0) where id = $2`,
          [booking.id, booking.expert_id]
        );
        await db.query(
          `insert into notifications (recipient_id, actor_name, type, message, params)
           values ($1, 'PeaceFlow', 'booking_update', 'Buổi tư vấn đã kết thúc và được tự động đánh dấu hoàn thành.', $2::jsonb)`,
          [booking.user_id, JSON.stringify({ code: 'booking_status_changed', status: 'completed' })]
        ).catch((e) => console.error('[zoom webhook] notify failed:', e.message));
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('[zoom webhook] failed:', error.message);
    return res.sendStatus(200);
  }
});

export default router;
