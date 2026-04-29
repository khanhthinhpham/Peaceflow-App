import * as riskService from './risk.service.js';

/**
 * POST /api/v1/risk/calculate
 * Tính stress index mới cho user hiện tại
 */
export async function calculateRisk(req, res, next) {
  try {
    const data = await riskService.calculateRisk(req.user.id);
    res.json({
      success: true,
      message: 'Đã tính toán chỉ số rủi ro',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/risk/latest
 * Lấy risk snapshot gần nhất (không tính lại)
 */
export async function getLatestRisk(req, res, next) {
  try {
    const data = await riskService.getLatestSnapshot(req.user.id);
    res.json({
      success: true,
      data: data || { message: 'Chưa có dữ liệu risk. Hãy thực hiện check-in tâm trạng trước.' }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/risk/history
 * Lấy lịch sử risk snapshots
 */
export async function getRiskHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await riskService.getRiskHistory(req.user.id, limit);
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/risk/recommendations
 * Lấy gợi ý task cá nhân hóa dựa trên risk profile
 */
export async function getRecommendations(req, res, next) {
  try {
    const data = await riskService.getRecommendations(req.user.id);
    res.json({
      success: true,
      message: 'Gợi ý nhiệm vụ dựa trên tình trạng hiện tại',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/risk/recommendation-history
 * Lấy lịch sử gợi ý đã tạo
 */
export async function getRecommendationHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await riskService.getRecommendationHistory(req.user.id, limit);
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (err) {
    next(err);
  }
}
