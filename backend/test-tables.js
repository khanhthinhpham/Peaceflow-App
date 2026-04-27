// Test kết nối bằng cách query một bảng cụ thể
const SUPABASE_URL = 'https://ccymyblzvdyvemcnuwmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FMh8PYXvqdd_7uGuahgABw_XKkMndUd';

async function testTable(tableName) {
    console.log(`--- Đang kiểm tra bảng: ${tableName} ---`);
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            console.log(`✅ Kết nối đến bảng [${tableName}] THÀNH CÔNG!`);
            return true;
        } else {
            const err = await response.json();
            console.log(`ℹ️ Bảng [${tableName}]: ${response.status} - ${err.message}`);
            return false;
        }
    } catch (e) {
        console.error(`❌ Lỗi khi gọi bảng ${tableName}:`, e.message);
        return false;
    }
}

async function runTests() {
    const tables = ['profiles', 'users', 'tasks', 'mood_logs'];
    for (const t of tables) {
        const success = await testTable(t);
        if (success) {
            console.log('\n=> Kết luận: Supabase đã được liên kết chính xác với các thông tin trong dự án!');
            return;
        }
    }
    console.log('\n=> Kết luận: Không tìm thấy bảng nào khả dụng, nhưng nếu không có lỗi 401 thì Key vẫn đúng.');
}

runTests();
