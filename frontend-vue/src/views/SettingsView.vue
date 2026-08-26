<template>
  <main class="main-content settings-page" style="margin-left: 0;">
    <div class="breadcrumb">
      <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
      <span>⚙️ Cài đặt</span>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-size:1.5rem;font-weight:800;">⚙️ Cài Đặt</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);">Tùy chỉnh PeaceFlow theo cách của bạn 🌿</div>
      </div>
      <button class="btn-primary" @click="saveAllSettings">💾 Lưu tất cả</button>
    </div>

    <div class="settings-layout">
      <!-- LEFT: Settings Nav -->
      <div class="settings-nav">
        <div class="paper-card sn-card">
          <a class="sn-item" :class="{ active: currentSection === 'notifications' }" href="#" @click.prevent="switchSection('notifications')"><span class="sni">🔔</span> Thông báo</a>
          <a class="sn-item" :class="{ active: currentSection === 'appearance' }" href="#" @click.prevent="switchSection('appearance')"><span class="sni">🎨</span> Giao diện</a>
          <a class="sn-item" :class="{ active: currentSection === 'checkin' }" href="#" @click.prevent="switchSection('checkin')"><span class="sni">💭</span> Check-in</a>
          <a class="sn-item" :class="{ active: currentSection === 'ai' }" href="#" @click.prevent="switchSection('ai')"><span class="sni">🐱</span> PeaceCat AI</a>
          <div class="sn-divider"></div>
          <a class="sn-item" :class="{ active: currentSection === 'devices' }" href="#" @click.prevent="switchSection('devices')"><span class="sni">📱</span> Thiết bị</a>
          <a class="sn-item" :class="{ active: currentSection === 'privacy' }" href="#" @click.prevent="switchSection('privacy')"><span class="sni">🔒</span> Quyền riêng tư</a>
          <a class="sn-item" :class="{ active: currentSection === 'security' }" href="#" @click.prevent="switchSection('security')"><span class="sni">🛡️</span> Bảo mật</a>
          <div class="sn-divider"></div>
          <a class="sn-item" :class="{ active: currentSection === 'data' }" href="#" @click.prevent="switchSection('data')"><span class="sni">📦</span> Dữ liệu</a>
          <a class="sn-item" :class="{ active: currentSection === 'about' }" href="#" @click.prevent="switchSection('about')"><span class="sni">ℹ️</span> Về PeaceFlow</a>
          <div class="sn-divider"></div>
          <a class="sn-item" :class="{ active: currentSection === 'danger' }" href="#" style="color:var(--coral);" @click.prevent="switchSection('danger')"><span class="sni">⚠️</span> Vùng nguy hiểm</a>
        </div>
      </div>

      <!-- RIGHT: Settings Content -->
      <div>
        <!-- NOTIFICATIONS -->
        <div class="settings-section" :class="{ active: currentSection === 'notifications' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--peach-light);">🔔</div>
              <div>
                <div class="sc-title">Thông báo</div>
                <div class="sc-subtitle">Kiểm soát khi nào và loại thông báo nào bạn nhận</div>
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">Bật thông báo</div>
                <div class="tr-desc">Cho phép PeaceFlow gửi thông báo đến thiết bị của bạn</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.notifMaster" @change="EventLogger.log('settings', 'notif:master:toggle')"><span class="toggle-slider"></span></label>
            </div>
            <div id="notif-sub-settings" :style="{ opacity: form.notifMaster ? '1' : '0.45' }">
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">🌅 Nhắc check-in buổi sáng</div>
                  <div class="tr-desc">Nhắc nhở check-in tâm trạng khi bắt đầu ngày mới</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifMorning" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="time-row">
                <div class="tr-left"><div class="tr-title">⏰ Giờ nhắc buổi sáng</div></div>
                <input type="time" class="time-input" v-model="form.notifMorningTime" :disabled="!form.notifMaster">
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">🌙 Nhắc check-in buổi tối</div>
                  <div class="tr-desc">Nhắc nhở check-in tâm trạng trước khi ngủ</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifEvening" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="time-row">
                <div class="tr-left"><div class="tr-title">⏰ Giờ nhắc buổi tối</div></div>
                <input type="time" class="time-input" v-model="form.notifEveningTime" :disabled="!form.notifMaster">
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">🎮 Nhắc nhiệm vụ hàng ngày</div>
                  <div class="tr-desc">Gợi ý nhiệm vụ phù hợp với tâm trạng hiện tại</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifTasks" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">🔥 Nhắc giữ streak</div>
                  <div class="tr-desc">Thông báo khi bạn sắp mất chuỗi hoạt động liên tục</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifStreak" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">🏅 Thông báo thành tích</div>
                  <div class="tr-desc">Khi bạn đạt huy hiệu mới hoặc lên cấp độ</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifAchievements" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">💡 Insight hàng tuần</div>
                  <div class="tr-desc">Phân tích tâm trạng và gợi ý cải thiện mỗi tuần</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifInsights" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">🩺 Cập nhật từ chuyên gia</div>
                  <div class="tr-desc">Khi chuyên gia gửi nhiệm vụ hoặc tin nhắn mới</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifExpert" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">👥 Hoạt động cộng đồng</div>
                  <div class="tr-desc">Khi có người phản hồi bài viết của bạn</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifCommunity" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
            </div>
            <div style="margin-top:14px;padding:12px 14px;background:var(--sky-light);border:1.5px solid var(--sky);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">
              💡 PeaceFlow tối đa <strong>2-3 thông báo/ngày</strong> — không bao giờ spam hay gây áp lực cho bạn.
            </div>
          </div>
        </div>

        <!-- APPEARANCE -->
        <div class="settings-section" :class="{ active: currentSection === 'appearance' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--lavender-light);">🎨</div>
              <div>
                <div class="sc-title">Giao diện</div>
                <div class="sc-subtitle">Tùy chỉnh màu sắc, font chữ và hiệu ứng</div>
              </div>
            </div>
            <div class="sr-left" style="margin-bottom:8px;">
              <div class="sr-title">🌈 Chủ đề màu sắc</div>
              <div class="sr-desc">Chọn giao diện phù hợp với tâm trạng của bạn</div>
            </div>
            <div class="theme-grid">
              <div class="theme-option" :class="{ selected: currentTheme === 'paper' }" @click="selectTheme('paper')">
                <div class="to-preview" style="background:linear-gradient(135deg,#FFF8F0,#A8D5BA);"></div>
                <div class="to-name">🌿 Paper Flow</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'ocean' }" @click="selectTheme('ocean')">
                <div class="to-preview" style="background:linear-gradient(135deg,#E8F4FD,#74B9FF);"></div>
                <div class="to-name">🌊 Đại Dương</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'sunset' }" @click="selectTheme('sunset')">
                <div class="to-preview" style="background:linear-gradient(135deg,#FFF3E0,#FF8B8B);"></div>
                <div class="to-name">🌅 Hoàng Hôn</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'forest' }" @click="selectTheme('forest')">
                <div class="to-preview" style="background:linear-gradient(135deg,#E8F5E9,#2E7D32);"></div>
                <div class="to-name">🌲 Rừng Xanh</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'lavender' }" @click="selectTheme('lavender')">
                <div class="to-preview" style="background:linear-gradient(135deg,#F3E5F5,#9C27B0);"></div>
                <div class="to-name">💜 Oải Hương</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'dark' }" style="opacity:0.5;" @click="selectTheme('dark')">
                <div class="to-preview" style="background:linear-gradient(135deg,#263238,#546E7A);"></div>
                <div class="to-name">🌙 Tối (Sắp ra)</div>
              </div>
            </div>
            <div style="margin-top:16px;">
              <div class="sr-left" style="margin-bottom:8px;">
                <div class="sr-title">🔤 Cỡ chữ</div>
              </div>
              <div class="font-size-row">
                <button class="fs-btn" :class="{ selected: currentFontSize === 'small' }" style="font-size:0.72rem;" @click="selectFontSize('small')">Nhỏ</button>
                <button class="fs-btn" :class="{ selected: currentFontSize === 'medium' }" style="font-size:0.85rem;" @click="selectFontSize('medium')">Vừa</button>
                <button class="fs-btn" :class="{ selected: currentFontSize === 'large' }" style="font-size:1rem;" @click="selectFontSize('large')">Lớn</button>
              </div>
            </div>
            <div style="margin-top:16px;">
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">✨ Hiệu ứng animation</div>
                  <div class="tr-desc">Bật/tắt các hiệu ứng chuyển động trong ứng dụng</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.appearanceAnimations"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">🎵 Âm thanh nền</div>
                  <div class="tr-desc">Nhạc thiền và âm thanh tự nhiên trong bài tập</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.appearanceSounds"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">📳 Rung phản hồi</div>
                  <div class="tr-desc">Rung nhẹ khi hoàn thành nhiệm vụ hoặc đạt thành tích</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.appearanceHaptics"><span class="toggle-slider"></span></label>
              </div>
              <div class="select-row">
                <div class="sr-left"><div class="sr-title">🌐 Ngôn ngữ</div></div>
                <select class="form-select" v-model="form.appearanceLanguage">
                  <option>🇻🇳 Tiếng Việt</option>
                  <option>🇬🇧 English</option>
                </select>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('appearance')">💾 Lưu giao diện</button>
            </div>
          </div>
        </div>

        <!-- CHECK-IN -->
        <div class="settings-section" :class="{ active: currentSection === 'checkin' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--mint-light);">💭</div>
              <div>
                <div class="sc-title">Check-in tâm trạng</div>
                <div class="sc-subtitle">Tùy chỉnh cách bạn theo dõi tâm trạng hàng ngày</div>
              </div>
            </div>
            <div class="select-row">
              <div class="sr-left">
                <div class="sr-title">📋 Phương thức check-in mặc định</div>
                <div class="sr-desc">Cách bạn muốn check-in tâm trạng chủ yếu</div>
              </div>
              <select class="form-select" v-model="form.checkinDefaultMode">
                <option>😊 Chọn emoji nhanh</option>
                <option>💬 Chat với PeaceCat</option>
                <option>📊 Bài kiểm tra chuẩn hóa</option>
              </select>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">📝 Ghi chú sau check-in</div>
                <div class="tr-desc">Hiển thị ô ghi chú ngắn sau mỗi lần check-in</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinNotes"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">🏷️ Gợi ý tag nguyên nhân</div>
                <div class="tr-desc">Hiển thị các tag gợi ý (Công việc, Gia đình, ...) sau check-in</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinTags"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">📊 Nhắc kiểm tra DASS-21 định kỳ</div>
                <div class="tr-desc">Gợi ý làm bài kiểm tra chuẩn hóa mỗi 2 tuần</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinAssessmentReminder"><span class="toggle-slider"></span></label>
            </div>
            <div class="select-row">
              <div class="sr-left"><div class="sr-title">📅 Tần suất nhắc kiểm tra</div></div>
              <select class="form-select" v-model="form.checkinReminderFrequency">
                <option>Hàng tuần</option>
                <option>2 tuần/lần</option>
                <option>Hàng tháng</option>
                <option>Chỉ khi tôi muốn</option>
              </select>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">🎤 Phân tích giọng nói (opt-in)</div>
                <div class="tr-desc">Cho phép AI phân tích giọng nói để hiểu tâm trạng chính xác hơn</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinVoiceOptin"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">📸 Selfie check-in (opt-in)</div>
                <div class="tr-desc">Phân tích biểu cảm khuôn mặt để hỗ trợ đánh giá tâm trạng</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinSelfieOptin"><span class="toggle-slider"></span></label>
            </div>
            <div style="margin-top:10px;padding:10px 12px;background:var(--peach-light);border:1.5px solid var(--peach);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">
              🔒 Phân tích giọng nói và selfie hoàn toàn opt-in. Dữ liệu được xử lý cục bộ và không được lưu trữ.
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('checkin')">💾 Lưu cài đặt</button>
            </div>
          </div>
        </div>

        <!-- AI SETTINGS -->
        <div class="settings-section" :class="{ active: currentSection === 'ai' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--lavender-light);">🐱</div>
              <div>
                <div class="sc-title">PeaceCat AI</div>
                <div class="sc-subtitle">Tùy chỉnh cách PeaceCat đồng hành cùng bạn</div>
              </div>
            </div>
            <div class="select-row">
              <div class="sr-left">
                <div class="sr-title">💬 Phong cách giao tiếp</div>
                <div class="sr-desc">Cách PeaceCat nói chuyện với bạn</div>
              </div>
              <select class="form-select" v-model="form.aiStyle">
                <option>😊 Thân thiện, vui vẻ</option>
                <option>🧘 Bình tĩnh, sâu lắng</option>
                <option>💪 Khích lệ, năng động</option>
                <option>🤗 Ấm áp, đồng cảm</option>
              </select>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">🎯 Gợi ý nhiệm vụ thông minh</div>
                <div class="tr-desc">PeaceCat tự động gợi ý nhiệm vụ dựa trên tâm trạng và lịch sử</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiTaskSuggestions"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">💡 Insight tự động</div>
                <div class="tr-desc">PeaceCat phân tích và đưa ra nhận xét về hành trình của bạn</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiInsights"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">🚨 Phát hiện từ khóa cảnh báo</div>
                <div class="tr-desc">AI tự động phát hiện dấu hiệu nguy hiểm và kích hoạt hỗ trợ khẩn cấp</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked disabled><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">📊 Phân tích nhật ký</div>
                <div class="tr-desc">AI đọc và phân tích cảm xúc trong nhật ký của bạn</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiJournalAnalysis"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">🐱 Hiển thị mascot PeaceCat</div>
                <div class="tr-desc">Hiện mascot mèo origami trong giao diện</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiMascot"><span class="toggle-slider"></span></label>
            </div>
            <div style="margin-top:10px;padding:10px 12px;background:var(--lavender-light);border:1.5px solid var(--lavender);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">
              🐱 <strong>Lưu ý:</strong> PeaceCat AI chỉ là người bạn đồng hành, không thay thế chuyên gia tâm lý. Tính năng phát hiện cảnh báo không thể tắt để đảm bảo an toàn của bạn.
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('ai')">💾 Lưu cài đặt AI</button>
            </div>
          </div>
        </div>

        <!-- DEVICES -->
        <div class="settings-section" :class="{ active: currentSection === 'devices' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--sky-light);">📱</div>
              <div>
                <div class="sc-title">Thiết bị kết nối</div>
                <div class="sc-subtitle">Phiên hiện tại và trạng thái tích hợp thiết bị thật</div>
              </div>
            </div>
            <div>
              <div class="device-card">
                <div class="dc-icon">💻</div>
                <div class="dc-info">
                  <div class="dc-name">{{ deviceName }}</div>
                  <div class="dc-meta">Phiên hiện tại · Đăng nhập lúc {{ currentSessionTime }}</div>
                </div>
                <div class="dc-status on">Đang hoạt động</div>
                <button class="dc-btn" type="button" @click="handleLogout">Đăng xuất</button>
              </div>
              <div class="device-card">
                <div class="dc-icon">⌚</div>
                <div class="dc-info">
                  <div class="dc-name">Thiết bị đeo sức khỏe</div>
                  <div class="dc-meta">Chưa có API kết nối thật trong backend hiện tại</div>
                </div>
                <div class="dc-status off">Chưa hỗ trợ</div>
                <button class="dc-btn disconnect" type="button" @click="disconnectDevice('wearable')">Thông tin</button>
              </div>
            </div>
            <div style="margin-top:10px;padding:10px 12px;background:var(--sky-light);border:1.5px solid var(--sky);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">
              PeaceFlow hiện chưa có backend đồng bộ Apple Watch/Fitbit thật. Trang này chỉ hiển thị phiên đăng nhập hiện tại và trạng thái tích hợp một cách trung thực.
            </div>
          </div>
        </div>

        <!-- PRIVACY -->
        <div class="settings-section" :class="{ active: currentSection === 'privacy' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--mint-light);">🔒</div>
              <div>
                <div class="sc-title">Quyền riêng tư</div>
                <div class="sc-subtitle">Kiểm soát cách dữ liệu của bạn được dùng trong sản phẩm</div>
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">📤 Chia sẻ dữ liệu để cá nhân hóa</div>
                <div class="tr-desc">Cho phép hệ thống dùng mood, journal và task để đưa gợi ý tốt hơn</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.privacyShareData"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">📈 Phân tích ẩn danh</div>
                <div class="tr-desc">Gửi thống kê ẩn danh để cải thiện sản phẩm, không kèm nội dung riêng tư</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.privacyAnonAnalytics"><span class="toggle-slider"></span></label>
            </div>
            <div class="select-row">
              <div class="sr-left">
                <div class="sr-title">👁️ Hiển thị hồ sơ</div>
                <div class="sr-desc">Mức hiển thị hồ sơ của bạn trên các tính năng cộng đồng</div>
              </div>
              <select class="form-select" v-model="form.privacyProfileVisibility">
                <option value="private">Chỉ mình tôi</option>
                <option value="friends">Chỉ kết nối tin cậy</option>
                <option value="community">Cộng đồng PeaceFlow</option>
              </select>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('privacy')">💾 Lưu quyền riêng tư</button>
            </div>
          </div>
        </div>

        <!-- SECURITY -->
        <div class="settings-section" :class="{ active: currentSection === 'security' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--peach-light);">🛡️</div>
              <div>
                <div class="sc-title">Bảo mật</div>
                <div class="sc-subtitle">Quản lý phiên hiện tại và cơ chế xác thực</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:var(--cream);border:1.5px solid var(--kraft-light);border-radius:var(--border-radius-sm);margin-bottom:12px;font-size:0.82rem;color:var(--text-secondary);line-height:1.6;">
              <div><strong>Người dùng:</strong> {{ securityInfo.displayName }}</div>
              <div><strong>Access token:</strong> {{ securityInfo.hasAccessToken ? 'Có' : 'Thiếu' }}</div>
              <div><strong>Refresh token:</strong> {{ securityInfo.hasRefreshToken ? 'Có' : 'Thiếu' }}</div>
              <div><strong>Lần cập nhật hồ sơ gần nhất:</strong> {{ securityInfo.updatedAt }}</div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">🔄 Tự làm mới phiên đăng nhập</div>
                <div class="tr-desc">Access token ngắn hạn sẽ được refresh tự động khi còn refresh token hợp lệ</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked disabled><span class="toggle-slider"></span></label>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap;">
              <button class="btn-outline" @click="saveSection('security')">Kiểm tra phiên</button>
              <button class="btn-primary" @click="handleLogout">🚪 Đăng xuất khỏi thiết bị này</button>
            </div>
          </div>
        </div>

        <!-- DATA -->
        <div class="settings-section" :class="{ active: currentSection === 'data' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--lavender-light);">📦</div>
              <div>
                <div class="sc-title">Dữ liệu</div>
                <div class="sc-subtitle">Xuất dữ liệu thật từ tài khoản và quản lý cache cục bộ</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:var(--warm-white);border:1.5px dashed var(--kraft-light);border-radius:var(--border-radius-sm);font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">
              Xuất JSON sẽ gom dữ liệu thật từ hồ sơ, tiến trình, badge và báo cáo chi tiết. Các thiết lập giao diện vẫn nằm cục bộ trên trình duyệt này.
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap;">
              <button class="btn-outline" @click="resetData">🧹 Xóa cài đặt cục bộ</button>
              <button class="btn-primary" @click="exportData('json')">📥 Xuất JSON</button>
            </div>
          </div>
        </div>

        <!-- ABOUT -->
        <div class="settings-section" :class="{ active: currentSection === 'about' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--gold-light);">ℹ️</div>
              <div>
                <div class="sc-title">Về PeaceFlow</div>
                <div class="sc-subtitle">Trạng thái ứng dụng và môi trường đang chạy</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:var(--cream);border:1.5px solid var(--kraft-light);border-radius:var(--border-radius-sm);font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">
              <div><strong>Phiên bản giao diện:</strong> {{ aboutInfo.version }}</div>
              <div><strong>API:</strong> {{ aboutInfo.apiBase }}</div>
              <div><strong>Múi giờ trình duyệt:</strong> {{ aboutInfo.timezone }}</div>
              <div><strong>Người dùng hiện tại:</strong> {{ aboutInfo.displayName }}</div>
            </div>
          </div>
        </div>

        <!-- DANGER -->
        <div class="settings-section" :class="{ active: currentSection === 'danger' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:rgba(255,139,139,0.16);">⚠️</div>
              <div>
                <div class="sc-title">Vùng nguy hiểm</div>
                <div class="sc-subtitle">Các thao tác nhạy cảm. Chỉ chạy khi bạn thực sự cần.</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:rgba(255,139,139,0.08);border:1.5px solid var(--coral-light);border-radius:var(--border-radius-sm);font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">
              Backend hiện chưa có endpoint xóa tài khoản. Trang này chỉ cho phép xóa cài đặt local và đăng xuất, không giả lập việc xóa dữ liệu trên server.
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap;">
              <button class="btn-outline" @click="resetData">🔄 Xóa cache local</button>
              <button class="btn-danger" @click="deleteAccount">🗑️ Yêu cầu xóa tài khoản</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible }">✅ <span>{{ toastText }}</span></div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient, getApiBaseUrl } from '../lib/apiClient';
import { EventLogger } from '../lib/eventLogger';

const router = useRouter();

const LOCAL_SETTINGS_KEY = 'peaceflow_profile_settings';
const APP_VERSION = '1.0.0';

const THEMES = {
  paper: {
    '--cream': '#FFF8F0', '--warm-white': '#FFFDF7', '--kraft': '#D4A574', '--kraft-light': '#E8CBA7',
    '--mint': '#A8D5BA', '--mint-light': '#C5E8D2', '--mint-dark': '#7BBF95', '--peach-light': '#FFE0C4',
    '--sky-light': '#C5E8F5', '--lavender-light': '#DDD1EB', '--text-primary': '#4A3728', '--text-secondary': '#7A6555'
  },
  ocean: {
    '--cream': '#F2F8FF', '--warm-white': '#FAFDFF', '--kraft': '#86B7E3', '--kraft-light': '#C7DDF2',
    '--mint': '#8FD3F4', '--mint-light': '#D8F0FB', '--mint-dark': '#4EA5D9', '--peach-light': '#E6F4FF',
    '--sky-light': '#D8EEFF', '--lavender-light': '#DDEAFE', '--text-primary': '#23405B', '--text-secondary': '#4F6E89'
  },
  sunset: {
    '--cream': '#FFF5EE', '--warm-white': '#FFFDF9', '--kraft': '#F0A66E', '--kraft-light': '#F7D3B5',
    '--mint': '#FFC2A8', '--mint-light': '#FFE5D6', '--mint-dark': '#E9886A', '--peach-light': '#FFE4D6',
    '--sky-light': '#FFE8D8', '--lavender-light': '#F7D8D1', '--text-primary': '#5A3525', '--text-secondary': '#8A5F4A'
  },
  forest: {
    '--cream': '#F4FAF4', '--warm-white': '#FCFEFC', '--kraft': '#8DB892', '--kraft-light': '#CFE3D0',
    '--mint': '#7BC47F', '--mint-light': '#DDF2DF', '--mint-dark': '#4F9656', '--peach-light': '#E3F4E4',
    '--sky-light': '#DDF1E1', '--lavender-light': '#D8EBD8', '--text-primary': '#26442A', '--text-secondary': '#4F6C53'
  },
  lavender: {
    '--cream': '#FBF7FF', '--warm-white': '#FFFDFF', '--kraft': '#B99AD9', '--kraft-light': '#E4D7F2',
    '--mint': '#D0B7EA', '--mint-light': '#F0E7FA', '--mint-dark': '#8E6FB3', '--peach-light': '#F4E6FB',
    '--sky-light': '#EEE3FA', '--lavender-light': '#EADAF7', '--text-primary': '#47315C', '--text-secondary': '#72588C'
  }
};

const FONT_SIZES = { small: '14px', medium: '16px', large: '18px' };

function loadLocalSettings() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function formatDateTime(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function detectDeviceName() {
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//.test(ua)) return 'Google Chrome';
  if (/Firefox\//.test(ua)) return 'Mozilla Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Trình duyệt hiện tại';
}

const local = loadLocalSettings();

const user = ref(null);
const profile = ref(null);
const progress = ref(null);
const currentSection = ref('notifications');

const currentTheme = ref('paper');
const currentFontSize = ref('medium');

const form = reactive({
  notifMaster: true,
  notifMorning: true,
  notifMorningTime: '08:00',
  notifEvening: true,
  notifEveningTime: '21:30',
  notifTasks: true,
  notifStreak: true,
  notifAchievements: true,
  notifInsights: true,
  notifExpert: true,
  notifCommunity: false,
  appearanceAnimations: true,
  appearanceSounds: true,
  appearanceHaptics: true,
  appearanceLanguage: '🇻🇳 Tiếng Việt',
  checkinDefaultMode: '😊 Chọn emoji nhanh',
  checkinNotes: true,
  checkinTags: true,
  checkinAssessmentReminder: true,
  checkinReminderFrequency: '2 tuần/lần',
  checkinVoiceOptin: false,
  checkinSelfieOptin: false,
  aiStyle: '😊 Thân thiện, vui vẻ',
  aiTaskSuggestions: true,
  aiInsights: true,
  aiJournalAnalysis: true,
  aiMascot: true,
  privacyShareData: false,
  privacyAnonAnalytics: true,
  privacyProfileVisibility: 'private'
});

const toastVisible = ref(false);
const toastText = ref('Đã lưu cài đặt!');
let toastTimer = null;

function showToast(message, type = 'success') {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, 2400);
}

function getSupportPreferences() {
  return profile.value?.support_preferences || {};
}

function getOnboardingAnswers() {
  return profile.value?.onboarding_answers || {};
}

function getNotificationSetting(key, fallback) {
  const notifications = getSupportPreferences().notifications || {};
  const localNotifications = local.notifications || {};
  return notifications[key] ?? localNotifications[key] ?? fallback;
}

function getLocalTheme() {
  return getOnboardingAnswers().theme || local.theme || 'paper';
}

function getLocalFontSize() {
  return getOnboardingAnswers().font_size || local.fontSize || 'medium';
}

function getLocalLanguage() {
  return getOnboardingAnswers().language || local.language || '🇻🇳 Tiếng Việt';
}

function applyTheme(theme) {
  const palette = THEMES[theme] || THEMES.paper;
  Object.entries(palette).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value);
  });
  currentTheme.value = theme;
}

function applyFontSize(size) {
  const cssValue = FONT_SIZES[size] || FONT_SIZES.medium;
  document.documentElement.style.fontSize = cssValue;
  currentFontSize.value = size;
}

function renderNotifications() {
  form.notifMaster = getNotificationSetting('master', true);
  form.notifMorning = getNotificationSetting('morning', true);
  form.notifEvening = getNotificationSetting('evening', true);
  form.notifTasks = getNotificationSetting('tasks', true);
  form.notifStreak = getNotificationSetting('streak', true);
  form.notifAchievements = getNotificationSetting('achievements', true);
  form.notifInsights = getNotificationSetting('insights', true);
  form.notifExpert = getNotificationSetting('expert', true);
  form.notifCommunity = getNotificationSetting('community', false);
  form.notifMorningTime = getSupportPreferences().morning_time || local.morningTime || '08:00';
  form.notifEveningTime = getSupportPreferences().evening_time || local.eveningTime || '21:30';
}

function renderAppearance() {
  const support = getSupportPreferences();
  form.appearanceAnimations = support.animations ?? local.animations ?? true;
  form.appearanceSounds = support.sounds ?? local.sounds ?? true;
  form.appearanceHaptics = support.haptics ?? local.haptics ?? true;
  form.appearanceLanguage = getLocalLanguage();
  applyTheme(getLocalTheme());
  applyFontSize(getLocalFontSize());
}

function renderCheckin() {
  const support = getSupportPreferences();
  form.checkinDefaultMode = support.checkin_default_mode || '😊 Chọn emoji nhanh';
  form.checkinNotes = support.checkin_notes_enabled ?? true;
  form.checkinTags = support.checkin_tag_suggestions ?? true;
  form.checkinAssessmentReminder = support.assessment_reminder_enabled ?? true;
  form.checkinReminderFrequency = support.assessment_reminder_frequency || '2 tuần/lần';
  form.checkinVoiceOptin = support.voice_opt_in ?? false;
  form.checkinSelfieOptin = support.selfie_opt_in ?? false;
}

function renderAi() {
  const support = getSupportPreferences();
  form.aiStyle = support.ai_style || '😊 Thân thiện, vui vẻ';
  form.aiTaskSuggestions = support.ai_task_suggestions ?? true;
  form.aiInsights = support.ai_insights ?? true;
  form.aiJournalAnalysis = support.journal_analysis ?? true;
  form.aiMascot = support.mascot_enabled ?? true;
}

function renderPrivacy() {
  const support = getSupportPreferences();
  form.privacyShareData = support.privacy_share_data ?? false;
  form.privacyAnonAnalytics = support.privacy_anonymous_analytics ?? true;
  form.privacyProfileVisibility = support.profile_visibility || 'private';
}

function renderPage() {
  renderNotifications();
  renderAppearance();
  renderCheckin();
  renderAi();
  renderPrivacy();
}

const deviceName = computed(() => detectDeviceName());
const currentSessionTime = computed(() => formatDateTime(user.value?.updated_at || user.value?.created_at));

const securityInfo = computed(() => ({
  displayName: user.value?.display_name || user.value?.full_name || 'Người dùng',
  hasAccessToken: Boolean(localStorage.getItem('access_token')),
  hasRefreshToken: Boolean(localStorage.getItem('refresh_token')),
  updatedAt: formatDateTime(profile.value?.updated_at || user.value?.updated_at)
}));

const aboutInfo = computed(() => ({
  version: APP_VERSION,
  apiBase: getApiBaseUrl(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Không xác định',
  displayName: user.value?.display_name || user.value?.full_name || 'Người dùng'
}));

function collectLocalSettings() {
  local.notifications = {
    master: form.notifMaster,
    morning: form.notifMorning,
    evening: form.notifEvening,
    tasks: form.notifTasks,
    streak: form.notifStreak,
    achievements: form.notifAchievements,
    insights: form.notifInsights,
    expert: form.notifExpert,
    community: form.notifCommunity
  };
  local.morningTime = form.notifMorningTime || '08:00';
  local.eveningTime = form.notifEveningTime || '21:30';
  local.animations = form.appearanceAnimations;
  local.sounds = form.appearanceSounds;
  local.haptics = form.appearanceHaptics;
  local.language = form.appearanceLanguage || '🇻🇳 Tiếng Việt';
  local.checkin = {
    defaultMode: form.checkinDefaultMode,
    notes: form.checkinNotes,
    tags: form.checkinTags,
    assessmentReminder: form.checkinAssessmentReminder,
    reminderFrequency: form.checkinReminderFrequency,
    voiceOptIn: form.checkinVoiceOptin,
    selfieOptIn: form.checkinSelfieOptin
  };
  local.ai = {
    style: form.aiStyle,
    taskSuggestions: form.aiTaskSuggestions,
    insights: form.aiInsights,
    journalAnalysis: form.aiJournalAnalysis,
    mascot: form.aiMascot
  };
  local.privacy = {
    shareData: form.privacyShareData,
    anonymousAnalytics: form.privacyAnonAnalytics,
    profileVisibility: form.privacyProfileVisibility
  };
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(local));
}

function buildProfilePayload() {
  const existingSupport = getSupportPreferences();
  const existingOnboarding = getOnboardingAnswers();

  return {
    support_preferences: {
      ...existingSupport,
      notifications: {
        master: form.notifMaster,
        morning: form.notifMorning,
        evening: form.notifEvening,
        tasks: form.notifTasks,
        streak: form.notifStreak,
        achievements: form.notifAchievements,
        insights: form.notifInsights,
        expert: form.notifExpert,
        community: form.notifCommunity
      },
      morning_time: form.notifMorningTime || '08:00',
      evening_time: form.notifEveningTime || '21:30',
      animations: form.appearanceAnimations,
      sounds: form.appearanceSounds,
      haptics: form.appearanceHaptics,
      checkin_default_mode: form.checkinDefaultMode,
      checkin_notes_enabled: form.checkinNotes,
      checkin_tag_suggestions: form.checkinTags,
      assessment_reminder_enabled: form.checkinAssessmentReminder,
      assessment_reminder_frequency: form.checkinReminderFrequency,
      voice_opt_in: form.checkinVoiceOptin,
      selfie_opt_in: form.checkinSelfieOptin,
      ai_style: form.aiStyle,
      ai_task_suggestions: form.aiTaskSuggestions,
      ai_insights: form.aiInsights,
      journal_analysis: form.aiJournalAnalysis,
      mascot_enabled: form.aiMascot,
      privacy_share_data: form.privacyShareData,
      privacy_anonymous_analytics: form.privacyAnonAnalytics,
      profile_visibility: form.privacyProfileVisibility
    },
    onboarding_answers: {
      ...existingOnboarding,
      theme: currentTheme.value || 'paper',
      font_size: currentFontSize.value || 'medium',
      language: form.appearanceLanguage || '🇻🇳 Tiếng Việt'
    }
  };
}

async function loadData() {
  const [userData, profileData, progressData] = await Promise.all([
    apiClient.get('/me'),
    apiClient.get('/profile'),
    apiClient.get('/progress')
  ]);

  user.value = userData;
  profile.value = profileData || {};
  progress.value = progressData || {};

  localStorage.setItem('user', JSON.stringify(userData));
  window.dispatchEvent(new Event('user-profile-updated'));
}

async function persistSettings(scope) {
  collectLocalSettings();

  try {
    profile.value = await apiClient.put('/profile', buildProfilePayload());
    EventLogger.log('settings', 'save:server:success');
    renderPage();
    showToast(scope === 'all' ? 'Đã lưu toàn bộ cài đặt.' : `Đã lưu cài đặt ${scope}.`);
  } catch (error) {
    EventLogger.error('settings', 'save:server:failed', error);
    console.error('Settings save failed:', error);
    showToast('Không lưu được cài đặt lên máy chủ.', 'error');
  }
}

function switchSection(sectionId) {
  EventLogger.log('settings', 'section:switch');
  currentSection.value = sectionId;
}

function selectTheme(themeName) {
  EventLogger.log('settings', 'theme:select');
  if (themeName === 'dark') {
    showToast('Chủ đề tối chưa được triển khai.', 'info');
    return;
  }

  applyTheme(themeName);
  collectLocalSettings();
}

function selectFontSize(size) {
  EventLogger.log('settings', 'font:select');
  applyFontSize(size);
  collectLocalSettings();
}

async function saveAllSettings() {
  EventLogger.log('settings', 'save:all');
  await persistSettings('all');
}

async function saveSection(section) {
  EventLogger.log('settings', 'save:section');
  await persistSettings(section);
}

function disconnectDevice(deviceKey) {
  if (deviceKey === 'wearable') {
    showToast('Backend chưa có kết nối wearable thật.', 'info');
    return;
  }
  showToast('Chỉ có thể đăng xuất khỏi phiên hiện tại trên trang này.', 'info');
}

async function exportData(format) {
  EventLogger.log('settings', 'data:export:attempt');
  if (format !== 'json') {
    showToast('Trang này hiện chỉ hỗ trợ xuất JSON.', 'info');
    return;
  }

  try {
    const [achievements, report] = await Promise.all([
      apiClient.get('/achievements'),
      apiClient.get('/reports/detail')
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      user: user.value,
      profile: profile.value,
      progress: progress.value,
      achievements,
      report,
      local_settings: local
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'peaceflow-settings-export.json';
    link.click();
    URL.revokeObjectURL(link.href);
    EventLogger.log('settings', 'data:export:success');
    showToast('Đã xuất dữ liệu JSON.');
  } catch (error) {
    EventLogger.error('settings', 'data:export:failed', error);
    console.error('Export failed:', error);
    showToast('Không xuất được dữ liệu.', 'error');
  }
}

function resetData() {
  EventLogger.log('settings', 'data:reset:request');
  const confirmed = window.confirm('Xóa toàn bộ cài đặt local trên trình duyệt này? Dữ liệu trên server sẽ không bị ảnh hưởng.');
  if (!confirmed) return;

  EventLogger.log('settings', 'data:reset:confirmed');
  localStorage.removeItem(LOCAL_SETTINGS_KEY);
  localStorage.removeItem('PeaceFlow_settings');
  Object.keys(local).forEach((key) => delete local[key]);
  renderPage();
  showToast('Đã xóa cài đặt cục bộ.');
}

function deleteAccount() {
  EventLogger.log('settings', 'account:delete:request');
  showToast('Backend chưa có endpoint xóa tài khoản.', 'info');
}

async function handleLogout() {
  EventLogger.log('auth', 'logout:request');
  try {
    await apiClient.logout();
  } finally {
    router.push('/login');
  }
}

onMounted(async () => {
  try {
    await loadData();
    renderPage();
  } catch (error) {
    console.error('Settings init failed:', error);
    showToast('Không tải được cài đặt từ máy chủ.', 'error');
  }
});
</script>

<style scoped src="../assets/settings.css"></style>
