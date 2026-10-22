import { db } from '../../config/db.js';

export class RiskEngineService {
  /**
   * Calculates the stress index and risk level for a user.
   * @param {string} userId 
   */
  static async calculateStressIndex(userId) {
    try {
      const [latestMood, latestJournal, recentEmergencyCount, taskStats, profile, latestAssessment, latestScreening] = await Promise.all([
        this._getLatestMood(userId),
        this._getLatestJournal(userId),
        this._countEmergencyEventsLast7Days(userId),
        this._getTaskStatsLast7Days(userId),
        this._getUserProfile(userId),
        this._getLatestAssessmentResult(userId),
        this._getLatestScreeningBand(userId)
      ]);

      // Normalization (0-100)
      const A = this._normalizeAnxiety(latestMood?.anxiety_score);
      const S = this._normalizeStress(latestMood?.stress_score);
      const M = this._inverseMood(latestMood?.mood_score);
      const Sleep = this._sleepRisk(latestMood?.sleep_quality_score);
      const TaskAvoid = this._calculateTaskAvoid(taskStats);
      const Journal = this._calculateJournalNegativity(latestJournal?.sentiment_score);
      const Emergency = this._calculateEmergencyFrequency(recentEmergencyCount);

      // 2 nguồn "tình trạng" bổ sung: kết quả bài test chuẩn hóa gần nhất (PHQ-9/GAD-7...)
      // và mức Xanh/Vàng/Đỏ của lần Sàng lọc HSSV gần nhất (chỉ có khi user đã đăng nhập lúc
      // làm khảo sát — screening_responses.user_id có thể null với phiếu ẩn danh). Cả 2 CHỈ
      // được cộng vào công thức khi thực sự có dữ liệu — không ép giá trị mặc định 30/50 như
      // các yếu tố khác, để không làm loãng điểm của người chưa từng làm test/khảo sát.
      const AssessmentSeverity = this._severityToRiskScore(latestAssessment?.severity);
      const ScreeningBand = this._bandToRiskScore(latestScreening?.risk_band);

      // weight gốc (cộng = 1.00) nhân hệ số 0.8 để nhường 0.20 tổng trọng số cho 2 nguồn mới
      // khi có đủ dữ liệu cả 2 — khi thiếu 1 hoặc cả 2, chuẩn hóa lại theo đúng tổng trọng số
      // THỰC SỰ đang có mặt (xem vòng lặp bên dưới), không lệch thang điểm 0-100.
      const weightedFactors = [
        { weight: 0.22 * 0.8, value: A },
        { weight: 0.22 * 0.8, value: S },
        { weight: 0.18 * 0.8, value: M },
        { weight: 0.15 * 0.8, value: Sleep },
        { weight: 0.10 * 0.8, value: TaskAvoid },
        { weight: 0.08 * 0.8, value: Journal },
        { weight: 0.05 * 0.8, value: Emergency },
        ...(AssessmentSeverity !== null ? [{ weight: 0.10, value: AssessmentSeverity }] : []),
        ...(ScreeningBand !== null ? [{ weight: 0.10, value: ScreeningBand }] : [])
      ];
      const totalWeight = weightedFactors.reduce((sum, f) => sum + f.weight, 0);
      let stressIndex = weightedFactors.reduce((sum, f) => sum + f.weight * f.value, 0) / totalWeight;

      let riskLevel = this._classifyRisk(stressIndex);

      // Ghi đè trực tiếp: "tình trạng khẩn cấp" (Đỏ hoặc severity ở mức nghiêm trọng/khủng
      // hoảng) phải LUÔN đẩy thẳng lên critical để bên gợi ý bài tập (RecommendationEngineService)
      // bật ngay nhánh bài tập khẩn cấp — không để bị pha loãng bởi tâm trạng tạm thời ổn ở
      // các yếu tố khác khiến điểm trung bình không vượt ngưỡng 75.
      const isCrisisOverride = latestScreening?.risk_band === 'do' || this._isCrisisSeverity(latestAssessment?.severity);
      if (isCrisisOverride) {
        stressIndex = Math.max(stressIndex, 85);
        riskLevel = 'critical';
      }

      const primaryTrigger = this._detectPrimaryTrigger(profile, latestMood, latestJournal, { Sleep, Journal });

      // Lý do cụ thể để hiển thị trong banner "Ưu tiên an toàn" ở Dashboard — người dùng cần
      // biết TẠI SAO banner bật lên, không chỉ 1 câu chung chung. Ưu tiên theo đúng thứ tự đã
      // xét ở trên: Đỏ sàng lọc > bài test nghiêm trọng > tổ hợp nhiều yếu tố (không có 1
      // nguồn rõ ràng để chỉ đích danh).
      let emergencyReason = null;
      if (latestScreening?.risk_band === 'do') {
        emergencyReason = { code: 'screening_red', params: {} };
      } else if (this._isCrisisSeverity(latestAssessment?.severity)) {
        emergencyReason = {
          code: 'assessment_severe',
          params: { assessmentName: latestAssessment.assessment_name, severity: latestAssessment.severity }
        };
      } else if (riskLevel === 'critical' || stressIndex >= 75) {
        if (Emergency >= 60) {
          emergencyReason = { code: 'frequent_emergency_button', params: {} };
        } else {
          emergencyReason = { code: 'mood_composite', params: {} };
        }
      }

      const factors = {
        anxiety: A,
        stress: S,
        inverse_mood: M,
        sleep_risk: Sleep,
        task_avoid: TaskAvoid,
        journal_negativity: Journal,
        emergency_frequency: Emergency,
        ...(AssessmentSeverity !== null ? { assessment_severity: AssessmentSeverity } : {}),
        ...(ScreeningBand !== null ? { screening_band: ScreeningBand } : {})
      };

      // Fire-and-forget — không block response
      this._saveRiskSnapshot(userId, stressIndex, A, Sleep, riskLevel, factors, primaryTrigger)
        .catch((e) => console.error('Snapshot save failed:', e.message));

      return {
        id: null,
        snapshot_id: null,
        stress_index: Math.round(stressIndex),
        risk_level: riskLevel,
        primary_trigger: primaryTrigger,
        factors,
        show_emergency_banner: riskLevel === 'critical' || stressIndex >= 75,
        emergency_reason: emergencyReason,
        _latestMood: latestMood,
        _profile: profile
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

  // severity là text tự do do frontend tính rồi gửi lên khi nộp bài test (vd "Nghiêm trọng",
  // "Severe", "Trung bình nặng"...) — dò từ khóa giống hệt cách frontend tô màu badge mức độ
  // ở MoodAssessmentView.vue (getSeverityBadgeStyle) để nhất quán 2 nơi, không cần sửa schema
  // thêm cột enum riêng.
  static _severityToRiskScore(severity) {
    if (!severity) return null;
    const value = String(severity).toLowerCase();
    if (value.includes('nghiêm') || value.includes('severe') || value.includes('nặng')) return 95;
    if (value.includes('vừa') || value.includes('moderate') || value.includes('poor')) return 55;
    return 20; // minimal/mild/nhẹ/tối thiểu
  }

  static _isCrisisSeverity(severity) {
    if (!severity) return false;
    const value = String(severity).toLowerCase();
    return value.includes('nghiêm') || value.includes('severe') || value.includes('nặng');
  }

  static _bandToRiskScore(band) {
    if (band === 'do') return 100;
    if (band === 'vang') return 55;
    if (band === 'xanh') return 10;
    return null;
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
        COUNT(*) as assigned,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) FILTER (WHERE status = 'expired') as expired
      FROM user_task_assignments 
      WHERE user_id = $1 AND assigned_at > NOW() - INTERVAL '7 days'`,
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

  static async _getLatestAssessmentResult(userId) {
    const result = await db.query(
      `SELECT ar.severity, ar.total_score, a.name as assessment_name
       FROM assessment_results ar
       JOIN assessments a ON a.id = ar.assessment_id
       WHERE ar.user_id = $1 ORDER BY ar.created_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0];
  }

  // Phiếu Sàng lọc HSSV công khai có thể nộp ẩn danh (user_id null) — chỉ lấy được khi học
  // sinh đã đăng nhập app lúc làm khảo sát (xem screening.routes.js).
  static async _getLatestScreeningBand(userId) {
    const result = await db.query(
      'SELECT risk_band FROM screening_responses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0];
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
