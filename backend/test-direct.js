// Test kết nối trực tiếp không phụ thuộc vào node_modules
const SUPABASE_URL = 'https://ccymyblzvdyvemcnuwmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FMh8PYXvqdd_7uGuahgABw_XKkMndUd';

async function testDirect() {
    console.log('--- Đang kiểm tra kết nối trực tiếp đến Supabase ---');
    const url = `${SUPABASE_URL}/rest/v1/`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ KẾT NỐI THÀNH CÔNG!');
            console.log('Dự án Supabase của bạn đang hoạt động bình thường.');
            console.log('Các bảng công khai tìm thấy:', Object.keys(data.definitions || {}).join(', ') || 'Không có bảng public nào (nhưng kết nối vẫn OK)');
        } else {
            console.error('❌ KẾT NỐI THẤT BẠI!');
            console.error('Mã lỗi:', response.status);
            const errText = await response.text();
            console.error('Chi tiết:', errText);
        }
    } catch (e) {
        console.error('❌ LỖI HỆ THỐNG:', e.message);
    }
}

testDirect();
