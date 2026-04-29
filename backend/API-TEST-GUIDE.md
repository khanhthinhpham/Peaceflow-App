# 🚀 Hướng Dẫn Setup MongoDB Atlas & Test API

## 📋 Bước 1: Cấu Hình MongoDB Atlas

### 1.1 Tạo tài khoản MongoDB Atlas
1. Truy cập [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Đăng ký với email/Google (miễn phí)
3. Xác thực email

### 1.2 Tạo Cluster
1. Nhấn "Create a Deployment"
2. Chọn "Shared" (miễn phí)
3. Chọn provider: AWS, GCP hoặc Azure (tùy chọn)
4. Chọn region gần Việt Nam (Singapore: ap-southeast-1)
5. Cluster name: `peaceflow-cluster`
6. Nhấn "Create Deployment"

### 1.3 Lấy Connection String
1. Sau khi cluster tạo xong (5-10 phút), nhấn "Connect"
2. Chọn "Drivers" (Node.js)
3. Copy connection string, ví dụ:
   ```
   mongodb+srv://<username>:<password>@peaceflow-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=peaceflow-cluster
   ```

### 1.4 Cập Nhật .env
Thay thế `backend/.env`:
```env
MONGO_URI=mongodb+srv://username:password@peaceflow-cluster.xxxxx.mongodb.net/peaceflow?retryWrites=true&w=majority
PORT=3000
JWT_SECRET=your-secret-key-here-change-this-in-production
```

**Lưu ý:** Thay `<username>` và `<password>` bằng credentials tạo trong MongoDB Atlas.

---

## 🧪 Bước 2: Test API

### Phương pháp 1: Sử dụng cURL (Terminal)

```bash
# Test POST - Lưu tâm trạng mới
curl -X POST http://localhost:3000/api/moods \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "mood": 4,
    "note": "Hôm nay tôi cảm thấy khá tốt"
  }'

# Test GET - Lấy lịch sử tâm trạng
curl http://localhost:3000/api/moods/user_001
```

### Phương pháp 2: Sử dụng Postman

#### Cài Postman
1. Download từ [postman.com](https://www.postman.com/downloads/)
2. Cài đặt và đăng nhập

#### Test API trong Postman

**Request 1: POST - Lưu tâm trạng**
- Method: `POST`
- URL: `http://localhost:3000/api/moods`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (JSON):
  ```json
  {
    "userId": "user_001",
    "mood": 4,
    "note": "Hôm nay tôi cảm thấy khá tốt"
  }
  ```
- Nhấn "Send"

**Request 2: GET - Lấy lịch sử tâm trạng**
- Method: `GET`
- URL: `http://localhost:3000/api/moods/user_001`
- Nhấn "Send"

### Phương pháp 3: Sử dụng DevTools Browser

```javascript
// Mở DevTools (F12) > Console, paste code này:

// Lưu tâm trạng
fetch('http://localhost:3000/api/moods', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_001',
    mood: 4,
    note: 'Test từ browser DevTools'
  })
})
  .then(r => r.json())
  .then(data => console.log('Lưu thành công:', data));

// Lấy lịch sử
fetch('http://localhost:3000/api/moods/user_001')
  .then(r => r.json())
  .then(data => console.log('Lịch sử:', data));
```

---

## 🔐 Bước 3: Cập Nhật Authentication

### 3.1 Cấu Hình JWT trong Backend

Cập nhật `backend/server.js` để thêm JWT authentication:

```javascript
import jwt from 'jsonwebtoken';

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token không tìm thấy' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token không hợp lệ' });
    req.userId = user.userId;
    next();
  });
};

// Áp dụng middleware cho API mood
app.post('/api/moods', authenticateToken, async (req, res) => {
  // ... logic
});

app.get('/api/moods/:userId', authenticateToken, async (req, res) => {
  // ... logic
});
```

### 3.2 Cập Nhật Frontend Authentication

Thay thế `mood-api.js` để sử dụng token:

```javascript
const API_URL = 'http://localhost:3000';
let TOKEN = localStorage.getItem('auth_token'); // Lấy token từ localStorage

async function saveMood(moodValue, note = '') {
  try {
    const response = await fetch(`${API_URL}/api/moods`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}` // Gửi token
      },
      body: JSON.stringify({ mood: moodValue, note })
    });
    return await response.json();
  } catch (err) {
    console.error('Lỗi:', err);
    return { success: false, message: err.message };
  }
}

async function loadMoodHistory(userId) {
  try {
    const response = await fetch(`${API_URL}/api/moods/${userId}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    return (await response.json()).data || [];
  } catch (err) {
    console.error('Lỗi:', err);
    return [];
  }
}
```

### 3.3 Cập Nhật USER_ID sau khi có Auth

Khi hệ thống auth hoàn chỉnh, thay thế:

```javascript
// Cũ:
const USER_ID = 'user_001';

// Mới:
const USER_ID = getCurrentUserId(); // Từ auth system
const TOKEN = getAuthToken(); // Từ auth system

function getCurrentUserId() {
  // Lấy từ Supabase auth hoặc custom auth
  return window.currentUser?.id || 'user_001';
}

function getAuthToken() {
  // Lấy JWT token từ session
  return localStorage.getItem('auth_token') || '';
}
```

---

## 📝 Danh Sách API Endpoints

| Method | Endpoint | Mô tả | Cần Auth |
|--------|----------|-------|---------|
| POST | `/api/moods` | Lưu tâm trạng mới | ✅ |
| GET | `/api/moods/:userId` | Lấy lịch sử tâm trạng | ✅ |
| GET | `/api/moods/stats/:userId` | Lấy thống kê | ✅ |
| DELETE | `/api/moods/:id` | Xóa bản ghi tâm trạng | ✅ |

---

## 🐛 Troubleshooting

### ❌ "Lỗi kết nối MongoDB"
- Kiểm tra MONGO_URI trong `.env`
- Đảm bảo IP whitelist trong MongoDB Atlas (cho phép tất cả: 0.0.0.0/0 hoặc IP local)
- Kiểm tra username/password có chứa ký tự đặc biệt không (cần URL encode)

### ❌ "CORS error"
- CORS đã được bật trong server.js
- Nếu vẫn lỗi, cập nhật:
  ```javascript
  app.use(cors({
    origin: 'http://localhost:8080', // Frontend URL
    credentials: true
  }));
  ```

### ❌ "Cannot POST /api/moods"
- Đảm bảo server đang chạy trên port 3000
- Check log: `Server chạy tại cổng 3000`

---

## 📚 Tài Liệu Tham Khảo

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Express + MongoDB Guide](https://expressjs.com/)
- [JWT Authentication](https://jwt.io/)
- [CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
