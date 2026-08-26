<template>
  <div class="admin-body">
    <div v-if="sidebarOpen" id="adminSidebarOverlay" class="sidebar-overlay admin-sidebar-overlay open" @click="sidebarOpen = false"></div>
    <AdminMobileTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <AdminSidebar :sidebar-open="sidebarOpen" />

    <div id="adminPageHost">
      <router-view v-if="ready" />
    </div>

    <NotificationPanel />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminSidebar from '../components/AdminSidebar.vue';
import AdminMobileTopbar from '../components/AdminMobileTopbar.vue';
import NotificationPanel from '../components/NotificationPanel.vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import '../assets/admin.css';

const sidebarOpen = ref(false);
const ready = ref(false);
const route = useRoute();
const router = useRouter();
watch(() => route.fullPath, () => { sidebarOpen.value = false; });

const auth = useAuthStore();
const notif = useNotificationsStore();

onMounted(async () => {
  const authenticated = await auth.waitForAuth();
  if (!authenticated) {
    router.replace('/login');
    return;
  }
  if (auth.user?.role !== 'admin') {
    router.replace('/dashboard');
    return;
  }
  ready.value = true;
  notif.init();
});
</script>

<style scoped>
.admin-body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 203, 164, 0.18), transparent 26%),
    radial-gradient(circle at bottom right, rgba(168, 213, 186, 0.18), transparent 30%),
    var(--cream);
  color: var(--text-primary);
}
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(74, 55, 40, 0.3);
  z-index: 150;
}
.sidebar-overlay.open { display: block; }
#adminPageHost {
  margin-left: var(--sidebar-width, 240px);
  min-height: 100vh;
}
@media (max-width: 860px) {
  #adminPageHost { margin-left: 0; padding-top: 60px; }
}
</style>
