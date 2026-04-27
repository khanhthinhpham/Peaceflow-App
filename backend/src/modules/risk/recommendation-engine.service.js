import { db } from '../../config/db.js';
import { RiskEngineService } from './risk-engine.service.js';

export class RecommendationEngineService {
  /**
   * Generates task recommendations for a user based on their current state.
   * @param {string} userId 
   */
  static async recommendTasks(userId) {
    try {
      // 1. Get latest state
      const profile = await this._getUserProfile(userId);
      const latestMood = await RiskEngineService._getLatestMood(userId);
      const latestRisk = await RiskEngineService.calculateStressIndex(userId);
      const history = await this._getTaskHistory(userId);
      const candidateTasks = await this._getActiveTasks();

      // 2. Score tasks
      const scoredTasks = candidateTasks.map(task => {
        let score = 0;

        // Rule 1: Support primary trigger (+30)
        if (task.triggers_supported?.includes(latestRisk.primary_trigger)) {
          score += 30;
        }

        // Rule 2: Difficulty match (+15)
        const preferredDifficulty = this._getPreferredDifficulty(history);
        if (task.difficulty === preferredDifficulty) {
          score += 15;
        }

        // Rule 3: Duration preference (+10)
        const prefDuration = profile?.preferred_task_duration || 10;
        if (task.duration_minutes <= prefDuration) {
          score += 10;
        }

        // Rule 4: Historical effectiveness (+20)
        if (this._wasTaskEffective(task.id, history)) {
          score += 20;
        }

        // Rule 5: Skip rate penalty (-15)
        if (this._isTaskFrequentlySkipped(task.id, history)) {
          score -= 15;
        }

        // Rule 6: Risk boost (+40)
        if (['high', 'critical'].includes(latestRisk.risk_level) && task.category === 'emergency') {
          score += 40;
        }

        // Rule 7: Sleep quality boost (+20)
        if ((latestMood?.sleep_quality_score || 5) <= 4 && task.category === 'sleep') {
          score += 20;
        }

        // Rule 8: Short task preference (+15 for <=5m, -15 for >15m)
        const prefersShort = this._prefersShortTasks(history);
        if (prefersShort) {
          if (task.duration_minutes <= 5) score += 15;
          if (task.duration_minutes > 15) score -= 15;
        }

        // Special Emergency Rule Boost
        if ((latestMood?.anxiety_score || 0) >= 8 && (latestMood?.stress_score || 0) >= 8 && (latestMood?.mood_score || 10) <= 3) {
          const emergencyCodes = ['E1', 'E2', 'E3', 'E4', 'E5']; // Breathing, Grounding, etc.
          if (emergencyCodes.some(code => task.code.startsWith(code))) {
            score += 50;
          }
        }

        return { ...task, recommendation_score: score };
      });

      // Sort by score descending
      scoredTasks.sort((a, b) => b.recommendation_score - a.recommendation_score);

      // 3. Bucket tasks
      const emergencyTask = scoredTasks.find(t => t.category === 'emergency') || scoredTasks[0];
      const todayPriority = scoredTasks.slice(0, 3);
      const microTask = scoredTasks.find(t => t.duration_minutes <= 5) || scoredTasks[0];
      const longTermTask = scoredTasks.find(t => t.duration_minutes >= 10) || scoredTasks[0];
      const backupTask = scoredTasks.find(t => !todayPriority.some(pt => pt.id === t.id)) || scoredTasks[4];

      // 4. Log recommendation
      await this._logRecommendation(userId, latestRisk.id, {
        emergency_task: emergencyTask?.id,
        today_priority_tasks: todayPriority.map(t => t.id),
        micro_task: microTask?.id,
        long_term_task: longTermTask?.id,
        backup_task: backupTask?.id
      }, { latest_mood: latestMood });

      return {
        emergency_task: emergencyTask,
        today_priority_tasks: todayPriority,
        micro_task: microTask,
        long_term_task: longTermTask,
        backup_task: backupTask,
        risk_summary: latestRisk,
        show_emergency_banner: latestRisk.show_emergency_banner
      };
    } catch (error) {
      console.error('Error recommending tasks:', error);
      throw error;
    }
  }

  // --- Scoring Helpers ---

  static _getPreferredDifficulty(history) {
    if (!history.completions.length) return 'easy';
    const counts = history.completions.reduce((acc, c) => {
      acc[c.difficulty] = (acc[c.difficulty] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  static _wasTaskEffective(taskId, history) {
    const completions = history.completions.filter(c => c.task_id === taskId);
    if (!completions.length) return false;
    // Check if it improved mood on average
    const avgImprovement = completions.reduce((sum, c) => sum + (c.self_rating_after - c.self_rating_before), 0) / completions.length;
    return avgImprovement >= 1.5;
  }

  static _isTaskFrequentlySkipped(taskId, history) {
    const assignments = history.assignments.filter(a => a.task_id === taskId);
    if (assignments.length < 3) return false;
    const skipCount = assignments.filter(a => a.status === 'skipped' || a.status === 'expired').length;
    return (skipCount / assignments.length) > 0.5;
  }

  static _prefersShortTasks(history) {
    if (!history.completions.length) return false;
    const avgDuration = history.completions.reduce((sum, c) => sum + c.duration_minutes, 0) / history.completions.length;
    return avgDuration <= 7;
  }

  // --- Data Access ---

  static async _getUserProfile(userId) {
    const result = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    return result.rows[0];
  }

  static async _getActiveTasks() {
    const result = await db.query('SELECT * FROM tasks WHERE active = true');
    return result.rows;
  }

  static async _getTaskHistory(userId) {
    const completions = await db.query(
      `SELECT tc.*, t.difficulty, t.duration_minutes 
       FROM task_completions tc 
       JOIN tasks t ON tc.task_id = t.id 
       WHERE tc.user_id = $1 
       ORDER BY tc.created_at DESC LIMIT 50`,
      [userId]
    );
    const assignments = await db.query(
      'SELECT * FROM user_task_assignments WHERE user_id = $1 ORDER BY assigned_at DESC LIMIT 50',
      [userId]
    );
    return {
      completions: completions.rows,
      assignments: assignments.rows
    };
  }

  static async _logRecommendation(userId, snapshotId, recommendedTasks, context) {
    const query = `
      INSERT INTO recommendation_logs (user_id, snapshot_id, recommended_tasks, context)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(query, [userId, snapshotId, JSON.stringify(recommendedTasks), JSON.stringify(context)]);
  }
}
