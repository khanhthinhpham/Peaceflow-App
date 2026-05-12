import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { BadgeAwardService } from '../progress/badge-award.service.js';

const router = Router();

router.post('/moods', requireAuth, async (req, res) => {
  const {
    mood_score,
    anxiety_score,
    stress_score,
    energy_score,
    sleep_quality_score,
    dominant_emotion,
    triggers,
    notes
  } = req.body;
  const client = await db.connect();

  try {
    await client.query('begin');

    const result = await client.query(
      `insert into mood_checkins
        (user_id, mood_score, anxiety_score, stress_score, energy_score, sleep_quality_score, dominant_emotion, triggers, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning *`,
      [
        req.user.sub,
        mood_score,
        anxiety_score,
        stress_score,
        energy_score,
        sleep_quality_score,
        dominant_emotion || null,
        JSON.stringify(triggers || []),
        notes || null
      ]
    );

    const badgeSync = await BadgeAwardService.syncUserBadges(client, req.user.sub);

    await client.query('commit');

    return res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        awarded_badges: badgeSync.awardedBadges,
        badges_count: badgeSync.badgesCount
      }
    });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
});

router.get('/moods', requireAuth, async (req, res) => {
  const result = await db.query(
    `select * from mood_checkins
     where user_id = $1
     order by created_at desc
     limit 100`,
    [req.user.sub]
  );

  return res.json({
    success: true,
    data: result.rows
  });
});

router.get('/moods/latest', requireAuth, async (req, res) => {
  const result = await db.query(
    `select * from mood_checkins
     where user_id = $1
     order by created_at desc
     limit 1`,
    [req.user.sub]
  );

  return res.json({
    success: true,
    data: result.rows[0] || null
  });
});

export default router;
