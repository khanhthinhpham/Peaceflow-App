const supabaseFetch = require('./supabase-fetch');

async function checkConnection() {
  console.log('--- Đang kiểm tra kết nối Supabase ---');
  try {
    // Thử lấy danh sách bảng (hoặc một bảng bất kỳ để test key)
    // Supabase REST API không cho phép lấy danh sách bảng qua /rest/v1/ trực tiếp nếu không có quyền admin
    // Nhưng ta có thể thử truy vấn một bảng phổ biến hoặc đơn giản là gọi endpoint gốc
    
    const result = await supabaseFetch('', { query: '' }); 
    // Endpoint gốc thường trả về danh sách các bảng công khai
    
    console.log('✅ Kết nối thành công!');
    console.log('Phản hồi từ Supabase:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ Kết nối thất bại!');
    console.error('Lỗi:', error.message);
    
    if (error.message.includes('fetch is not defined')) {
        console.log('Gợi ý: Bạn đang dùng phiên bản Node cũ. Hãy đảm bảo bạn dùng Node 18 trở lên.');
    }
  }
}

checkConnection();
