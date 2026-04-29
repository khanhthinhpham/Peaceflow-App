# 🔐 Hướng Dẫn Authentication Integration

## 📖 Overview

Hệ thống xác thực dự kiến sử dụng **JWT (JSON Web Tokens)** để bảo mật API Mood Tracking. Có 3 cách triển khai:

1. **Supabase Auth** (Hiện đã sử dụng) - Khuyên dùng
2. **Custom JWT** - Nếu không dùng Supabase
3. **Session-based** (Traditional) - Không khuyên cho API

---

## 🅰️ Phương án 1: Supabase Auth (Khuyên Dùng)

### Ưu điểm
- ✅ Đã setup sẵn trong project
- ✅ Free tier đủ dùng
- ✅ Bảo mật cấp production
- ✅ Hỗ trợ social login (Google, GitHub, etc.)

### Cấu Hình Backend

#### Bước 1: Cài Supabase SDK cho Node.js
```bash
cd backend
npm install @supabase/supabase-js
```

#### Bước 2: Cập nhật backend/.env
```env
MONGO_URI=mongodb+srv://username:password@cluster...
PORT=3000
JWT_SECRET=your-jwt-secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

#### Bước 3: Cập nhật server.js để verify JWT từ Supabase

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware xác thực Supabase JWT
const authenticateSupabase = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) throw new Error('Token không tìm thấy');
    
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    
    req.user = data.user;
    req.userId = data.user.id;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
};

// Áp dụng middleware
app.post('/api/moods', authenticateSupabase, async (req, res) => {
  // userId sẽ là Supabase user ID
  const userId = req.userId;
  // ... rest of logic
});
```

### Cấu Hình Frontend

#### Bước 1: Khi user đăng nhập
```javascript
// Trong login.html hoặc authentication module
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (!error) {
    const token = data.session.access_token;
    const userId = data.user.id;
    
    // Lưu token
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user_id', userId);
    
    // Cập nhật Mood API
    setAuthToken(token, userId);
    console.log('✅ User đăng nhập thành công');
  }
}
```

#### Bước 2: Sử dụng Mood API với auth
```javascript
// Sử dụng mood-api-auth.js (đã tạo)
setAuthToken(token, userId); // Gọi sau khi đăng nhập
await saveMood(4, 'Cảm thấy tốt');
```

#### Bước 3: Khi user đăng xuất
```javascript
async function handleLogout() {
  await supabase.auth.signOut();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user_id');
  clearAuth();
  console.log('✅ User đã đăng xuất');
}
```

---

## 🅱️ Phương án 2: Custom JWT (Không dùng Supabase)

### Ưu điểm
- ✅ Full control
- ✅ Đơn giản, không phụ thuộc bên ngoài

### Hạn chế
- ❌ Cần tự manage user database
- ❌ Cần tự implement security measures

### Cấu Hình Backend

#### Bước 1: Tạo User Schema
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String, // Nên hash với bcrypt
  name: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);
```

#### Bước 2: Tạo Login Endpoint
```javascript
import jwt from 'jsonwebtoken';

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'User không tồn tại' });
    }
    
    // TODO: Compare password với hash
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### Bước 3: Verify JWT Middleware
```javascript
const verifyJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token không tìm thấy' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ' });
    }
    req.userId = decoded.userId;
    next();
  });
};

app.post('/api/moods', verifyJWT, async (req, res) => {
  // userId sẽ là từ JWT
  // ...
});
```

### Cấu Hình Frontend
```javascript
// Login
async function login(email, password) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await res.json();
  if (data.token) {
    setAuthToken(data.token, data.user.id);
  }
}
```

---

## 🔄 Phương án 3: Session-based (Không khuyên)

### Ưu điểm
- ✅ Đơn giản
- ✅ Tự động handle logout

### Hạn chế
- ❌ Không tốt cho mobile/SPA
- ❌ CORS phức tạp
- ❌ Scalability issues

### Không khuyên cho dự án này vì PeaceFlow là SPA + Mobile-friendly

---

## 📋 Checklist Triển Khai

### Backend
- [ ] Cài đặt JWT library (jsonwebtoken)
- [ ] Thêm JWT_SECRET vào .env
- [ ] Tạo authenticate middleware
- [ ] Áp dụng middleware cho các endpoint cần bảo mật
- [ ] Test API với token

### Frontend
- [ ] Import mood-api-auth.js thay vì mood-api.js
- [ ] Khi user đăng nhập: gọi `setAuthToken(token, userId)`
- [ ] Khi user đăng xuất: gọi `clearAuth()`
- [ ] Sử dụng `saveMood()` - nó sẽ tự động gửi token
- [ ] Implement offline mode: `syncLocalMoods()` khi online

---

## 🧪 Test Authentication

### Test JWT trong Postman

1. Login để lấy token:
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

2. Copy token từ response

3. Ghi vào environment variable `jwt_token`

4. Test API mood với JWT:
```json
GET /api/moods/{{user_id}}
Headers: Authorization: Bearer {{jwt_token}}
```

### Test JWT trong Browser Console
```javascript
// Sau khi user đăng nhập
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// Test API
fetch('http://localhost:3000/api/moods/user_123', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## 🚀 Tiếp Theo

1. **Chọn phương án auth** (khuyên Supabase)
2. **Implement backend** - middleware verify JWT
3. **Implement frontend** - gọi setAuthToken() khi login
4. **Test complete flow** - login → save mood → logout
5. **Deploy** - đảm bảo JWT_SECRET an toàn trên server

---

## 📚 Tài Liệu

- [JWT.io](https://jwt.io/) - JWT tutorial
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [MongoDB Sessions](https://docs.mongodb.com/manual/reference/server-sessions/)

