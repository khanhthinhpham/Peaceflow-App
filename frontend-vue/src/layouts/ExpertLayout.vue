<template>
  <div class="expert-portal">
    <ExpertMobileTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <ExpertSidebar :sidebar-open="sidebarOpen" />
    <div v-if="sidebarOpen" class="sidebar-overlay expert-sidebar-overlay open" @click="sidebarOpen = false"></div>

    <div id="expertPageHost">
      <router-view v-if="ready" />
    </div>

    <NotificationPanel />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ExpertSidebar from '../components/ExpertSidebar.vue';
import ExpertMobileTopbar from '../components/ExpertMobileTopbar.vue';
import NotificationPanel from '../components/NotificationPanel.vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import '../assets/expertPortal.css';

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
  if (auth.user?.role !== 'expert') {
    router.replace('/dashboard');
    return;
  }

  ready.value = true;
  notif.init();
});
</script>
