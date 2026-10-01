<template>
  <div :style="sidebarCollapsed ? { '--sidebar-width': '0px' } : {}">
    <div v-if="sidebarOpen" class="sidebar-overlay open" @click="sidebarOpen = false"></div>
    <MobileTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <Sidebar
      :sidebar-open="sidebarOpen"
      :collapsed="sidebarCollapsed"
      @navigate="sidebarOpen = false"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />
    <button
      type="button"
      class="sidebar-toggle-btn"
      :class="{ collapsed: sidebarCollapsed }"
      :title="sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')"
      @click="sidebarCollapsed = !sidebarCollapsed"
    >{{ sidebarCollapsed ? '▶' : '◀' }}</button>

    <div class="shell-host">
      <router-view />
    </div>

    <NotificationPanel />
    <ToastStack />
    <PushPromptModal />
    <DonateModal />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Sidebar from '../components/Sidebar.vue';
import MobileTopbar from '../components/MobileTopbar.vue';
import NotificationPanel from '../components/NotificationPanel.vue';
import ToastStack from '../components/ToastStack.vue';
import PushPromptModal from '../components/PushPromptModal.vue';
import DonateModal from '../components/DonateModal.vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';

const { t } = useI18n();
const sidebarOpen = ref(false);

const SIDEBAR_COLLAPSED_KEY = 'pf_sidebar_collapsed';
const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
watch(sidebarCollapsed, (val) => {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, val ? '1' : '0');
});

const route = useRoute();
watch(() => route.fullPath, () => { sidebarOpen.value = false; });

const auth = useAuthStore();
const notif = useNotificationsStore();
auth.waitForAuth().then(() => notif.init());
</script>

<style scoped>
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(74, 55, 40, 0.3);
  z-index: 150;
}
.sidebar-overlay.open { display: block; }
.sidebar-toggle-btn {
  display: none;
}
@media (min-width: 901px) {
  .sidebar-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 24px;
    left: calc(var(--sidebar-width, 240px) - 14px);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--kraft-light);
    background: var(--warm-white);
    color: var(--text-secondary);
    font-size: 0.7rem;
    cursor: pointer;
    z-index: 210;
    box-shadow: 1px 1px 0px rgba(74, 55, 40, 0.15);
    transition: left 0.3s ease, background 0.2s ease;
  }
  .sidebar-toggle-btn.collapsed {
    left: 10px;
  }
  .sidebar-toggle-btn:hover {
    background: var(--mint-light);
    border-color: var(--mint);
  }
}
.shell-host {
  margin-left: var(--sidebar-width, 240px);
  width: calc(100vw - var(--sidebar-width, 240px));
  min-height: 100vh;
  position: relative;
  transition: margin-left 0.3s ease, width 0.3s ease;
  background: var(--warm-white);
  /* Android 15+ (target SDK 35+) buộc edge-to-edge — nội dung vẽ tràn xuống dưới cả
     thanh điều hướng hệ thống nếu không tự chừa. Trên web env(...) = 0px, không đổi gì. */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .shell-host {
    margin-left: 0;
    width: 100vw;
    margin-top: calc(60px + env(safe-area-inset-top, 0px));
    min-height: calc(100vh - 60px - env(safe-area-inset-top, 0px));
  }
}
</style>
