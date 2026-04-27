import { db } from '../../config/db.js';

export class RiskEngineService {
  /**
   * Calculates the stress index and risk level for a user.
   * @param {string} userId 
   */
  static async calculateStressIndex(userId) {
    try {
      const latestMood = await this._getLatestMood(userId);
      const latestJournal = await this._getLatestJournal(userId);
      const recentEmergencyCount = await this._countEmergencyEventsLast7Days(userId);
      const taskStats = await this._getTaskStatsLast7Days(userId);

      // Normalization (0-100)
      const A = this._normalizeAnxiety(latestMood?.anxiety_score);
      const S = this._normalizeStress(latestMood?.stress_score);
      const M = this._inverseMood(latestMood?.mood_score);
      const Sleep = this._sleepRisk(latestMood?.sleep_quality_score);
      const TaskAvoid = this._calculateTaskAvoid(taskStats);
      const Journal = this._calculateJournalNegativity(latestJournal?.sentiment_score);
      const Emergency = this._calculateEmergencyFrequency(recentEmergencyCount);

      // Weighted Formula
      // StressIndex = 0.22*A + 0.22*S + 0.18*M + 0.15*Sleep + 0.10*TaskAvoid + 0.08*Journal + 0.05*Emergency
      const stressIndex = (
        0.22 * A +
        0.22 * S +
        0.18 * M +
        0.15 * Sleep +
        0.10 * TaskAvoid +
        0.08 * Journal +
        0.05 * Emergency
      );

      const riskLevel = this._classifyRisk(stressIndex);
      
      // Get profile for personalization weights
      const profile = await this._getUserProfile(userId);
      const primaryTrigger = this._detectPrimaryTrigger(profile, latestMood, latestJournal, { Sleep, Journal });

      const factors = {
        anxiety: A,
        stress: S,
        inverse_mood: M,
        sleep_risk: Sleep,
        task_avoid: TaskAvoid,
        journal_negativity: Journal,
        emergency_frequency: Emergency
      };

      // Save snapshot
      const snapshot = await this._saveRiskSnapshot(userId, stressIndex, A, Sleep, riskLevel, factors, primaryTrigger);

      return {
        stress_index: Math.round(stressIndex),
        risk_level: riskLevel,
        primary_trigger: primaryTrigger,
        factors,
        show_emergency_banner: riskLevel === 'critical' || stressIndex >= 75
      };
    } catch (error) {
      console.error('Error calculating stress index:', error);
      throw error;
    }
  }

  // --- Normalization Helpers ---

  static _normalizeAnxiety(score) {
    // anxiety_score 0-10, fallback 5
    const val = score !== undefined && score !== null ? score : 5;
    return val * 10;
  }

  static _normalizeStress(score) {
    // stress_score 0-10, fallback 5
    const val = score !== undefined && score !== null ? score : 5;
    return val * 10;
  }

  static _inverseMood(score) {
    // (10 - mood_score) * 10, fallback 5
    const val = score !== undefined && score !== null ? score : 5;
    return (10 - val) * 10;
  }

  static _sleepRisk(score) {
    // (10 - sleep_quality_score) * 10, fallback 5
    const val = score !== undefined && score !== null ? score : 5;
    return (10 - val) * 10;
  }

  static _calculateTaskAvoid(stats) {
    // ((skipped + expired) / assigned) * 100, fallback 0
    if (!stats || stats.assigned === 0) return 0;
    return Math.min(100, ((stats.skipped + stats.expired) / stats.assigned) * 100);
  }

  static _calculateJournalNegativity(sentimentScore) {
    // ((1 - sentiment_score) / 2) * 100, fallback 30
    if (sentimentScore === undefined || sentimentScore === null) return 30;
    return ((1 - sentimentScore) / 2) * 100;
  }

  static _calculateEmergencyFrequency(count) {
    // min(count, 5) * 20
    return Math.min(count || 0, 5) * 20;
  }

  static _classifyRisk(index) {
    if (index <= 24) return 'low';
    if (index <= 49) return 'moderate';
    if (index <= 74) return 'high';
    return 'critical';
  }

  // --- Trigger Detection ---

  static _detectPrimaryTrigger(profile, latestMood, latestJournal, calculatedRisks) {
    const weights = profile?.personalization_weights || {
      sleep_weight: 0.30,
      workload_weight: 0.25,
      social_isolation_weight: 0.20,
      self_criticism_weight: 0.15,
      sensory_overload_weight: 0.10
    };

    const scores = {};

    // 1. Sleep Trigger
    scores.sleep_loss = (calculatedRisks.Sleep || 0) * (weights.sleep_weight || 0.30);

    // 2. Workload Trigger (from mood triggers or profile)
    const hasWorkloadTrigger = latestMood?.triggers?.some(t => ['work', 'deadline', 'workload'].includes(t.toLowerCase()));
    scores.workload = (hasWorkloadTrigger ? 80 : 20) * (weights.workload_weight || 0.25);

    // 3. Social Isolation
    const isLonely = latestMood?.triggers?.some(t => ['lonely', 'loneliness'].includes(t.toLowerCase()));
    scores.social_isolation = (isLonely ? 80 : 20) * (weights.social_isolation_weight || 0.20);

    // 4. Self Criticism
    scores.self_criticism = (calculatedRisks.Journal || 30) * (weights.self_criticism_weight || 0.15);

    // 5. Sensory Overload
    const hasSensoryTrigger = latestMood?.triggers?.some(t => ['noise', 'crowd', 'conflict'].includes(t.toLowerCase()));
    scores.sensory_overload = (hasSensoryTrigger ? 80 : 20) * (weights.sensory_overload_weight || 0.10);

    // Find trigger with highest score
    let primary = 'workload'; // default
    let maxScore = -1;

    for (const [trigger, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primary = trigger;
      }
    }

    return primary;
  }

  // --- Data Access (Direct DB queries for v1) ---

  static async _getLatestMood(userId) {
    const result = await db.query(
      'SELECT * FROM mood_checkins WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0];
  }

  static async _getLatestJournal(userId) {
    const result = await db.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0];
  }

  static async _countEmergencyEventsLast7Days(userId) {
    const result = await db.query(
      "SELECT COUNT(*) FROM emergency_logs WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'",
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  static async _getTaskStatsLast7Days(userId) {
    const result = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status != 'pending') as assigned,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) FILTER (WHERE status = 'expired') as expired
      FROM user_task_assignments 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    const row = result.rows[0];
    return {
      assigned: parseInt(row.assigned, 10) || 0,
      completed: parseInt(row.completed, 10) || 0,
      skipped: parseInt(row.skipped, 10) || 0,
      expired: parseInt(row.expired, 10) || 0
    };
  }

  static async _getUserProfile(userId) {
    const result = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  static async _saveRiskSnapshot(userId, stressIndex, anxietyIndex, sleepRisk, riskLevel, factors, primaryTrigger) {
    const query = `
      INSERT INTO risk_snapshots (
        user_id, current_stress_index, current_anxiety_index, 
        sleep_risk_index, crisis_risk_level, explanation
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      userId,
      stressIndex,
      anxietyIndex,
      sleepRisk,
      riskLevel,
      JSON.stringify({
        factors,
        primary_trigger: primaryTrigger,
        calculated_at: new Date().toISOString()
      })
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}
