# 🚀 Backend Setup - PeaceFlow Mood API (Complete Guide)

## ✅ Hoàn Thành

### 1. ✅ Backend Server
- **File**: `backend/server.js`
- **Status**: Chạy trên port 3000
- **Runtime**: Node.js ES Module
- **Dependencies**: express, cors, mongoose, dotenv, jsonwebtoken

### 2. ✅ API Endpoints Ready
| Method | Endpoint | Mô Tả | Status |
|--------|----------|-------|--------|
| POST | `/api/moods` | Lưu tâm trạng | ✅ |
| GET | `/api/moods/:userId` | Lấy lịch sử | ✅ |
| GET | `/api/moods/stats/:userId` | Thống kê | ✅ |
| DELETE | `/api/moods/:id` | Xóa bản ghi | ✅ |
| GET | `/health` | Health check | ✅ |

### 3. ✅ Frontend Integration
- **File 1**: `frontend/public/js/mood-api.js` (basic)
- **File 2**: `frontend/public/js/mood-api-auth.js` (with JWT)
- **Updated**: `frontend/pages/mood-checkin.html`

### 4. ✅ Documentation Created
- 📄 `API-TEST-GUIDE.md` - Complete test guide
- 📄 `POSTMAN-COLLECTION.md` - Ready-to-import collection
- 📄 `AUTHENTICATION-GUIDE.md` - Auth implementation
- 🔧 `curl-tests.sh` - Linux/Mac test script
- 🔧 `curl-tests.ps1` - Windows PowerShell script

---

## 🚀 Quick Start

### Step 1: Setup MongoDB Atlas (5 min)

```bash
# 1. Go to mongodb.com/cloud/atlas
# 2. Create account & verify email
# 3. Create "peaceflow-cluster" (Shared, Free tier)
# 4. Create database user (username/password)
# 5. Whitelist IP: 0.0.0.0/0 (for local development)
# 6. Get connection string from "Connect" > "Drivers"

# Copy into backend/.env:
MONGO_URI=mongodb+srv://username:password@peaceflow-cluster.xxxxx.mongodb.net/peaceflow
PORT=3000
JWT_SECRET=my-secret-key-change-in-production
```

### Step 2: Start Backend Server (1 min)

```bash
cd backend
npm start

# Expected output:
# ╔════════════════════════════════════════╗
# ║   🚀 PeaceFlow Backend Server          ║
# ║   Port: 3000                           ║
# ║   Status: ✅ Running                    ║
# ╚════════════════════════════════════════╝
```

### Step 3: Test API (2 min)

**Option A: PowerShell (Windows)**
```powershell
cd backend
.\curl-tests.ps1
```

**Option B: Browser DevTools (F12)**
```javascript
// Test health check
fetch('http://localhost:3000/health').then(r => r.json()).then(d => console.log(d));

// Save mood
fetch('http://localhost:3000/api/moods', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user_001', mood: 4, note: 'Test' })
}).then(r => r.json()).then(d => console.log(d));

// Get history
fetch('http://localhost:3000/api/moods/user_001').then(r => r.json()).then(d => console.log(d));
```

### Step 4: Implement Authentication (Optional, 20 min)

See `AUTHENTICATION-GUIDE.md` for detailed steps.

Quick version:
```bash
# 1. Install JWT library
npm install jsonwebtoken

# 2. Add JWT_SECRET to .env
JWT_SECRET=your-secret-key

# 3. See server.js.advanced for JWT middleware example

# 4. Update frontend/public/js/mood-api-auth.js
setAuthToken(token, userId); // After user login

# 5. Test with Postman:
# Header: Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📁 File Structure

```
backend/
├── server.js ............................ Main (Basic version)
├── server.js.advanced .................. With JWT authentication
├── package.json ......................... npm dependencies
├── .env ................................ Configuration (add MONGO_URI)
├── API-TEST-GUIDE.md ................... 📖 MongoDB + Testing guide
├── POSTMAN-COLLECTION.md ............... 📄 Import to Postman
├── AUTHENTICATION-GUIDE.md ............. 🔐 JWT/Supabase setup
├── curl-tests.ps1 ...................... 🔧 Windows test script
├── curl-tests.sh ....................... 🔧 Linux/Mac test script
└── BACKEND-SETUP.md (this file) ........ This file

frontend/
├── public/js/
│   ├── mood-api.js ..................... Basic API client
│   └── mood-api-auth.js ................ With JWT support
└── pages/mood-checkin.html ............. Updated UI
```

---

## 📊 Current Status

### 1️⃣ Server Status
```bash
npm start
# Output:
# Server chạy tại cổng 3000
# ✅ MongoDB connection established
```

### 2️⃣ API Verification
```bash
# Health check
curl http://localhost:3000/health
# {"status":"✅ Server is running","port":3000}

# Test save
curl -X POST http://localhost:3000/api/moods \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_001","mood":4}'
# {"success":true,"data":{...}}
```

### 3️⃣ Frontend Ready
```javascript
// mood-checkin.html
await saveMoodWithFallback(moodValue, note);
// - Sends to API
// - Falls back to localStorage
// - Syncs when online
```

---

## 🧪 Test Scenarios

### Test 1: Create & Retrieve
```bash
# 1. Create entry
curl -X POST http://localhost:3000/api/moods \
  -H "Content-Type: application/json" \
  -d '{"userId":"john","mood":5,"note":"Great day!","tags":["happy"]}'

# 2. Retrieve history
curl http://localhost:3000/api/moods/john

# 3. Get stats
curl http://localhost:3000/api/moods/stats/john
```

### Test 2: Error Cases
```bash
# Invalid mood (must be 1-5)
curl -X POST http://localhost:3000/api/moods \
  -H "Content-Type: application/json" \
  -d '{"userId":"john","mood":10}'
# Response: {"success":false,"message":"mood phải là số từ 1-5"}

# Missing required field
curl -X POST http://localhost:3000/api/moods \
  -H "Content-Type: application/json" \
  -d '{"userId":"john"}'
# Response: {"success":false,"message":"..."}
```

### Test 3: Offline Mode
```javascript
// Frontend automatically handles offline
const result = await saveMoodWithFallback(4, 'Test');
// If API fails: saves to localStorage
// When online: calls syncLocalMoods() automatically
```

---

## 🔐 Authentication Roadmap

### Current (Testing Mode)
- ✅ Server accepts requests without auth
- ✅ Frontend code ready for JWT (mood-api-auth.js)
- ✅ Fallback to localStorage

### To Implement (3 options)
1. **Supabase Auth** (Recommended)
   - Already configured in project
   - See AUTHENTICATION-GUIDE.md
   
2. **Custom JWT**
   - Manual login endpoint
   - See server.js.advanced
   
3. **Session-based**
   - Not recommended for SPA/API

---

## 📋 Environment Variables

### Required
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/peaceflow
PORT=3000
```

### Optional
```env
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=development
```

---

## 🚨 Common Issues

### ❌ "Cannot connect to MongoDB"
```
Error: querySrv ECONNREFUSED _mongodb._tcp.cluster.mongodb.net

Fix:
1. Check MONGO_URI in .env (copy full string from MongoDB Atlas)
2. Verify credentials (username:password with special chars URL-encoded)
3. Check IP whitelist in MongoDB Atlas (0.0.0.0/0 for dev)
4. Wait for cluster to be ready (5-10 min after creation)
```

### ❌ "CORS error from frontend"
```
Error: Access to XMLHttpRequest at 'http://localhost:3000' 
from origin 'http://localhost:8080' has been blocked by CORS policy

Fix: Already enabled in server.js
app.use(cors());
// If still issues, add origin:
// app.use(cors({ origin: 'http://localhost:8080', credentials: true }))
```

### ❌ "Port 3000 already in use"
```
Error: listen EADDRINUSE :::3000

Fix:
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

### ❌ "ReferenceError: require is not defined"
```
Error: require is not defined in ES module scope

Fix: Already fixed in server.js
// Using import instead of require
import express from 'express';
import cors from 'cors';
```

---

## 📈 Performance Tips

1. **Add indexes** to MongoDB (userId field)
2. **Limit results**: Use `?limit=30` parameter
3. **Cache stats**: Compute periodically instead of every request
4. **Batch operations**: Save multiple moods at once (TODO)
5. **Compression**: Add middleware for production

---

## 🔒 Security Checklist

- ✅ MongoDB credentials in .env (not in .gitignore for team, in .gitignore for git)
- ⏳ JWT_SECRET configured
- ✅ CORS enabled (for dev)
- ⏳ Input validation on all endpoints
- ⏳ Rate limiting (package installed, not yet configured)
- ⏳ HTTPS enabled (production only)
- ⏳ Database backup strategy
- ⏳ User authentication (TODO)

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user_001",
    "mood": 4,
    "note": "Cảm thấy khá tốt",
    "tags": ["happy"],
    "createdAt": "2025-04-27T10:30:00.000Z"
  },
  "message": "Tâm trạng lưu thành công (4/5)"
}
```

### Error Response
```json
{
  "success": false,
  "message": "mood phải là số từ 1-5"
}
```

### Stats Response
```json
{
  "success": true,
  "stats": {
    "average": 4.2,
    "total": 10,
    "highest": 5,
    "lowest": 2,
    "trend": "📈 Cải thiện",
    "lastEntry": "2025-04-27T10:00:00.000Z"
  }
}
```

---

## 🎯 Next Steps

1. ✅ **Run Backend**: `npm start` in backend/
2. ✅ **Test API**: Use PowerShell script or DevTools
3. ⏳ **Add Authentication**: Follow AUTHENTICATION-GUIDE.md
4. ⏳ **Add User Endpoints**: /api/auth/login, /api/auth/logout
5. ⏳ **Frontend Integration**: Update all pages to use API
6. ⏳ **Error Handling**: Proper error messages in UI
7. ⏳ **Rate Limiting**: Prevent spam/abuse
8. ⏳ **Deploy**: Railway, Heroku, AWS, etc.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| API-TEST-GUIDE.md | How to test API (MongoDB, cURL, Postman, DevTools) |
| POSTMAN-COLLECTION.md | Postman collection for easy testing |
| AUTHENTICATION-GUIDE.md | JWT/Supabase authentication setup |
| curl-tests.ps1 | Windows PowerShell test script |
| curl-tests.sh | Linux/Mac bash test script |
| server.js.advanced | Server with JWT middleware example |

---

## 💬 Questions?

### For API questions
- See: API-TEST-GUIDE.md
- Test: Use PowerShell script or Postman

### For authentication questions
- See: AUTHENTICATION-GUIDE.md
- Example: server.js.advanced

### For frontend integration
- See: mood-api.js and mood-api-auth.js
- Example: mood-checkin.html submitCheckin()

---

**Last Updated**: 2025-04-27  
**Status**: Backend Ready ✅  
**Next Phase**: Authentication Implementation ⏳
