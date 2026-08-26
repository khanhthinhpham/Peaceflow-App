<template>
  <div v-if="donate.open" class="donate-overlay" @click="handleOverlayClick">
    <div class="donate-box">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div style="font-size:1.6rem;">❤️</div>
          <h2 style="margin:4px 0 2px;font-size:1.2rem;font-weight:800;">Ủng hộ PeaceFlow</h2>
          <p style="margin:0;font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">
            Đóng góp của bạn giúp PeaceFlow tiếp tục miễn phí cho mọi người. Cảm ơn bạn 🌿
          </p>
        </div>
        <button type="button" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-light);line-height:1;" @click="donate.close()">✕</button>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 6px;">
        <button
          v-for="amt in PRESET_AMOUNTS"
          :key="amt"
          type="button"
          class="donate-amt"
          :class="{ 'donate-amt-active': donate.selectedAmount === amt }"
          @click="donate.selectAmount(amt)"
        >{{ formatMoney(amt) }}</button>
        <button
          type="button"
          class="donate-amt"
          :class="{ 'donate-amt-active': donate.selectedAmount === 0 }"
          @click="donate.selectAmount(0)"
        >Tuỳ tâm</button>
      </div>

      <div style="text-align:center;margin-top:12px;color:var(--text-secondary);font-size:0.85rem;">
        <template v-if="donate.loading">Đang tải mã QR…</template>
        <template v-else-if="donate.error">
          <span style="color:var(--coral);">{{ donate.error }}</span>
        </template>
        <template v-else-if="donate.bankInfo">
          <img :src="donate.qrUrl" alt="QR ủng hộ PeaceFlow" style="width:200px;height:200px;object-fit:contain;border:1px solid var(--kraft-light);border-radius:12px;background:#fff;">
          <div style="font-size:0.82rem;margin-top:10px;line-height:1.6;">
            Quét QR bằng app ngân hàng · Số tiền: <strong>{{ donate.selectedAmount ? formatMoney(donate.selectedAmount) : 'Tuỳ tâm' }}</strong>
          </div>
          <div style="font-size:0.8rem;color:var(--text-light);margin-top:8px;line-height:1.6;">
            {{ donate.bankInfo.account_name || '' }}<br>
            <strong style="font-family:monospace;">{{ donate.bankInfo.account_no || '' }}</strong> · {{ donate.bankInfo.bank_id || '' }}<br>
            Nội dung: <strong>UNG HO PEACEFLOW</strong>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDonateStore, PRESET_AMOUNTS, formatMoney } from '../stores/donate';

const donate = useDonateStore();

function handleOverlayClick(event) {
  if (event.target.classList.contains('donate-overlay')) donate.close();
}
</script>

<style scoped>
.donate-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(74, 55, 40, .4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}
.donate-box {
  background: var(--warm-white);
  border: 2px solid var(--kraft-light);
  border-radius: 18px;
  box-shadow: 4px 4px 0 rgba(74, 55, 40, .15);
  max-width: 380px;
  width: 100%;
  max-height: 92vh;
  overflow: auto;
  padding: 22px;
}
.donate-amt {
  flex: 1;
  min-width: 84px;
  padding: 9px 8px;
  border: 1.5px solid var(--kraft-light);
  background: var(--warm-white);
  border-radius: 10px;
  font-family: inherit;
  font-weight: 800;
  font-size: .85rem;
  cursor: pointer;
  color: var(--text-secondary);
}
.donate-amt:hover { background: var(--mint-light); }
.donate-amt.donate-amt-active { background: var(--mint); border-color: var(--mint-dark); color: var(--text-primary); }
</style>
