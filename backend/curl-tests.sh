#!/bin/bash
# 🧪 PeaceFlow Mood API - cURL Test Examples
# Sử dụng: bash curl-tests.sh

API_URL="http://localhost:3000"
USER_ID="user_001"
JWT_TOKEN="your-jwt-token-here"  # Thay bằng token thực nếu cần

echo "🚀 PeaceFlow Mood API - cURL Test Suite"
echo "=========================================="
echo ""

# ===== 1. HEALTH CHECK =====
echo "1️⃣  HEALTH CHECK"
echo "Command:"
echo "curl $API_URL/health"
echo ""
curl -s $API_URL/health | jq .
echo -e "\n---\n"

# ===== 2. POST - Lưu tâm trạng (không auth) =====
echo "2️⃣  POST - Lưu tâm trạng (không auth)"
echo "Command:"
echo "curl -X POST $API_URL/api/moods ..."
echo ""
curl -s -X POST $API_URL/api/moods \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "mood": 4,
    "note": "Test từ cURL",
    "tags": ["test", "api"]
  }' | jq .
echo -e "\n---\n"

# ===== 3. GET - Lấy lịch sử (30 ngày gần nhất) =====
echo "3️⃣  GET - Lấy lịch sử tâm trạng"
echo "Command:"
echo "curl $API_URL/api/moods/$USER_ID"
echo ""
curl -s $API_URL/api/moods/$USER_ID | jq .
echo -e "\n---\n"

# ===== 4. GET - Lấy thống kê =====
echo "4️⃣  GET - Thống kê tâm trạng"
echo "Command:"
echo "curl $API_URL/api/moods/stats/$USER_ID"
echo ""
curl -s $API_URL/api/moods/stats/$USER_ID | jq .
echo -e "\n---\n"

# ===== 5. POST - Lưu tâm trạng (với JWT) =====
echo "5️⃣  POST - Lưu tâm trạng (có JWT token)"
echo "Command:"
echo 'curl -X POST $API_URL/api/moods \
  -H "Authorization: Bearer $JWT_TOKEN" ...'
echo ""
curl -s -X POST $API_URL/api/moods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mood": 5,
    "note": "Ngày tuyệt vời!",
    "tags": ["amazing"]
  }' | jq .
echo -e "\n---\n"

# ===== 6. Lấy limit 10 bản ghi =====
echo "6️⃣  GET - Lấy 10 bản ghi gần nhất"
echo "Command:"
echo "curl '$API_URL/api/moods/$USER_ID?limit=10'"
echo ""
curl -s "$API_URL/api/moods/$USER_ID?limit=10" | jq .
echo -e "\n---\n"

# ===== 7. Test error cases =====
echo "7️⃣  TEST - Invalid mood (phải là 1-5)"
echo "Command:"
echo "curl -X POST $API_URL/api/moods ..."
echo ""
curl -s -X POST $API_URL/api/moods \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "mood": 10,
    "note": "Invalid mood"
  }' | jq .
echo -e "\n---\n"

# ===== 8. Test missing userId =====
echo "8️⃣  TEST - Missing userId"
echo "Command:"
echo "curl -X POST $API_URL/api/moods ..."
echo ""
curl -s -X POST $API_URL/api/moods \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 3,
    "note": "No userId"
  }' | jq .
echo -e "\n---\n"

echo "✅ Test suite hoàn thành!"
echo ""
echo "📝 Ghi chú:"
echo "  - Thay $USER_ID bằng user ID thực tế"
echo "  - Thay $JWT_TOKEN bằng token JWT thực nếu cần test auth"
echo "  - Cần cài jq để format JSON (apt install jq hoặc brew install jq)"
echo "  - Nếu không có jq, bỏ '| jq .'"
