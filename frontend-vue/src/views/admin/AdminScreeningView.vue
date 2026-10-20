<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Sàng lọc trường học</h1>
        <p class="admin-page-sub">Phiếu khảo sát/sàng lọc đầu năm — link cho học sinh: <code>{{ formUrl }}</code> <button type="button" class="btn-outline" style="padding:2px 8px;font-size:0.72rem;" @click="copyLink">Sao chép</button></p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:.72rem;font-weight:800;color:var(--text-light);text-transform:uppercase;">Sàng lọc HSSV:</span>
        <button type="button" class="btn-outline" :class="{ active: tab === 'responses' }" @click="tab = 'responses'">📋 Danh sách phiếu</button>
        <button type="button" class="btn-outline" :class="{ active: tab === 'summary' }" @click="tab = 'summary'">📊 Tổng hợp</button>
        <span style="font-size:.72rem;font-weight:800;color:var(--text-light);text-transform:uppercase;margin-left:8px;">Đăng ký hỗ trợ:</span>
        <button type="button" class="btn-outline" :class="{ active: tab === 'regResponses' }" @click="tab = 'regResponses'">📝 Danh sách</button>
        <button type="button" class="btn-outline" :class="{ active: tab === 'regSummary' }" @click="tab = 'regSummary'">📊 Tổng hợp</button>
        <button type="button" class="btn-outline" :class="{ active: tab === 'schools' }" @click="tab = 'schools'" style="margin-left:8px;">🏫 Trường</button>
      </div>
    </div>

    <!-- ===== Bộ lọc dùng chung (trường + khoảng ngày) ===== -->
    <div class="admin-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;" v-if="tab !== 'schools'">
      <div style="min-width:200px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Trường</label>
        <select v-model="filterSchoolId" class="admin-input">
          <option value="">Tất cả trường</option>
          <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div v-if="tab === 'responses'" style="min-width:150px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Mức độ</label>
        <select v-model="filterRiskBand" class="admin-input">
          <option value="">Tất cả</option>
          <option value="do">🔴 Đỏ</option>
          <option value="vang">🟡 Vàng</option>
          <option value="xanh">🟢 Xanh</option>
        </select>
      </div>
      <div v-if="tab === 'regResponses'" style="min-width:150px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Mức độ</label>
        <select v-model="filterRiskBand" class="admin-input">
          <option value="">Tất cả</option>
          <option value="do">🔴 Đỏ</option>
          <option value="vang">🟡 Vàng</option>
          <option value="xanh">🟢 Xanh</option>
          <option value="khac">Khác</option>
        </select>
      </div>
      <template v-if="tab === 'responses' || tab === 'summary'">
        <div style="width:160px;">
          <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Từ ngày</label>
          <input v-model="filterFrom" type="date" class="admin-input">
        </div>
        <div style="width:160px;">
          <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Đến ngày</label>
          <input v-model="filterTo" type="date" class="admin-input">
        </div>
      </template>
      <button type="button" class="btn-primary" @click="runFilter">🔍 Lọc</button>
      <button type="button" class="btn-outline" @click="resetFilter">Xoá lọc</button>
      <button v-if="tab === 'responses'" type="button" class="btn-outline" :disabled="exportingXlsx" @click="exportXlsx">⬇️ {{ exportingXlsx ? 'Đang xuất...' : 'Xuất Excel (2 sheet)' }}</button>
      <button v-if="tab === 'regResponses'" type="button" class="btn-outline" :disabled="exportingRegXlsx" @click="exportRegXlsx">⬇️ {{ exportingRegXlsx ? 'Đang xuất...' : 'Xuất Excel (2 sheet)' }}</button>
    </div>

    <!-- ===== Danh sách phiếu ===== -->
    <template v-if="tab === 'responses'">
      <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
      <div v-else-if="!items.length" class="admin-card admin-empty">Chưa có phiếu nào khớp bộ lọc.</div>
      <template v-else>
        <div v-for="item in items" :key="item.id" class="admin-card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;" @click="openDetail(item)">
          <span class="screening-band-dot" :class="`band-${item.risk_band}`"></span>
          <div style="flex:1 1 220px;min-width:0;">
            <span style="font-weight:800;">{{ item.student_name || 'Chưa rõ tên' }}{{ item.grade ? ` — Khối ${item.grade}${item.class_name ? ' / ' + item.class_name : ''}` : '' }}</span>
            <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">{{ item.school_name || 'Chưa rõ trường' }} · {{ dt(item.created_at) }}</div>
          </div>
          <div style="text-align:right;font-size:.85rem;font-weight:700;white-space:nowrap;flex-shrink:0;">
            <span :class="`screening-band-label band-${item.risk_band}`">{{ bandLabel(item.risk_band) }}</span>
            <div style="font-size:.72rem;color:var(--text-light);font-weight:400;">{{ item.wellbeing_total }}/30 điểm</div>
          </div>
        </div>
      </template>
      <AdminPager :page="page" :total-pages="totalPages" @go="load" />
    </template>

    <!-- ===== Tổng hợp ===== -->
    <template v-else-if="tab === 'summary'">
      <div v-if="summaryLoading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="summary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">
        <div class="admin-card">
          <h3 style="margin-top:0;">Tổng số phiếu: {{ summary.total }}</h3>
          <AdminChart type="pie" :labels="summary.byBand.map((r) => bandLabel(r.risk_band))" :values="summary.byBand.map((r) => r.count)" :colors="summary.byBand.map((r) => BAND_COLORS[r.risk_band])" />
        </div>
        <div class="admin-card">
          <h3 style="margin-top:0;">Khó khăn phổ biến</h3>
          <AdminChart v-if="summary.byDifficulty.length" type="bar" :labels="summary.byDifficulty.map((r) => difficultyLabel(r.difficulty))" :values="summary.byDifficulty.map((r) => r.count)" :height="Math.max(160, summary.byDifficulty.length * 34)" />
          <p v-else class="admin-empty" style="padding:8px 0;">Chưa có dữ liệu.</p>
        </div>
        <div class="admin-card">
          <h3 style="margin-top:0;">Nhu cầu hỗ trợ phổ biến</h3>
          <AdminChart v-if="summary.bySupportNeed.length" type="bar" :labels="summary.bySupportNeed.map((r) => supportNeedLabel(r.support_need))" :values="summary.bySupportNeed.map((r) => r.count)" :height="Math.max(160, summary.bySupportNeed.length * 34)" />
          <p v-else class="admin-empty" style="padding:8px 0;">Chưa có dữ liệu.</p>
        </div>
      </div>
      <p style="font-size:.78rem;color:var(--text-light);margin-top:12px;">Gửi báo cáo tự động hàng tháng cho đầu mối trường sẽ bổ sung sau khi có thông tin liên hệ — hiện tại dùng nút "Xuất CSV" ở tab Danh sách phiếu để gửi thủ công.</p>
    </template>

    <!-- ===== Đăng ký hỗ trợ: danh sách ===== -->
    <template v-else-if="tab === 'regResponses'">
      <div v-if="regLoading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="regLoadError" class="admin-card admin-empty" style="color:var(--coral);">{{ regLoadError }}</div>
      <div v-else-if="!regItems.length" class="admin-card admin-empty">Chưa có phiếu đăng ký nào khớp bộ lọc.</div>
      <template v-else>
        <div v-for="item in regItems" :key="item.id" class="admin-card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;" @click="openRegDetail(item)">
          <span class="screening-band-dot" :class="`band-${item.risk_level}`"></span>
          <div style="flex:1 1 220px;min-width:0;">
            <span style="font-weight:800;">{{ item.student_name }}{{ item.grade ? ` — Khối ${item.grade}${item.class_name ? ' / ' + item.class_name : ''}` : '' }}</span>
            <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">{{ item.school_name || item.school_other || 'Chưa rõ trường' }} · {{ dt(item.created_at) }}</div>
            <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">Người đăng ký: {{ informantLabel(item.informant) }} · {{ item.email }}</div>
          </div>
          <div style="text-align:right;font-size:.85rem;font-weight:700;white-space:nowrap;flex-shrink:0;">
            <span :class="`screening-band-label band-${item.risk_level}`">{{ bandLabel(item.risk_level) }}</span>
            <div style="font-size:.72rem;color:var(--text-light);font-weight:400;">{{ item.phone }}</div>
          </div>
        </div>
      </template>
      <AdminPager :page="regPage" :total-pages="regTotalPages" @go="loadReg" />
    </template>

    <!-- ===== Đăng ký hỗ trợ: tổng hợp ===== -->
    <template v-else-if="tab === 'regSummary'">
      <div v-if="regSummaryLoading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="regSummary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">
        <div class="admin-card">
          <h3 style="margin-top:0;">Tổng số phiếu: {{ regSummary.total }}</h3>
          <AdminChart type="pie" :labels="regSummary.byRisk.map((r) => bandLabel(r.risk_level))" :values="regSummary.byRisk.map((r) => r.count)" :colors="regSummary.byRisk.map((r) => BAND_COLORS[r.risk_level])" />
        </div>
        <div class="admin-card">
          <h3 style="margin-top:0;">Vấn đề phổ biến</h3>
          <AdminChart v-if="regSummary.byIssue.length" type="bar" :labels="regSummary.byIssue.map((r) => issueCategoryLabel(r.issue_category))" :values="regSummary.byIssue.map((r) => r.count)" :height="Math.max(160, regSummary.byIssue.length * 34)" />
          <p v-else class="admin-empty" style="padding:8px 0;">Chưa có dữ liệu.</p>
        </div>
        <div class="admin-card">
          <h3 style="margin-top:0;">Hình thức hỗ trợ mong muốn</h3>
          <AdminChart v-if="regSummary.bySupportFormat.length" type="bar" :labels="regSummary.bySupportFormat.map((r) => supportFormatLabel(r.support_format))" :values="regSummary.bySupportFormat.map((r) => r.count)" :height="Math.max(160, regSummary.bySupportFormat.length * 34)" />
          <p v-else class="admin-empty" style="padding:8px 0;">Chưa có dữ liệu.</p>
        </div>
      </div>
    </template>

    <!-- ===== Quản lý trường ===== -->
    <template v-else>
      <div class="admin-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div style="flex:1;min-width:180px;">
          <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Tên trường mới</label>
          <input v-model="newSchoolName" type="text" class="admin-input" placeholder="VD: THPT Nghi Lộc 1">
        </div>
        <div style="flex:1;min-width:180px;">
          <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Đầu mối (tên)</label>
          <input v-model="newSchoolContactName" type="text" class="admin-input" placeholder="Không bắt buộc">
        </div>
        <div style="flex:1;min-width:180px;">
          <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Email đầu mối</label>
          <input v-model="newSchoolContactEmail" type="email" class="admin-input" placeholder="Không bắt buộc">
        </div>
        <button type="button" class="btn-primary" :disabled="!newSchoolName.trim()" @click="createSchool">+ Thêm trường</button>
      </div>

      <div v-if="schoolsLoading" class="admin-card admin-empty">Đang tải...</div>
      <template v-else>
        <div v-for="s in schoolsFull" :key="s.id" class="admin-card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="flex:1 1 220px;min-width:0;">
            <span style="font-weight:800;">{{ s.name }}</span>
            <span v-if="!s.active" class="mb-badge" style="margin-left:8px;color:var(--coral-dark);background:var(--coral-light);">Đã ẩn</span>
            <div style="color:var(--text-secondary);font-size:.82rem;margin-top:3px;">{{ s.contact_name || 'Chưa có đầu mối' }}{{ s.contact_email ? ` · ${s.contact_email}` : '' }}</div>
          </div>
          <div style="font-size:.85rem;font-weight:700;">{{ s.response_count }} phiếu</div>
          <button type="button" class="btn-outline" @click="toggleSchoolActive(s)">{{ s.active ? 'Ẩn' : 'Hiện lại' }}</button>
        </div>
      </template>
    </template>

    <!-- ===== Chi tiết phiếu ===== -->
    <div class="ca-detail-overlay" :class="{ show: showDetail }">
      <div class="ca-detail-box" style="max-width:640px;">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">{{ detailItem?.student_name || 'Chưa rõ tên' }}</div>
            <div class="ca-detail-meta">{{ detailItem?.school_name }} · Khối {{ detailItem?.grade }} / {{ detailItem?.class_name }} · {{ dt(detailItem?.created_at) }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="showDetail = false">✕</button>
        </div>
        <template v-if="detailItem">
          <p><span :class="`screening-band-label band-${detailItem.risk_band}`">{{ bandLabel(detailItem.risk_band) }}</span> — {{ detailItem.wellbeing_total }}/30 điểm (Phần 2)</p>

          <h4>Khó khăn đang gặp</h4>
          <p v-if="!detailItem.difficulties.length && !detailItem.difficulties_other">Không ghi nhận.</p>
          <ul v-else>
            <li v-for="k in detailItem.difficulties" :key="k">{{ difficultyLabel(k) }}</li>
            <li v-if="detailItem.difficulties_other">Khác: {{ detailItem.difficulties_other }}</li>
          </ul>

          <h4>Nhu cầu hỗ trợ</h4>
          <p v-if="!detailItem.support_needs.length && !detailItem.support_needs_other">Không ghi nhận.</p>
          <ul v-else>
            <li v-for="k in detailItem.support_needs" :key="k">{{ supportNeedLabel(k) }}</li>
            <li v-if="detailItem.support_needs_other">Khác: {{ detailItem.support_needs_other }}</li>
          </ul>

          <h4>Chia sẻ thêm</h4>
          <p>{{ detailItem.share_note || 'Không có.' }}</p>
          <p>Đồng ý được liên hệ: <strong>{{ detailItem.consent_contact ? 'Có' : 'Không' }}</strong>{{ detailItem.contact ? ` · Liên hệ: ${detailItem.contact}` : '' }}</p>

          <template v-if="detailItem.referral_categories.length || detailItem.referral_risk_level">
            <h4>Phiếu đăng ký hỗ trợ</h4>
            <p v-if="detailItem.referral_categories.length">Vấn đề: {{ detailItem.referral_categories.map(referralCategoryLabel).join(', ') }}</p>
            <p v-if="detailItem.referral_risk_level">Tự nhận định mức độ: <span :class="`screening-band-label band-${detailItem.referral_risk_level}`">{{ bandLabel(detailItem.referral_risk_level) }}</span></p>
            <p v-if="detailItem.referral_support_format.length">Hình thức mong muốn: {{ detailItem.referral_support_format.map(supportFormatLabel).join(', ') }}</p>
            <p v-if="detailItem.referral_phone">SĐT: {{ detailItem.referral_phone }}</p>
            <p v-if="detailItem.referral_description">Mô tả: {{ detailItem.referral_description }}</p>
          </template>

          <p v-if="detailItem.confirm_note">Ghi chú xác nhận: {{ detailItem.confirm_note }}</p>
        </template>
      </div>
    </div>

    <!-- ===== Chi tiết phiếu đăng ký hỗ trợ ===== -->
    <div class="ca-detail-overlay" :class="{ show: showRegDetail }">
      <div class="ca-detail-box" style="max-width:640px;">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">{{ regDetailItem?.student_name }}</div>
            <div class="ca-detail-meta">{{ regDetailItem?.school_name || regDetailItem?.school_other }} · Khối {{ regDetailItem?.grade || regDetailItem?.grade_other }} / {{ regDetailItem?.class_name }} · {{ dt(regDetailItem?.created_at) }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="showRegDetail = false">✕</button>
        </div>
        <template v-if="regDetailItem">
          <p><span :class="`screening-band-label band-${regDetailItem.risk_level}`">{{ bandLabel(regDetailItem.risk_level) }}</span>{{ regDetailItem.risk_level_other ? ` — ${regDetailItem.risk_level_other}` : '' }}</p>
          <p>Người cung cấp thông tin: <strong>{{ informantLabel(regDetailItem.informant) }}</strong>{{ regDetailItem.informant_other ? ` (${regDetailItem.informant_other})` : '' }} · {{ regDetailItem.email }}</p>

          <h4>Vấn đề học sinh đang gặp phải</h4>
          <ul>
            <li v-for="k in regDetailItem.issue_categories" :key="k">{{ issueCategoryLabel(k) }}</li>
            <li v-if="regDetailItem.issue_categories_other">Khác: {{ regDetailItem.issue_categories_other }}</li>
          </ul>
          <p>{{ regDetailItem.issue_description }}</p>

          <h4>Hình thức mong muốn hỗ trợ</h4>
          <ul>
            <li v-for="k in regDetailItem.support_format" :key="k">{{ supportFormatLabel(k) }}</li>
            <li v-if="regDetailItem.support_format_other">Khác: {{ regDetailItem.support_format_other }}</li>
          </ul>

          <p>SĐT: {{ regDetailItem.phone }}</p>
          <p>Đồng ý cung cấp thông tin: <strong>{{ regDetailItem.consent ? 'Có' : 'Không' }}</strong></p>
          <p v-if="regDetailItem.confirm_note">Chia sẻ thêm: {{ regDetailItem.confirm_note }}</p>
        </template>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import ExcelJS from 'exceljs';
import { Chart, registerables } from 'chart.js';
import { apiClient } from '../../lib/apiClient';
import AdminPager from '../../components/AdminPager.vue';
import AdminChart from '../../components/AdminChart.vue';

Chart.register(...registerables);

const DIFFICULTY_LABELS = {
  ap_luc_hoc_tap: 'Áp lực học tập, thi cử', lo_lang_cang_thang: 'Lo lắng, căng thẳng',
  buon_chan_mat_hung_thu: 'Buồn chán, mất hứng thú', kho_kiem_soat_cam_xuc: 'Khó kiểm soát cảm xúc',
  mau_thuan_ban_be: 'Mâu thuẫn với bạn bè', mau_thuan_gia_dinh: 'Mâu thuẫn với cha mẹ/người thân',
  bi_treu_choc_bat_nat: 'Bị trêu chọc, bắt nạt hoặc cô lập', kho_khan_mang_xa_hoi: 'Khó khăn khi sử dụng mạng xã hội',
  kho_khan_dinh_huong_nghe_nghiep: 'Khó khăn về định hướng nghề nghiệp', kho_khan_hoan_canh_gia_dinh: 'Khó khăn về hoàn cảnh gia đình',
  khong_co_kho_khan: 'Không có khó khăn đáng kể'
};
const SUPPORT_NEED_LABELS = {
  ky_nang_quan_ly_cang_thang: 'Kỹ năng quản lý căng thẳng', ky_nang_hoc_tap: 'Kỹ năng học tập hiệu quả',
  ky_nang_dieu_hoa_cam_xuc: 'Kỹ năng điều hoà cảm xúc', ky_nang_giao_tiep: 'Kỹ năng giao tiếp và giải quyết mâu thuẫn',
  phong_chong_bao_luc: 'Phòng chống bạo lực học đường', an_toan_mang: 'An toàn trên môi trường mạng',
  tu_van_huong_nghiep: 'Tư vấn hướng nghiệp', tro_chuyen_rieng: 'Trò chuyện riêng với thầy/cô hoặc tổ tư vấn',
  khong_co_nhu_cau: 'Không có nhu cầu hiện tại'
};
const REFERRAL_CATEGORY_LABELS = { hoc_tap: 'Học tập', huong_nghiep: 'Hướng nghiệp', giao_tiep: 'Giao tiếp và các mối quan hệ', phat_trien_ban_than: 'Phát triển bản thân' };
const SUPPORT_FORMAT_LABELS = { tai_lieu: 'Tài liệu/hướng dẫn', tu_van_truong: 'Tư vấn/hỗ trợ tại trường', ket_noi_chuyen_gia: 'Kết nối chuyên gia', ho_tro_khan: 'Hỗ trợ khẩn' };
const BAND_LABELS = { do: '🔴 Đỏ — ưu tiên', vang: '🟡 Vàng — cần quan tâm', xanh: '🟢 Xanh — nhẹ', khac: 'Khác' };
const BAND_COLORS = { do: '#e05c5c', vang: '#e0a92d', xanh: '#4caf7d', khac: '#b9b2a4' };
const CHART_PALETTE = ['#4a9e8e', '#e0955a', '#8a6aaa', '#4a90aa', '#e05c5c', '#e0a92d', '#4caf7d', '#b9b2a4'];

// Vẽ 1 biểu đồ Chart.js lên canvas TẠM (không gắn vào DOM) để lấy ảnh PNG nhúng vào Excel —
// độc lập với các <AdminChart> đang hiển thị trên trang, nên export được dù đang đứng ở
// tab Danh sách (chưa mở tab Tổng hợp để các component chart kia được mount).
function renderChartImage({ type, labels, values, colors }, width = 480, height = 280) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const isPie = type === 'pie';
  const finalColors = colors && colors.length ? colors : labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);
  const chart = new Chart(canvas, {
    type,
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: isPie ? finalColors : finalColors[0],
        borderWidth: isPie ? 2 : 0,
        borderColor: isPie ? '#ffffff' : undefined
      }]
    },
    options: {
      responsive: false,
      animation: false,
      indexAxis: type === 'bar' ? 'y' : undefined,
      plugins: { legend: { display: isPie, position: 'right' } },
      scales: isPie ? undefined : { x: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();
  return dataUrl;
}

// `cursor` là { value: <row hiện tại> } — dùng object để hàm có thể tự tăng con trỏ dòng
// (truyền số nguyên thường thì không sửa được giá trị ở nơi gọi).
function addChartImage(wb, ws, cursor, chartSpec, width = 480, height = 280) {
  const dataUrl = renderChartImage(chartSpec, width, height);
  const imageId = wb.addImage({ base64: dataUrl.split(',')[1], extension: 'png' });
  ws.addImage(imageId, { tl: { col: 3, row: cursor.value }, ext: { width, height } });
  cursor.value += Math.ceil(height / 20) + 2;
}

async function downloadWorkbookBlob(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
const INFORMANT_LABELS = { hoc_sinh: 'Học sinh', cha_me: 'Cha/mẹ hoặc người thân', giao_vien: 'Giáo viên/cán bộ nhà trường', khac: 'Khác' };

const difficultyLabel = (k) => DIFFICULTY_LABELS[k] || k;
const supportNeedLabel = (k) => SUPPORT_NEED_LABELS[k] || k;
const referralCategoryLabel = (k) => REFERRAL_CATEGORY_LABELS[k] || k;
const issueCategoryLabel = (k) => REFERRAL_CATEGORY_LABELS[k] || k; // dùng chung keys với "Vấn đề học sinh đang gặp phải" của Đăng ký hỗ trợ
const supportFormatLabel = (k) => SUPPORT_FORMAT_LABELS[k] || k;
const informantLabel = (k) => INFORMANT_LABELS[k] || k;
const bandLabel = (b) => BAND_LABELS[b] || b;

function dt(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

const formUrl = computed(() => `${window.location.origin}/sang-loc-dau-nam`);
function copyLink() {
  navigator.clipboard?.writeText(formUrl.value).catch(() => {});
}

const tab = ref('responses');
const schools = ref([]);
async function loadSchoolsForFilter() {
  try {
    schools.value = await apiClient.get('/screening/schools', { noCache: true });
  } catch (_e) {
    schools.value = [];
  }
}

// ===== Danh sách phiếu =====
const filterSchoolId = ref('');
const filterRiskBand = ref('');
const filterFrom = ref('');
const filterTo = ref('');
const appliedFilters = ref({ schoolId: '', riskBand: '', from: '', to: '' });

const items = ref([]);
const page = ref(0);
const limit = 20;
const total = ref(0);
const loading = ref(false);
const loadError = ref('');
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

function buildQuery(extra = {}) {
  const qs = new URLSearchParams(extra);
  if (appliedFilters.value.schoolId) qs.set('schoolId', appliedFilters.value.schoolId);
  if (appliedFilters.value.riskBand) qs.set('riskBand', appliedFilters.value.riskBand);
  if (appliedFilters.value.from) qs.set('from', appliedFilters.value.from);
  if (appliedFilters.value.to) qs.set('to', appliedFilters.value.to);
  return qs;
}

async function load(p = page.value) {
  page.value = Math.max(0, p);
  loading.value = true;
  loadError.value = '';
  try {
    const qs = buildQuery({ limit: String(limit), offset: String(page.value * limit) });
    const data = await apiClient.get(`/admin/screening/responses?${qs.toString()}`, { noCache: true });
    items.value = (data?.items || []).map((it) => ({
      ...it,
      difficulties: it.difficulties || [],
      support_needs: it.support_needs || [],
      referral_categories: it.referral_categories || [],
      referral_support_format: it.referral_support_format || []
    }));
    total.value = data?.total || 0;
  } catch (_e) {
    loadError.value = 'Không tải được danh sách.';
  } finally {
    loading.value = false;
  }
}

const summary = ref(null);
const summaryLoading = ref(false);
async function loadSummary() {
  summaryLoading.value = true;
  try {
    const qs = buildQuery();
    summary.value = await apiClient.get(`/admin/screening/summary?${qs.toString()}`, { noCache: true });
  } catch (_e) {
    summary.value = null;
  } finally {
    summaryLoading.value = false;
  }
}

function runFilter() {
  appliedFilters.value = { schoolId: filterSchoolId.value, riskBand: filterRiskBand.value, from: filterFrom.value, to: filterTo.value };
  if (tab.value === 'summary') loadSummary();
  else if (tab.value === 'regResponses') loadReg(0);
  else if (tab.value === 'regSummary') loadRegSummary();
  else load(0);
}
function resetFilter() {
  filterSchoolId.value = '';
  filterRiskBand.value = '';
  filterFrom.value = '';
  filterTo.value = '';
  runFilter();
}

const exportingXlsx = ref(false);
async function exportXlsx() {
  exportingXlsx.value = true;
  try {
    const [summaryData, listData] = await Promise.all([
      apiClient.get(`/admin/screening/summary?${buildQuery().toString()}`, { noCache: true }),
      apiClient.get(`/admin/screening/responses?${buildQuery({ limit: '10000', offset: '0' }).toString()}`, { noCache: true })
    ]);

    const wb = new ExcelJS.Workbook();
    const wsSummary = wb.addWorksheet('Tổng hợp');
    wsSummary.addRow(['Tổng số phiếu', summaryData.total]);
    wsSummary.addRow([]);
    wsSummary.addRow(['Mức độ', 'Số lượng']);
    summaryData.byBand.forEach((r) => wsSummary.addRow([bandLabel(r.risk_band), r.count]));
    wsSummary.addRow([]);
    wsSummary.addRow(['Khó khăn phổ biến', 'Số lượng']);
    summaryData.byDifficulty.forEach((r) => wsSummary.addRow([difficultyLabel(r.difficulty), r.count]));
    wsSummary.addRow([]);
    wsSummary.addRow(['Nhu cầu hỗ trợ phổ biến', 'Số lượng']);
    summaryData.bySupportNeed.forEach((r) => wsSummary.addRow([supportNeedLabel(r.support_need), r.count]));

    const cursor = { value: 0 };
    addChartImage(wb, wsSummary, cursor, {
      type: 'pie',
      labels: summaryData.byBand.map((r) => bandLabel(r.risk_band)),
      values: summaryData.byBand.map((r) => r.count),
      colors: summaryData.byBand.map((r) => BAND_COLORS[r.risk_band])
    });
    if (summaryData.byDifficulty.length) {
      addChartImage(wb, wsSummary, cursor, {
        type: 'bar',
        labels: summaryData.byDifficulty.map((r) => difficultyLabel(r.difficulty)),
        values: summaryData.byDifficulty.map((r) => r.count)
      }, 480, Math.max(200, summaryData.byDifficulty.length * 26));
    }
    if (summaryData.bySupportNeed.length) {
      addChartImage(wb, wsSummary, cursor, {
        type: 'bar',
        labels: summaryData.bySupportNeed.map((r) => supportNeedLabel(r.support_need)),
        values: summaryData.bySupportNeed.map((r) => r.count)
      }, 480, Math.max(200, summaryData.bySupportNeed.length * 26));
    }

    const wsList = wb.addWorksheet('Danh sách phiếu');
    wsList.addRow(['Trường', 'Học sinh', 'Khối', 'Lớp', 'Giới tính', 'Điểm (Phần 2)', 'Mức độ', 'Khó khăn', 'Nhu cầu hỗ trợ', 'Đồng ý liên hệ', 'Liên hệ', 'Ngày gửi']);
    (listData.items || []).forEach((it) => {
      wsList.addRow([
        it.school_name || '', it.student_name || '', it.grade || '', it.class_name || '', it.gender || '',
        it.wellbeing_total, bandLabel(it.risk_band), (it.difficulties || []).map(difficultyLabel).join('; '),
        (it.support_needs || []).map(supportNeedLabel).join('; '), it.consent_contact ? 'Có' : 'Không', it.contact || '', dt(it.created_at)
      ]);
    });

    await downloadWorkbookBlob(wb, `sang-loc-truong-hoc-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (error) {
    alert(error.message || 'Không xuất được file.');
  } finally {
    exportingXlsx.value = false;
  }
}

// ===== Đăng ký hỗ trợ: danh sách =====
const regItems = ref([]);
const regPage = ref(0);
const regLimit = 20;
const regTotal = ref(0);
const regLoading = ref(false);
const regLoadError = ref('');
const regTotalPages = computed(() => Math.max(1, Math.ceil(regTotal.value / regLimit)));

function buildRegQuery(extra = {}) {
  const qs = new URLSearchParams(extra);
  if (appliedFilters.value.schoolId) qs.set('schoolId', appliedFilters.value.schoolId);
  if (appliedFilters.value.riskBand) qs.set('riskLevel', appliedFilters.value.riskBand);
  return qs;
}

async function loadReg(p = regPage.value) {
  regPage.value = Math.max(0, p);
  regLoading.value = true;
  regLoadError.value = '';
  try {
    const qs = buildRegQuery({ limit: String(regLimit), offset: String(regPage.value * regLimit) });
    const data = await apiClient.get(`/admin/support-registrations?${qs.toString()}`, { noCache: true });
    regItems.value = (data?.items || []).map((it) => ({
      ...it,
      issue_categories: it.issue_categories || [],
      support_format: it.support_format || []
    }));
    regTotal.value = data?.total || 0;
  } catch (_e) {
    regLoadError.value = 'Không tải được danh sách.';
  } finally {
    regLoading.value = false;
  }
}

const regSummary = ref(null);
const regSummaryLoading = ref(false);
async function loadRegSummary() {
  regSummaryLoading.value = true;
  try {
    const qs = buildRegQuery();
    regSummary.value = await apiClient.get(`/admin/support-registrations/summary?${qs.toString()}`, { noCache: true });
  } catch (_e) {
    regSummary.value = null;
  } finally {
    regSummaryLoading.value = false;
  }
}

const exportingRegXlsx = ref(false);
async function exportRegXlsx() {
  exportingRegXlsx.value = true;
  try {
    const [summaryData, listData] = await Promise.all([
      apiClient.get(`/admin/support-registrations/summary?${buildRegQuery().toString()}`, { noCache: true }),
      apiClient.get(`/admin/support-registrations?${buildRegQuery({ limit: '10000', offset: '0' }).toString()}`, { noCache: true })
    ]);

    const wb = new ExcelJS.Workbook();
    const wsSummary = wb.addWorksheet('Tổng hợp');
    wsSummary.addRow(['Tổng số phiếu', summaryData.total]);
    wsSummary.addRow([]);
    wsSummary.addRow(['Mức độ', 'Số lượng']);
    summaryData.byRisk.forEach((r) => wsSummary.addRow([bandLabel(r.risk_level), r.count]));
    wsSummary.addRow([]);
    wsSummary.addRow(['Vấn đề phổ biến', 'Số lượng']);
    summaryData.byIssue.forEach((r) => wsSummary.addRow([issueCategoryLabel(r.issue_category), r.count]));
    wsSummary.addRow([]);
    wsSummary.addRow(['Hình thức hỗ trợ mong muốn', 'Số lượng']);
    summaryData.bySupportFormat.forEach((r) => wsSummary.addRow([supportFormatLabel(r.support_format), r.count]));

    const cursor = { value: 0 };
    addChartImage(wb, wsSummary, cursor, {
      type: 'pie',
      labels: summaryData.byRisk.map((r) => bandLabel(r.risk_level)),
      values: summaryData.byRisk.map((r) => r.count),
      colors: summaryData.byRisk.map((r) => BAND_COLORS[r.risk_level])
    });
    if (summaryData.byIssue.length) {
      addChartImage(wb, wsSummary, cursor, {
        type: 'bar',
        labels: summaryData.byIssue.map((r) => issueCategoryLabel(r.issue_category)),
        values: summaryData.byIssue.map((r) => r.count)
      }, 480, Math.max(200, summaryData.byIssue.length * 26));
    }
    if (summaryData.bySupportFormat.length) {
      addChartImage(wb, wsSummary, cursor, {
        type: 'bar',
        labels: summaryData.bySupportFormat.map((r) => supportFormatLabel(r.support_format)),
        values: summaryData.bySupportFormat.map((r) => r.count)
      }, 480, Math.max(200, summaryData.bySupportFormat.length * 26));
    }

    const wsList = wb.addWorksheet('Danh sách đăng ký');
    wsList.addRow(['Trường', 'Học sinh cần hỗ trợ', 'Khối', 'Lớp', 'Người cung cấp thông tin', 'Email', 'Vấn đề', 'Mô tả', 'Mức độ', 'Hình thức hỗ trợ', 'SĐT', 'Ngày gửi']);
    (listData.items || []).forEach((it) => {
      wsList.addRow([
        it.school_name || it.school_other || '', it.student_name || '', it.grade || it.grade_other || '', it.class_name || '',
        informantLabel(it.informant), it.email || '', (it.issue_categories || []).map(issueCategoryLabel).join('; '), it.issue_description || '',
        bandLabel(it.risk_level), (it.support_format || []).map(supportFormatLabel).join('; '), it.phone || '', dt(it.created_at)
      ]);
    });

    await downloadWorkbookBlob(wb, `dang-ky-ho-tro-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (error) {
    alert(error.message || 'Không xuất được file.');
  } finally {
    exportingRegXlsx.value = false;
  }
}

const showRegDetail = ref(false);
const regDetailItem = ref(null);
function openRegDetail(item) {
  regDetailItem.value = item;
  showRegDetail.value = true;
}

// ===== Chi tiết =====
const showDetail = ref(false);
const detailItem = ref(null);
function openDetail(item) {
  detailItem.value = item;
  showDetail.value = true;
}

// ===== Quản lý trường =====
const schoolsFull = ref([]);
const schoolsLoading = ref(false);
const newSchoolName = ref('');
const newSchoolContactName = ref('');
const newSchoolContactEmail = ref('');

async function loadSchoolsFull() {
  schoolsLoading.value = true;
  try {
    schoolsFull.value = await apiClient.get('/admin/screening/schools', { noCache: true });
  } catch (_e) {
    schoolsFull.value = [];
  } finally {
    schoolsLoading.value = false;
  }
}

async function createSchool() {
  if (!newSchoolName.value.trim()) return;
  try {
    await apiClient.post('/admin/screening/schools', {
      name: newSchoolName.value.trim(),
      contactName: newSchoolContactName.value.trim() || null,
      contactEmail: newSchoolContactEmail.value.trim() || null
    });
    newSchoolName.value = '';
    newSchoolContactName.value = '';
    newSchoolContactEmail.value = '';
    await Promise.all([loadSchoolsFull(), loadSchoolsForFilter()]);
  } catch (error) {
    alert(error.message || 'Không tạo được trường.');
  }
}

async function toggleSchoolActive(school) {
  try {
    await apiClient.patch(`/admin/screening/schools/${school.id}`, { active: !school.active });
    school.active = !school.active;
    await loadSchoolsForFilter();
  } catch (error) {
    alert(error.message || 'Không cập nhật được.');
  }
}

onMounted(async () => {
  await loadSchoolsForFilter();
  load(0);
});

watch(tab, (next) => {
  if (next === 'summary' && !summary.value) loadSummary();
  if (next === 'schools' && !schoolsFull.value.length) loadSchoolsFull();
  if (next === 'regResponses' && !regItems.value.length) loadReg(0);
  if (next === 'regSummary' && !regSummary.value) loadRegSummary();
});
</script>

<style scoped src="../../assets/clientAssessments.css"></style>
<style scoped>
.screening-band-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}
.screening-band-dot.band-do { background: #e05c5c; }
.screening-band-dot.band-vang { background: #e0a92d; }
.screening-band-dot.band-xanh { background: #4caf7d; }
.screening-band-dot.band-khac { background: var(--kraft-light); }
.screening-band-label.band-do { color: #c93f3f; }
.screening-band-label.band-vang { color: #ad7f12; }
.screening-band-label.band-xanh { color: #2f8a5c; }
.screening-band-label.band-khac { color: var(--text-secondary); }
.btn-outline.active { background: var(--mint-light); border-color: var(--mint-dark); }
</style>
