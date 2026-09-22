<template>
  <main class="expert-main expert-dashboard-main">
    <header class="expert-topbar expert-dashboard-topbar">
      <div class="expert-topbar-copy">
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Quy trình lâm sàng</h1>
        <p class="expert-page-subtitle">Danh mục 25 quy trình từ tài liệu hướng dẫn Bộ Y tế, dành riêng cho chuyên gia.</p>
      </div>
    </header>
    <section class="expert-panel" style="margin-top:20px;">
      <div class="protocol-warning"><strong>Phạm vi sử dụng chuyên môn.</strong> Trang này hỗ trợ tra cứu và điều hướng; không thay thế quy trình cơ sở đã phê duyệt, thẩm quyền hành nghề, đánh giá chỉ định/chống chỉ định hoặc hồ sơ người bệnh.</div>
      <div class="protocol-filter">
        <button v-for="(label, key) in CLINICAL_PROTOCOL_GROUPS" :key="key" type="button" class="badge-pill catalog-filter-chip" :class="{ active: group === key }" @click="group = key">{{ label }}</button>
      </div>
      <div class="protocol-grid">
        <button v-for="protocol in filteredProtocols" :key="protocol.id" type="button" class="protocol-card" @click="selected = protocol">
          <span class="protocol-icon">{{ protocol.icon }}</span><span class="protocol-number">Quy trình {{ protocol.no }}</span><strong>{{ protocol.title }}</strong><span>{{ protocol.summary }}</span>
        </button>
      </div>
    </section>
    <div v-if="selected" class="protocol-overlay" @click.self="selected = null">
      <section class="protocol-detail">
        <button type="button" class="protocol-close" aria-label="Đóng" @click="selected = null">×</button>
        <div class="protocol-icon">{{ selected.icon }}</div><p class="protocol-number">Quy trình {{ selected.no }}</p><h2>{{ selected.title }}</h2><h3>Định nghĩa</h3><p>{{ selected.definition }}</p><h3>Hỗ trợ thực hiện</h3><p>{{ selected.summary }}</p>
        <div class="protocol-warning">Thực hiện theo toàn văn quy trình đã được cơ sở y tế phê duyệt, trong phạm vi chuyên môn và sau khi hoàn thiện đánh giá người bệnh/hồ sơ cần thiết.</div>
        <router-link v-if="selected.group === 'safety'" to="/emergency" class="btn-primary">Mở hỗ trợ khẩn cấp</router-link>
        <router-link v-else to="/expert/client-assessments" class="btn-primary">Mở đánh giá lâm sàng</router-link>
      </section>
    </div>
  </main>
</template>
<script setup>
import { computed, ref } from 'vue';
import { CLINICAL_PROTOCOLS, CLINICAL_PROTOCOL_GROUPS } from '../../lib/clinicalProtocols';
const group = ref('all');
const selected = ref(null);
const filteredProtocols = computed(() => group.value === 'all' ? CLINICAL_PROTOCOLS : CLINICAL_PROTOCOLS.filter((protocol) => protocol.group === group.value));
</script>
<style scoped>
.protocol-warning{padding:14px 16px;border:1.5px solid var(--peach);background:var(--peach-light);border-radius:12px;color:var(--text-primary);line-height:1.6}.protocol-filter{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.protocol-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px}.protocol-card{text-align:left;border:1.5px solid var(--kraft-light);border-radius:14px;background:white;padding:16px;color:var(--text-primary);font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:8px}.protocol-card:hover{transform:translateY(-2px);border-color:var(--mint)}.protocol-card>span:last-child{font-size:.82rem;color:var(--text-secondary);line-height:1.5}.protocol-icon{font-size:1.55rem}.protocol-number{color:var(--mint-dark);font-size:.75rem;font-weight:800}.protocol-overlay{position:fixed;inset:0;z-index:600;background:rgba(41,50,45,.48);padding:24px;display:flex;align-items:center;justify-content:center}.protocol-detail{position:relative;max-width:600px;width:100%;max-height:90vh;overflow:auto;background:white;border-radius:18px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.2)}.protocol-detail h2{margin:8px 0 12px}.protocol-detail p{line-height:1.65;white-space:pre-line}.protocol-detail .btn-primary{display:inline-block;margin-top:18px;text-decoration:none}.protocol-close{position:absolute;top:12px;right:14px;border:0;background:none;font-size:2rem;cursor:pointer;color:var(--text-secondary)}@media(max-width:640px){.protocol-overlay{padding:12px}.protocol-detail{padding:22px}}
</style>
