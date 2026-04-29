import { RiskEngineService } from './risk-engine.service.js';
import { RecommendationEngineService } from './recommendation-engine.service.js';
import * as riskRepository from './risk.repository.js';

/**
 * Tính stress index + risk level cho user hiện tại
 */
export async function calculateRisk(userId) {
  return RiskEngineService.calculateStressIndex(userId);
}

/**
 * Lấy gợi ý task cá nhân hóa dựa trên risk profile
 */
export async function getRecommendations(userId) {
  return RecommendationEngineService.recommendTasks(userId);
}

/**
 * Lấy risk snapshot gần nhất (không tính mới)
 */
export async function getLatestSnapshot(userId) {
  return riskRepository.getLatestSnapshot(userId);
}

/**
 * Lấy lịch sử risk snapshots
 */
export async function getRiskHistory(userId, limit = 20) {
  return riskRepository.getRiskHistory(userId, limit);
}

/**
 * Lấy lịch sử recommendation logs
 */
export async function getRecommendationHistory(userId, limit = 10) {
  return riskRepository.getRecommendationHistory(userId, limit);
}
