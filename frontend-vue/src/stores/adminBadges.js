import { defineStore } from 'pinia';

// Số việc-chờ hiển thị trên các mục nav của sidebar admin — port từ shell.js's setAdminBadge().
export const useAdminBadgesStore = defineStore('adminBadges', {
  state: () => ({
    experts: 0,
    payments: 0,
    community: 0
  }),
  actions: {
    setBadge(key, count) {
      this[key] = Number(count) || 0;
    }
  }
});
