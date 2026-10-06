<template>
  <div class="share-row">
    <span v-if="label !== false" class="sb-label">{{ label || t('share.label') }}</span>
    <a
      class="sb-icon-btn"
      :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`"
      target="_blank" rel="noopener"
      :title="'Facebook'" :aria-label="'Facebook'"
    ><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z"/></svg></a>
    <a
      class="sb-icon-btn"
      :href="`https://www.threads.net/intent/post?text=${encodeURIComponent(threadsText)}`"
      target="_blank" rel="noopener"
      :title="'Threads'" :aria-label="'Threads'"
    ><svg viewBox="0 0 192 192" fill="currentColor"><path d="M141.5 88.6c-.7-.3-1.4-.7-2.1-1 -1.2-21.8-13-34.3-32.9-34.4h-.3c-11.9 0-21.8 5.1-27.9 14.3l13.3 9.1c4.6-6.9 11.7-8.4 14.6-8.4h.2c6.1 0 10.7 1.8 13.7 5.4 2.2 2.6 3.7 6.2 4.5 10.7 -5.6-.9-11.7-1.2-18.1-.8 -18.2 1-29.9 11.6-29.1 26.3 .4 7.5 4.1 13.9 10.5 18.1 5.4 3.6 12.3 5.3 19.5 4.9 9.5-.5 17-4.1 22.1-10.7 3.9-5 6.4-11.5 7.5-19.7 4.5 2.7 7.9 6.3 9.7 10.6 3.1 7.3 3.3 19.3-6.4 29 -8.5 8.5-18.7 12.2-34.2 12.3 -17.2-.1-30.2-5.6-38.6-16.5 -7.9-10.2-11.9-24.8-12.1-43.6 .2-18.8 4.3-33.4 12.1-43.6 8.4-10.8 21.4-16.4 38.6-16.5 17.3.1 30.6 5.6 39.4 16.4 4.3 5.3 7.5 12 9.6 19.8l15.8-4.2c-2.5-9.8-6.9-18.4-13-25.8 -11.8-14.4-29.1-21.8-51.6-21.9h-.1c-22.4.1-39.5 7.5-50.8 22 -10.1 12.9-15.3 30.8-15.5 53.2v.1 .1c.2 22.4 5.4 40.3 15.5 53.2 11.3 14.5 28.4 21.9 50.8 22h.1c18.8-.1 32.1-5.1 43-16 12.5-12.5 12.1-28.2 8-37.7 -2.9-6.9-8.6-12.4-16.5-16.2zm-32 36.3c-8 .5-16.3-3.3-16.7-11.4 -.3-6 4.3-12.8 17.2-13.5 1.5-.1 3-.1 4.4-.1 4.8 0 9.2.5 13.3 1.4C126.1 118.3 118.3 124.3 109.5 124.9z"/></svg></a>
    <!-- Instagram không có link web để chia sẻ ngoài trực tiếp (chỉ nhận ảnh qua app di
         động) -> copy link để người dùng tự dán vào Story/Bio/tin nhắn. -->
    <button type="button" class="sb-icon-btn" @click="openInstagramModal" title="Instagram" aria-label="Instagram">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>
    </button>
    <!-- Dialog chính thức của Meta, chạy được qua trình duyệt (không cần cài app Messenger) —
         cần Facebook App ID riêng, xem FACEBOOK_APP_ID bên dưới. -->
    <a
      class="sb-icon-btn"
      :href="`https://m.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(url)}&display=touch`"
      target="_blank" rel="noopener"
      title="Messenger" aria-label="Messenger"
    ><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.15 2 11.26c0 2.91 1.45 5.51 3.72 7.21V22l3.4-1.87c.91.25 1.87.39 2.88.39 5.52 0 10-4.15 10-9.26C22 6.15 17.52 2 12 2zm1.01 12.47-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.91-2.72-5.47 5.82z"/></svg></a>
    <!-- Web Share API: bật khay chia sẻ GỐC của máy (Zalo/Telegram/SMS... nếu máy có cài),
         chỉ hiện khi trình duyệt hỗ trợ (chủ yếu mobile, desktop thường không có). -->
    <button v-if="canNativeShare" type="button" class="sb-icon-btn" @click="nativeShare" :title="t('share.moreBtn')" :aria-label="t('share.moreBtn')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/></svg>
    </button>
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
.sb-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}
.sb-icon-btn svg {
  width: 40px;
  height: 40px;
}
.sb-icon-btn:hover {
  transform: translateY(-1px);
  color: var(--mint-dark);
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
