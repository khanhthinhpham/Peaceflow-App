<template>
  <div class="share-row">
    <span v-if="label !== false" class="sb-label">{{ label || t('share.label') }}</span>
    <a
      class="sb-btn sb-fb"
      :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`"
      target="_blank" rel="noopener"
    >📘 Facebook</a>
    <a
      class="sb-btn sb-threads"
      :href="`https://www.threads.net/intent/post?text=${encodeURIComponent(threadsText)}`"
      target="_blank" rel="noopener"
    >🧵 Threads</a>
    <!-- Instagram không có link web để chia sẻ ngoài trực tiếp (chỉ nhận ảnh qua app di
         động) -> copy link để người dùng tự dán vào Story/Bio/tin nhắn. -->
    <button type="button" class="sb-btn sb-ig" @click="openInstagramModal">📸 Instagram</button>
    <!-- Dialog chính thức của Meta, chạy được qua trình duyệt (không cần cài app Messenger) —
         cần Facebook App ID riêng, xem FACEBOOK_APP_ID bên dưới. -->
    <a
      class="sb-btn sb-messenger"
      :href="`https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(url)}`"
      target="_blank" rel="noopener"
    >💬 Messenger</a>
    <!-- Web Share API: bật khay chia sẻ GỐC của máy (Zalo/Telegram/SMS... nếu máy có cài),
         chỉ hiện khi trình duyệt hỗ trợ (chủ yếu mobile, desktop thường không có). -->
    <button v-if="canNativeShare" type="button" class="sb-btn sb-more" @click="nativeShare">📤 {{ t('share.moreBtn') }}</button>
  </div>

  <div v-if="instagramModalOpen" class="sb-ig-overlay" @click.self="instagramModalOpen = false">
    <div class="sb-ig-modal">
      <div class="sb-ig-modal-title">📸 {{ t('share.instagramTitle') }}</div>
      <p class="sb-ig-modal-desc">{{ t('share.instagramDesc') }}</p>
      <div class="sb-ig-link-row">
        <input
          ref="instagramLinkInput"
          class="sb-ig-link-input"
          type="text"
          readonly
          :value="url"
          @click="$event.target.select()"
        >
        <button type="button" class="sb-ig-copy-btn" @click="copyShareLink">{{ copied ? t('share.copied') : t('share.copyBtn') }}</button>
      </div>
      <div class="sb-ig-modal-actions">
        <button type="button" class="sb-btn" @click="instagramModalOpen = false">{{ t('share.closeBtn') }}</button>
        <a class="sb-btn sb-ig" href="https://www.instagram.com/" target="_blank" rel="noopener" @click="instagramModalOpen = false">{{ t('share.openInstagramBtn') }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component dùng chung cho MỌI chỗ cần nút chia sẻ Facebook/Threads/Instagram trong app
// (bài viết "Góc chia sẻ", bài test tâm lý...) — tránh lặp lại y hệt code ở từng trang.
import { ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  url: { type: String, required: true },
  // Nội dung kèm theo khi share Threads (vd tiêu đề bài viết/bài test) — url luôn được tự
  // nhét thêm vào cuối, không cần caller tự ghép (xem threadsText bên dưới).
  text: { type: String, default: '' },
  // false để ẩn hẳn label (khi muốn tự đặt tiêu đề ở ngoài), bỏ qua thì dùng t('share.label').
  label: { type: [String, Boolean], default: null }
});

const { t } = useI18n();

// App "PeaceFlow Share" tạo ở developers.facebook.com, không gắn quyền/sản phẩm gì (chỉ để
// lấy App ID dùng cho dialog/send) — đọc từ VITE_FACEBOOK_APP_ID nếu cần đổi mà không sửa
// code, fallback về App ID thật đang dùng.
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '1435709022070369';

// Threads intent chỉ có 1 param "text" (không có "url" riêng như Facebook) -> phải tự nhét
// link vào cuối text thì Threads mới nhận diện ra link và tự tạo card preview.
const threadsText = computed(() => (props.text ? `${props.text}\n\n${props.url}` : props.url));

const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
async function nativeShare() {
  try {
    await navigator.share({ title: props.text || undefined, url: props.url });
  } catch (_e) {
    // Người dùng tự bấm huỷ khay chia sẻ -> navigator.share() reject bình thường, không
    // phải lỗi thật, không cần báo gì cả.
  }
}

const copied = ref(false);
let copiedTimer = null;
async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(props.url);
  } catch (_e) {
    // Clipboard API bị chặn (http không an toàn, quyền trình duyệt...) -> ô input readonly
    // đã tự select sẵn text, người dùng tự bấm Ctrl+C được.
  }
  copied.value = true;
  window.clearTimeout(copiedTimer);
  copiedTimer = window.setTimeout(() => { copied.value = false; }, 2400);
}

const instagramModalOpen = ref(false);
const instagramLinkInput = ref(null);
async function openInstagramModal() {
  instagramModalOpen.value = true;
  await copyShareLink();
  await nextTick();
  instagramLinkInput.value?.select();
}
</script>

<style scoped>
.share-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.sb-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-right: 4px;
}
.sb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--kraft-light);
  background: var(--warm-white);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
}
.sb-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-paper);
}
.sb-ig-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.sb-ig-modal {
  background: var(--warm-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-paper-lg);
  padding: 24px;
  max-width: 420px;
  width: 100%;
}
.sb-ig-modal-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin-bottom: 8px;
}
.sb-ig-modal-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 16px;
}
.sb-ig-link-row {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}
.sb-ig-link-input {
  flex: 1;
  min-width: 0;
  border: 1.5px solid var(--kraft-light);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 0.8rem;
  font-family: inherit;
  background: var(--cream);
  color: var(--text-primary);
}
.sb-ig-copy-btn {
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  background: var(--mint-dark);
  cursor: pointer;
}
.sb-ig-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
