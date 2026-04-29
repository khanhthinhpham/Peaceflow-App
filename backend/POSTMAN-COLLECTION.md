# 🧪 Postman Collection - PeaceFlow Mood API

## Cara Import Collection

1. Mở Postman
2. Nhấn "Import" (góc trái)
3. Chọn "Paste Raw Text"
4. Copy & Paste nội dung dưới đây

---

```json
{
  "info": {
    "name": "PeaceFlow Mood API",
    "description": "API để lưu và truy vấn tâm trạng của người dùng",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["health"]
        },
        "description": "Kiểm tra xem server có chạy không"
      },
      "response": []
    },
    {
      "name": "2. POST - Lưu tâm trạng (không auth)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{{\n  \"userId\": \"user_001\",\n  \"mood\": 4,\n  \"note\": \"Hôm nay tôi cảm thấy khá tốt\",\n  \"tags\": [\"happy\", \"productive\"]\n}}"
        },
        "url": {
          "raw": "http://localhost:3000/api/moods",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "moods"]
        },
        "description": "Lưu bản ghi tâm trạng mới"
      },
      "response": []
    },
    {
      "name": "3. GET - Lấy lịch sử tâm trạng",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/moods/user_001?limit=30",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "moods", "user_001"],
          "query": [
            {
              "key": "limit",
              "value": "30",
              "description": "Số bản ghi tối đa (mặc định 30)"
            }
          ]
        },
        "description": "Lấy lịch sử tâm trạng của một user"
      },
      "response": []
    },
    {
      "name": "4. GET - Thống kê tâm trạng",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/moods/stats/user_001",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "moods", "stats", "user_001"]
        },
        "description": "Lấy thống kê (trung bình, xu hướng, etc.)"
      },
      "response": []
    },
    {
      "name": "5. DELETE - Xóa bản ghi tâm trạng",
      "request": {
        "method": "DELETE",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/moods/REPLACE_WITH_MOOD_ID",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "moods", "REPLACE_WITH_MOOD_ID"]
        },
        "description": "Xóa một bản ghi tâm trạng (thay REPLACE_WITH_MOOD_ID bằng _id thực)"
      },
      "response": []
    },
    {
      "name": "6. POST - Lưu tâm trạng (có JWT token)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{{\n  \"mood\": 5,\n  \"note\": \"Ngày tuyệt vời!\",\n  \"tags\": [\"amazing\", \"blessed\"]\n}}"
        },
        "url": {
          "raw": "http://localhost:3000/api/moods",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "moods"]
        },
        "description": "Lưu tâm trạng với JWT authentication ({{jwt_token}} là variable)"
      },
      "response": []
    }
  ],
  "variable": [
    {
      "key": "jwt_token",
      "value": "your-jwt-token-here",
      "type": "string"
    }
  ]
}
```

---

## Cách Sử Dụng

### Bước 1: Setup Environment Variable
Nếu sử dụng JWT token:
1. Nhấn tab "Environments" (trái sidebar)
2. Click "+" để tạo environment mới
3. Thêm variable:
   ```
   jwt_token: your-actual-jwt-token
   ```

### Bước 2: Test Endpoints
1. Chọn request từ collection
2. Nhấn "Send"
3. Xem response ở tab "Body"

### Bước 3: Sử dụng Response Data
Ví dụ lấy ID từ response:
1. Tab "Tests" trong request
2. Thêm:
   ```javascript
   if (pm.response.code === 201) {
     var jsonData = pm.response.json();
     pm.environment.set("mood_id", jsonData.data._id);
   }
   ```

---

## Test Scenarios

### Scenario 1: Tạo và Lấy Dữ liệu
1. POST - Lưu tâm trạng (request 2)
2. GET - Lấy lịch sử (request 3)
3. GET - Xem thống kê (request 4)

### Scenario 2: JWT Authentication
1. Nhận JWT token từ auth endpoint (chưa implement)
2. Đặt token vào environment variable
3. Test request 6 (POST với JWT)

### Scenario 3: Error Handling
- Test với mood=0 hoặc mood=6 (invalid)
- Test với userId không tồn tại
- Test với token không hợp lệ

---

## Response Format

### Success (200-201)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user_001",
    "mood": 4,
    "note": "Hôm nay tôi cảm thấy khá tốt",
    "tags": ["happy", "productive"],
    "createdAt": "2025-04-27T10:30:00.000Z"
  },
  "message": "Tâm trạng lưu thành công (4/5)"
}
```

### Error (400/500)
```json
{
  "success": false,
  "message": "mood phải là số từ 1-5"
}
```

---

## Troubleshooting

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|----------|
| Cannot GET /api/moods | Endpoint không đúng | Kiểm tra URL |
| 500 Internal Error | MongoDB không kết nối | Cấu hình MONGO_URI |
| 401 Unauthorized | Token không hợp lệ | Kiểm tra JWT token |
| CORS Error | Frontend URL không whitelist | Cấu hình CORS |

