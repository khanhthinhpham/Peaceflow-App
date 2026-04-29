import { apiClient } from './api-client.js';

/**
 * Mood Tracking API Integration
 * Standardized to use apiClient for consistent base URL and auth headers.
 */

/**
 * Gửi tâm trạng mới lên server
 * @param {Object} checkinData - Dữ liệu check-in từ UI
 * @returns {Promise<Object>} Kết quả từ server
 */
export async function saveMood(checkinData) {
  try {
    const payload = {
      mood_score: checkinData.score, // 1-10 scale
      anxiety_score: checkinData.anxiety || 5,
      stress_score: checkinData.stress || 5,
      energy_score: checkinData.energy || 5,
      sleep_quality_score: checkinData.sleep || 5,
      dominant_emotion: checkinData.moodLabel || checkinData.mood,
      triggers: Array.from(checkinData.tags || []),
      notes: checkinData.note || ''
    };

    const result = await apiClient.post('/moods', payload);
    console.log('✅ Tâm trạng đã lưu lên server:', result);
    return { success: true, data: result };
  } catch (err) {
    console.error('❌ Lỗi lưu tâm trạng lên server:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Lấy lịch sử tâm trạng từ server
 * @returns {Promise<Array>} Mảng các bản ghi tâm trạng
 */
export async function loadMoodHistory() {
  try {
    const data = await apiClient.get('/moods');
    console.log('📊 Lịch sử tâm trạng:', data);
    return data || [];
  } catch (err) {
    console.error('❌ Lỗi tải lịch sử tâm trạng:', err);
    return [];
  }
}

/**
 * Lấy thống kê tâm trạng
 * @returns {Promise<Object>} Thống kê (trung bình, xu hướng, v.v.)
 */
export async function getMoodStats() {
  try {
    const moods = await loadMoodHistory();
    if (!moods || moods.length === 0) return { average: 0, total: 0, trend: 'Không có dữ liệu' };
    
    const average = (moods.reduce((sum, m) => sum + m.mood_score, 0) / moods.length).toFixed(1);
    const recent = moods.slice(0, 7); // 7 ngày gần nhất
    const trend = recent.length > 1 
      ? (recent[0].mood_score >= recent[recent.length - 1].mood_score ? 'Cải thiện ✓' : 'Cần chú ý')
      : 'Chưa đủ dữ liệu';
    
    return { 
      average, 
      total: moods.length, 
      trend,
      recentData: recent
    };
  } catch (err) {
    console.error('❌ Lỗi thống kê:', err);
    return { average: 0, total: 0, trend: 'Lỗi' };
  }
}

/**
 * Fallback: nếu API không khả dụng, sử dụng localStorage
 */
export async function saveMoodWithFallback(checkinData) {
  const result = await saveMood(checkinData);
  
  if (!result.success) {
    // Fallback to localStorage (PeaceFlow_logs used in app.js)
    let logs = [];
    try { 
      logs = JSON.parse(localStorage.getItem('PeaceFlow_logs') || "[]"); 
    } catch (e) { }
    
    const fallbackEntry = {
      date: new Date().toISOString(),
      mood: checkinData.mood,
      score: checkinData.score,
      tags: Array.from(checkinData.tags || []),
      note: checkinData.note || '',
      timestamp: Date.now(),
      is_synced: false
    };
    
    logs.push(fallbackEntry);
    localStorage.setItem('PeaceFlow_logs', JSON.stringify(logs));
    console.warn('⚠️ Đã lưu vào localStorage (Server không phản hồi)');
    return { success: true, data: fallbackEntry, source: 'local' };
  }
  
  return result;
}

// Expose to window for inline scripts if necessary
window.saveMoodWithFallback = saveMoodWithFallback;
window.loadMoodHistory = loadMoodHistory;
window.getMoodStats = getMoodStats;
