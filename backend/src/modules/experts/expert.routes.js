import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { sendBookingRequestEmail, sendBookingStatusEmail, sendPayoutMethodChangedEmail } from '../../common/services/email.service.js';
import { generateOrderCode, transferContent, buildTransferContent, buildVietQrUrl, platformBankInfo, computeFee, isPayosEnabled, createPayosPayment, qrImageFromString, verifyPayosWebhook, lookupBankAccount, isVietqrLookupEnabled } from '../../common/services/payment.service.js';
import { approveExpertApplication, rejectExpertApplication } from '../auth/auth.service.js';

const router = Router();

router.get('/expert-portal/overview', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }

    const expertProfileRes = await db.query(
      `select id, code, full_name, degree, phone, avatar_emoji, status, rating, sessions_count, satisfaction_rate,
              base_price, location, experience_years, specialties, bio, credentials, approaches, next_slot_label,
              active, created_at
       from experts
       where user_id = $1
       limit 1`,
      [req.user.sub]
    );

    const expert = expertProfileRes.rows[0] || null;
    if (!expert) {
      return res.json({
        success: true,
        data: {
          expert: null,
          stats: {
            upcoming_sessions: 0,
            completed_sessions: 0,
            total_clients: 0,
            monthly_revenue: 0
          },
          upcoming_sessions: []
        }
      });
    }

    const [statsRes, upcomingRes] = await Promise.all([
      db.query(
        `select
           count(*) filter (where status = 'confirmed' and starts_at >= now())::int as upcoming_sessions,
           count(*) filter (where status = 'completed')::int as completed_sessions,
           count(distinct user_id)::int as total_clients,
           coalesce(sum(price) filter (
             where status in ('confirmed', 'completed')
               and date_trunc('month', starts_at) = date_trunc('month', now())
           ), 0)::int as monthly_revenue
         from expert_bookings
         where expert_id = $1`,
        [expert.id]
      ),
      db.query(
        `select
           eb.id,
           eb.session_type,
           eb.starts_at,
           eb.duration_minutes,
           eb.price,
           eb.status,
           u.full_name as client_name,
           u.email as client_email
         from expert_bookings eb
         join users u on u.id = eb.user_id
         where eb.expert_id = $1
           and eb.status = 'confirmed'
           and eb.starts_at >= now()
         order by eb.starts_at asc
         limit 5`,
        [expert.id]
      )
    ]);

    return res.json({
      success: true,
      data: {
        expert: {
          ...expert,
          specialties: ensureArray(expert.specialties),
          credentials: ensureArray(expert.credentials),
          approaches: ensureArray(expert.approaches)
        },
        stats: statsRes.rows[0] || {
          upcoming_sessions: 0,
          completed_sessions: 0,
          total_clients: 0,
          monthly_revenue: 0
        },
        upcoming_sessions: upcomingRes.rows
      }
    });
  } catch (error) {
    console.error('Expert portal overview error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch expert portal overview' });
  }
});

router.put('/expert-portal/profile', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }

    const payload = expertProfileSchema.parse(req.body);

    const expertRes = await db.query(
      `select id
       from experts
       where user_id = $1
       limit 1`,
      [req.user.sub]
    );

    const expert = expertRes.rows[0];
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert profile not found' });
    }

    const updatedExpertRes = await db.query(
      `update experts
       set full_name = $2,
           degree = $3,
           phone = $4,
           avatar_emoji = $5,
           status = $6,
           base_price = $7,
           location = $8,
           experience_years = $9,
           specialties = $10::jsonb,
           bio = $11,
           credentials = $12::jsonb,
           approaches = $13::jsonb,
           next_slot_label = $14,
           updated_at = now()
       where id = $1
       returning id, code, full_name, degree, phone, avatar_emoji, status, rating, sessions_count,
                 satisfaction_rate, base_price, location, experience_years, specialties, bio,
                 credentials, approaches, next_slot_label, active, created_at, updated_at`,
      [
        expert.id,
        payload.full_name,
        payload.degree,
        payload.phone,
        payload.avatar_emoji,
        payload.status,
        payload.base_price,
        payload.location || null,
        payload.experience_years,
        JSON.stringify(payload.specialties || []),
        payload.bio || null,
        JSON.stringify(payload.credentials || []),
        JSON.stringify(payload.approaches || []),
        payload.next_slot_label || null
      ]
    );

    await db.query(
      `update users
       set full_name = $2,
           display_name = $2,
           phone = $3
       where id = $1`,
      [req.user.sub, payload.full_name, payload.phone]
    );

    const row = updatedExpertRes.rows[0];
    return res.json({
      success: true,
      data: {
        ...row,
        specialties: ensureArray(row.specialties),
        credentials: ensureArray(row.credentials),
        approaches: ensureArray(row.approaches)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues?.[0]?.message || 'Invalid expert profile payload'
      });
    }

    console.error('Expert portal profile update error:', error);
    return res.status(500).json({ success: false, message: 'Could not update expert profile' });
  }
});

router.get('/experts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const [expertsRes, latestMoodRes, latestAssessmentRes, upcomingBookingRes] = await Promise.all([
      db.query(
        `select *
         from experts
         where active = true
         order by
           case status when 'online' then 0 when 'busy' then 1 else 2 end,
           rating desc,
           sessions_count desc`
      ).catch((e) => { console.error('[EXPERTS_QUERY] experts:', e.message); return { rows: [] }; }),
      db.query(
        `select *
         from mood_checkins
         where user_id = $1
         order by created_at desc
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[EXPERTS_QUERY] mood_checkins:', e.message); return { rows: [] }; }),
      db.query(
        `select
           a.code,
           ar.severity,
           ar.dimension_scores
         from assessment_results ar
         join assessments a on a.id = ar.assessment_id
         where ar.user_id = $1
         order by ar.created_at desc
         limit 1`,
        [userId]
      ).catch(() => ({ rows: [] })),
      db.query(
        `select
           eb.id,
           eb.session_type,
           eb.starts_at,
           eb.duration_minutes,
           eb.price,
           eb.status,
           e.full_name as expert_name
         from expert_bookings eb
         join experts e on e.id = eb.expert_id
         where eb.user_id = $1
           and eb.status = 'confirmed'
           and eb.starts_at >= now()
         order by eb.starts_at asc
         limit 1`,
        [userId]
      ).catch((e) => { console.error('[EXPERTS_QUERY] expert_bookings:', e.message); return { rows: [] }; })
    ]);

    const matchingTags = buildMatchingTags(latestMoodRes.rows[0] || null, latestAssessmentRes.rows[0] || null);
    const experts = expertsRes.rows.map((row) => mapExpert(row, matchingTags));
    const matchedExperts = experts.filter((expert) => expert.matched);

    const summary = {
      active_experts: experts.length,
      avg_rating: round1(average(experts.map((expert) => expert.rating))),
      total_sessions: experts.reduce((sum, expert) => sum + (expert.sessions || 0), 0),
      satisfaction_rate: Math.round(average(experts.map((expert) => expert.satisfaction_rate || 0))) || 0
    };

    return res.json({
      success: true,
      data: {
        experts,
        summary,
        ai_match: buildAiMatch(matchedExperts, latestMoodRes.rows[0] || null, matchingTags),
        upcoming_booking: upcomingBookingRes.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Experts route error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch experts' });
  }
});

router.get('/experts/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select *
       from experts
       where id = $1
         and active = true
       limit 1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    return res.json({
      success: true,
      data: mapExpert(result.rows[0], new Set())
    });
  } catch (error) {
    console.error('Expert detail error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch expert detail' });
  }
});

router.get('/expert-bookings', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select
         eb.*,
         e.full_name as expert_name,
         e.degree as expert_degree,
         e.avatar_emoji as expert_avatar,
         er.rating as review_rating
       from expert_bookings eb
       join experts e on e.id = eb.expert_id
       left join expert_reviews er on er.booking_id = eb.id
       where eb.user_id = $1
       order by eb.starts_at desc`,
      [req.user.sub]
    );

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Expert bookings error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch bookings' });
  }
});

router.get('/expert-bookings/upcoming', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select
         eb.*,
         e.full_name as expert_name,
         e.degree as expert_degree,
         e.avatar_emoji as expert_avatar
       from expert_bookings eb
       join experts e on e.id = eb.expert_id
       where eb.user_id = $1
         and eb.status = 'confirmed'
         and eb.starts_at >= now()
       order by eb.starts_at asc
       limit 1`,
      [req.user.sub]
    );

    return res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Upcoming expert booking error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch upcoming booking' });
  }
});

const bookingCreateSchema = z.object({
  session_type: z.enum(['chat', 'voice', 'video', 'inperson']),
  starts_at: z.coerce.date(),
  duration_minutes: z.coerce.number().int().min(15).max(240),
  price: z.coerce.number().int().min(0).optional().default(0),
  notes: z.string().max(1000).optional().nullable()
});

router.post('/experts/:id/bookings', requireAuth, async (req, res) => {
  try {
    const payload = bookingCreateSchema.parse(req.body);

    if (payload.starts_at.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Thời gian đặt lịch phải ở tương lai.' });
    }

    await expireStaleBookings();

    const expertResult = await db.query(
      `select e.id, e.user_id, e.full_name, e.degree, e.avatar_emoji, u.email as user_email
       from experts e
       left join users u on u.id = e.user_id
       where e.id = $1
         and e.active = true
       limit 1`,
      [req.params.id]
    );

    const expert = expertResult.rows[0];
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    // Chống trùng giờ: không cho đặt nếu khoảng [starts_at, starts_at+duration) chồng lấn
    // một booking pending/confirmed khác của cùng chuyên gia.
    const endsAt = new Date(payload.starts_at.getTime() + payload.duration_minutes * 60000);
    const overlap = await db.query(
      `select 1 from expert_bookings
       where expert_id = $1
         and status in ('pending_payment', 'pending', 'awaiting_expert', 'confirmed')
         and tstzrange(starts_at, starts_at + (duration_minutes || ' minutes')::interval) && tstzrange($2, $3)
       limit 1`,
      [expert.id, payload.starts_at.toISOString(), endsAt.toISOString()]
    );
    if (overlap.rows[0]) {
      return res.status(409).json({ success: false, message: 'Khung giờ này đã có lịch khác, vui lòng chọn giờ khác.' });
    }

    // Chặn đặt vào khung giờ chuyên gia đã đánh dấu bận (lịch làm việc hằng tuần).
    const busyHit = await db.query(
      `select 1 from expert_availability a
       where a.expert_id = $1
         and a.weekday = extract(dow from ($2::timestamptz at time zone 'Asia/Bangkok'))::int
         and a.start_time < ($3::timestamptz at time zone 'Asia/Bangkok')::time
         and a.end_time > ($2::timestamptz at time zone 'Asia/Bangkok')::time
       limit 1`,
      [expert.id, payload.starts_at.toISOString(), endsAt.toISOString()]
    );
    if (busyHit.rows[0]) {
      return res.status(409).json({ success: false, message: 'Chuyên gia bận vào khung giờ này, vui lòng chọn giờ khác.' });
    }

    // Đặt lịch ở trạng thái CHỜ THANH TOÁN — sinh đơn + QR VietQR. Chỉ sau khi
    // thân chủ chuyển khoản (claim) lịch mới vào hàng "Cần xác nhận" của chuyên gia.
    const amount = payload.price || 0;
    const bookingResult = await db.query(
      `insert into expert_bookings (user_id, expert_id, session_type, starts_at, duration_minutes, price, notes, status, amount)
       values ($1, $2, $3, $4, $5, $6, $7, 'pending_payment', $8)
       returning *`,
      [
        req.user.sub,
        expert.id,
        payload.session_type,
        payload.starts_at.toISOString(),
        payload.duration_minutes,
        amount,
        payload.notes || null,
        amount
      ]
    );
    const booking = bookingResult.rows[0];

    const orderCode = generateOrderCode();
    const clientNameRes = await db.query(`select coalesce(display_name, full_name, '') as name from users where id = $1`, [req.user.sub]);
    const clientName = clientNameRes.rows[0]?.name || '';

    // Nội dung CK: "TÊN PEACEFLOW <mã>" (chế độ thủ công); PayOS dùng mã ngắn (giới hạn 25 ký tự).
    let content = buildTransferContent(clientName, orderCode);
    const expiresAt = new Date(Date.now() + env.paymentExpireMinutes * 60000);

    // Nếu có PayOS → tạo đơn PayOS (tự xác nhận qua webhook). Lỗi/không cấu hình → QR tĩnh + thủ công.
    let qrUrl = buildVietQrUrl({ amount, content });
    let checkoutUrl = null;
    let provider = 'vietqr_manual';
    let auto = false;
    if (isPayosEnabled() && amount > 0) {
      try {
        const ret = `${env.frontendUrl}/pages/experts.html`;
        const data = await createPayosPayment({ orderCode, amount, description: transferContent(orderCode), returnUrl: ret, cancelUrl: ret });
        qrUrl = data.qrCode ? qrImageFromString(data.qrCode) : qrUrl;
        checkoutUrl = data.checkoutUrl || null;
        content = transferContent(orderCode);
        provider = 'payos';
        auto = true;
      } catch (e) {
        console.error('[payos] create failed, fallback static QR:', e.message);
      }
    }

    await db.query(
      `insert into payments (booking_id, order_code, amount, status, provider, qr_code, checkout_url, content, expires_at)
       values ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)`,
      [booking.id, orderCode, amount, provider, qrUrl, checkoutUrl, content, expiresAt.toISOString()]
    );

    return res.json({
      success: true,
      data: {
        ...booking,
        expert_name: expert.full_name,
        expert_degree: expert.degree,
        expert_avatar: expert.avatar_emoji,
        payment: {
          order_code: orderCode,
          content,
          amount,
          qr_image: qrUrl,
          checkout_url: checkoutUrl,
          auto,
          bank: platformBankInfo(),
          expires_at: expiresAt.toISOString()
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues?.[0]?.message || 'Dữ liệu đặt lịch không hợp lệ' });
    }
    console.error('Create expert booking error:', error);
    return res.status(500).json({ success: false, message: 'Could not create booking' });
  }
});

// Xem thông tin thanh toán (QR / nội dung CK / trạng thái) của một lịch hẹn.
router.get('/bookings/:id/payment', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select b.id as booking_id, b.status as booking_status, b.amount,
              p.order_code, p.qr_code, p.checkout_url, p.provider, p.content, p.status as payment_status, p.expires_at
       from expert_bookings b
       left join payments p on p.booking_id = b.id
       where b.id = $1 and b.user_id = $2
       order by p.created_at desc
       limit 1`,
      [req.params.id, req.user.sub]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    return res.json({
      success: true,
      data: {
        booking_id: row.booking_id,
        booking_status: row.booking_status,
        amount: row.amount,
        order_code: row.order_code,
        content: row.content || (row.order_code ? transferContent(row.order_code) : null),
        qr_image: row.qr_code,
        checkout_url: row.checkout_url,
        auto: row.provider === 'payos',
        payment_status: row.payment_status,
        bank: platformBankInfo(),
        expires_at: row.expires_at
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch payment' });
  }
});

// Webhook PayOS — tự động xác nhận khi có tiền. Public (không requireAuth), trả 200.
router.post('/payments/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    // PayOS gửi ping khi đăng ký webhook → cứ trả 200.
    if (!body.data) return res.status(200).json({ success: true });
    if (!verifyPayosWebhook(body)) {
      console.warn('[payos webhook] invalid signature');
      return res.status(200).json({ success: false, message: 'invalid signature' });
    }

    const orderCode = body.data.orderCode;
    const payRes = await db.query(`select * from payments where order_code = $1 limit 1`, [orderCode]);
    const pay = payRes.rows[0];
    if (!pay) return res.status(200).json({ success: true });
    if (pay.status === 'paid') return res.status(200).json({ success: true }); // idempotent

    await db.query(
      `update payments set status = 'paid', paid_at = now(), provider_ref = $2, raw = $3 where id = $1`,
      [pay.id, body.data.reference || null, JSON.stringify(body)]
    );
    const upd = await db.query(
      `update expert_bookings set status = 'awaiting_expert', paid_at = now()
       where id = $1 and status = 'pending_payment' returning *`,
      [pay.booking_id]
    );
    const b = upd.rows[0];
    if (b) {
      const infoRes = await db.query(
        `select e.user_id as expert_user_id, coalesce(u.display_name, u.full_name, 'Thân chủ') as client_name
         from expert_bookings bk join experts e on e.id = bk.expert_id join users u on u.id = bk.user_id
         where bk.id = $1 limit 1`,
        [b.id]
      );
      const info = infoRes.rows[0];
      await notify(b.user_id, null, 'booking_update', 'Đã nhận thanh toán — đang chờ chuyên gia nhận lịch.');
      if (info?.expert_user_id) {
        await notify(info.expert_user_id, info.client_name, 'booking_new', 'Có lịch đã thanh toán — mời bạn nhận hoặc từ chối.');
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('PayOS webhook error:', error);
    return res.status(200).json({ success: false });
  }
});

// Thân chủ báo "đã chuyển khoản" → đưa lịch vào hàng chờ chuyên gia xác nhận (chế độ thủ công).
router.post('/bookings/:id/claim-payment', requireAuth, async (req, res) => {
  try {
    const bRes = await db.query(
      `select b.*, e.user_id as expert_user_id, e.full_name as expert_name, eu.email as expert_email
       from expert_bookings b
       join experts e on e.id = b.expert_id
       left join users eu on eu.id = e.user_id
       where b.id = $1 and b.user_id = $2 limit 1`,
      [req.params.id, req.user.sub]
    );
    const booking = bRes.rows[0];
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (booking.status !== 'pending_payment') {
      return res.status(409).json({ success: false, message: 'Lịch hẹn không ở trạng thái chờ thanh toán.' });
    }

    await db.query(`update expert_bookings set status = 'pending' where id = $1`, [booking.id]);

    const clientRes = await db.query(
      `select coalesce(display_name, full_name, 'Một thân chủ') as name from users where id = $1`,
      [req.user.sub]
    );
    const clientName = clientRes.rows[0]?.name || 'Một thân chủ';

    // Báo ADMIN để đối chiếu sao kê & xác nhận thanh toán.
    const adminsRes = await db.query(`select id from users where role = 'admin'`);
    for (const admin of adminsRes.rows) {
      await notify(admin.id, clientName, 'booking_update', `${clientName} báo đã chuyển khoản — cần đối chiếu & xác nhận thanh toán.`);
    }
    // Báo chuyên gia (thông tin, không cần thao tác): có lịch đã thanh toán đang chờ duyệt.
    await notify(booking.expert_user_id, clientName, 'booking_new', `${clientName} đã đặt & thanh toán một lịch hẹn — đang chờ xác nhận.`);

    return res.json({ success: true });
  } catch (error) {
    console.error('Claim payment error:', error);
    return res.status(500).json({ success: false, message: 'Could not claim payment' });
  }
});

// Thân chủ tự huỷ lịch → hoàn tiền vào ví theo chính sách (nếu đã thanh toán).
router.post('/expert-bookings/:id/cancel', requireAuth, async (req, res) => {
  try {
    const bRes = await db.query(
      `select b.*, e.user_id as expert_user_id, e.full_name as expert_name
       from expert_bookings b join experts e on e.id = b.expert_id
       where b.id = $1 and b.user_id = $2 limit 1`,
      [req.params.id, req.user.sub]
    );
    const booking = bRes.rows[0];
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (['completed', 'cancelled', 'expired'].includes(booking.status)) {
      return res.status(409).json({ success: false, message: 'Lịch hẹn này không thể huỷ.' });
    }

    let refund = 0;
    let pct = 0;
    const payRes = await db.query(`select status from payments where booking_id = $1 order by created_at desc limit 1`, [booking.id]);
    const paid = payRes.rows[0]?.status === 'paid';
    if (paid && Number(booking.amount) > 0) {
      const hours = (new Date(booking.starts_at).getTime() - Date.now()) / 3600000;
      pct = hours >= 24 ? 100 : (hours >= 12 ? 50 : 0);
      refund = Math.round((Number(booking.amount) * pct) / 100);
    }

    await db.query(`update expert_bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = 'user' where id = $1`, [booking.id]);
    await db.query(`update expert_ledger set status = 'reversed' where booking_id = $1`, [booking.id]);
    if (paid) {
      await db.query(`update payments set status = 'cancelled' where booking_id = $1`, [booking.id]);
    }
    if (refund > 0) {
      await creditWallet(req.user.sub, refund, 'refund', booking.id, `Hoàn ${pct}% do bạn huỷ lịch`);
    }

    await notify(booking.expert_user_id, null, 'booking_update', `Một lịch hẹn đã bị thân chủ huỷ.`);

    return res.json({ success: true, data: { refunded: refund, refund_percent: pct } });
  } catch (error) {
    console.error('User cancel booking error:', error);
    return res.status(500).json({ success: false, message: 'Could not cancel booking' });
  }
});

// ===== EXPERT PORTAL: quản lý vận hành cho chuyên gia =====

// Đổi nhanh trạng thái hoạt động (online/busy/offline)
router.patch('/expert-portal/status', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }
    const { status } = z.object({ status: z.enum(['online', 'busy', 'offline']) }).parse(req.body);
    const r = await db.query(
      `update experts set status = $2, updated_at = now() where user_id = $1 returning status`,
      [req.user.sub, status]
    );
    if (!r.rows[0]) {
      return res.status(404).json({ success: false, message: 'Expert profile not found' });
    }
    return res.json({ success: true, data: { status: r.rows[0].status } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    console.error('Expert status toggle error:', error);
    return res.status(500).json({ success: false, message: 'Could not update status' });
  }
});

// Danh sách toàn bộ lịch hẹn của chuyên gia (để quản lý)
router.get('/expert-portal/bookings', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }
    const eRes = await db.query(`select id from experts where user_id = $1 limit 1`, [req.user.sub]);
    if (!eRes.rows[0]) {
      return res.json({ success: true, data: [] });
    }
    const r = await db.query(
      `select eb.id, eb.session_type, eb.starts_at, eb.duration_minutes, eb.price, eb.status, eb.notes, eb.created_at,
              u.full_name as client_name, u.email as client_email,
              er.rating as review_rating, er.comment as review_comment
       from expert_bookings eb
       join users u on u.id = eb.user_id
       left join expert_reviews er on er.booking_id = eb.id
       where eb.expert_id = $1 and eb.status <> 'pending_payment'
       order by eb.starts_at desc`,
      [eRes.rows[0].id]
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('Expert bookings list error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch bookings' });
  }
});

// Cập nhật trạng thái một lịch hẹn (xác nhận / hoàn thành / huỷ)
router.patch('/expert-portal/bookings/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }
    // Chuyên gia: Nhận lịch (đã thanh toán) / Hoàn thành / Từ chối-Huỷ.
    const { status } = z.object({ status: z.enum(['confirmed', 'completed', 'cancelled']) }).parse(req.body);
    const eRes = await db.query(`select id, full_name from experts where user_id = $1 limit 1`, [req.user.sub]);
    const expert = eRes.rows[0];
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert profile not found' });
    }
    const bRes = await db.query(
      `select id, status, user_id, amount, price from expert_bookings where id = $1 and expert_id = $2 limit 1`,
      [req.params.id, expert.id]
    );
    const booking = bRes.rows[0];
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    }
    if (status === 'confirmed' && booking.status !== 'awaiting_expert') {
      return res.status(409).json({ success: false, message: 'Chỉ nhận được lịch đã thanh toán & đang chờ duyệt.' });
    }
    if (status === 'completed' && booking.status !== 'confirmed') {
      return res.status(409).json({ success: false, message: 'Chỉ hoàn thành lịch đã nhận.' });
    }
    if (status === 'cancelled' && !['awaiting_expert', 'confirmed'].includes(booking.status)) {
      return res.status(409).json({ success: false, message: 'Không thể huỷ lịch này.' });
    }

    const updated = await db.query(
      `update expert_bookings set status = $2 where id = $1 returning *`,
      [booking.id, status]
    );
    const b = updated.rows[0];

    // Nhận lịch → ghi sổ doanh thu (pending; thành payable khi hoàn thành).
    if (status === 'confirmed') {
      const ledgerExists = await db.query(`select 1 from expert_ledger where booking_id = $1 limit 1`, [b.id]);
      if (!ledgerExists.rows[0]) {
        const fee = computeFee(b.amount || b.price || 0);
        await db.query(
          `insert into expert_ledger (expert_id, booking_id, gross, platform_fee, expert_earning, status)
           values ($1, $2, $3, $4, $5, 'pending')`,
          [expert.id, b.id, fee.gross, fee.platform_fee, fee.expert_earning]
        );
      }
    }

    // Từ chối / huỷ lịch ĐÃ thanh toán → hoàn 100% vào ví thân chủ.
    if (status === 'cancelled') {
      const payRes = await db.query(`select status from payments where booking_id = $1 order by created_at desc limit 1`, [b.id]);
      if (payRes.rows[0]?.status === 'paid' && Number(b.amount) > 0) {
        await creditWallet(b.user_id, b.amount, 'refund', b.id, 'Hoàn 100% do chuyên gia từ chối / huỷ lịch');
        await db.query(`update payments set status = 'cancelled' where booking_id = $1`, [b.id]);
        await db.query(`update expert_ledger set status = 'reversed' where booking_id = $1`, [b.id]);
      }
      await db.query(`update expert_bookings set cancelled_at = now(), cancel_reason = 'expert' where id = $1`, [b.id]);
    }

    // Hoàn thành → cộng số dư + số buổi.
    if (status === 'completed') {
      await db.query(`update experts set sessions_count = coalesce(sessions_count, 0) + 1 where id = $1`, [expert.id]);
      await db.query(`update expert_ledger set status = 'payable' where booking_id = $1 and status = 'pending'`, [b.id]);
      await db.query(`update experts set balance = coalesce(balance, 0) + coalesce((select expert_earning from expert_ledger where booking_id = $1 limit 1), 0) where id = $2`, [b.id, expert.id]);
    }

    const labelMap = { confirmed: 'đã nhận lịch', completed: 'đã hoàn thành', cancelled: 'đã huỷ' };
    await notify(booking.user_id, expert.full_name, 'booking_update',
      `Chuyên gia ${expert.full_name} ${labelMap[status]} lịch hẹn của bạn.`);

    // Gửi email cho thân chủ về thay đổi trạng thái (best-effort).
    try {
      const clientRes = await db.query(
        `select email, coalesce(display_name, full_name) as name from users where id = $1`,
        [booking.user_id]
      );
      const client = clientRes.rows[0];
      if (client?.email) {
        await sendBookingStatusEmail({
          to: client.email,
          clientName: client.name,
          expertName: expert.full_name,
          sessionType: updated.rows[0].session_type,
          startsAt: updated.rows[0].starts_at,
          status
        });
      }
    } catch (e) {
      console.error('[email] booking status failed:', e.message);
    }

    return res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    console.error('Expert booking update error:', error);
    return res.status(500).json({ success: false, message: 'Could not update booking' });
  }
});

// ===== ADMIN: xác nhận thanh toán (tiền về tài khoản nền tảng) =====

router.get('/admin/overview', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const [
      usersRes,
      expertsRes,
      bookingsTodayRes,
      pendingPaymentsRes,
      payoutsRes,
      applicationsRes,
      communityRes
    ] = await Promise.all([
      db.query(`select count(*)::int as total from users`),
      db.query(`select count(*)::int as total from experts where active = true`),
      db.query(
        `select count(*)::int as total
         from expert_bookings
         where date_trunc('day', starts_at) = date_trunc('day', now())`
      ),
      db.query(`select count(*)::int as total from expert_bookings where status = 'pending'`),
      db.query(
        `select
           count(*)::int as total_experts,
           coalesce(sum(balance), 0)::int as total_balance
         from experts
         where coalesce(balance, 0) > 0`
      ),
      db.query(`select count(*)::int as total from expert_applications where status = 'pending'`),
      db.query(
        `select
           count(*) filter (where coalesce(reports_count, 0) > 0)::int as reported_posts,
           count(*) filter (where is_hidden = true)::int as hidden_posts
         from community_posts`
      )
    ]);

    return res.json({
      success: true,
      data: {
        total_users: usersRes.rows[0]?.total || 0,
        active_experts: expertsRes.rows[0]?.total || 0,
        bookings_today: bookingsTodayRes.rows[0]?.total || 0,
        pending_payment_bookings: pendingPaymentsRes.rows[0]?.total || 0,
        pending_payout_experts: payoutsRes.rows[0]?.total_experts || 0,
        pending_payout_amount: payoutsRes.rows[0]?.total_balance || 0,
        pending_expert_applications: applicationsRes.rows[0]?.total || 0,
        reported_community_posts: communityRes.rows[0]?.reported_posts || 0,
        hidden_community_posts: communityRes.rows[0]?.hidden_posts || 0
      }
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch admin overview' });
  }
});

// ===== Admin: duyệt hồ sơ chuyên gia =====

// Danh sách hồ sơ đăng ký chuyên gia. ?status=pending|approved|rejected|all (mặc định pending).
router.get('/admin/expert-applications', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const allowed = ['pending', 'approved', 'rejected', 'all'];
    const filter = allowed.includes(req.query.status) ? req.query.status : 'pending';
    const params = [];
    let where = '';
    if (filter !== 'all') {
      where = 'where a.status = $1';
      params.push(filter);
    }

    const r = await db.query(
      `select a.id, a.full_name, a.phone, a.degree, a.specialties, a.experience_years,
              a.location, a.bio, a.status, a.created_at, a.reviewed_at,
              a.credential_filename, a.credential_mime, a.approval_token,
              u.email
       from expert_applications a
       join users u on u.id = a.user_id
       ${where}
       order by (a.status = 'pending') desc, a.created_at desc
       limit 100`,
      params
    );

    return res.json({
      success: true,
      data: r.rows.map(({ approval_token, ...rest }) => ({
        ...rest,
        // Đường dẫn (tương đối API_BASE_URL) để xem file bằng cấp; FE tự nối origin backend.
        credential_path: `/auth/expert-application/credential?token=${encodeURIComponent(approval_token)}`
      }))
    });
  } catch (error) {
    console.error('Admin list expert applications error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch expert applications' });
  }
});

// Duyệt / từ chối hồ sơ ngay trên web (tái dùng logic + email của luồng duyệt qua link).
router.post('/admin/expert-applications/:id/approve', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const tokenRes = await db.query(`select approval_token from expert_applications where id = $1 limit 1`, [req.params.id]);
    const token = tokenRes.rows[0]?.approval_token;
    if (!token) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
    const result = await approveExpertApplication(token);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin approve application error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Could not approve application' });
  }
});

router.post('/admin/expert-applications/:id/reject', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const tokenRes = await db.query(`select approval_token from expert_applications where id = $1 limit 1`, [req.params.id]);
    const token = tokenRes.rows[0]?.approval_token;
    if (!token) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
    const result = await rejectExpertApplication(token);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin reject application error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Could not reject application' });
  }
});

// Danh sách chuyên gia (đã được duyệt). ?search=&active=true|false&limit=&offset=
router.get('/admin/experts', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const conditions = [];
    const params = [];

    const search = (req.query.search || '').trim();
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(e.full_name ilike $${params.length} or e.code ilike $${params.length} or u.email ilike $${params.length})`);
    }
    if (req.query.active === 'true' || req.query.active === 'false') {
      params.push(req.query.active === 'true');
      conditions.push(`e.active = $${params.length}`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const countRes = await db.query(`select count(*)::int as total from experts e left join users u on u.id = e.user_id ${where}`, params);
    params.push(limit, offset);
    const rowsRes = await db.query(
      `select e.id, e.code, e.full_name, e.avatar_emoji, e.status, e.active, e.rating, e.sessions_count,
              e.base_price, e.location, e.specialties, e.experience_years,
              coalesce(e.balance, 0)::int as balance,
              e.payout_bank_name, e.payout_bank_bin, e.payout_account_number, e.payout_account_name,
              u.email
       from experts e
       left join users u on u.id = e.user_id
       ${where}
       order by e.created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params
    );

    return res.json({
      success: true,
      data: {
        total: countRes.rows[0]?.total || 0,
        limit,
        offset,
        experts: rowsRes.rows.map((row) => ({
          ...row,
          payout_qr_url: buildExpertPayoutQrUrl(row.payout_bank_bin, row.payout_account_number, row.payout_account_name)
        }))
      }
    });
  } catch (error) {
    console.error('Admin list experts error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch experts' });
  }
});

// Bật / tắt hoạt động của chuyên gia. Body: { active: boolean }.
router.patch('/admin/experts/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (typeof req.body.active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Thiếu trường active.' });
    }
    const r = await db.query(
      `update experts set active = $2, updated_at = now() where id = $1 returning id, active`,
      [req.params.id, req.body.active]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên gia.' });
    return res.json({ success: true, data: r.rows[0] });
  } catch (error) {
    console.error('Admin toggle expert error:', error);
    return res.status(500).json({ success: false, message: 'Could not update expert' });
  }
});

// ===== Admin: quản lý người dùng =====

// Danh sách user. ?search= (email/tên), ?role=, ?status=, ?limit=&offset= (phân trang).
router.get('/admin/users', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const conditions = [];
    const params = [];

    const search = (req.query.search || '').trim();
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.email ilike $${params.length} or u.full_name ilike $${params.length} or u.display_name ilike $${params.length})`);
    }
    if (['user', 'expert', 'admin'].includes(req.query.role)) {
      params.push(req.query.role);
      conditions.push(`u.role = $${params.length}`);
    }
    if (['active', 'inactive', 'suspended', 'deleted', 'pending'].includes(req.query.status)) {
      params.push(req.query.status);
      conditions.push(`u.status = $${params.length}`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const countRes = await db.query(`select count(*)::int as total from users u ${where}`, params);
    params.push(limit, offset);
    const rowsRes = await db.query(
      `select u.id, u.email, u.full_name, u.display_name, u.role, u.status,
              u.wallet_balance, u.email_verified, u.last_login_at, u.created_at,
              exists(select 1 from experts e where e.user_id = u.id) as is_expert
       from users u
       ${where}
       order by u.created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params
    );

    return res.json({
      success: true,
      data: { total: countRes.rows[0]?.total || 0, limit, offset, users: rowsRes.rows }
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch users' });
  }
});

// Cập nhật trạng thái / vai trò user. Body: { status?, role? }.
router.patch('/admin/users/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (req.params.id === req.user.sub) {
      return res.status(400).json({ success: false, message: 'Không thể tự thay đổi tài khoản của chính mình.' });
    }

    const sets = [];
    const params = [req.params.id];

    if (req.body.status !== undefined) {
      if (!['active', 'inactive', 'suspended', 'deleted'].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
      }
      params.push(req.body.status);
      sets.push(`status = $${params.length}`);
    }
    if (req.body.role !== undefined) {
      if (!['user', 'expert', 'admin'].includes(req.body.role)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
      }
      params.push(req.body.role);
      sets.push(`role = $${params.length}`);
    }
    if (!sets.length) {
      return res.status(400).json({ success: false, message: 'Không có thay đổi nào.' });
    }

    const r = await db.query(
      `update users set ${sets.join(', ')}, updated_at = now() where id = $1
       returning id, email, full_name, display_name, role, status, wallet_balance`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    return res.json({ success: true, data: r.rows[0] });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ success: false, message: 'Could not update user' });
  }
});

// ===== Admin: kiểm duyệt cộng đồng =====

// Danh sách bài cần kiểm duyệt. ?filter=reported|hidden|all (mặc định reported).
router.get('/admin/community/reports', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const filter = ['reported', 'hidden', 'all'].includes(req.query.filter) ? req.query.filter : 'reported';
    let where = 'p.reports_count > 0';
    if (filter === 'hidden') where = 'p.is_hidden = true';
    else if (filter === 'all') where = '(p.reports_count > 0 or p.is_hidden = true)';

    const countRes = await db.query(`select count(*)::int as total from community_posts p where ${where}`);
    const rowsRes = await db.query(
      `select p.id, p.content, p.category, p.author_name, p.is_anonymous, p.is_hidden,
              p.reports_count, p.created_at, u.email as author_email,
              (select json_agg(json_build_object('reason', r.reason, 'created_at', r.created_at) order by r.created_at desc)
                 from community_reports r where r.post_id = p.id) as reports
       from community_posts p
       left join users u on u.id = p.user_id
       where ${where}
       order by p.is_hidden desc, p.reports_count desc, p.created_at desc
       limit $1 offset $2`,
      [limit, offset]
    );

    return res.json({
      success: true,
      data: { total: countRes.rows[0]?.total || 0, limit, offset, posts: rowsRes.rows }
    });
  } catch (error) {
    console.error('Admin community reports error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch reported posts' });
  }
});

// Ẩn / hiện lại bài. Body: { is_hidden: boolean }.
router.patch('/admin/community/posts/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (typeof req.body.is_hidden !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Thiếu trường is_hidden.' });
    }
    const r = await db.query(
      `update community_posts set is_hidden = $2, updated_at = now() where id = $1
       returning id, is_hidden, reports_count`,
      [req.params.id, req.body.is_hidden]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    return res.json({ success: true, data: r.rows[0] });
  } catch (error) {
    console.error('Admin hide post error:', error);
    return res.status(500).json({ success: false, message: 'Could not update post' });
  }
});

// Bỏ qua báo cáo (xem như hợp lệ): xoá report, reset count & hiện lại bài.
router.post('/admin/community/posts/:id/dismiss-reports', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    await db.query(`delete from community_reports where post_id = $1`, [req.params.id]);
    const r = await db.query(
      `update community_posts set reports_count = 0, is_hidden = false, updated_at = now() where id = $1
       returning id`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Admin dismiss reports error:', error);
    return res.status(500).json({ success: false, message: 'Could not dismiss reports' });
  }
});

// Gỡ hẳn bài viết (cascade xoá comment/reaction/report).
router.delete('/admin/community/posts/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(`delete from community_posts where id = $1 returning id`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Admin delete post error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete post' });
  }
});

// Danh sách lịch đã báo chuyển khoản, chờ admin đối chiếu sao kê.
router.get('/admin/bookings/pending-payment', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(
      `select b.id, b.amount, b.starts_at, b.session_type, b.notes, b.created_at,
              u.full_name as client_name, u.email as client_email,
              e.full_name as expert_name,
              p.order_code, p.content
       from expert_bookings b
       join users u on u.id = b.user_id
       join experts e on e.id = b.expert_id
       left join payments p on p.booking_id = b.id
       where b.status = 'pending'
       order by b.created_at desc`
    );
    return res.json({
      success: true,
      data: r.rows.map((row) => ({ ...row, content: row.content || (row.order_code ? transferContent(row.order_code) : null) }))
    });
  } catch (error) {
    console.error('Admin pending payments error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch pending payments' });
  }
});

// Admin xác nhận đã nhận tiền → chốt lịch + ghi sổ doanh thu.
router.post('/admin/bookings/:id/confirm-payment', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const bRes = await db.query(
      `select b.*, e.user_id as expert_user_id, e.full_name as expert_name
       from expert_bookings b join experts e on e.id = b.expert_id
       where b.id = $1 limit 1`,
      [req.params.id]
    );
    const b = bRes.rows[0];
    if (!b) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (b.status !== 'pending') return res.status(409).json({ success: false, message: 'Lịch không ở trạng thái chờ xác nhận thanh toán.' });

    // Đã nhận tiền → chuyển sang CHỜ CHUYÊN GIA NHẬN LỊCH (ghi sổ doanh thu khi chuyên gia nhận).
    await db.query(`update expert_bookings set status = 'awaiting_expert', paid_at = now() where id = $1`, [b.id]);
    await db.query(`update payments set status = 'paid', paid_at = now() where booking_id = $1 and status = 'pending'`, [b.id]);

    await notify(b.user_id, null, 'booking_update', 'Đã xác nhận thanh toán — đang chờ chuyên gia nhận lịch.');
    await notify(b.expert_user_id, null, 'booking_new', 'Có lịch đã thanh toán — mời bạn nhận hoặc từ chối.');

    return res.json({ success: true });
  } catch (error) {
    console.error('Admin confirm payment error:', error);
    return res.status(500).json({ success: false, message: 'Could not confirm payment' });
  }
});

// Admin từ chối (không thấy tiền) → huỷ đơn.
router.post('/admin/bookings/:id/reject-payment', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const bRes = await db.query(`select * from expert_bookings where id = $1 limit 1`, [req.params.id]);
    const b = bRes.rows[0];
    if (!b) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (b.status !== 'pending') return res.status(409).json({ success: false, message: 'Lịch không ở trạng thái chờ xác nhận thanh toán.' });

    await db.query(`update expert_bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = 'payment_failed' where id = $1`, [b.id]);
    await db.query(`update payments set status = 'failed' where booking_id = $1`, [b.id]);
    await notify(b.user_id, null, 'booking_update', 'Chưa nhận được thanh toán cho lịch hẹn — đơn đã bị huỷ. Vui lòng đặt lại.');

    return res.json({ success: true });
  } catch (error) {
    console.error('Admin reject payment error:', error);
    return res.status(500).json({ success: false, message: 'Could not reject payment' });
  }
});

// ===== VÍ NGƯỜI DÙNG =====

router.get('/wallet', requireAuth, async (req, res) => {
  try {
    const u = await db.query(`select coalesce(wallet_balance, 0)::int as balance from users where id = $1`, [req.user.sub]);
    const tx = await db.query(
      `select amount, type, note, created_at from wallet_transactions where user_id = $1 order by created_at desc limit 50`,
      [req.user.sub]
    );
    return res.json({ success: true, data: { balance: u.rows[0]?.balance || 0, transactions: tx.rows } });
  } catch (error) {
    console.error('Get wallet error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch wallet' });
  }
});

// Thanh toán lịch hẹn bằng số dư ví (tự xác nhận → chờ chuyên gia nhận).
router.post('/bookings/:id/pay-wallet', requireAuth, async (req, res) => {
  try {
    const bRes = await db.query(
      `select b.*, e.user_id as expert_user_id, coalesce(u.display_name, u.full_name, 'Thân chủ') as client_name
       from expert_bookings b join experts e on e.id = b.expert_id join users u on u.id = b.user_id
       where b.id = $1 and b.user_id = $2 limit 1`,
      [req.params.id, req.user.sub]
    );
    const b = bRes.rows[0];
    if (!b) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (b.status !== 'pending_payment') return res.status(409).json({ success: false, message: 'Lịch không ở trạng thái chờ thanh toán.' });
    const amount = Number(b.amount) || 0;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Đơn không hợp lệ.' });

    const uRes = await db.query(`select coalesce(wallet_balance, 0)::int as bal from users where id = $1`, [req.user.sub]);
    if ((uRes.rows[0]?.bal || 0) < amount) return res.status(400).json({ success: false, message: 'Số dư ví không đủ.' });

    await db.query(`update users set wallet_balance = wallet_balance - $2 where id = $1`, [req.user.sub, amount]);
    await db.query(
      `insert into wallet_transactions (user_id, amount, type, booking_id, note) values ($1, $2, 'payment', $3, 'Thanh toán lịch hẹn bằng ví')`,
      [req.user.sub, -amount, b.id]
    );
    await db.query(`update payments set status = 'paid', paid_at = now(), provider = 'wallet' where booking_id = $1 and status = 'pending'`, [b.id]);
    await db.query(`update expert_bookings set status = 'awaiting_expert', paid_at = now() where id = $1`, [b.id]);

    await notify(b.user_id, null, 'booking_update', 'Đã thanh toán bằng ví — đang chờ chuyên gia nhận lịch.');
    if (b.expert_user_id) await notify(b.expert_user_id, b.client_name, 'booking_new', 'Có lịch đã thanh toán — mời bạn nhận hoặc từ chối.');

    return res.json({ success: true });
  } catch (error) {
    console.error('Pay wallet error:', error);
    return res.status(500).json({ success: false, message: 'Could not pay with wallet' });
  }
});

// ===== DOANH THU / SỐ DƯ CHUYÊN GIA =====
// Che số tài khoản: chỉ hiện 4 số cuối.
function maskAccount(num) {
  const s = String(num || '').replace(/\s/g, '');
  if (!s) return '';
  return s.length <= 4 ? s : `${'•'.repeat(Math.min(s.length - 4, 8))}${s.slice(-4)}`;
}

function buildExpertPayoutQrUrl(bankBin, accountNumber, accountName) {
  const bin = String(bankBin || '').trim();
  const account = String(accountNumber || '').trim();
  if (!bin || !account) return null;
  const name = encodeURIComponent(String(accountName || '').trim());
  return `https://img.vietqr.io/image/${encodeURIComponent(bin)}-${encodeURIComponent(account)}-compact2.png?accountName=${name}`;
}

// Phương thức nhận thanh toán của chuyên gia (để nền tảng chi trả payout).
// Trả về số tài khoản đã che — không lộ full cho chính chủ trên UI.
router.get('/expert-portal/payment-method', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const r = await db.query(
      `select payout_bank_name, payout_bank_bin, payout_account_number, payout_account_name from experts where user_id = $1 limit 1`,
      [req.user.sub]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Expert profile not found' });
    const row = r.rows[0];
    return res.json({
      success: true,
      data: {
        payout_bank_name: row.payout_bank_name,
        payout_bank_bin: row.payout_bank_bin,
        payout_account_name: row.payout_account_name,
        payout_account_masked: maskAccount(row.payout_account_number),
        payout_qr_url: buildExpertPayoutQrUrl(row.payout_bank_bin, row.payout_account_number, row.payout_account_name),
        has_method: Boolean(row.payout_account_number),
        lookup_enabled: isVietqrLookupEnabled()
      }
    });
  } catch (error) {
    console.error('Get payment method error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch payment method' });
  }
});

router.put('/expert-portal/payment-method', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const schema = z.object({
      payout_bank_name: z.string().trim().max(120).min(1, 'Vui lòng chọn ngân hàng.'),
      payout_bank_bin: z.string().trim().max(20).optional().nullable(),
      payout_account_number: z.string().trim().max(40).regex(/^[0-9]+$/, 'Số tài khoản chỉ gồm chữ số.'),
      payout_account_name: z.string().trim().max(255).min(1, 'Thiếu tên chủ tài khoản.')
    });
    const p = schema.parse(req.body);
    const r = await db.query(
      `update experts
       set payout_bank_name = $2, payout_bank_bin = $3, payout_account_number = $4, payout_account_name = $5, updated_at = now()
       where user_id = $1
       returning id, payout_bank_name, payout_account_number, payout_account_name`,
      [req.user.sub, p.payout_bank_name, p.payout_bank_bin || null, p.payout_account_number, p.payout_account_name]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Expert profile not found' });

    // Cảnh báo bảo mật: gửi email cho chính chủ (best-effort).
    try {
      const uRes = await db.query(`select email, coalesce(display_name, full_name) as name from users where id = $1`, [req.user.sub]);
      const u = uRes.rows[0];
      if (u?.email) {
        await sendPayoutMethodChangedEmail({
          to: u.email,
          name: u.name,
          bankName: p.payout_bank_name,
          accountMasked: maskAccount(p.payout_account_number)
        });
      }
    } catch (e) {
      console.error('Payout method change email failed:', e.message);
    }

    return res.json({
      success: true,
      data: {
        payout_bank_name: r.rows[0].payout_bank_name,
        payout_bank_bin: p.payout_bank_bin || null,
        payout_account_name: r.rows[0].payout_account_name,
        payout_account_masked: maskAccount(r.rows[0].payout_account_number),
        payout_qr_url: buildExpertPayoutQrUrl(p.payout_bank_bin, r.rows[0].payout_account_number, r.rows[0].payout_account_name),
        has_method: true
      }
    });
  } catch (error) {
    if (error?.issues) return res.status(400).json({ success: false, message: error.issues[0]?.message || 'Dữ liệu không hợp lệ.' });
    console.error('Update payment method error:', error);
    return res.status(500).json({ success: false, message: 'Could not update payment method' });
  }
});

// Tra cứu tên chủ tài khoản qua VietQR. Body: { bin, account_number }.
router.post('/expert-portal/payment-method/lookup', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const bin = String(req.body?.bin || '').trim();
    const accountNumber = String(req.body?.account_number || '').trim();
    if (!/^[0-9]+$/.test(accountNumber)) {
      return res.status(400).json({ success: false, message: 'Số tài khoản chỉ gồm chữ số.' });
    }
    const result = await lookupBankAccount({ bin, accountNumber });
    if (result.ok) return res.json({ success: true, data: { account_name: result.accountName } });
    return res.status(result.configured === false ? 503 : 422).json({ success: false, message: result.message });
  } catch (error) {
    console.error('Lookup bank account error:', error);
    return res.status(500).json({ success: false, message: 'Could not lookup account' });
  }
});

router.get('/expert-portal/earnings', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') return res.status(403).json({ success: false, message: 'Expert access required' });
    const eRes = await db.query(`select id, coalesce(balance, 0)::int as balance from experts where user_id = $1 limit 1`, [req.user.sub]);
    if (!eRes.rows[0]) return res.json({ success: true, data: { balance: 0, total_earned: 0, pending: 0, recent: [] } });
    const expertId = eRes.rows[0].id;
    const agg = await db.query(
      `select
         coalesce(sum(expert_earning) filter (where status in ('payable', 'settled')), 0)::int as total_earned,
         coalesce(sum(expert_earning) filter (where status = 'pending'), 0)::int as pending
       from expert_ledger where expert_id = $1`,
      [expertId]
    );
    const recent = await db.query(
      `select l.expert_earning, l.gross, l.platform_fee, l.status, l.created_at, u.full_name as client_name
       from expert_ledger l
       join expert_bookings b on b.id = l.booking_id
       join users u on u.id = b.user_id
       where l.expert_id = $1 order by l.created_at desc limit 20`,
      [expertId]
    );
    return res.json({
      success: true,
      data: { balance: eRes.rows[0].balance, total_earned: agg.rows[0].total_earned, pending: agg.rows[0].pending, recent: recent.rows }
    });
  } catch (error) {
    console.error('Expert earnings error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch earnings' });
  }
});

// ===== ADMIN: chi trả (payout) cho chuyên gia =====
router.get('/admin/payouts/pending', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(
      `select e.id, e.full_name, coalesce(e.balance, 0)::int as balance, u.email,
              e.payout_bank_name, e.payout_account_number, e.payout_account_name
       from experts e left join users u on u.id = e.user_id
       where coalesce(e.balance, 0) > 0 order by e.balance desc`
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('Admin payouts pending error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch payouts' });
  }
});

router.post('/admin/payouts/:expertId', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const eRes = await db.query(`select id, user_id, coalesce(balance, 0)::int as balance, full_name from experts where id = $1 limit 1`, [req.params.expertId]);
    const exp = eRes.rows[0];
    if (!exp) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên gia.' });
    if (exp.balance <= 0) return res.status(400).json({ success: false, message: 'Chuyên gia không có số dư để chi trả.' });

    await db.query(
      `insert into expert_payouts (expert_id, amount, status, note, paid_at) values ($1, $2, 'paid', $3, now())`,
      [exp.id, exp.balance, req.body?.note || null]
    );
    await db.query(`update expert_ledger set status = 'settled' where expert_id = $1 and status = 'payable'`, [exp.id]);
    await db.query(`update experts set balance = 0 where id = $1`, [exp.id]);
    if (exp.user_id) {
      await notify(exp.user_id, null, 'booking_update', `Bạn đã được chi trả ${Number(exp.balance).toLocaleString('vi-VN')}đ.`);
    }
    return res.json({ success: true, data: { amount: exp.balance } });
  } catch (error) {
    console.error('Admin payout error:', error);
    return res.status(500).json({ success: false, message: 'Could not create payout' });
  }
});

// ===== Lịch rảnh hằng tuần =====

router.get('/expert-portal/availability', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }
    const eRes = await db.query(`select id from experts where user_id = $1 limit 1`, [req.user.sub]);
    if (!eRes.rows[0]) {
      return res.json({ success: true, data: [] });
    }
    const r = await db.query(
      `select id, weekday, to_char(start_time, 'HH24:MI') as start_time, to_char(end_time, 'HH24:MI') as end_time
       from expert_availability where expert_id = $1 order by weekday, start_time`,
      [eRes.rows[0].id]
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('Get availability error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch availability' });
  }
});

router.put('/expert-portal/availability', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }
    const { slots } = z.object({
      slots: z.array(z.object({
        weekday: z.coerce.number().int().min(0).max(6),
        start_time: z.string().regex(/^\d{2}:\d{2}$/),
        end_time: z.string().regex(/^\d{2}:\d{2}$/)
      })).max(60)
    }).parse(req.body);

    const eRes = await db.query(`select id from experts where user_id = $1 limit 1`, [req.user.sub]);
    if (!eRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'Expert profile not found' });
    }
    const expertId = eRes.rows[0].id;

    const client = await db.connect();
    try {
      await client.query('begin');
      await client.query(`delete from expert_availability where expert_id = $1`, [expertId]);
      for (const s of slots) {
        if (s.end_time <= s.start_time) continue;
        await client.query(
          `insert into expert_availability (expert_id, weekday, start_time, end_time) values ($1, $2, $3, $4)`,
          [expertId, s.weekday, s.start_time, s.end_time]
        );
      }
      await client.query('commit');
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Khung giờ rảnh không hợp lệ' });
    }
    console.error('Save availability error:', error);
    return res.status(500).json({ success: false, message: 'Could not save availability' });
  }
});

// Client xem lịch rảnh của một chuyên gia
router.get('/experts/:id/availability', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select weekday, to_char(start_time, 'HH24:MI') as start_time, to_char(end_time, 'HH24:MI') as end_time
       from expert_availability where expert_id = $1 order by weekday, start_time`,
      [req.params.id]
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('Public availability error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch availability' });
  }
});

// Các khung giờ trống (1 giờ) của chuyên gia trong một ngày — để client chọn khi đặt lịch.
const SLOT_TZ = 'Asia/Bangkok';
const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 21;

router.get('/experts/:id/slots', requireAuth, async (req, res) => {
  try {
    const date = String(req.query.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Ngày không hợp lệ.' });
    }

    await expireStaleBookings();

    const [busyRes, bookingRes, nowRes] = await Promise.all([
      db.query(
        `select to_char(start_time, 'HH24:MI') as s, to_char(end_time, 'HH24:MI') as e
         from expert_availability
         where expert_id = $1 and weekday = extract(dow from $2::date)::int`,
        [req.params.id, date]
      ),
      db.query(
        `select to_char(starts_at at time zone $3, 'HH24:MI') as t, duration_minutes
         from expert_bookings
         where expert_id = $1 and status in ('pending_payment', 'pending', 'awaiting_expert', 'confirmed')
           and (starts_at at time zone $3)::date = $2::date`,
        [req.params.id, date, SLOT_TZ]
      ),
      db.query(
        `select to_char(now() at time zone $1, 'YYYY-MM-DD') as today,
                extract(hour from now() at time zone $1)::int as hour`,
        [SLOT_TZ]
      )
    ]);

    const toMin = (hhmm) => {
      const [h, m] = String(hhmm).split(':').map(Number);
      return (h * 60) + (m || 0);
    };
    const overlaps = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

    const busy = busyRes.rows.map((r) => [toMin(r.s), toMin(r.e)]);
    const booked = bookingRes.rows.map((r) => {
      const start = toMin(r.t);
      return [start, start + (Number(r.duration_minutes) || 60)];
    });
    const isToday = nowRes.rows[0]?.today === date;
    const nowHour = Number(nowRes.rows[0]?.hour ?? 0);

    const slots = [];
    for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h += 1) {
      const s = h * 60;
      const e = s + 60;
      if (isToday && h <= nowHour) continue;
      if (busy.some(([b1, b2]) => overlaps(s, e, b1, b2))) continue;
      if (booked.some(([b1, b2]) => overlaps(s, e, b1, b2))) continue;
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }

    return res.json({ success: true, data: slots });
  } catch (error) {
    console.error('Expert slots error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch slots' });
  }
});

// ===== Đánh giá sau buổi =====
router.post('/expert-bookings/:id/review', requireAuth, async (req, res) => {
  try {
    const { rating, comment } = z.object({
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().max(1000).optional().nullable()
    }).parse(req.body);

    const bRes = await db.query(
      `select id, expert_id, status from expert_bookings where id = $1 and user_id = $2 limit 1`,
      [req.params.id, req.user.sub]
    );
    const booking = bRes.rows[0];
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể đánh giá buổi đã hoàn thành.' });
    }

    await db.query(
      `insert into expert_reviews (booking_id, expert_id, user_id, rating, comment)
       values ($1, $2, $3, $4, $5)
       on conflict (booking_id) do update set rating = excluded.rating, comment = excluded.comment, created_at = now()`,
      [booking.id, booking.expert_id, req.user.sub, rating, comment || null]
    );

    // Cập nhật lại rating trung bình + tỉ lệ hài lòng của chuyên gia
    const agg = await db.query(
      `select round(avg(rating)::numeric, 1) as avg_rating, round(avg(rating) * 20)::int as satisfaction
       from expert_reviews where expert_id = $1`,
      [booking.expert_id]
    );
    await db.query(
      `update experts set rating = $2, satisfaction_rate = $3 where id = $1`,
      [booking.expert_id, agg.rows[0].avg_rating, agg.rows[0].satisfaction]
    );

    return res.json({ success: true, data: { rating, avg_rating: agg.rows[0].avg_rating } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues?.[0]?.message || 'Dữ liệu đánh giá không hợp lệ' });
    }
    console.error('Expert review error:', error);
    return res.status(500).json({ success: false, message: 'Could not submit review' });
  }
});

function mapExpert(row, matchingTags) {
  const tags = ensureArray(row.tags);

  return {
    id: row.id,
    code: row.code,
    avatar: row.avatar_emoji || '👩‍⚕️',
    name: row.full_name,
    degree: row.degree,
    status: row.status,
    rating: row.rating === null ? 0 : Number(row.rating),
    sessions: row.sessions_count || 0,
    satisfaction_rate: row.satisfaction_rate === null ? 0 : Number(row.satisfaction_rate),
    price: row.base_price || 0,
    location: row.location || 'Online',
    experience: row.experience_years || 0,
    specialties: ensureArray(row.specialties),
    tags,
    bio: row.bio || '',
    matched: tags.some((tag) => matchingTags.has(tag)),
    nextSlot: row.next_slot_label || 'Chưa có lịch trống',
    credentials: ensureArray(row.credentials),
    approaches: ensureArray(row.approaches)
  };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

// Ghi một notification (best-effort, không làm hỏng request chính nếu lỗi).
async function notify(recipientId, actorName, type, message) {
  if (!recipientId) return;
  try {
    await db.query(
      `insert into notifications (recipient_id, actor_name, type, message) values ($1, $2, $3, $4)`,
      [recipientId, actorName, type, message]
    );
  } catch (e) {
    console.error('[notify] failed:', e.message);
  }
}

// Hết hạn các đơn chưa thanh toán quá giờ → nhả khung giờ đang giữ chỗ.
async function expireStaleBookings() {
  try {
    await db.query(`update payments set status = 'expired' where status = 'pending' and expires_at < now()`);
    await db.query(
      `update expert_bookings b set status = 'expired'
       where b.status = 'pending_payment'
         and exists (select 1 from payments p where p.booking_id = b.id and p.status = 'expired')`
    );
  } catch (e) {
    console.error('[expire] failed:', e.message);
  }
}

// Cộng tiền vào ví người dùng + ghi sổ giao dịch ví.
async function creditWallet(userId, amount, type, bookingId, note) {
  if (!userId || !amount) return;
  await db.query(`update users set wallet_balance = coalesce(wallet_balance, 0) + $2 where id = $1`, [userId, amount]);
  await db.query(
    `insert into wallet_transactions (user_id, amount, type, booking_id, note) values ($1, $2, $3, $4, $5)`,
    [userId, amount, type, bookingId || null, note || null]
  );
}

function csvToArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

const csvOrArraySchema = z.preprocess(csvToArray, z.array(z.string()).default([]));

const expertProfileSchema = z.object({
  full_name: z.string().min(2, 'Vui lòng nhập họ tên.').max(255),
  degree: z.string().min(2, 'Vui lòng nhập bằng cấp.'),
  phone: z.string().min(6, 'Số điện thoại không hợp lệ.').max(30),
  avatar_emoji: z.string().min(1).max(16).default('👩‍⚕️'),
  status: z.enum(['online', 'busy', 'offline']),
  base_price: z.coerce.number().int().min(0).max(100000000).default(0),
  location: z.string().max(255).optional().nullable(),
  experience_years: z.coerce.number().int().min(0).max(80).default(0),
  specialties: csvOrArraySchema,
  bio: z.string().optional().nullable(),
  credentials: csvOrArraySchema,
  approaches: csvOrArraySchema,
  next_slot_label: z.string().max(255).optional().nullable()
});

function round1(value) {
  return Math.round((value || 0) * 10) / 10;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function buildMatchingTags(latestMood, latestAssessment) {
  const tags = new Set();

  if (latestMood) {
    if ((latestMood.anxiety_score || 0) >= 6) tags.add('anxiety');
    if ((latestMood.stress_score || 0) >= 6) tags.add('stress');
    if ((latestMood.sleep_quality_score || 10) <= 4) tags.add('sleep');

    const triggerList = ensureArray(latestMood.triggers).map((trigger) => String(trigger).toLowerCase());
    if (triggerList.some((trigger) => ['family', 'relationship'].includes(trigger))) tags.add('relationship');
    if (triggerList.some((trigger) => ['work', 'finance', 'study'].includes(trigger))) tags.add('stress');
    if (triggerList.some((trigger) => ['trauma', 'abuse'].includes(trigger))) tags.add('trauma');

    const emotion = String(latestMood.dominant_emotion || '').toLowerCase();
    if (emotion.includes('buồn') || emotion.includes('depress')) tags.add('depression');
  }

  if (latestAssessment) {
    const severity = String(latestAssessment.severity || '').toLowerCase();
    const code = String(latestAssessment.code || '').toUpperCase();
    if (['GAD7', 'HARS'].includes(code) && severity !== 'minimal' && severity !== 'good') tags.add('anxiety');
    if (code === 'PHQ9' && severity !== 'minimal') tags.add('depression');
    if (code === 'PSQI' && severity !== 'good') tags.add('sleep');
    if (code === 'DASS21') {
      const dimensions = latestAssessment.dimension_scores || {};
      if ((dimensions.stress || 0) >= 10) tags.add('stress');
      if ((dimensions.anxiety || 0) >= 8) tags.add('anxiety');
      if ((dimensions.depression || 0) >= 10) tags.add('depression');
    }
  }

  if (!tags.size) tags.add('stress');
  return tags;
}

function buildAiMatch(matchedExperts, latestMood, matchingTags) {
  const moodScore = latestMood?.mood_score ?? null;
  const topTags = Array.from(matchingTags).slice(0, 2);
  const count = matchedExperts.length;

  if (!count) {
    return {
      count: 0,
      title: 'PeaceCat chưa thấy chuyên gia cần ưu tiên đặc biệt lúc này',
      subtitle: 'Bạn vẫn có thể xem toàn bộ danh sách chuyên gia và chọn người phù hợp.'
    };
  }

  return {
    count,
    title: `PeaceCat đã tìm được ${count} chuyên gia phù hợp với bạn`,
    subtitle: `Mood gần nhất ${moodScore ?? '--'}/10 và tín hiệu ${topTags.join(', ')} đang được dùng để ưu tiên danh sách.`
  };
}

export default router;
