import { defineStore } from 'pinia';
import { apiClient } from '../lib/apiClient';

export const PRESET_AMOUNTS = [20000, 50000, 100000, 200000];

export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

export const useDonateStore = defineStore('donate', {
  state: () => ({
    open: false,
    loading: false,
    error: null,
    bankInfo: null,
    selectedAmount: 50000
  }),

  getters: {
    qrUrl(state) {
      if (!state.bankInfo) return '';
      const bank = encodeURIComponent(state.bankInfo.bank_id);
      const acc = encodeURIComponent(state.bankInfo.account_no);
      const name = encodeURIComponent(state.bankInfo.account_name || 'PEACEFLOW');
      const info = encodeURIComponent('UNG HO PEACEFLOW');
      const amt = state.selectedAmount ? `&amount=${state.selectedAmount}` : '';
      return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?addInfo=${info}${amt}&accountName=${name}`;
    }
  },

  actions: {
    selectAmount(amount) {
      this.selectedAmount = amount;
    },

    close() {
      this.open = false;
    },

    async openModal() {
      this.open = true;
      if (this.bankInfo) return;

      this.loading = true;
      this.error = null;
      try {
        this.bankInfo = await apiClient.get('/donate/info', { noCache: true });
      } catch (_e) {
        this.error = 'Không tải được thông tin ủng hộ. Vui lòng thử lại.';
      } finally {
        this.loading = false;
      }
    }
  }
});
