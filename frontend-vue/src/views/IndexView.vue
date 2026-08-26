<template>
  <div class="index-page">
    <!-- Mobile Nav Overlay -->
    <div class="mobile-nav-overlay" :class="{ open: mobileNavOpen }" @click="closeMobileNav"></div>
    <div class="mobile-nav-panel" :class="{ open: mobileNavOpen }">
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <button class="mnp-close" @click="closeMobileNav">✕</button>
      </div>
      <a href="#features" class="mnp-link" @click="closeMobileNav">✨ Tính năng</a>
      <a href="#how-it-works" class="mnp-link" @click="closeMobileNav">💡 Cách hoạt động</a>
      <router-link to="/mood-assessment" class="mnp-link">📋 Bài test</router-link>
      <router-link to="/experts" class="mnp-link">🩺 Chuyên gia</router-link>
      <router-link to="/community" class="mnp-link">👥 Cộng đồng</router-link>
      <router-link to="/emergency" class="mnp-link" style="color:var(--coral);">🆘 Khẩn cấp</router-link>
      <div class="mobile-auth-user" :class="{ open: isAuthenticated }">
        <div class="mobile-auth-avatar" :class="{ 'has-image': hasAvatarImage }" :style="avatarStyle">{{ hasAvatarImage ? '' : avatarFallback }}</div>
        <div>
          <div class="mobile-auth-name">{{ userLabel }}</div>
          <div class="mobile-auth-email">{{ auth.user?.email || '' }}</div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
        <router-link
          v-if="!isAuthenticated"
          :to="{ path: '/tasks', query: { guest_emergency: '1' } }"
          style="display:block;padding:12px;border:2px solid var(--coral);border-radius:var(--radius-full);background:var(--coral-light);color:var(--coral-dark);font-weight:800;font-size:0.85rem;text-align:center;"
        >🆘 Bài tập khẩn cấp</router-link>
        <router-link
          v-if="!isAuthenticated"
          to="/signup"
          style="display:block;padding:12px;border:2px solid var(--mint-dark);border-radius:var(--radius-full);background:var(--mint);color:var(--text-primary);font-weight:700;font-size:0.85rem;text-align:center;"
        >🌿 Đăng ký miễn phí</router-link>
        <router-link
          v-if="!isAuthenticated"
          to="/login"
          style="display:block;padding:11px;border:2px solid var(--kraft-light);border-radius:var(--radius-full);color:var(--text-secondary);font-weight:600;font-size:0.82rem;text-align:center;"
        >Đăng nhập</router-link>
        <router-link
          v-if="isAuthenticated"
          to="/dashboard"
          style="display:block;padding:12px;border:2px solid var(--mint-dark);border-radius:var(--radius-full);background:var(--mint);color:var(--text-primary);font-weight:700;font-size:0.85rem;text-align:center;"
        >🌿 Vào PeaceFlow</router-link>
        <button
          v-if="isAuthenticated"
          style="padding:11px;border:2px solid var(--coral);border-radius:var(--radius-full);background:var(--coral-light);color:var(--coral-dark);font-weight:700;font-size:0.82rem;text-align:center;cursor:pointer;width:100%;"
          @click="handleLogout"
        >Đăng xuất</button>
      </div>
    </div>

    <!-- NAVBAR -->
    <nav class="navbar">
      <router-link to="/" class="nav-logo">
        <div class="logo-icon">🌿</div>
        <div class="logo-text">Peace<span>Flow</span></div>
      </router-link>
      <div class="nav-links">
        <a href="#features" class="nav-link">Tính năng</a>
        <a href="#how-it-works" class="nav-link">Cách hoạt động</a>
        <router-link to="/mood-assessment" class="nav-link">Bài test</router-link>
        <router-link to="/experts" class="nav-link">Chuyên gia</router-link>
        <router-link to="/community" class="nav-link">Cộng đồng</router-link>
        <router-link to="/emergency" class="nav-link" style="color:var(--coral);">🆘 Khẩn cấp</router-link>
      </div>
      <div class="nav-cta">
        <router-link v-if="!isAuthenticated" :to="{ path: '/tasks', query: { guest_emergency: '1' } }"><button class="btn-nav-emergency">🆘 Khẩn cấp</button></router-link>
        <router-link v-if="!isAuthenticated" to="/login"><button class="btn-nav-outline">Đăng nhập</button></router-link>
        <router-link v-if="!isAuthenticated" to="/signup"><button class="btn-nav-primary">🌿 Đăng ký miễn phí</button></router-link>
        <router-link v-if="isAuthenticated" to="/dashboard"><button class="btn-nav-primary">🌿 Vào PeaceFlow</button></router-link>
        <div v-if="isAuthenticated" class="nav-auth-menu">
          <button class="nav-avatar-btn" :class="{ 'has-image': hasAvatarImage }" :style="avatarStyle" type="button" aria-label="Tài khoản" @click.stop="navDropdownOpen = !navDropdownOpen">{{ hasAvatarImage ? '' : avatarFallback }}</button>
          <div class="nav-auth-dropdown" :class="{ open: navDropdownOpen }">
            <div class="nav-auth-user">
              <div class="nav-auth-user-avatar" :class="{ 'has-image': hasAvatarImage }" :style="avatarStyle">{{ hasAvatarImage ? '' : avatarFallback }}</div>
              <div>
                <div class="nav-auth-user-name">{{ userLabel }}</div>
                <div class="nav-auth-user-email">{{ auth.user?.email || '' }}</div>
              </div>
            </div>
            <router-link to="/dashboard" class="nav-auth-action" style="text-decoration:none;">Vào PeaceFlow</router-link>
            <button class="nav-auth-action logout" type="button" @click="handleLogout">Đăng xuất</button>
          </div>
        </div>
      </div>
      <button class="mobile-nav-btn" @click="openMobileNav">☰</button>
    </nav>

    <!-- HERO -->
    <section class="hero" id="hero">
      <div class="hero-bg-deco">
        <div class="hbd-circle hbd-1"></div>
        <div class="hbd-circle hbd-2"></div>
        <div class="hbd-circle hbd-3"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">🌟 Nền tảng sức khỏe tâm thần #1 Việt Nam</div>
        <h1 class="hero-title">
          Đồng hành<br>
          <span class="ht-accent">vượt qua stress</span><br>
          mỗi ngày 🌿
        </h1>
        <p class="hero-subtitle">Theo dõi tâm trạng, hoàn thành nhiệm vụ chữa lành và kết nối với chuyên gia tâm lý — tất cả trong một nền tảng ấm áp, thủ công.</p>
        <div class="hero-message">
          <div class="hero-message-text">"{{ heroQuote }}"</div>
        </div>
        <div class="hero-actions">
          <router-link :to="isAuthenticated ? '/dashboard' : '/signup'" class="btn-hero-primary">{{ isAuthenticated ? '🌿 Vào PeaceFlow' : '🚀 Đăng ký miễn phí' }}</router-link>
          <a href="#how-it-works" class="btn-hero-outline">📖 Tìm hiểu thêm</a>
        </div>
        <div class="hero-stats">
          <div class="hs-item">
            <div class="hs-num">10K+</div>
            <div class="hs-label">Người dùng</div>
          </div>
          <div class="hs-item">
            <div class="hs-num">30+</div>
            <div class="hs-label">Chuyên gia</div>
          </div>
          <div class="hs-item">
            <div class="hs-num">95%</div>
            <div class="hs-label">Hài lòng</div>
          </div>
          <div class="hs-item">
            <div class="hs-num">4.9⭐</div>
            <div class="hs-label">Đánh giá</div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="float-badge fb-1">🔥 7 ngày streak!</div>
        <div class="float-badge fb-2">🏅 Huy hiệu mới: Thiền Sư</div>
        <div class="float-badge fb-3">+25 XP ⭐</div>
        <div class="hero-phone-mockup">
          <div class="hpm-bar"></div>
          <div class="hpm-mood">
            <div class="hpm-mood-emoji">😊</div>
            <div class="hpm-mood-text">Tâm trạng hôm nay: Tốt</div>
          </div>
          <div class="hpm-task">
            <div class="hpm-task-icon">🧘</div>
            <div class="hpm-task-text">Thiền 5 phút</div>
            <div class="hpm-task-xp">+25 XP</div>
          </div>
          <div class="hpm-task">
            <div class="hpm-task-icon">💨</div>
            <div class="hpm-task-text">Thở vuông 5 vòng</div>
            <div class="hpm-task-xp">+20 XP</div>
          </div>
          <div class="hpm-xp">
            <div class="hpm-xp-text">⭐ -- XP · Level 2</div>
            <div class="hpm-xp-bar">
              <div class="hpm-xp-fill"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="how-section" id="how-it-works">
      <div style="text-align:center;">
        <div class="section-badge">🗺️ Cách hoạt động</div>
        <h2 class="section-title">Hành trình tự chữa lành<br>chỉ trong 4 bước 🌱</h2>
        <p class="section-subtitle" style="margin:0 auto;">Đơn giản, không áp lực — mỗi bước nhỏ đều có ý nghĩa.</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">1</div>
          <span class="step-icon">📝</span>
          <div class="step-title">Đăng ký & thiết lập</div>
          <div class="step-desc">Tạo hồ sơ trong 2 phút. Chọn avatar Paper Flow dễ thương và chia sẻ điều bạn cần hỗ trợ.</div>
        </div>
        <div class="step-card">
          <div class="step-num">2</div>
          <span class="step-icon">💭</span>
          <div class="step-title">Check-in tâm trạng</div>
          <div class="step-desc">Mỗi ngày check-in 30 giây. AI phân tích và hiểu bạn đang cảm thấy thế nào.</div>
        </div>
        <div class="step-card">
          <div class="step-num">3</div>
          <span class="step-icon">🎮</span>
          <div class="step-title">Hoàn thành nhiệm vụ</div>
          <div class="step-desc">AI gợi ý nhiệm vụ phù hợp. Thiền, thở, viết nhật ký — mỗi bước đều nhận XP.</div>
        </div>
        <div class="step-card">
          <div class="step-num">4</div>
          <span class="step-icon">🌱</span>
          <div class="step-title">Phát triển mỗi ngày</div>
          <div class="step-desc">Theo dõi tiến trình, nhận huy hiệu và kết nối chuyên gia khi cần hỗ trợ sâu hơn.</div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" style="background:var(--cream);padding:80px 5%;">
      <div style="text-align:center;margin-bottom:48px;">
        <div class="section-badge">✨ Tính năng</div>
        <h2 class="section-title">Mọi thứ bạn cần<br>để chăm sóc tâm hồn 💚</h2>
      </div>
      <div class="features-grid">
        <router-link to="/mood-checkin" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--mint-light);border-color:var(--mint);">💭</div>
          <div class="fc-title">Check-in tâm trạng AI</div>
          <div class="fc-desc">PeaceCat AI lắng nghe và phân tích tâm trạng của bạn qua emoji, slider và trò chuyện tự nhiên. Phát hiện dấu hiệu cảnh báo sớm.</div>
          <span class="fc-link">Thử ngay →</span>
        </router-link>
        <router-link to="/tasks" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--peach-light);border-color:var(--peach);">🎮</div>
          <div class="fc-title">Nhiệm vụ game hóa</div>
          <div class="fc-desc">80+ nhiệm vụ từ dễ đến khó. Thiền, thở, nhật ký, kết nối xã hội — mỗi hoàn thành nhận XP và huy hiệu.</div>
          <span class="fc-link">Xem nhiệm vụ →</span>
        </router-link>
        <router-link to="/experts" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--lavender-light);border-color:var(--lavender);">🩺</div>
          <div class="fc-title">Kết nối chuyên gia</div>
          <div class="fc-desc">30+ chuyên gia tâm lý được chứng nhận. Chat, gọi thoại hoặc video call — đặt lịch trong 2 phút.</div>
          <span class="fc-link">Tìm chuyên gia →</span>
        </router-link>
        <router-link to="/mood-assessment" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--sky-light);border-color:var(--sky);">📊</div>
          <div class="fc-title">Bài kiểm tra chuẩn hóa</div>
          <div class="fc-desc">DASS-21, GAD-7, PHQ-9, PSQI — các thang đo tâm lý lâm sàng được trình bày thân thiện, không gây áp lực.</div>
          <span class="fc-link">Làm bài kiểm tra →</span>
        </router-link>
        <router-link to="/journal" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--gold-light);border-color:var(--gold);">📝</div>
          <div class="fc-title">Nhật ký cảm xúc</div>
          <div class="fc-desc">Không gian riêng tư, mã hóa AES-256. AI phân tích cảm xúc và đưa ra gợi ý nhẹ nhàng sau mỗi bài viết.</div>
          <span class="fc-link">Viết nhật ký →</span>
        </router-link>
        <router-link to="/emergency" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--coral-light);border-color:var(--coral);">🆘</div>
          <div class="fc-title">Hỗ trợ khẩn cấp 24/7</div>
          <div class="fc-desc">Phát hiện từ khóa nguy hiểm tự động. Bài tập ổn định tức thì, hotline miễn phí và kết nối chuyên gia ngay lập tức.</div>
          <span class="fc-link" style="color:var(--coral);">Tìm hiểu →</span>
        </router-link>
      </div>
    </section>

    <!-- MOOD DEMO -->
    <section class="mood-demo-section" id="mood-demo">
      <div style="text-align:center;margin-bottom:0;">
        <div class="section-badge">💭 Demo tương tác</div>
        <h2 class="section-title">Thử check-in tâm trạng<br>ngay bây giờ 🐱</h2>
      </div>
      <div class="mood-demo-layout">
        <div class="mood-demo-card">
          <div class="mdc-title">🐱 PeaceCat hỏi: Hôm nay bạn thế nào?</div>
          <div class="mood-emoji-row">
            <button
              v-for="emoji in ['😊', '😌', '😐', '😟', '😰', '😢']"
              :key="emoji"
              class="demo-mood-btn"
              :class="{ selected: selectedMood === emoji }"
              :style="demoMoodBtnStyle(emoji)"
              @click="selectDemoMood(emoji)"
            >{{ emoji }}</button>
          </div>
          <div class="demo-slider-wrap">
            <div class="demo-slider-label"><span>😔 Rất thấp</span><span>😊 Rất cao</span></div>
            <input type="range" class="demo-slider" min="1" max="10" v-model.number="selectedScore">
            <div style="text-align:center;font-size:0.78rem;font-weight:700;color:var(--mint-dark);margin-top:4px;">Mức độ: {{ selectedScore }}/10</div>
          </div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">🏷️ Nguyên nhân (tùy chọn):</div>
          <div class="demo-tags">
            <span
              v-for="tag in DEMO_TAGS"
              :key="tag"
              class="demo-tag"
              :class="{ active: selectedTags.has(tag) }"
              :style="selectedTags.has(tag) ? { background: 'var(--mint-dark)', color: 'white' } : null"
              @click="toggleDemoTag(tag)"
            >{{ tag }}</span>
          </div>
          <button class="demo-save-btn" @click="saveDemoMood">{{ demoSaveLabel }}</button>
        </div>
        <div class="mood-demo-info">
          <div class="mdi-item">
            <div class="mdi-icon">🤖</div>
            <div>
              <div class="mdi-title">AI phân tích realtime</div>
              <div class="mdi-desc">PeaceCat phân tích tâm trạng và gợi ý nhiệm vụ phù hợp nhất với trạng thái hiện tại của bạn.</div>
            </div>
          </div>
          <div class="mdi-item">
            <div class="mdi-icon">📈</div>
            <div>
              <div class="mdi-title">Theo dõi tiến triển</div>
              <div class="mdi-desc">Tâm trạng của bạn được lưu lại thành biểu đồ để nhìn lại hành trình tự chữa lành.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer>
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="fb-logo">
            <div class="fb-logo-icon">🌿</div>
            <div class="fb-logo-text">Peace<span>Flow</span></div>
          </div>
          <p>Nền tảng hỗ trợ sức khỏe tinh thần, giúp bạn vượt qua căng thẳng, tìm lại sự bình yên mỗi ngày bằng các nhiệm vụ game hóa thú vị.</p>
          <div class="footer-hotline">
            <div class="fh-num">📞 0931773637</div>
            <div class="fh-label">Đường dây nóng hỗ trợ tâm lý 24/7</div>
          </div>
        </div>
        <div>
          <div class="footer-col-title">Về PeaceFlow</div>
          <a href="#" class="footer-link">Câu chuyện của chúng tôi</a>
          <a href="#" class="footer-link">Đội ngũ chuyên gia</a>
          <a href="#" class="footer-link">Nghiên cứu khoa học</a>
          <a href="#" class="footer-link">Báo chí nói về chúng tôi</a>
        </div>
        <div>
          <div class="footer-col-title">Tính năng chính</div>
          <router-link to="/tasks" class="footer-link">Nhiệm vụ chữa lành</router-link>
          <router-link to="/mood-checkin" class="footer-link">Kiểm tra tâm trạng</router-link>
          <router-link to="/community" class="footer-link">Cộng đồng PeaceFlow</router-link>
          <router-link to="/experts" class="footer-link">Kết nối chuyên gia</router-link>
        </div>
        <div>
          <div class="footer-col-title">Hỗ trợ</div>
          <router-link to="/emergency" class="footer-link">Trung tâm khẩn cấp</router-link>
          <a href="#" class="footer-link">Câu hỏi thường gặp</a>
          <a href="#" class="footer-link">Chính sách bảo mật</a>
          <a href="#" class="footer-link">Điều khoản sử dụng</a>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);">© 2026 PeaceFlow. Mọi quyền được bảo lưu.</div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.5);display:flex;gap:16px;">
          <span style="cursor:pointer;" title="Facebook">FB</span>
          <span style="cursor:pointer;" title="Instagram">IG</span>
          <span style="cursor:pointer;" title="TikTok">TT</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const SLOGANS = [
  'Ai cũng gặp stress ở một mức độ nào đó. Bạn không hề đơn độc.',
  'Dù cảm xúc có nặng nề đến đâu, vẫn luôn có cơ hội phục hồi.',
  'Rồi chuyện này sẽ qua, hãy bình tâm.',
  'AI chỉ hỗ trợ, không thay thế sự kết nối giữa người với người.',
  'Hạnh phúc do chính bạn tạo ra, hãy sống có trách nhiệm với đời mình.',
  'Sự hồi phục cần sự kiên nhẫn, kiên trì và từ từ.',
  'Đừng đè nén, hãy giải phóng cảm xúc qua hoạt động tích cực.',
  'Mọi cảm xúc mãnh liệt đều là trải nghiệm quý giá.',
  'Bạn không đơn độc, hãy mở lòng để thấy nhẹ nhõm hơn.',
  'Sức khỏe hài hòa giữa thể chất và tinh thần là chìa khóa của hạnh phúc.',
  'Chỉ có bạn mới là người thực sự giúp được chính mình.',
  'Góc tối trong ta cần được hiểu rõ, thay vì chôn giấu.',
  'Hầu hết những điều bạn lo sợ sẽ không bao giờ xảy ra.',
  'Hãy tử tế với bản thân - bạn là món quà của thế giới này.',
  'Bảo vệ sự chú ý, ưu tiên Sức khỏe, Công việc và Gia đình.',
  'Tình yêu gia đình là một phần cuộc đời, đừng để nó chi phối tất cả.',
  'Hãy tha thứ và yêu bản thân mình nhiều hơn.',
  'Nghiện ngập là dấu hiệu cơ thể cần được khỏa lấp, chữa lành.',
  'Sống với cảm xúc thực là quyền tự do lớn nhất của bạn.',
  'Đổ mồ hôi bằng vận động là cách tuyệt vời để vượt qua stress.',
  'Khoái lạc là hệ quả của hạnh phúc, không phải nguyên nhân.',
  'Sự không hoàn hảo chính là nét hoàn hảo nhất của cuộc sống.',
  'Giảm kỳ vọng là một cách thông minh để giảm stress.',
  'Mọi thứ không tệ như ta nghĩ, con người có sức bật đáng kinh ngạc.',
  'Liệu việc này có đáng để căng thẳng không? Nếu không, bỏ qua.',
  'Stress ở mức vừa phải giúp bạn tập trung và mạnh mẽ hơn.',
  "Vượt qua stress sẽ tạo ra 'kháng sinh tự nhiên' cho tinh thần bạn."
];

const DEMO_TAGS = ['💼 Công việc', '👨‍👩‍👧 Gia đình', '💰 Tài chính', '😴 Mất ngủ', '💔 Tình cảm', '❓ Không rõ'];

const heroQuote = ref(SLOGANS[Math.floor(Math.random() * SLOGANS.length)]);

const mobileNavOpen = ref(false);
function openMobileNav() { mobileNavOpen.value = true; document.body.style.overflow = 'hidden'; }
function closeMobileNav() { mobileNavOpen.value = false; document.body.style.overflow = ''; }

const navDropdownOpen = ref(false);
const isAuthenticated = computed(() => auth.isAuthenticated);
const userLabel = computed(() => auth.user?.display_name || auth.user?.full_name || auth.user?.email || 'Người dùng');
const avatarFallback = computed(() => {
  const label = userLabel.value.trim();
  return label ? label.charAt(0).toUpperCase() : 'PF';
});
const hasAvatarImage = computed(() => Boolean(auth.user?.avatar_url));
const avatarStyle = computed(() => (hasAvatarImage.value ? { backgroundImage: `url('${auth.user.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}));

async function handleLogout() {
  navDropdownOpen.value = false;
  await auth.logout();
}

// Mood demo
const selectedMood = ref(null);
const selectedScore = ref(6);
const selectedTags = ref(new Set());
const demoSaveLabel = ref('✅ Lưu tâm trạng & nhận gợi ý');

const glowingMood = ref(null);
function demoMoodBtnStyle(emoji) {
  const style = {};
  if (selectedMood.value === emoji) {
    style.transform = `scale(${1 + selectedScore.value / 20})`;
  }
  if (glowingMood.value === emoji) {
    style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  }
  return style;
}

function selectDemoMood(emoji) {
  selectedMood.value = emoji;
  glowingMood.value = emoji;
  setTimeout(() => {
    if (glowingMood.value === emoji) glowingMood.value = null;
  }, 500);
}

function toggleDemoTag(tag) {
  const next = new Set(selectedTags.value);
  if (next.has(tag)) next.delete(tag);
  else next.add(tag);
  selectedTags.value = next;
}

function saveDemoMood() {
  if (!selectedMood.value) {
    alert('Vui lòng chọn một biểu tượng cảm xúc để cho PeaceCat biết bạn đang cảm thấy thế nào nhé! 🐱');
    return;
  }

  const entry = {
    date: new Date().toISOString(),
    mood: selectedMood.value,
    score: selectedScore.value,
    tags: Array.from(selectedTags.value).map((tag) => {
      const clean = tag.replace(/[^\p{L}\p{M}\s0-9]/gu, '').trim();
      return clean === 'Không rõ' ? 'Khong_ro' : clean;
    }),
    createdAt: Date.now()
  };

  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('PeaceFlow_logs') || '[]');
  } catch (_) {}

  logs.push(entry);
  localStorage.setItem('PeaceFlow_logs', JSON.stringify(logs));

  demoSaveLabel.value = '✅ Đã lưu! Đang chuyển đến vườn tâm hồn...';

  setTimeout(() => {
    window.location.href = isAuthenticated.value ? '/mood-checkin' : '/signup';
  }, 1000);
}

function closeAuthDropdownOnOutsideClick(event) {
  const menu = document.querySelector('.nav-auth-menu');
  if (menu && !menu.contains(event.target)) navDropdownOpen.value = false;
}

onMounted(() => {
  document.addEventListener('click', closeAuthDropdownOnOutsideClick);
  auth.waitForAuth();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeAuthDropdownOnOutsideClick);
  // Lưới an toàn: router-link trong mobile-nav-panel điều hướng đi luôn mà không
  // gọi closeMobileNav() trước, nếu không reset ở đây body sẽ bị kẹt overflow:hidden.
  document.body.style.overflow = '';
});
</script>

<style scoped src="../assets/index-landing.css"></style>
