import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { z } from 'zod';

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
         e.avatar_emoji as expert_avatar
       from expert_bookings eb
       join experts e on e.id = eb.expert_id
       where eb.user_id = $1
       order by eb.starts_at asc`,
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

    const expertResult = await db.query(
      `select id, user_id, full_name, degree, avatar_emoji
       from experts
       where id = $1
         and active = true
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
         and status in ('pending', 'confirmed')
         and tstzrange(starts_at, starts_at + (duration_minutes || ' minutes')::interval) && tstzrange($2, $3)
       limit 1`,
      [expert.id, payload.starts_at.toISOString(), endsAt.toISOString()]
    );
    if (overlap.rows[0]) {
      return res.status(409).json({ success: false, message: 'Khung giờ này đã có lịch khác, vui lòng chọn giờ khác.' });
    }

    const bookingResult = await db.query(
      `insert into expert_bookings (user_id, expert_id, session_type, starts_at, duration_minutes, price, notes, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'pending')
       returning *`,
      [
        req.user.sub,
        expert.id,
        payload.session_type,
        payload.starts_at.toISOString(),
        payload.duration_minutes,
        payload.price || 0,
        payload.notes || null
      ]
    );

    // Thông báo cho chuyên gia về lịch hẹn mới (chờ xác nhận)
    const clientRes = await db.query(
      `select coalesce(display_name, full_name, 'Một thân chủ') as name from users where id = $1`,
      [req.user.sub]
    );
    const clientName = clientRes.rows[0]?.name || 'Một thân chủ';
    await notify(expert.user_id, clientName, 'booking_new', `${clientName} vừa đặt một lịch hẹn — chờ bạn xác nhận.`);

    return res.json({
      success: true,
      data: {
        ...bookingResult.rows[0],
        expert_name: expert.full_name,
        expert_degree: expert.degree,
        expert_avatar: expert.avatar_emoji
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
       where eb.expert_id = $1
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
    const { status } = z.object({ status: z.enum(['confirmed', 'completed', 'cancelled']) }).parse(req.body);
    const eRes = await db.query(`select id, full_name from experts where user_id = $1 limit 1`, [req.user.sub]);
    const expert = eRes.rows[0];
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert profile not found' });
    }
    const bRes = await db.query(
      `select id, status, user_id from expert_bookings where id = $1 and expert_id = $2 limit 1`,
      [req.params.id, expert.id]
    );
    const booking = bRes.rows[0];
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    }

    const updated = await db.query(
      `update expert_bookings set status = $2 where id = $1 returning *`,
      [booking.id, status]
    );

    // Tăng số buổi đã hoàn thành (chỉ khi chuyển sang completed lần đầu)
    if (status === 'completed' && booking.status !== 'completed') {
      await db.query(`update experts set sessions_count = coalesce(sessions_count, 0) + 1 where id = $1`, [expert.id]);
    }

    const labelMap = { confirmed: 'đã xác nhận', completed: 'đã hoàn thành', cancelled: 'đã huỷ' };
    await notify(booking.user_id, expert.full_name, 'booking_update',
      `Chuyên gia ${expert.full_name} ${labelMap[status]} lịch hẹn của bạn.`);

    return res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    console.error('Expert booking update error:', error);
    return res.status(500).json({ success: false, message: 'Could not update booking' });
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
