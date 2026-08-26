<template>
  <main class="onboarding-page">
    <div class="progress-bar-container"><div class="progress-bar-fill" :style="{ width: `${progress}%` }" /></div>
    <router-link to="/dashboard" class="onboarding-logo"><div class="logo-icon">🌿</div><div class="logo-text">Peace<span>Flow</span></div></router-link>
    <div class="step-dots">
      <button v-for="(label, index) in stepLabels" :key="label" class="step-dot" :class="{ active: step === index, done: step > index }" :title="label" :aria-label="label" :style="index === 1 ? { display: 'none' } : undefined" @click="goToStep(index)" />
    </div>
    <div v-for="(emoji, index) in decorations" :key="index" class="bg-deco" :class="`bg-deco-${index + 1}`">{{ emoji }}</div>

    <div class="onboarding-wrapper">
      <section v-show="step === 0" class="step-screen active">
        <div class="paper-card welcome-card">
          <div class="welcome-scene"><div class="w-sun" /><div class="w-cloud w-cloud-1" /><div class="w-cloud w-cloud-2" /><div class="w-mountain-back" /><div class="w-mountain-front" /><div class="w-ground" /><div class="w-mascot"><div class="w-mascot-body"><div class="w-mascot-ears"><div class="w-mascot-ear" /><div class="w-mascot-ear" /></div><div class="w-mascot-eyes"><div class="w-mascot-eye" /><div class="w-mascot-eye" /></div><div class="w-mascot-mouth" /></div></div></div>
          <p class="handwritten welcome-quote">{{ quote }}</p>
          <h1 class="welcome-title">Bạn <span class="hl">không hề đơn độc</span><br>trên hành trình này 🌿</h1>
          <p class="welcome-sub">PeaceFlow đồng hành cùng bạn — nhẹ nhàng, không phán xét, từng bước một.<br>Chỉ mất <strong>2 phút</strong> để bắt đầu.</p>
          <div class="welcome-stats"><div><strong>10K+</strong><span>Người dùng</span></div><div><strong>50+</strong><span>Bài tập</span></div><div><strong>30+</strong><span>Chuyên gia</span></div></div>
          <div class="step-nav center"><button class="btn-next" @click="goToStep(2)">🚀 Bắt đầu hành trình</button></div>
        </div>
      </section>

      <section v-show="step === 1" class="step-screen active">
        <div class="paper-card auth-card">
          <p style="font-size:1.8rem;margin-bottom:8px;">👋</p>
          <h2 class="step-title">Tạo tài khoản của bạn</h2>
          <p class="step-subtitle">Chọn cách đăng ký phù hợp — nhanh chóng và bảo mật</p>

          <div class="auth-options">
            <button class="auth-btn" @click="selectAuth('google')">
              <span class="auth-icon">🔵</span>
              <span class="auth-label">Tiếp tục với Google</span>
              <span class="auth-arrow">›</span>
            </button>
            <button class="auth-btn" @click="selectAuth('apple')">
              <span class="auth-icon">🍎</span>
              <span class="auth-label">Tiếp tục với Apple</span>
              <span class="auth-arrow">›</span>
            </button>
          </div>

          <div class="auth-divider">hoặc đăng ký bằng email</div>

          <div class="auth-form">
            <input v-model="authEmail" type="email" class="form-input" placeholder="✉️  Email của bạn">
            <input v-model="authPassword" type="password" class="form-input" placeholder="🔒  Mật khẩu (tối thiểu 8 ký tự)">
            <button class="btn-next" style="width:100%;justify-content:center;" @click="nextStep">
              Tạo tài khoản →
            </button>
          </div>

          <div class="note-box sky">
            <span>🕵️</span>
            <span><strong>Muốn thử trước?</strong> Bạn có thể dùng thử ẩn danh — dữ liệu lưu trên thiết bị, đăng ký sau.</span>
          </div>
          <button class="btn-skip" style="display:block;text-align:center;margin-top:6px;width:100%;" @click="nextStep">
            Dùng thử ẩn danh →
          </button>
          <div class="note-box mint">
            <span>🔐</span>
            <span>Dữ liệu được <strong>mã hóa AES-256</strong>. Chỉ bạn mới có quyền truy cập. Chúng tôi không bao giờ bán dữ liệu cho bên thứ 3.</span>
          </div>

          <div class="step-nav" style="margin-top:18px;">
            <button class="btn-back" @click="previousStep">← Quay lại</button>
          </div>
        </div>
      </section>

      <section v-show="step === 2" class="step-screen active">
        <div class="paper-card profile-card"><p style="font-size:1.8rem;margin-bottom:8px;">😊</p><h2 class="step-title">Mình nên gọi bạn là gì?</h2><p class="step-subtitle">Chỉ vài câu hỏi nhỏ để mình hiểu bạn hơn nhé!</p>
          <div class="q-block"><div class="q-label"><span class="qi">🐱</span>Tên hoặc biệt danh của bạn?</div><input v-model="name" class="form-input" placeholder="Ví dụ: Minh, Hana, PeaceUser..."></div>
          <div class="q-block"><div class="q-label"><span class="qi">🎂</span>Bạn thuộc nhóm tuổi nào?</div><div class="age-options"><button v-for="item in ages" :key="item" class="option-chip" :class="{ selected: age === item }" @click="age = item">{{ item }}</button></div></div>
          <div class="q-block"><div class="q-label"><span class="qi">🎨</span>Chọn avatar Paper Flow của bạn</div><div class="avatar-grid"><button v-for="item in avatars" :key="item.name" class="avatar-option" :class="{ selected: avatar === item.emoji }" @click="avatar = item.emoji"><span class="av-emoji">{{ item.emoji }}</span><span class="av-name">{{ item.name }}</span></button></div></div>
          <div class="q-block"><div class="q-label"><span class="qi">💭</span>Điều gì đưa bạn đến đây hôm nay?</div><div class="reason-options"><button v-for="item in reasons" :key="item.text" class="reason-option" :class="{ selected: reason === item.text }" @click="reason = item.text"><span class="ri">{{ item.emoji }}</span><span class="rt">{{ item.text }}</span></button></div></div>
          <div class="step-nav"><button class="btn-back" @click="previousStep">← Quay lại</button><button class="btn-next" @click="nextStep">Tiếp tục →</button></div>
        </div>
      </section>

      <section v-show="step === 3" class="step-screen active"><div class="paper-card mindset-card"><p style="font-size:1.8rem;margin-bottom:8px;">🤝</p><h2 class="step-title">Cùng đồng hành đúng cách</h2><p class="mindset-intro">Trước khi bắt đầu, hãy cùng mình đọc qua 4 nguyên tắc nhỏ nhé. <strong>Nhấn vào từng thẻ</strong> để lật và đọc thêm — như lật trang nhật ký vậy 📖</p><div class="mindset-progress"><span>{{ readCards.size }}/4 thẻ đã đọc</span><div class="mindset-progress-bar"><div class="mindset-progress-fill" :style="{ width: `${readCards.size * 25}%` }" /></div></div><div class="flip-cards-container"><button v-for="(card, index) in mindsetCards" :key="card.title" class="flip-card" :class="{ flipped: readCards.has(index) }" @click="flipCard(index)"><span class="flip-card-front"><span class="fci">{{ card.emoji }}</span><span class="fct">{{ card.title }}</span><span class="fcc">✅</span><span class="fca">›</span></span><span class="flip-card-back">{{ card.description }}</span></button></div><div class="step-nav"><button class="btn-back" @click="previousStep">← Quay lại</button><button class="btn-next" @click="nextStep">Tôi đồng ý ✓</button></div></div></section>

      <section v-show="step === 4" class="step-screen active"><div class="paper-card device-card"><p style="font-size:1.8rem;margin-bottom:4px;">⌚</p><div class="optional-badge">✨ Tùy chọn</div><h2 class="step-title">Kết nối thiết bị thông minh</h2><p class="step-subtitle">Đồng bộ đồng hồ để PeaceFlow hiểu bạn chính xác hơn. Hoàn toàn có thể bỏ qua!</p><div class="data-collected"><strong>📊 Dữ liệu sẽ thu thập:</strong><div class="data-tags"><span v-for="tag in dataTags" :key="tag" class="data-tag">{{ tag }}</span></div></div><div class="device-list"><div v-for="device in devices" :key="device.name" class="device-item"><span class="di-icon">{{ device.icon }}</span><div class="di-info"><div class="di-name">{{ device.name }}</div><div class="di-desc">{{ device.desc }}</div></div><button class="di-btn" :class="{ connected: connectedDevices.has(device.name) }" :disabled="connectedDevices.has(device.name)" @click="connectDevice(device.name)">{{ connectedDevices.has(device.name) ? '✓ Đã kết nối' : 'Kết nối' }}</button></div></div><div class="step-nav"><button class="btn-back" @click="previousStep">← Quay lại</button><div style="display:flex;gap:10px;"><button class="btn-skip" @click="nextStep">Bỏ qua</button><button class="btn-next" @click="nextStep">Tiếp tục →</button></div></div></div></section>

      <section v-show="step === 5" class="step-screen active"><div class="paper-card complete-card"><div class="complete-anim"><div class="confetti-wrap"><i v-for="piece in confetti" :key="piece.id" class="cp" :style="piece.style" /></div><div class="complete-circle">🌿</div></div><h2 class="complete-title">Chào mừng, <span class="cn">{{ name.trim() || 'bạn ơi' }}</span>! 🎉</h2><p class="complete-desc">Hành trình của bạn chính thức bắt đầu rồi!<br>PeaceFlow sẽ luôn ở đây, đồng hành cùng bạn từng ngày. 💚</p><div class="complete-summary"><div v-for="item in summary" :key="item.label" class="cs-item"><div class="csi">{{ item.icon }}</div><div class="csl">{{ item.label }}</div><div class="csv">{{ item.value }}</div></div></div><div class="first-task"><div class="ft-label">🎯 Nhiệm vụ đầu tiên cho bạn</div><div class="ft-name">💨 Hít thở sâu — Bài tập 4-4-4</div><div class="ft-meta">⏱ 2 phút &nbsp;|&nbsp; ⭐ 10 XP &nbsp;|&nbsp; 🟢 Cấp 0 — Khẩn cấp</div></div><div class="onboarding-warning">⚠️ <strong>Lưu ý:</strong> Ứng dụng này là công cụ hỗ trợ, <strong>không thay thế chẩn đoán y khoa</strong>. Nếu bạn đang trong tình trạng khẩn cấp: <strong>📞 0931773637</strong> (Miễn phí, 24/7)</div><div class="step-nav center complete-actions"><button class="btn-next" @click="complete('mood-checkin')">🌿 Bắt đầu check-in tâm trạng</button><button class="dashboard-link" @click="complete('dashboard')">Đến Dashboard trước →</button></div></div></section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { apiClient } from '../lib/apiClient';

const router = useRouter();
const auth = useAuthStore();
const step = ref(0);
const name = ref(''); const age = ref(''); const avatar = ref(''); const reason = ref('');
const authEmail = ref(''); const authPassword = ref('');
const readCards = ref(new Set()); const connectedDevices = ref(new Set());
const quotes = ['"Ai cũng gặp stress ở một mức độ nào đó. Bạn không hề đơn độc."', '"Rồi chuyện này sẽ qua. Hãy bình tâm."', '"Hạnh phúc của bạn được tạo ra bởi chính bạn."', '"Mỗi ngày là một cơ hội mới để bắt đầu lại."', '"Chúng ta cần sự kiên nhẫn, từ từ và nhẫn nại."'];
const quote = ref(quotes[Math.floor(Math.random() * quotes.length)]); const progress = computed(() => step.value * 20);
const stepLabels = ['Chào mừng', 'Đăng ký', 'Hồ sơ', 'Cam kết', 'Thiết bị', 'Hoàn tất']; const decorations = ['🌿', '🦋', '🌸', '⭐', '🍃', '🌼'];
const ages = ['16 – 24 tuổi', '25 – 34 tuổi', '35 – 44 tuổi', '45 tuổi trở lên'];
const avatars = [{ emoji: '🐱', name: 'PeaceCat' }, { emoji: '🐻', name: 'CalmBear' }, { emoji: '🦊', name: 'WiseFox' }, { emoji: '🐰', name: 'HopBun' }, { emoji: '🦉', name: 'PeaceOwl' }, { emoji: '🐼', name: 'PeacePanda' }, { emoji: '🦋', name: 'FreeSpirit' }, { emoji: '🌱', name: 'GrowSeed' }];
const reasons = [{ emoji: '😰', text: 'Tôi đang cảm thấy căng thẳng' }, { emoji: '🔍', text: 'Tôi muốn hiểu bản thân hơn' }, { emoji: '✨', text: 'Tôi tò mò muốn thử' }, { emoji: '👥', text: 'Ai đó giới thiệu cho tôi' }];
const mindsetCards = [{ emoji: '🤖', title: 'AI chỉ hỗ trợ, không thay thế con người', description: 'PeaceFlow là người bạn đồng hành ảo — không phải bác sĩ, không chẩn đoán bệnh, không kê đơn thuốc. Khi cần hỗ trợ chuyên sâu, hãy kết nối với chuyên gia thật sự nhé.' }, { emoji: '💧', title: 'Đừng đè nén cảm xúc — hãy giải phóng nó', description: 'Mọi cảm xúc đều có giá trị — kể cả buồn, tức giận hay sợ hãi. Thay vì đè nén, hãy nhận ra và giải phóng chúng qua các hành động tích cực. Cảm xúc không phải kẻ thù.' }, { emoji: '🌱', title: 'Chỉ có bản thân mới giúp được chính mình', description: 'PeaceFlow tạo ra môi trường và công cụ, nhưng sức mạnh thật sự đến từ chính bạn. Mỗi bước nhỏ bạn thực hiện đều là chiến thắng của riêng bạn. Chúng mình chỉ ở đây để cổ vũ thôi! 🎉' }, { emoji: '🐢', title: 'Kiên nhẫn — từ từ và nhẫn nại', description: 'Thay đổi không xảy ra trong một đêm. Không sao nếu có ngày bạn không hoàn thành nhiệm vụ — chúng mình không phạt, chỉ thưởng thôi. Hãy đi theo nhịp của chính bạn. 🌿' }];
const dataTags = ['💓 Nhịp tim', '🧠 HRV', '😴 Giấc ngủ', '👟 Số bước', '🌡️ Nhiệt độ da'];
const devices = [{ icon: '⌚', name: 'Apple Watch', desc: 'Yêu cầu iOS 14+ và Apple Health' }, { icon: '🟢', name: 'Garmin', desc: 'Kết nối qua Garmin Connect API' }, { icon: '🔵', name: 'Fitbit', desc: 'Kết nối qua Fitbit Web API' }, { icon: '🟡', name: 'Google Fit / Samsung Health', desc: 'Đồng bộ dữ liệu sức khỏe Android' }];
const summary = [{ icon: '⭐', label: 'XP Khởi đầu', value: '+50 XP' }, { icon: '🌱', label: 'Huy hiệu', value: 'Mầm non' }, { icon: '📋', label: 'Nhiệm vụ', value: 'Sẵn sàng' }];
const confetti = ref([]);
function spawnConfetti() {
  const colors = ['#A8D5BA', '#FFCBA4', '#A8D8EA', '#C3AED6', '#FF8B8B', '#D4A574', '#C5E8D2'];
  confetti.value = Array.from({ length: 20 }, (_, id) => ({
    id,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 20}%`,
      background: colors[Math.floor(Math.random() * colors.length)],
      animationDelay: `${Math.random()}s`,
      animationDuration: `${1.5 + Math.random()}s`,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px'
    }
  }));
}

function replaceSet(target, item) { target.value = new Set([...target.value, item]); }
function flipCard(index) { const next = new Set(readCards.value); next.has(index) ? next.delete(index) : next.add(index); readCards.value = next; }
function connectDevice(device) { replaceSet(connectedDevices, device); }
async function saveProfile() {
  try {
    const me = {};
    if (name.value.trim()) me.display_name = name.value.trim();
    if (avatar.value) me.avatar_url = `emoji:${avatar.value}`;
    if (Object.keys(me).length) {
      await apiClient.put('/me', me);
      auth.user = { ...(auth.user || {}), ...me };
    }
    await apiClient.put('/profile', { goals: reason.value ? [reason.value] : [], onboarding_answers: { reason: reason.value || null } });
  } catch (e) {
    console.error('Save profile failed:', e);
  }
}
async function goToStep(index) {
  if (index < 0 || index > 5) return;
  const cur = step.value;
  if (cur === 2 && index > 2) {
    await saveProfile();
  }
  if (index >= 2) {
    try {
      await apiClient.put('/profile', { onboarding_answers: { started: true } });
      localStorage.setItem('peaceflow_onboarding_done', '1');
    } catch (e) {
      console.error('Mark onboarding started failed:', e);
    }
  }
  step.value = index;
  if (index === 5) setTimeout(spawnConfetti, 300);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function nextStep() { goToStep(step.value + 1); } function previousStep() { goToStep(step.value - 1); }
function selectAuth() { nextStep(); }
async function complete(destination) {
  try {
    await apiClient.put('/profile', { onboarding_answers: { completed: true } });
  } catch (e) {
    console.error('Mark onboarding failed:', e);
  }
  localStorage.setItem('peaceflow_onboarding_done', '1');
  await router.push({ name: destination });
}
onMounted(async () => { if (!await auth.waitForAuth()) { router.replace('/login'); return; } name.value = auth.user?.display_name || auth.user?.full_name || ''; });
</script>

<style scoped src="../assets/onboarding.css"></style>
<style scoped>
.welcome-stats { display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:16px; } .welcome-stats div { text-align:center; } .welcome-stats strong { display:block; font-size:1.4rem; color:var(--mint-dark); } .welcome-stats span { font-size:.75rem; color:var(--text-light); font-weight:600; }
.option-chip, .avatar-option, .reason-option, .flip-card { font:inherit; color:inherit; text-align:inherit; } .option-chip, .avatar-option, .reason-option { cursor:pointer; } .flip-card { border:0; padding:0; background:transparent; width:100%; } .flip-card-front, .flip-card-back { width:100%; }
.onboarding-warning { padding:12px 16px; background:var(--coral-light); border:1.5px solid var(--coral); border-radius:var(--border-radius-sm); font-size:.8rem; color:var(--text-secondary); margin-bottom:20px; }.complete-actions { flex-direction:column; gap:12px; }.dashboard-link { font-size:.85rem; color:var(--text-light); text-decoration:underline; background:none; border:0; cursor:pointer; }
</style>
