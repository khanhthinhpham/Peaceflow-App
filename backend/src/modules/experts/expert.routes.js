import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

router.get('/expert-portal/overview', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'Expert access required' });
    }

    const expertProfileRes = await db.query(
      `select id, code, full_name, degree, status, rating, sessions_count, satisfaction_rate,
              base_price, location, experience_years, specialties, bio, active, created_at
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
          specialties: ensureArray(expert.specialties)
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

router.post('/experts/:id/bookings', requireAuth, async (req, res) => {
  try {
    const {
      session_type,
      starts_at,
      duration_minutes,
      price,
      notes
    } = req.body;

    const expertResult = await db.query(
      `select id, full_name, degree, avatar_emoji
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

    const bookingResult = await db.query(
      `insert into expert_bookings (
         user_id,
         expert_id,
         session_type,
         starts_at,
         duration_minutes,
         price,
         notes,
         status
       )
       values ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
       returning *`,
      [
        req.user.sub,
        expert.id,
        session_type,
        starts_at,
        duration_minutes,
        price || 0,
        notes || null
      ]
    );

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
    console.error('Create expert booking error:', error);
    return res.status(500).json({ success: false, message: 'Could not create booking' });
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
