<template>
  <div>
    <div v-if="sidebarOpen" class="sidebar-overlay open" @click="sidebarOpen = false"></div>
    <MobileTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <Sidebar :sidebar-open="sidebarOpen" @navigate="sidebarOpen = false" />

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
import Sidebar from '../components/Sidebar.vue';
import MobileTopbar from '../components/MobileTopbar.vue';
import NotificationPanel from '../components/NotificationPanel.vue';
import ToastStack from '../components/ToastStack.vue';
import PushPromptModal from '../components/PushPromptModal.vue';
import DonateModal from '../components/DonateModal.vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';

const sidebarOpen = ref(false);
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
.shell-host {
  margin-left: var(--sidebar-width, 240px);
  width: calc(100vw - var(--sidebar-width, 240px));
  min-height: 100vh;
  position: relative;
  background: var(--warm-white);
  /* Android 15+ (target SDK 35+) buộc edge-to-edge — nội dung vẽ tràn xuống dưới cả
     thanh điều hướng hệ thống nếu không tự chừa. Trên web env(...) = 0px, không đổi gì. */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
@media (max-width: 900px) {
  .shell-host {
    margin-left: 0;
    width: 100vw;
    margin-top: calc(60px + env(safe-area-inset-top, 0px));
    min-height: calc(100vh - 60px - env(safe-area-inset-top, 0px));
  }
}
</style>
