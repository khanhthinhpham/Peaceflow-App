<template>
  <div class="emergency-page">
    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible }">✅ <span>{{ toastText }}</span></div>

    <!-- Task Detail Modal -->
    <div class="modal-overlay" :class="{ show: modalOpen }" @click="closeTaskModalOnBackdrop">
      <div class="task-modal">
        <button class="tm-close" @click="closeTaskModal">✕</button>
        <div class="tm-icon">{{ activeTask?.icon }}</div>
        <div class="tm-title">{{ activeTask?.title }}</div>
        <div class="tm-desc">{{ activeTask?.desc }}</div>
        <div class="tm-steps">
          <div v-for="(step, idx) in activeTask?.steps || []" :key="idx" class="tm-step">
            <div class="tm-step-num">{{ idx + 1 }}</div>
            <div class="tm-step-text">{{ step }}</div>
          </div>
        </div>
        <div class="tm-timer" v-if="activeTask?.time?.includes('phút')">
          <div class="tm-timer-num">{{ modalTimerLabel }}</div>
          <div class="tm-timer-label">Thời gian còn lại</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button
            v-if="!modalTimerRunning"
            style="padding:10px 24px;border:2px solid var(--mint-dark);border-radius:50px;background:var(--mint);color:var(--text-primary);font-family:'Nunito',sans-serif;font-size:0.85rem;font-weight:700;cursor:pointer;"
            @click="startModalTimer"
          >▶ Bắt đầu</button>
          <button
            style="padding:10px 20px;border:2px solid var(--kraft-light);border-radius:50px;background:transparent;color:var(--text-secondary);font-family:'Nunito',sans-serif;font-size:0.82rem;font-weight:600;cursor:pointer;"
            @click="closeTaskModal"
          >Đóng</button>
        </div>
      </div>
    </div>

    <main class="main-content">
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <span>🆘 Hỗ trợ khẩn cấp</span>
      </div>

      <!-- Hero -->
      <div class="hero-section">
        <div class="hs-deco1">❤️</div>
        <div class="hs-deco2">🌿</div>
        <div class="hs-heart">❤️</div>
        <div class="hs-title">Bạn <span>không đơn độc</span></div>
        <div class="hs-subtitle">Dù bạn đang cảm thấy thế nào lúc này — chúng tôi ở đây bên bạn. Hãy thở chậm lại và chọn một hành động nhỏ bên dưới. Rồi chuyện này sẽ qua. 🌱</div>
        <div class="hs-reassure">💚 Bạn đã dũng cảm khi tìm kiếm sự giúp đỡ</div>
      </div>

      <!-- Hotlines -->
      <div class="section-title">📞 Liên hệ ngay — Miễn phí, 24/7</div>
      <div class="hotline-grid">
        <a href="tel:1800599920" class="paper-card hotline-card hc-main" @click="logHotlineView('1800599920')">
          <div class="hc-icon">📞</div>
          <div class="hc-num">0931773637</div>
          <div class="hc-label">Đường dây nóng sức khỏe tâm thần</div>
          <div class="hc-desc">Chuyên gia lắng nghe 24/7</div>
          <div class="hc-badge">Miễn phí · Bảo mật</div>
        </a>
        <router-link to="/experts" class="paper-card hotline-card hc-expert">
          <div class="hc-icon">🩺</div>
          <div class="hc-num">Chat ngay</div>
          <div class="hc-label">Kết nối chuyên gia tâm lý</div>
          <div class="hc-desc">Đặt lịch hoặc chat ngay</div>
          <div class="hc-badge">Có chuyên gia online</div>
        </router-link>
        <a href="tel:115" class="paper-card hotline-card hc-rescue" @click="logHotlineView('115')">
          <div class="hc-icon">🚑</div>
          <div class="hc-num">115</div>
          <div class="hc-label">Cấp cứu y tế khẩn cấp</div>
          <div class="hc-desc">Khi cần hỗ trợ y tế ngay lập tức</div>
          <div class="hc-badge">Khẩn cấp</div>
        </a>
      </div>

      <div class="emergency-layout">
        <!-- LEFT -->
        <div>
          <!-- Breathing Exercise -->
          <div class="paper-card breathing-card">
            <div class="bc-title">💨 Hít thở để ổn định ngay — Thở vuông 4-4-4</div>
            <div class="bc-desc">Kỹ thuật này giúp hệ thần kinh bình tĩnh trong vòng 2 phút</div>
            <div class="breath-circle" :class="breathPhaseClass" @click="startBreathing">
              <span>{{ breathText }}</span>
            </div>
            <div class="breath-label">{{ breathLabel }}</div>
            <div class="breath-progress">
              <div v-for="i in 5" :key="i" class="bp-dot" :class="{ active: i <= breathCycle + 1 && isBreathing }"></div>
            </div>
            <div class="breath-controls">
              <button v-if="!isBreathing" class="bc-ctrl-btn bc-start" @click="startBreathing">▶ Bắt đầu thở</button>
              <button v-else class="bc-ctrl-btn bc-stop" @click="stopBreathing()">⏹ Dừng</button>
            </div>
          </div>

          <!-- Immediate Tasks -->
          <div class="section-title">⚡ Bài tập ổn định tức thì</div>
          <div class="task-grid">
            <div v-for="(t, idx) in EMERGENCY_TASKS" :key="idx" class="paper-card etask-card" @click="openTaskModal(idx)">
              <div class="etc-icon">{{ t.icon }}</div>
              <div class="etc-title">{{ t.title }}</div>
              <div class="etc-desc">{{ t.desc }}</div>
              <div class="etc-meta">
                <div class="etc-time">⏱ {{ t.time }}</div>
              </div>
              <button class="etc-btn" @click.stop="openTaskModal(idx)">▶ Bắt đầu</button>
            </div>
          </div>

          <!-- 5-4-3-2-1 Grounding -->
          <div class="paper-card grounding-card">
            <div class="section-title" style="margin-bottom:10px;">🌍 Bài tập 5-4-3-2-1 Grounding</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;">Kéo tâm trí trở về hiện tại — nhấn vào từng bước khi hoàn thành:</div>
            <div class="grounding-steps">
              <div v-for="(s, idx) in GROUNDING_STEPS" :key="idx" class="gs-item" :class="{ done: groundingDone.has(idx) }" @click="toggleGrounding(idx)">
                <div class="gs-num">{{ s.num }}</div>
                <div class="gs-content">
                  <div class="gs-title">{{ s.title }}</div>
                  <div class="gs-desc">{{ s.desc }}</div>
                </div>
                <div class="gs-check">✅</div>
              </div>
            </div>
            <div style="margin-top:10px;text-align:center;">
              <button
                style="padding:8px 20px;border:2px solid var(--mint-dark);border-radius:50px;background:var(--mint-light);color:var(--mint-dark);font-family:'Nunito',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;"
                @click="resetGrounding"
              >🔄 Làm lại từ đầu</button>
            </div>
          </div>

          <!-- Affirmations -->
          <div class="paper-card affirmation-card">
            <div class="ac-title">💬 Lời khẳng định tích cực</div>
            <div class="affirmation-text" @click="nextAffirmation">"{{ AFFIRMATIONS[affirmationIndex] }}"</div>
            <div class="ac-hint">👆 Nhấn để xem lời khẳng định tiếp theo</div>
          </div>

          <!-- Disclaimer -->
          <div style="padding:14px 16px;background:rgba(255,139,139,0.05);border:1.5px solid rgba(255,139,139,0.2);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;">
            ⚠️ <strong>Lưu ý quan trọng:</strong> Ứng dụng này cung cấp công cụ hỗ trợ sức khỏe tinh thần, KHÔNG phải dịch vụ y tế hoặc chẩn đoán lâm sàng. Nếu bạn đang trong tình trạng khẩn cấp hoặc có ý định tự hại, hãy gọi ngay <strong>0931773637</strong> hoặc <strong>115</strong>.
          </div>
        </div>

        <!-- RIGHT -->
        <div>
          <!-- Expert Quick Connect -->
          <div class="paper-card right-card">
            <div class="rc-title">🩺 Chuyên gia đang online</div>
            <div class="expert-quick">
              <div v-for="e in EXPERTS_ONLINE" :key="e.name" class="eq-item">
                <div class="eq-avatar">{{ e.avatar }}</div>
                <div class="eq-info">
                  <div class="eq-name">{{ e.name }}</div>
                  <div class="eq-status">{{ e.online ? '🟢 Đang online' : '⚫ Offline' }}</div>
                </div>
                <button class="eq-btn" @click="connectExpert(e.name)">{{ e.online ? 'Chat ngay' : 'Đặt lịch' }}</button>
              </div>
            </div>
            <router-link
              to="/experts"
              style="display:block;margin-top:8px;padding:9px;border:1.5px solid var(--lavender);border-radius:50px;text-align:center;font-size:0.78rem;font-weight:700;color:#8a6aaa;text-decoration:none;transition:var(--transition);background:var(--lavender-light);"
            >Xem tất cả chuyên gia →</router-link>
          </div>

          <!-- Safe Plan -->
          <div class="paper-card safe-plan-card">
            <div class="rc-title">📋 Kế hoạch an toàn cá nhân</div>
            <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">Khi cảm thấy không ổn, hãy làm theo thứ tự:</div>
            <div class="sp-step">
              <div class="sp-num">1</div>
              <div class="sp-text">Hít thở sâu 5 lần chậm rãi</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">2</div>
              <div class="sp-text">Gọi cho người thân hoặc bạn bè tin tưởng</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">3</div>
              <div class="sp-text">Gọi đường dây nóng 0931773637</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">4</div>
              <div class="sp-text">Chat với PeaceCat hoặc chuyên gia</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">5</div>
              <div class="sp-text">Đến cơ sở y tế gần nhất nếu cần</div>
            </div>
            <button
              style="width:100%;margin-top:10px;padding:8px;border:1.5px solid var(--mint-dark);border-radius:50px;background:var(--mint-dark);color:white;font-family:'Nunito',sans-serif;font-size:0.75rem;font-weight:700;cursor:pointer;"
              @click="editSafePlan"
            >✏️ Tùy chỉnh kế hoạch của tôi</button>
          </div>

          <!-- PeaceCat Message -->
          <div class="paper-card message-card">
            <div class="mc-mascot">🐱</div>
            <div class="mc-text" :style="{ opacity: peaceCatMessageOpacity }">{{ PeaceCAT_MESSAGES[peaceCatMessageIndex] }}</div>
          </div>

          <!-- Resources -->
          <div class="paper-card right-card">
            <div class="rc-title">📚 Tài nguyên hỗ trợ</div>
            <router-link to="/mood-chat" class="resource-item"><span class="ri-icon">💬</span><span class="ri-text">Chat với PeaceCat AI</span><span class="ri-arrow">›</span></router-link>
            <router-link to="/tasks" class="resource-item"><span class="ri-icon">🎮</span><span class="ri-text">Nhiệm vụ khẩn cấp</span><span class="ri-arrow">›</span></router-link>
            <router-link to="/journal" class="resource-item"><span class="ri-icon">📝</span><span class="ri-text">Viết nhật ký cảm xúc</span><span class="ri-arrow">›</span></router-link>
            <router-link to="/community" class="resource-item"><span class="ri-icon">👥</span><span class="ri-text">Chia sẻ với cộng đồng</span><span class="ri-arrow">›</span></router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const EMERGENCY_TASKS = [
  { icon: '🌊', title: 'Tách biệt môi trường', desc: 'Tìm một không gian yên tĩnh, ngồi xuống và đặt tay lên ngực.', time: '2-5 phút', steps: ['Rời khỏi không gian ồn ào', 'Tìm chỗ ngồi yên tĩnh', 'Đặt tay lên ngực, cảm nhận nhịp tim', 'Nhắm mắt và thở chậm 5 lần', 'Mở mắt, nhìn xung quanh'] },
  { icon: '🛑', title: 'Stop-Drop-Breathe', desc: 'Dừng mọi suy nghĩ tiêu cực và tập trung vào hơi thở ngay lập tức.', time: '1-2 phút', steps: ['STOP — Dừng lại hoàn toàn', 'DROP — Buông bỏ mọi suy nghĩ', 'BREATHE — Hít thở sâu 3 lần', 'Thay thế bằng: "Tôi an toàn. Tôi ổn."'] },
  { icon: '💧', title: 'Rửa mặt nước lạnh', desc: 'Nước lạnh kích hoạt phản xạ làm chậm nhịp tim, giảm lo âu ngay.', time: '1 phút', steps: ['Đến bồn rửa mặt', 'Mở nước lạnh', 'Rửa mặt 3-5 lần', 'Cảm nhận cảm giác mát lạnh', 'Nhìn vào gương và thở chậm'] },
  { icon: '☕', title: 'Cầm cốc nước ấm', desc: 'Nhiệt ấm giúp hệ thần kinh bình tĩnh và kéo tâm trí về hiện tại.', time: '3 phút', steps: ['Pha một cốc nước ấm hoặc trà', 'Cầm cốc bằng cả hai tay', 'Cảm nhận hơi ấm truyền qua lòng bàn tay', 'Hít thở mùi thơm nếu có', 'Uống từng ngụm chậm rãi'] },
  { icon: '🤲', title: 'Tha thứ cho bản thân', desc: 'Viết ra điều bạn đang tự trách và buông bỏ nó.', time: '3-5 phút', steps: ['Lấy giấy bút hoặc mở nhật ký', 'Viết: "Tôi đang tự trách mình vì..."', 'Viết tiếp: "Nhưng tôi tha thứ cho bản thân vì..."', 'Đọc to lên 3 lần', 'Xé tờ giấy đó đi (tượng trưng buông bỏ)'] },
  { icon: '🎵', title: 'Khóc nếu cần', desc: 'Khóc là cơ chế tự nhiên giải phóng căng thẳng — hãy cho phép bản thân.', time: 'Không giới hạn', steps: ['Tìm không gian riêng tư', 'Bật nhạc nhẹ nhàng nếu muốn', 'Cho phép bản thân khóc tự nhiên', 'Không phán xét cảm xúc của mình', 'Sau đó uống nước và nghỉ ngơi'] }
];

const GROUNDING_STEPS = [
  { num: '5', title: '5 thứ bạn NHÌN thấy', desc: 'Nhìn xung quanh và đặt tên 5 vật thể bạn thấy ngay lúc này' },
  { num: '4', title: '4 thứ bạn CÓ THỂ CHẠM', desc: 'Chạm vào 4 bề mặt khác nhau — bàn, ghế, quần áo, tường...' },
  { num: '3', title: '3 âm thanh bạn NGHE', desc: 'Lắng nghe và nhận ra 3 âm thanh đang xảy ra xung quanh bạn' },
  { num: '2', title: '2 mùi bạn NGỬI được', desc: 'Ngửi không khí, quần áo, hoặc bất cứ thứ gì gần bạn' },
  { num: '1', title: '1 thứ bạn NẾM được', desc: 'Uống một ngụm nước hoặc cảm nhận vị trong miệng' }
];

const AFFIRMATIONS = [
  'Mọi cảm xúc của tôi hiện tại đều hợp lệ và đáng được tôn trọng.',
  'Tôi cho phép bản thân mình được nghỉ ngơi mà không cảm thấy tội lỗi.',
  'Tôi buông bỏ những điều nằm ngoài tầm kiểm soát của mình.',
  'Điều này rồi cũng sẽ qua.',
  'Tôi không nhất thiết phải giải quyết mọi thứ ngay trong lúc này.',
  'Tôi chấp nhận rằng mình không hoàn hảo, và điều đó hoàn toàn ổn.',
  'Tôi hít vào sự bình tĩnh và thở ra những căng thẳng.',
  'Tôi đủ mạnh mẽ để vượt qua khoảnh khắc khó khăn này.',
  'Tôi đã từng vượt qua nhiều thử thách, và lần này tôi cũng sẽ làm được.',
  'Áp lực hiện tại là để tôi trưởng thành, không phải để quật ngã tôi.',
  'Tôi có khả năng tìm ra giải pháp cho mọi vấn đề tôi đối mặt.',
  'Sự lo lắng không làm thay đổi tương lai, nhưng sự bình tĩnh sẽ giúp tôi xử lý nó.',
  'Tôi tin tưởng vào khả năng xoay sở và khả năng phục hồi của bản thân.',
  'Tôi là người làm chủ tâm trí mình, không phải là nô lệ của nỗi sợ.',
  'Ngay lúc này, tôi đang an toàn.',
  'Tôi chọn tập trung vào từng bước nhỏ trước mắt thay vì lo lắng cho cả hành trình.',
  'Tôi làm chủ hơi thở của mình, và hơi thở sẽ dẫn lối tôi về sự bình yên.',
  'Quá khứ đã qua, tương lai chưa tới, tôi chỉ sống cho hiện tại này.',
  'Mỗi nhịp thở giúp tôi cảm thấy vững chãi và kết nối với mặt đất hơn.',
  'Thế giới vẫn đang vận hành, và tôi có quyền sống chậm lại một chút.',
  'Tôi chọn tin tưởng vào bản thân mình.'
];

const EXPERTS_ONLINE = [
  { name: 'ThS. Lan Anh', avatar: '👩‍⚕️', online: true },
  { name: 'BS. Minh Tâm', avatar: '🧑‍⚕️', online: true },
  { name: 'ThS. Hoài Phương', avatar: '👩', online: false }
];

const PeaceCAT_MESSAGES = [
  '"Mình ở đây bên bạn. Hãy thở chậm lại — bạn đang làm rất tốt khi tìm kiếm sự giúp đỡ. Từng bước nhỏ thôi nhé. 💚"',
  '"Bạn không cần mạnh mẽ một mình. Chỉ cần đi từng bước nhỏ trong lúc này thôi. 🌿"',
  '"Khoảnh khắc khó khăn này không kéo dài mãi. Mình sẽ ở đây cùng bạn. 🐱"',
  '"Bạn xứng đáng được an toàn, được lắng nghe và được yêu thương. ✨"'
];

async function logEmergencyEvent(eventType, payload = {}) {
  if (!auth.isAuthenticated) return;
  try {
    await apiClient.post('/emergency/log', { event_type: eventType, payload });
  } catch (_) {}
}

function logHotlineView(number) {
  logEmergencyEvent('hotline_view', { number });
}

// Toast
const toastVisible = ref(false);
const toastText = ref('');
let toastTimer = null;
function showToast(message) {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, 3000);
}

// Breathing
const BREATH_PHASES = [
  { label: 'Hít vào... (4 giây)', class: 'inhale', text: 'Hít vào', duration: 4000 },
  { label: 'Giữ hơi... (4 giây)', class: 'hold', text: 'Giữ', duration: 4000 },
  { label: 'Thở ra... (4 giây)', class: 'exhale', text: 'Thở ra', duration: 4000 },
  { label: 'Nghỉ... (2 giây)', class: '', text: 'Nghỉ', duration: 2000 }
];
const isBreathing = ref(false);
const breathPhaseIdx = ref(0);
const breathCycle = ref(0);
const breathPhaseClass = ref('');
const breathText = ref('Bắt đầu');
const breathLabel = ref('Nhấn vào vòng tròn để bắt đầu');
let breathTimeout = null;

function startBreathing() {
  if (isBreathing.value) return;
  isBreathing.value = true;
  breathPhaseIdx.value = 0;
  breathCycle.value = 0;
  logEmergencyEvent('breathing_tool');
  runBreathPhase();
}

function runBreathPhase() {
  const phase = BREATH_PHASES[breathPhaseIdx.value];
  breathPhaseClass.value = phase.class;
  breathLabel.value = phase.label;
  breathText.value = phase.text;
  breathTimeout = setTimeout(() => {
    breathTimeout = null;
    breathPhaseIdx.value = (breathPhaseIdx.value + 1) % BREATH_PHASES.length;
    if (breathPhaseIdx.value === 0) {
      breathCycle.value += 1;
      if (breathCycle.value >= 5) {
        stopBreathing(true);
        return;
      }
    }
    runBreathPhase();
  }, phase.duration);
}

function stopBreathing(completed = false) {
  if (breathTimeout) { clearTimeout(breathTimeout); breathTimeout = null; }
  breathPhaseClass.value = '';
  breathText.value = 'Bắt đầu';
  breathLabel.value = completed ? '🎉 Tuyệt vời! Bạn đã hoàn thành 5 vòng thở!' : 'Nhấn vào vòng tròn để bắt đầu';
  isBreathing.value = false;
  if (completed) showToast('🌬️ Hoàn thành bài thở! Bạn cảm thấy tốt hơn chưa?');
}

// Grounding
const groundingDone = ref(new Set());
function toggleGrounding(idx) {
  const next = new Set(groundingDone.value);
  if (next.has(idx)) next.delete(idx);
  else next.add(idx);
  groundingDone.value = next;
  if (groundingDone.value.size === GROUNDING_STEPS.length) {
    showToast('🌍 Tuyệt vời! Bạn đã hoàn thành bài tập Grounding 5-4-3-2-1!');
  }
}
function resetGrounding() {
  groundingDone.value = new Set();
}

// Affirmations
const affirmationIndex = ref(Math.floor(Math.random() * AFFIRMATIONS.length));
function nextAffirmation() {
  affirmationIndex.value = (affirmationIndex.value + 1) % AFFIRMATIONS.length;
}

// PeaceCat rotating message
const peaceCatMessageIndex = ref(0);
const peaceCatMessageOpacity = ref('1');
let peaceCatInterval = null;
function rotatePeaceCatMessage() {
  peaceCatInterval = setInterval(() => {
    peaceCatMessageOpacity.value = '0';
    setTimeout(() => {
      peaceCatMessageIndex.value = (peaceCatMessageIndex.value + 1) % PeaceCAT_MESSAGES.length;
      peaceCatMessageOpacity.value = '1';
    }, 400);
  }, 6000);
}

// Task modal
const modalOpen = ref(false);
const activeTaskIdx = ref(0);
const activeTask = computed(() => EMERGENCY_TASKS[activeTaskIdx.value]);
const modalTimerSeconds = ref(0);
const modalTimerRunning = ref(false);
let modalTimerInterval = null;

const modalTimerLabel = computed(() => {
  const m = Math.floor(modalTimerSeconds.value / 60).toString().padStart(2, '0');
  const s = (modalTimerSeconds.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

function openTaskModal(idx) {
  activeTaskIdx.value = idx;
  const t = EMERGENCY_TASKS[idx];
  modalTimerSeconds.value = t.time && t.time.includes('phút') ? (parseInt(t.time) * 60 || 120) : 0;
  modalOpen.value = true;
}

function closeTaskModalOnBackdrop(event) {
  if (event.target.classList.contains('modal-overlay')) closeTaskModal();
}

function closeTaskModal() {
  modalOpen.value = false;
  stopModalTimer();
}

function startModalTimer() {
  if (modalTimerInterval) return;
  modalTimerRunning.value = true;
  modalTimerInterval = setInterval(() => {
    modalTimerSeconds.value -= 1;
    if (modalTimerSeconds.value <= 0) {
      stopModalTimer();
      showToast('✨ Bài tập kết thúc! Bạn làm tốt lắm.');
    }
  }, 1000);
}

function stopModalTimer() {
  if (modalTimerInterval) {
    clearInterval(modalTimerInterval);
    modalTimerInterval = null;
  }
  modalTimerRunning.value = false;
}

// Misc actions
function connectExpert(name) {
  logEmergencyEvent('expert_request', { expert_name: name });
  showToast(`🚀 Đang kết nối với ${name}...`);
  setTimeout(() => router.push('/experts'), 1500);
}

function editSafePlan() {
  showToast('📝 Tính năng tùy chỉnh kế hoạch sẽ sớm ra mắt!');
}

onMounted(() => {
  rotatePeaceCatMessage();
});

onBeforeUnmount(() => {
  if (breathTimeout) clearTimeout(breathTimeout);
  if (modalTimerInterval) clearInterval(modalTimerInterval);
  if (peaceCatInterval) clearInterval(peaceCatInterval);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped src="../assets/emergency.css"></style>
