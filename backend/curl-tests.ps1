# 🧪 PeaceFlow Mood API - PowerShell Test Examples
# Run: .\curl-tests.ps1

$API_URL = "http://localhost:3000"
$USER_ID = "user_001"
$JWT_TOKEN = "your-jwt-token-here"

Write-Host "🚀 PeaceFlow Mood API - PowerShell Test Suite" -ForegroundColor Cyan
Write-Host "=============================================`n" -ForegroundColor Cyan

# ===== Helper Function =====
function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body,
        [string]$Token
    )
    
    Write-Host "$Name" -ForegroundColor Green
    Write-Host "Endpoint: $Method $Endpoint" -ForegroundColor Yellow
    
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    if ($Token) {
        $headers['Authorization'] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri $Endpoint `
                -Method $Method `
                -Headers $headers `
                -Body ($Body | ConvertTo-Json) `
                -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Endpoint `
                -Method $Method `
                -Headers $headers `
                -ErrorAction Stop
        }
        
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        $json = $response.Content | ConvertFrom-Json
        Write-Host ($json | ConvertTo-Json -Depth 3) -ForegroundColor White
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n---`n" -ForegroundColor DarkGray
}

# ===== 1. HEALTH CHECK =====
Test-API `
    -Name "1️⃣  HEALTH CHECK" `
    -Method GET `
    -Endpoint "$API_URL/health"

# ===== 2. POST - Lưu tâm trạng (không auth) =====
$body = @{
    userId = $USER_ID
    mood = 4
    note = "Test từ PowerShell"
    tags = @("test", "api")
}

Test-API `
    -Name "2️⃣  POST - Lưu tâm trạng (không auth)" `
    -Method POST `
    -Endpoint "$API_URL/api/moods" `
    -Body $body

# ===== 3. GET - Lấy lịch sử =====
Test-API `
    -Name "3️⃣  GET - Lấy lịch sử tâm trạng" `
    -Method GET `
    -Endpoint "$API_URL/api/moods/$USER_ID"

# ===== 4. GET - Lấy thống kê =====
Test-API `
    -Name "4️⃣  GET - Thống kê tâm trạng" `
    -Method GET `
    -Endpoint "$API_URL/api/moods/stats/$USER_ID"

# ===== 5. POST - Với JWT token =====
$bodyWithJWT = @{
    mood = 5
    note = "Ngày tuyệt vời!"
    tags = @("amazing")
}

Test-API `
    -Name "5️⃣  POST - Lưu tâm trạng (có JWT token)" `
    -Method POST `
    -Endpoint "$API_URL/api/moods" `
    -Body $bodyWithJWT `
    -Token $JWT_TOKEN

# ===== 6. GET - Với limit =====
Test-API `
    -Name "6️⃣  GET - Lấy 10 bản ghi gần nhất" `
    -Method GET `
    -Endpoint "$API_URL/api/moods/$USER_ID`?limit=10"

# ===== 7. TEST - Invalid mood =====
$invalidBody = @{
    userId = $USER_ID
    mood = 10
    note = "Invalid mood"
}

Test-API `
    -Name "7️⃣  TEST - Invalid mood (phải là 1-5)" `
    -Method POST `
    -Endpoint "$API_URL/api/moods" `
    -Body $invalidBody

# ===== 8. TEST - Missing userId =====
$missingUserBody = @{
    mood = 3
    note = "No userId"
}

Test-API `
    -Name "8️⃣  TEST - Missing userId" `
    -Method POST `
    -Endpoint "$API_URL/api/moods" `
    -Body $missingUserBody

Write-Host "✅ Test suite hoàn thành!" -ForegroundColor Green
Write-Host "`n📝 Ghi chú:" -ForegroundColor Yellow
Write-Host "  - Thay `$USER_ID bằng user ID thực tế" -ForegroundColor Gray
Write-Host "  - Thay `$JWT_TOKEN bằng token JWT thực nếu cần test auth" -ForegroundColor Gray
Write-Host "  - Đảm bảo server chạy tại http://localhost:3000" -ForegroundColor Gray
