import { apiClient } from './api-client.js';

export const profileManager = {
    // Biến lưu trạng thái hiện tại
    currentData: {
        displayName: '',
        email: '',
        phone: '',
        gender: '',
        ageGroup: '',
        tagline: '',
        bio: ''
    },

    async init() {
        console.log("🚀 Bắt đầu tải dữ liệu Profile...");
        try {
            // Cố gắng gọi API
            const [userRes, profileRes] = await Promise.all([
                apiClient.get('/me'),
                apiClient.get('/profile')
            ]);
            
            this.currentData = {
                displayName: userRes.display_name || userRes.full_name || '',
                email: userRes.email || '',
                phone: userRes.phone || '',
                gender: this.mapGenderToDisplay(userRes.gender),
                tagline: profileRes.onboarding_answers?.tagline || '',
                bio: profileRes.onboarding_answers?.bio || '',
                ageGroup: profileRes.onboarding_answers?.ageGroup || ''
            };
            console.log("✅ Tải từ API thành công");
        } catch (error) {
            console.warn("⚠️ API lỗi hoặc chưa đăng nhập. Đang dùng LocalStorage dự phòng...");
            // Fallback: Lấy từ LocalStorage nếu API lỗi (chạy offline/môi trường tĩnh)
            const localData = JSON.parse(localStorage.getItem('peaceflow_profile_data') || '{}');
            this.currentData = { ...this.currentData, ...localData };
        }

        this.fillFormAndUI();
    },

    // Điền dữ liệu vào Form và cập nhật DOM
    fillFormAndUI() {
        const data = this.currentData;

        // 1. Điền vào các Input
        const inputs = ['displayName', 'email', 'phone', 'tagline', 'bio', 'ageGroup', 'gender'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el && data[id]) el.value = data[id];
        });

        // 2. Cập nhật DOM (Tên và Khẩu hiệu hiển thị trên giao diện)
        const displayName = data.displayName || "Người dùng";
        
        // Cập nhật tên ở Hero section
        document.querySelectorAll('.ph-name').forEach(el => el.innerText = displayName);
        
        // Cập nhật tên ở Sidebar góc dưới trái
        document.querySelectorAll('.user-name').forEach(el => el.innerText = displayName);
        
        // Cập nhật Tagline
        if (data.tagline) {
            document.querySelectorAll('.ph-tagline').forEach(el => el.innerText = data.tagline);
        }
    },

    async saveProfile() {
        console.log("💾 Đang lưu dữ liệu...");
        const btn = document.querySelector('.btn-primary[onclick*="saveProfile"]');
        if (btn) btn.innerHTML = '⌛ Đang xử lý...';

        try {
            // BƯỚC 1: THU THẬP DỮ LIỆU CHÍNH XÁC
            const newData = {
                displayName: document.getElementById('displayName')?.value?.trim(),
                phone: document.getElementById('phone')?.value?.trim(),
                gender: document.getElementById('gender')?.value,
                ageGroup: document.getElementById('ageGroup')?.value,
                tagline: document.getElementById('tagline')?.value?.trim(),
                bio: document.getElementById('bio')?.value?.trim()
            };

            // Lưu trạng thái vào biến cục bộ
            this.currentData = { ...this.currentData, ...newData };

            // BƯỚC 2: GỌI API & LOCALSTORAGE
            // Luôn lưu dự phòng vào LocalStorage phòng khi API chết
            localStorage.setItem('peaceflow_profile_data', JSON.stringify(this.currentData));

            try {
                // Tách ra thành Payload theo chuẩn Backend của bạn
                const userPayload = {
                    display_name: newData.displayName,
                    phone: newData.phone,
                    gender: this.mapDisplayToGender(newData.gender)
                };
                const profilePayload = {
                    onboarding_answers: {
                        tagline: newData.tagline,
                        bio: newData.bio,
                        ageGroup: newData.ageGroup
                    }
                };

                // Bắn API
                await Promise.all([
                    apiClient.put('/me', userPayload),
                    apiClient.put('/profile', profilePayload)
                ]);
            } catch (apiError) {
                console.warn("⚠️ API không phản hồi, đã lưu offline vào LocalStorage.");
                // Bỏ qua lỗi API để người dùng vẫn thấy giao diện hoạt động
            }

            // BƯỚC 3: CẬP NHẬT LẠI DOM TRỰC TIẾP (KHÔNG CẦN F5)
            this.fillFormAndUI();

            // BƯỚC 4: SYNC TÊN MỚI VÀO LOCALSTORAGE → CÁC TRANG KHÁC SẼ LẤY ĐÚNG
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    user.display_name = newData.displayName || user.display_name;
                    user.full_name = newData.displayName || user.full_name;
                    localStorage.setItem('user', JSON.stringify(user));
                    // Trigger UserSync để cập nhật sidebar + header ngay lập tức
                    window.dispatchEvent(new Event('user-profile-updated'));
                    if (window.updateGlobalUI) window.updateGlobalUI();
                } catch (e) { /* ignore parse errors */ }
            }
            
            // Hiển thị thông báo thành công
            this.showToast('✅ Đã lưu thay đổi thành công!', 'success');

        } catch (error) {
            console.error('❌ Lỗi hệ thống:', error);
            this.showToast('❌ Có lỗi xảy ra, vui lòng thử lại.', 'error');
        } finally {
            if (btn) btn.innerHTML = '💾 Lưu thay đổi';
        }
    },

    mapGenderToDisplay(gender) {
        const mapping = { 'male': 'Nam', 'female': 'Nữ', 'other': 'Khác' };
        return mapping[gender] || 'Không muốn tiết lộ';
    },

    mapDisplayToGender(display) {
        const mapping = { 'Nam': 'male', 'Nữ': 'female', 'Khác': 'other' };
        return mapping[display] || 'prefer_not_to_say';
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastText = document.getElementById('toastText');
        if (toast && toastText) {
            toastText.innerText = message;
            toast.style.display = 'flex';
            toast.className = `toast show ${type}`;
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => { toast.style.display = 'none'; }, 500);
            }, 3000);
        } else {
            alert(message); // Dự phòng nếu HTML thiếu thẻ toast
        }
    },

    resetForm() {
        this.fillFormAndUI();
        this.showToast('🔄 Đã khôi phục dữ liệu gốc', 'info');
    }
};

// Gắn hàm khởi tạo khi trang tải xong
document.addEventListener('DOMContentLoaded', () => profileManager.init());

// Expose functions to global scope for HTML onclick handlers
window.saveProfile = () => profileManager.saveProfile();
window.resetForm = () => profileManager.resetForm();
