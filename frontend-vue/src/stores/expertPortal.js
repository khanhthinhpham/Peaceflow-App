import { defineStore } from 'pinia';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from './auth';

const DATA_TTL_MS = 20_000;

export const useExpertPortalStore = defineStore('expertPortal', {
  state: () => ({
    application: null,
    overview: null,
    loadedAt: 0
  }),

  actions: {
    async load({ force = false } = {}) {
      if (!force && this.overview && (Date.now() - this.loadedAt) < DATA_TTL_MS) {
        return { application: this.application, overview: this.overview };
      }

      const auth = useAuthStore();
      const [application, overview] = await Promise.all([
        auth.getMyExpertApplication(),
        apiClient.get('/expert-portal/overview', { noCache: true })
      ]);

      this.application = application;
      this.overview = overview;
      this.loadedAt = Date.now();
      return { application, overview };
    },

    invalidate() {
      this.application = null;
      this.overview = null;
      this.loadedAt = 0;
    }
  }
});
