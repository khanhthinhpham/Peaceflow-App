import { defineStore } from 'pinia';

// Số việc-chờ hiển thị trên các mục nav của sidebar chuyên gia — cùng pattern với
// adminBadges.js bên admin.
export const useExpertBadgesStore = defineStore('expertBadges', {
  state: () => ({
    pendingBookings: 0
  }),
  actions: {
    setBadge(key, count) {
      this[key] = Number(count) || 0;
    }
  }
});
