// 🔐 Mood Tracking API Integration with Authentication
// File này có hỗ trợ token-based authentication (JWT)

const API_URL = 'http://localhost:3000';
let USER_ID = localStorage.getItem('auth_user_id') || 'user_001';
let AUTH_TOKEN = localStorage.getItem('auth_token') || null;

/**
 * Đặt token authentication
 * Gọi hàm này sau khi user đăng nhập thành công
 */
function setAuthToken(token, userId) {
  AUTH_TOKEN = token;
  USER_ID = userId;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user_id', userId);
  console.log('✅ Auth token đã cập nhật');
}

/**
 * Xóa authentication
 * Gọi hàm này khi user đăng xuất
 */
function clearAuth() {
  AUTH_TOKEN = null;
  USER_ID = 'user_001';
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user_id');
  console.log('✅ Auth đã xóa');
}

/**
 * Lấy headers cho API request
 * @returns {Object} Headers với authorization token (nếu có)
 */
function getApiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  return headers;
}

/**
 * Gửi tâm trạng mới lên server
 * @param {number} moodValue - Giá trị tâm trạng (1-5)
 * @param {string} note - Ghi chú (có thể rỗng)
 * @param {Array} tags - Mảng tags (có thể rỗng)
 * @returns {Promise<Object>} Kết quả từ server
 */
async function saveMood(moodValue, note = '', tags = []) {
  try {
    const response = await fetch(`${API_URL}/api/moods`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ 
        userId: USER_ID,  // Gửi userId (sẽ override bằng auth token nếu có)
        mood: moodValue, 
        note: note,
        tags: tags
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Lỗi lưu tâm trạng:', result.message);
      return { success: false, message: result.message };
    }
    
    console.log('✅ Tâm trạng đã lưu:', result);
    return result;
  } catch (err) {
    console.error('❌ Lỗi kết nối API:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Lấy lịch sử tâm trạng từ server
 * @param {string} userId - User ID (không bắt buộc, mặc định là USER_ID hiện tại)
 * @param {number} limit - Số bản ghi (mặc định 30)
 * @returns {Promise<Array>} Mảng các bản ghi tâm trạng
 */
async function loadMoodHistory(userId = USER_ID, limit = 30) {
  try {
    const response = await fetch(`${API_URL}/api/moods/${userId}?limit=${limit}`, {
      headers: getApiHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Lỗi tải lịch sử:', result.message);
      return [];
    }
    
    console.log('✅ Lịch sử tâm trạng:', result.data);
    return result.data || [];
  } catch (err) {
    console.error('❌ Lỗi kết nối API:', err);
    return [];
  }
}

/**
 * Lấy thống kê tâm trạng
 * @param {string} userId - User ID (không bắt buộc)
 * @returns {Promise<Object>} Thống kê (trung bình, xu hướng, v.v.)
 */
async function getMoodStats(userId = USER_ID) {
  try {
    const response = await fetch(`${API_URL}/api/moods/stats/${userId}`, {
      headers: getApiHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Lỗi thống kê:', result.message);
      return { average: 0, total: 0, trend: 'Không có dữ liệu' };
    }
    
    console.log('📊 Thống kê tâm trạng:', result.stats);
    return result.stats;
  } catch (err) {
    console.error('❌ Lỗi kết nối API:', err);
    return { average: 0, total: 0, trend: 'Lỗi' };
  }
}

/**
 * Xóa bản ghi tâm trạng
 * @param {string} moodId - MongoDB mood document ID
 * @returns {Promise<Object>} Kết quả xóa
 */
async function deleteMood(moodId) {
  try {
    const response = await fetch(`${API_URL}/api/moods/${moodId}`, {
      method: 'DELETE',
      headers: getApiHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Lỗi xóa:', result.message);
      return { success: false, message: result.message };
    }
    
    console.log('✅ Bản ghi đã xóa');
    return result;
  } catch (err) {
    console.error('❌ Lỗi kết nối API:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Fallback: nếu API không khả dụng, sử dụng localStorage
 * @param {number} moodValue - Giá trị tâm trạng (1-5)
 * @param {string} note - Ghi chú
 * @returns {Promise<Object>} Kết quả
 */
async function saveMoodWithFallback(moodValue, note = '') {
  const result = await saveMood(moodValue, note);
  
  if (result.success === false) {
    // Fallback to localStorage
    let logs = [];
    try { 
      logs = JSON.parse(localStorage.getItem('PeaceFlow_moods') || "[]"); 
    } catch (e) { }
    
    const entry = {
      userId: USER_ID,
      mood: moodValue, 
      note: note, 
      createdAt: new Date().toISOString(),
      _local: true  // Đánh dấu là lưu local
    };
    
    logs.push(entry);
    localStorage.setItem('PeaceFlow_moods', JSON.stringify(logs));
    console.log('⚠️  Tâm trạng đã lưu vào localStorage (API không khả dụng)');
    return { success: true, data: entry, offline: true };
  }
  
  return result;
}

/**
 * Đồng bộ dữ liệu từ localStorage lên server
 * Sử dụng khi ứng dụng online trở lại
 */
async function syncLocalMoods() {
  try {
    let logs = [];
    try { 
      logs = JSON.parse(localStorage.getItem('PeaceFlow_moods') || "[]"); 
    } catch (e) { }
    
    const localMoods = logs.filter(m => m._local === true);
    
    if (localMoods.length === 0) {
      console.log('✅ Không có dữ liệu local để đồng bộ');
      return;
    }
    
    console.log(`🔄 Đồng bộ ${localMoods.length} bản ghi từ local lên server...`);
    
    for (const mood of localMoods) {
      await saveMood(mood.mood, mood.note);
    }
    
    // Xóa local moods sau khi sync thành công
    const remaining = logs.filter(m => m._local !== true);
    localStorage.setItem('PeaceFlow_moods', JSON.stringify(remaining));
    console.log('✅ Đồng bộ hoàn thành');
  } catch (err) {
    console.error('❌ Lỗi đồng bộ:', err);
  }
}

// Event listener cho online/offline
window.addEventListener('online', () => {
  console.log('🌐 Ứng dụng online - Đồng bộ dữ liệu...');
  syncLocalMoods();
});

window.addEventListener('offline', () => {
  console.log('⚠️  Ứng dụng offline - Dữ liệu sẽ lưu local');
});

// Export cho sử dụng trong console
window.MoodAPI = {
  saveMood,
  loadMoodHistory,
  getMoodStats,
  deleteMood,
  saveMoodWithFallback,
  syncLocalMoods,
  setAuthToken,
  clearAuth
};

console.log('✅ Mood API initialized. Sử dụng: window.MoodAPI');
