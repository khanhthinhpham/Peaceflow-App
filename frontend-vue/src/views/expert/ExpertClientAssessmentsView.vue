<template>
  <main class="expert-main expert-dashboard-main">
    <header class="expert-topbar expert-dashboard-topbar">
      <div class="expert-topbar-copy">
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Đánh giá lâm sàng</h1>
        <p class="expert-page-subtitle">Nhập điểm CARS hoặc SDQ-25 (bản quan sát) thay cho client trong các buổi tư vấn.</p>
      </div>
      <div class="expert-topbar-tools">
        <button type="button" class="expert-bell-btn" aria-label="Thông báo" @click="notif.togglePanel()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span class="expert-bell-badge" :style="{ display: notif.unread > 0 ? 'flex' : 'none' }">{{ Math.min(notif.unread, 9) }}</span>
        </button>
        <div class="expert-avatar-chip" aria-hidden="true">EX</div>
      </div>
    </header>

    <ExpertStatusBanner :message="banner.message" :type="banner.type" />

    <section class="expert-panel expert-section ca-selftest-panel">
      <div class="expert-section-head">
        <div>
          <h2 class="expert-section-title">Khách hàng tự làm test trên máy này</h2>
          <p class="expert-section-copy">Kết quả của những người đã tự làm bài test (SDQ-25, PSS, Raven...) khi đăng nhập tài khoản của bạn.</p>
        </div>
        <button type="button" class="ca-export-btn" :disabled="exportingAll" @click="exportAllSelfTests">{{ exportAllLabel }}</button>
      </div>
      <div class="ca-search-bar">
        <div class="ca-search-field grow">
          <label for="caSearchName">Tên người làm bài</label>
          <input v-model="searchName" type="search" id="caSearchName" class="form-input" placeholder="Nhập tên để tìm..." @keydown.enter="runSearch">
        </div>
        <div class="ca-search-field">
          <label for="caSearchCode">Bài test</label>
          <select v-model="searchCode" id="caSearchCode" class="form-input">
            <option value="">Tất cả bài test</option>
            <option v-for="t in SELF_TEST_CODES" :key="t.code" :value="t.code">{{ t.label }}</option>
          </select>
        </div>
        <div class="ca-search-field ca-search-age">
          <label for="caSearchAgeMin">Tuổi từ</label>
          <input v-model="searchAgeMin" type="number" id="caSearchAgeMin" class="form-input" min="0" max="120" placeholder="VD: 5">
        </div>
        <div class="ca-search-field ca-search-age">
          <label for="caSearchAgeMax">đến</label>
          <input v-model="searchAgeMax" type="number" id="caSearchAgeMax" class="form-input" min="0" max="120" placeholder="VD: 12">
        </div>
        <div class="ca-search-field ca-search-flagged">
          <label>&nbsp;</label>
          <label class="ca-flag-checkbox">
            <input v-model="searchFlagged" type="checkbox" @change="runSearch"> ⭐ Đã đánh dấu
          </label>
        </div>
        <div class="ca-search-actions">
          <button type="button" class="btn-primary" @click="runSearch">🔍 Tìm</button>
          <button type="button" class="btn-outline" @click="resetSearch">Xoá lọc</button>
          <button type="button" class="btn-outline" @click="togglePatientView">{{ patientViewActive ? '📋 Xem theo lần test' : '👤 Xem theo bệnh nhân' }}</button>
        </div>
      </div>

      <template v-if="!patientViewActive">
        <div id="caSelfTestList">
          <p v-if="selfTestLoading" class="ca-empty">Đang tải...</p>
          <p v-else-if="selfTestError" class="ca-empty">Không tải được danh sách.</p>
          <p v-else-if="!selfTestResults.length" class="ca-empty">{{ selfTestEmptyText }}</p>
          <div v-for="item in selfTestResults" :key="item.id" class="ca-selftest-item" @click="openDetailModal(item)">
            <button type="button" class="ca-flag-btn" :class="{ active: item.flagged }" :title="item.flagged ? 'Bỏ đánh dấu' : 'Đánh dấu'" @click.stop="toggleFlag(item)">{{ item.flagged ? '⭐' : '☆' }}</button>
            <div class="ca-selftest-main">
              <div class="ca-selftest-name">{{ item.respondent_name || 'Chưa rõ tên' }}{{ item.respondent_age ? ` — ${item.respondent_age} tuổi` : '' }}<span v-if="!item.is_owner" class="ca-shared-badge">🔗 Được chia sẻ</span></div>
              <div class="ca-selftest-meta">{{ item.name }} · {{ formatDateTime(item.created_at) }}</div>
              <div v-if="item.note" class="ca-selftest-note">Ghi chú: {{ item.note }}</div>
            </div>
            <div class="ca-selftest-score">{{ item.severity || 'Đã hoàn thành' }}<br>{{ item.total_score }}</div>
          </div>
        </div>
        <div id="caSelfTestPager" class="ca-pager">
          <template v-if="selfTestTotal">
            <span class="ca-pager-meta">{{ selfTestFrom }}–{{ selfTestTo }} trong {{ selfTestTotal }}</span>
            <template v-if="selfTestTotalPages > 1">
              <button type="button" class="ca-page-btn" :disabled="selfTestPage === 0" title="Trang đầu" @click="loadSelfTestResults(0)">« Đầu</button>
              <button type="button" class="ca-page-btn" :disabled="selfTestPage === 0" @click="loadSelfTestResults(selfTestPage - 1)">‹ Trước</button>
              <template v-for="(p, idx) in selfTestPageWindow" :key="idx">
                <span v-if="p === '…'" class="ca-page-ellipsis">…</span>
                <button v-else type="button" class="ca-page-btn" :class="{ active: p === selfTestPage }" @click="loadSelfTestResults(p)">{{ p + 1 }}</button>
              </template>
              <button type="button" class="ca-page-btn" :disabled="selfTestPage >= selfTestTotalPages - 1" @click="loadSelfTestResults(selfTestPage + 1)">Sau ›</button>
              <button type="button" class="ca-page-btn" :disabled="selfTestPage >= selfTestTotalPages - 1" title="Trang cuối" @click="loadSelfTestResults(selfTestTotalPages - 1)">Cuối »</button>
            </template>
          </template>
        </div>
      </template>
      <template v-else>
        <div id="caSelfTestList">
          <p v-if="patientLoading" class="ca-empty">Đang tải...</p>
          <p v-else-if="!patientGroups.length" class="ca-empty">Không có bệnh nhân nào khớp với bộ lọc.</p>
          <div v-for="g in patientGroups" :key="g.name + g.age" class="ca-patient-card" @click="openPatientModal(g)">
            <div>
              <div class="ca-patient-name">{{ g.name }}{{ g.age ? ` — ${g.age} tuổi` : '' }}</div>
              <div class="ca-patient-meta">Lần gần nhất: {{ formatDateTime(g.tests[0].created_at) }}</div>
            </div>
            <div class="ca-patient-count">{{ g.tests.length }} lần test</div>
          </div>
        </div>
      </template>
    </section>

    <section class="expert-panel expert-section ca-client-panel">
      <div class="expert-section-head">
        <div>
          <h2 class="expert-section-title">Chọn client</h2>
          <p class="expert-section-copy">Danh sách client suy ra từ các lịch hẹn đã xác nhận/hoàn thành với bạn.</p>
        </div>
      </div>
      <div id="caClientList">
        <p v-if="clientsLoading" class="ca-empty">Đang tải danh sách client...</p>
        <p v-else-if="clientsError" class="ca-empty">Không tải được danh sách client.</p>
        <p v-else-if="!clients.length" class="ca-empty">Bạn chưa có client nào (cần ít nhất 1 lịch hẹn đã xác nhận/hoàn thành).</p>
        <div v-else class="ca-client-grid">
          <div v-for="c in clients" :key="c.user_id" class="ca-client-card" :class="{ 'is-active': selectedClient?.user_id === c.user_id }" @click="selectClient(c.user_id)">
            <div class="ca-client-name">{{ c.full_name || 'Client' }}</div>
            <div class="ca-client-meta">{{ c.email || '' }}</div>
            <div class="ca-client-meta">Lịch gần nhất: {{ formatDateTime(c.last_booking_at) }}</div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="selectedClient" class="expert-panel expert-section ca-form-panel">
      <div class="expert-section-head">
        <div>
          <h2 class="expert-section-title">{{ formTitle }}</h2>
          <p class="expert-section-copy">Client: {{ selectedClient.full_name || selectedClient.email }}</p>
        </div>
        <div class="ca-test-switch">
          <button v-for="opt in TEST_SWITCH_OPTIONS" :key="opt.code" type="button" class="ca-switch-btn" :class="{ 'is-active': testType === opt.code }" @click="testType = opt.code">{{ opt.label }}</button>
        </div>
      </div>
      <div id="caFormBody">
        <template v-if="testType === 'CARS'">
          <div v-for="domain in CARS_DOMAINS" :key="domain.key" class="ca-domain">
            <div class="ca-domain-label">{{ domain.label }}</div>
            <div class="ca-scale-row">
              <button
                v-for="v in CARS_SCALE_VALUES"
                :key="v"
                type="button"
                class="ca-scale-btn"
                :class="{ 'is-half': !Number.isInteger(v), 'is-selected': carsAnswers[domain.key] === v }"
                @click="carsAnswers[domain.key] = v"
              >{{ v }}</button>
            </div>
            <div class="ca-domain-desc">{{ Number.isInteger(carsAnswers[domain.key]) ? (domain.levels[carsAnswers[domain.key]] || '') : '' }}</div>
          </div>
          <div class="ca-submit-row">
            <button type="button" class="btn-primary" @click="submitCars">Nộp đánh giá CARS</button>
          </div>
        </template>
        <template v-else>
          <div v-for="item in SDQ_OBS_ITEMS" :key="item.n" class="ca-sdq-item">
            <div class="ca-sdq-text">{{ item.n }}. {{ item.text }}</div>
            <div class="ca-sdq-opts">
              <button
                v-for="opt in SDQ_OBS_OPTIONS"
                :key="opt.label"
                type="button"
                class="ca-sdq-opt"
                :class="{ 'is-selected': sdqAnswers[item.n] === (item.reverse ? opt.reverse : opt.normal) }"
                @click="sdqAnswers[item.n] = (item.reverse ? opt.reverse : opt.normal)"
              >{{ opt.label }}</button>
            </div>
          </div>
          <div class="ca-submit-row">
            <button type="button" class="btn-primary" @click="submitSdqObs">Nộp đánh giá SDQ-25</button>
          </div>
        </template>
      </div>
    </section>
    <section v-if="selectedClient" class="expert-panel expert-section ca-history-panel">
      <div class="expert-section-head">
        <div>
          <h2 class="expert-section-title">Lịch sử đánh giá đã ghi cho client này</h2>
        </div>
      </div>
      <div id="caHistoryList">
        <p v-if="historyLoading" class="ca-empty">Đang tải lịch sử...</p>
        <p v-else-if="historyError" class="ca-empty">Không tải được lịch sử đánh giá.</p>
        <p v-else-if="!history.length" class="ca-empty">Chưa có đánh giá nào được bạn ghi cho client này.</p>
        <div v-for="item in history" :key="item.id" class="ca-history-item" @click="openDetailModal(item, selectedClient)">
          <span><strong>{{ item.name }}</strong> — {{ item.severity || 'Đã hoàn thành' }} ({{ item.total_score }})</span>
          <span>{{ formatDateTime(item.created_at) }}</span>
        </div>
      </div>
    </section>

    <!-- Detail modal -->
    <div class="ca-detail-overlay" :class="{ show: showDetail }">
      <div class="ca-detail-box">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">{{ detailItem?.name }}</div>
            <div class="ca-detail-meta">{{ detailMetaText }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="closeDetail">✕</button>
        </div>
        <div v-if="detailItem?.has_attachment" style="margin-bottom:14px;">
          <button v-if="!attachmentUrl && !attachmentLoading && !attachmentError" type="button" class="ca-export-btn" @click="viewAttachment">🖼️ Xem ảnh đính kèm</button>
          <p v-else-if="attachmentLoading" style="color:var(--text-secondary);">Đang tải ảnh...</p>
          <p v-else-if="attachmentError" style="color:var(--coral);">Không tải được ảnh đính kèm.</p>
          <img v-else :src="attachmentUrl" alt="Ảnh đính kèm" style="max-width:100%;border-radius:12px;border:1.5px solid var(--kraft-light);">
        </div>

        <div v-if="detailEditing" class="ca-edit-panel">
          <div class="ca-edit-grid">
            <div class="form-group">
              <label class="form-label">Tên người làm bài</label>
              <input v-model="editName" type="text" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Tuổi</label>
              <input v-model="editAge" type="number" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Điểm tổng</label>
              <input v-model="editScore" type="number" step="0.5" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Xếp loại</label>
              <input v-model="editSeverity" type="text" class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ghi chú</label>
            <textarea v-model="editNote" class="form-input ca-edit-note"></textarea>
          </div>
          <p class="ca-edit-hint">Sửa câu trả lời/điểm từng câu ở bảng dưới — với các bài có trong danh mục, điểm tổng ở trên tự tính lại theo đúng công thức của bài đó. Bài không có công thức (Raven CPM, CARS...) thì tự nhập điểm tổng.</p>
        </div>

        <table class="ca-detail-table">
          <thead>
            <tr>
              <th style="width:36px;">#</th>
              <th>Câu hỏi / Mục</th>
              <th style="width:180px;">Trả lời</th>
              <th style="width:180px;">Điểm</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!displayRows.length"><td colspan="4" style="color:var(--text-secondary);">Không có dữ liệu chi tiết từng câu.</td></tr>
            <tr v-for="r in displayRows" :key="r.no">
              <td>{{ r.no }}</td>
              <td>{{ r.question }}</td>
              <template v-if="!detailEditing">
                <td>{{ r.answer }}</td>
                <td>{{ r.score }}</td>
              </template>
              <template v-else-if="r.options">
                <td>
                  <select v-model="r.selIdx" class="form-input" @change="recomputeTotal">
                    <option v-for="(opt, i) in r.options" :key="i" :value="i">{{ opt.label }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="r.selIdx" class="form-input" @change="recomputeTotal">
                    <option v-for="(opt, i) in r.options" :key="i" :value="i">{{ opt.score }}</option>
                  </select>
                </td>
              </template>
              <template v-else>
                <td><input v-model="r.answer" type="text" class="form-input"></td>
                <td><input v-model="r.score" type="number" step="0.5" class="form-input" @input="recomputeTotal"></td>
              </template>
            </tr>
          </tbody>
        </table>

        <div v-if="showSharePanel" class="ca-edit-panel">
          <div class="ca-share-list">
            <span v-if="shareLoading">Đang tải...</span>
            <span v-else-if="shareError" style="color:var(--coral);">Không tải được danh sách chia sẻ.</span>
            <span v-else-if="!shareEntries.length" style="color:var(--text-secondary);">Chưa chia sẻ với ai.</span>
            <template v-else>
              <strong>Đã chia sẻ với:</strong>
              <ul style="margin:6px 0 0;padding-left:18px;">
                <li v-for="s in shareEntries" :key="s.shared_with_user_id">
                  {{ s.full_name || s.email }}
                  <button type="button" style="border:none;background:none;color:var(--coral);cursor:pointer;font-size:.78rem;" @click="removeShare(s.shared_with_user_id)">Gỡ</button>
                </li>
              </ul>
            </template>
          </div>
          <p class="form-label" style="margin-bottom:6px;">Chia sẻ cho (chọn nhiều được)</p>
          <div class="ca-share-checklist">
            <span v-if="!colleagues.length" style="color:var(--text-secondary);font-size:.85rem;">Chưa có đồng nghiệp nào khác trong hệ thống.</span>
            <label v-for="c in colleagues" :key="c.user_id">
              <input type="checkbox" :value="c.user_id" v-model="selectedColleagueIds">
              {{ c.full_name }}{{ c.degree ? ` — ${c.degree}` : '' }}
            </label>
          </div>
          <button type="button" class="btn-primary" style="margin-top:8px;" @click="confirmShare">🔗 Chia sẻ cho những người đã chọn</button>
          <div class="ca-transfer-box">
            <p class="form-label" style="margin-bottom:6px;">Hoặc chuyển hẳn hồ sơ này cho (bạn sẽ không còn thấy nữa)</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <select v-model="transferTarget" class="form-input" style="max-width:280px;">
                <option value="">Chọn chuyên gia...</option>
                <option v-for="c in colleagues" :key="c.user_id" :value="c.user_id">{{ c.full_name }}{{ c.degree ? ` — ${c.degree}` : '' }}</option>
              </select>
              <button type="button" class="btn-danger" @click="doTransfer">🔁 Chuyển hẳn</button>
            </div>
          </div>
        </div>

        <div class="ca-detail-actions">
          <button v-if="canFlag" type="button" class="ca-export-btn" @click="toggleFlagInDetail">{{ detailItem?.flagged ? '⭐ Đã đánh dấu' : '☆ Đánh dấu' }}</button>
          <button v-if="isOwned" type="button" class="ca-export-btn" @click="toggleEdit">{{ detailEditing ? 'Hủy sửa' : '✏️ Sửa kết quả' }}</button>
          <button v-if="isOwned && detailEditing" type="button" class="ca-export-btn" :disabled="saving" @click="saveEdit">💾 Lưu thay đổi</button>
          <button v-if="isOwned" type="button" class="ca-export-btn" @click="toggleSharePanel">🔗 Chia sẻ cho đồng nghiệp</button>
          <button type="button" class="ca-export-btn" @click="exportCsv">📊 Xuất Excel (CSV)</button>
          <button type="button" class="ca-export-btn" @click="exportPdf">📄 Xuất PDF</button>
          <button v-if="isOwned" type="button" class="btn-danger" @click="deleteResult">🗑️ Xoá kết quả</button>
          <button type="button" @click="closeDetail">Đóng</button>
        </div>
      </div>
    </div>

    <!-- Patient modal -->
    <div class="ca-detail-overlay" :class="{ show: showPatientModal }">
      <div class="ca-detail-box">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">{{ selectedPatientGroup?.name }}</div>
            <div class="ca-detail-meta">{{ selectedPatientGroup ? `${selectedPatientGroup.age ? `${selectedPatientGroup.age} tuổi · ` : ''}${selectedPatientGroup.tests.length} lần test` : '' }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="showPatientModal = false">✕</button>
        </div>
        <div>
          <div v-for="t in sortedPatientTests" :key="t.id" class="ca-patient-test-row" @click="openTestFromPatientModal(t)">
            <div>
              <div class="ca-selftest-name">{{ t.name }}</div>
              <div class="ca-selftest-meta">{{ formatDateTime(t.created_at) }}</div>
            </div>
            <div class="ca-selftest-score">{{ t.severity || 'Đã hoàn thành' }}<br>{{ t.total_score }}</div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../../lib/apiClient';
import { useExpertPortalStore } from '../../stores/expertPortal';
import { useNotificationsStore } from '../../stores/notifications';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';

const CARS_DOMAINS = [
  { key: 'd1', label: '1. Quan hệ với mọi người', levels: {
    1: 'Không có biểu hiện khó khăn khi quan hệ với mọi người, hành vi phù hợp với tuổi.',
    2: 'Quan hệ bất bình thường nhẹ: né tránh ánh mắt/bám bố mẹ nhiều hơn trẻ cùng tuổi.',
    3: 'Bất thường trung bình: dường như không nhận thấy người lớn, hiếm khi khởi đầu quan hệ.',
    4: 'Bất thường nặng: luôn tách biệt, hầu như không bao giờ đáp ứng hay khởi đầu quan hệ.'
  } },
  { key: 'd2', label: '2. Bắt chước', levels: {
    1: 'Bắt chước âm thanh, lời nói, động tác phù hợp với lứa tuổi.',
    2: 'Chỉ bắt chước hành vi đơn giản, cần khích lệ hoặc trì hoãn (nhẹ).',
    3: 'Ít bắt chước, cần yêu cầu kiên trì và giúp đỡ nhiều (trung bình).',
    4: 'Hiếm khi hoặc không bao giờ bắt chước dù được khích lệ (nặng).'
  } },
  { key: 'd3', label: '3. Đáp ứng cảm xúc', levels: {
    1: 'Đáp ứng cảm xúc phù hợp với tình huống và tuổi.',
    2: 'Đôi khi thể hiện cảm xúc không phù hợp, không liên quan tình huống (nhẹ).',
    3: 'Có dấu hiệu rõ về đáp ứng cảm xúc không phù hợp, quá mức hoặc thiếu (trung bình).',
    4: 'Đáp ứng cảm xúc hiếm khi phù hợp, rất khó thay đổi khí sắc (nặng).'
  } },
  { key: 'd4', label: '4. Động tác cơ thể', levels: {
    1: 'Hoạt động thoải mái, nhanh nhẹn, phối hợp tốt như trẻ cùng tuổi.',
    2: 'Có động tác bất thường nhỏ: vụng về, lặp lại, phối hợp kém (nhẹ).',
    3: 'Cử động khác lạ rõ: ngón tay, nhìn chằm chằm, đung đưa, quay tròn (trung bình).',
    4: 'Động tác bất thường xuất hiện mạnh mẽ, liên tục dù bị lôi kéo (nặng).'
  } },
  { key: 'd5', label: '5. Sử dụng đồ vật', levels: {
    1: 'Quan tâm và sử dụng đồ chơi/đồ vật phù hợp, đúng cách.',
    2: 'Quan tâm không đúng kiểu, chơi không phù hợp như đập/mút đồ chơi (nhẹ).',
    3: 'Ít quan tâm đồ chơi, tập trung vào chi tiết không đặc trưng, lặp một hành động (trung bình).',
    4: 'Hành vi bất thường thường xuyên, cường độ mạnh, khó đổi hướng (nặng).'
  } },
  { key: 'd6', label: '6. Thích nghi với sự thay đổi', levels: {
    1: 'Chấp nhận thay đổi thông thường mà không khó chịu.',
    2: 'Tiếp tục hoạt động cũ khi bị yêu cầu thay đổi (nhẹ).',
    3: 'Chống lại thay đổi, khó bị đánh lạc hướng, cáu giận khi đổi thói quen (trung bình).',
    4: 'Phản ứng mãnh liệt, rất cáu giận hoặc không hợp tác khi bị thay đổi (nặng).'
  } },
  { key: 'd7', label: '7. Đáp ứng nhìn', levels: {
    1: 'Động tác nhìn bình thường, phù hợp lứa tuổi, kết hợp giác quan khác.',
    2: 'Đôi khi cần nhắc nhìn vào vật, thích nhìn gương/đèn sáng, tránh giao tiếp mắt (nhẹ).',
    3: 'Thường bị nhắc nhìn, nhìn chằm chằm khoảng trống, cầm đồ vật sát mắt (trung bình).',
    4: 'Luôn tránh nhìn vào mắt/đồ vật, cách nhìn rất đặc biệt (nặng).'
  } },
  { key: 'd8', label: '8. Đáp ứng nghe', levels: {
    1: 'Biểu hiện nghe bình thường, phù hợp lứa tuổi.',
    2: 'Đôi khi thiếu đáp ứng hoặc nhạy cảm với âm thanh nhất định (nhẹ).',
    3: 'Đáp ứng âm thanh hay biến đổi; lờ đi âm thanh hoặc giật mình/che tai (trung bình).',
    4: 'Đáp ứng cực kỳ nhạy cảm hoặc hoàn toàn không đáp ứng với âm thanh (nặng).'
  } },
  { key: 'd9', label: '9. Nếm, ngửi và đáp ứng xúc giác', levels: {
    1: 'Đáp ứng/sử dụng nếm-ngửi-sờ bình thường, khám phá đồ vật phù hợp.',
    2: 'Hay cho đồ vật vào miệng, ngửi/nếm thứ không ăn được (nhẹ).',
    3: 'Biểu hiện trung bình khi sờ/ngửi/nếm hoặc khi được bế/ôm; phản ứng quá/dưới mức (trung bình).',
    4: 'Tạo cảm giác thay vì thăm dò; không cảm nhận đau hoặc quá nhạy cảm (nặng).'
  } },
  { key: 'd10', label: '10. Sợ hãi và lo lắng', levels: {
    1: 'Sợ hãi/lo lắng phù hợp tình huống và tuổi.',
    2: 'Đôi khi sợ hãi/lo lắng hơn bạn cùng tuổi trong tình huống tương tự (nhẹ).',
    3: 'Thể hiện khá nhiều sợ hãi/lo lắng so với trẻ khác (trung bình).',
    4: 'Sợ hãi kéo dài, khó trấn an, hoặc thiếu nhận biết nguy hiểm cần tránh (nặng).'
  } },
  { key: 'd11', label: '11. Giao tiếp có lời', levels: {
    1: 'Giao tiếp có lời bình thường, phù hợp tình huống và tuổi.',
    2: 'Ngôn ngữ chậm, có thể lặp âm/đảo đại từ, đôi khi dùng từ kỳ dị (nhẹ).',
    3: 'Có thể không nói được, hoặc lời nói kỳ dị/lặp lại, hỏi quá nhiều hoặc bám chủ đề (trung bình).',
    4: 'Không dùng từ có nghĩa, nhiều âm vô nghĩa/la hét hoặc kỳ dị (nặng).'
  } },
  { key: 'd12', label: '12. Giao tiếp không lời', levels: {
    1: 'Sử dụng giao tiếp không lời (cử chỉ, nét mặt) bình thường.',
    2: 'Sử dụng không thuần thục, chỉ thể hiện nhu cầu một cách mơ hồ (nhẹ).',
    3: 'Không có khả năng thể hiện nhu cầu/hiểu người khác qua giao tiếp không lời (trung bình).',
    4: 'Dùng cử chỉ kỳ dị vô nghĩa; không hiểu cử chỉ/nét mặt người khác (nặng).'
  } },
  { key: 'd13', label: '13. Mức độ hoạt động', levels: {
    1: 'Hoạt động phù hợp tuổi và hoàn cảnh.',
    2: 'Bồn chồn nhẹ hoặc lười biếng/di chuyển chậm chạp (nhẹ).',
    3: 'Khó kiềm chế/khó ngủ ban đêm, hoặc thờ ơ cần thúc giục (trung bình).',
    4: 'Hoạt động trì trệ hoặc chuyển cực đoan bất thường, quá mức (nặng).'
  } },
  { key: 'd14', label: '14. Mức độ và sự ổn định của đáp ứng trí tuệ', levels: {
    1: 'Trí tuệ bình thường, ổn định ở mọi lĩnh vực, không có bất thường.',
    2: 'Không thông minh như bạn cùng tuổi, kỹ năng chậm ở mọi lĩnh vực (nhẹ).',
    3: 'Nhìn chung không thông minh bằng bạn cùng tuổi, nhưng có lĩnh vực gần bình thường (trung bình).',
    4: 'Không thông minh bằng bạn cùng tuổi nhưng có thể vượt trội ở vài lĩnh vực riêng lẻ (nặng).'
  } },
  { key: 'd15', label: '15. Ấn tượng chung', levels: {
    1: 'Không tự kỷ — không có các triệu chứng đặc trưng.',
    2: 'Tự kỷ mức nhẹ — thể hiện vài triệu chứng hoặc chỉ ở mức nhẹ.',
    3: 'Tự kỷ mức vừa — thể hiện một số triệu chứng ở mức vừa.',
    4: 'Tự kỷ nặng — thể hiện hầu hết triệu chứng ở mức nặng.'
  } }
];
const CARS_SCALE_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const CARS_BANDS = [
  { max: 29.5, label: 'Không có tự kỷ' },
  { max: 36.5, label: 'Tự kỷ mức độ nhẹ và vừa' },
  { max: 60, label: 'Tự kỷ mức độ nặng' }
];

const SDQ_OBS_ITEMS = [
  { n: 1, text: 'Quan tâm đến cảm xúc của người khác', dim: 'prosocial' },
  { n: 2, text: 'Bồn chồn, quá hiếu động, không ở yên một chỗ được lâu', dim: 'hyperactivity' },
  { n: 3, text: 'Hay than phiền là bị đau đầu, đau bụng hoặc bị ốm', dim: 'emotional' },
  { n: 4, text: 'Sẵn sàng chia sẻ với những trẻ khác (nhường quà, đồ chơi)', dim: 'prosocial' },
  { n: 5, text: 'Hay có những cơn nổi cáu hoặc tức giận', dim: 'conduct' },
  { n: 6, text: 'Hay lủi thủi một mình hoặc có xu hướng chơi một mình', dim: 'peer' },
  { n: 7, text: 'Nhìn chung là ngoan, luôn làm những điều người lớn sai bảo', dim: 'conduct', reverse: true },
  { n: 8, text: 'Có nhiều điều lo lắng, thường tỏ ra lo lắng', dim: 'emotional' },
  { n: 9, text: 'Giúp đỡ ai đó bị đau, buồn bực hay bị bệnh', dim: 'prosocial' },
  { n: 10, text: 'Liên tục bồn chồn hay lúc nào cũng bứt rứt', dim: 'hyperactivity' },
  { n: 11, text: 'Có ít nhất một bạn thân', dim: 'peer', reverse: true },
  { n: 12, text: 'Thường đánh nhau với những đứa trẻ khác hoặc la hét chúng', dim: 'conduct' },
  { n: 13, text: 'Hay không được vui, buồn bã hoặc mau nước mắt', dim: 'emotional' },
  { n: 14, text: 'Nói chung được những trẻ khác thích', dim: 'peer', reverse: true },
  { n: 15, text: 'Dễ sao nhãng, thiếu tập trung', dim: 'hyperactivity' },
  { n: 16, text: 'Hồi hộp, sợ sệt trong những tình huống mới, dễ mất tự tin', dim: 'emotional' },
  { n: 17, text: 'Tử tế với những trẻ nhỏ tuổi hơn', dim: 'prosocial' },
  { n: 18, text: 'Hay nói dối, lừa lọc', dim: 'conduct' },
  { n: 19, text: 'Bị những trẻ khác trêu chọc hoặc bắt nạt', dim: 'peer' },
  { n: 20, text: 'Hay nguyện giúp đỡ người khác (bố, mẹ, thầy cô, bạn bè)', dim: 'prosocial' },
  { n: 21, text: 'Đắn đo hoặc suy nghĩ mọi chuyện trước khi làm', dim: 'hyperactivity', reverse: true },
  { n: 22, text: 'Ăn cắp đồ ở nhà, trường học hoặc những nơi khác', dim: 'conduct' },
  { n: 23, text: 'Dễ hòa đồng với người lớn hơn là với trẻ khác', dim: 'peer', reverse: true },
  { n: 24, text: 'Hay sợ hãi, dễ hoảng sợ', dim: 'emotional' },
  { n: 25, text: 'Làm những công việc được giao từ đầu đến cuối, thời gian chú ý cao', dim: 'hyperactivity', reverse: true }
];
const SDQ_DIMENSION_LABELS = { emotional: 'Cảm xúc', conduct: 'Hành vi', hyperactivity: 'Tăng động', peer: 'Bạn bè', prosocial: 'Xã hội tích cực' };
const SDQ_CUTOFFS = { emotional: 4, conduct: 3, hyperactivity: 6, peer: 3 };
const SDQ_TOTAL_BANDS = [
  { max: 15, label: 'Bình thường' },
  { max: 19, label: 'Ranh giới' },
  { max: 40, label: 'Bất thường' }
];
const SDQ_OBS_OPTIONS = [
  { label: 'Không đúng', normal: 0, reverse: 2 },
  { label: 'Đúng một phần', normal: 1, reverse: 1 },
  { label: 'Chắc chắn đúng', normal: 2, reverse: 0 }
];
const TEST_SWITCH_OPTIONS = [
  { code: 'CARS', label: 'CARS (Tự kỷ)' },
  { code: 'SDQ25_OBS', label: 'SDQ-25 (Quan sát)' }
];
const SELF_TEST_CODES = [
  { code: 'DASS21', label: 'DASS-21' },
  { code: 'GAD7', label: 'GAD-7' },
  { code: 'HARS', label: 'HARS' },
  { code: 'PHQ9', label: 'PHQ-9' },
  { code: 'PSQI', label: 'PSQI' },
  { code: 'PSS', label: 'PSS' },
  { code: 'SDQ25', label: 'SDQ-25' },
  { code: 'MMSE', label: 'MMSE' },
  { code: 'ISI', label: 'ISI' },
  { code: 'IAT', label: 'IAT' },
  { code: 'AUDIT', label: 'AUDIT' },
  { code: 'RAVEN_CPM', label: 'Raven CPM' }
];

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function formatDateTime(value) {
  if (!value) return 'Chưa có lịch';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function pageWindow(current, total) {
  const pages = new Set([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const out = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}
function normalizeAnswerRow(entry, index) {
  if (entry === null || typeof entry !== 'object') {
    return { no: index + 1, question: `Câu ${index + 1}`, answer: entry === null || entry === undefined ? '(không có dữ liệu)' : String(entry), score: '' };
  }
  const question = entry.question || entry.domain || entry.item || `Câu ${index + 1}`;
  const answer = entry.answer ?? (entry.choice !== undefined && entry.choice !== null ? `Đáp án ${entry.choice}` : '');
  const score = entry.score ?? entry.choice ?? '';
  return { no: index + 1, question, answer, score };
}
function findBand(score, bands) {
  return bands.find((b) => score <= b.max) || bands[bands.length - 1];
}
function findCatalogOptions(catalog, testCode, row) {
  const test = catalog?.[String(testCode || '').toLowerCase()];
  if (!test) return null;
  const byIndex = test.questions[row.no - 1];
  if (byIndex && byIndex.text === row.question) return byIndex.options;
  const byText = test.questions.find((q) => q.text === row.question);
  return byText ? byText.options : null;
}
function computeTotalFromRowScores(testCode, catalog, scoresByIndex) {
  const test = catalog?.[String(testCode || '').toLowerCase()];
  if (!test?.scoring) return null;
  const subScores = {};
  Object.entries(test.scoring).forEach(([key, sc]) => {
    let sum = 0;
    sc.indices.forEach((idx) => { sum += Number(scoresByIndex[idx]) || 0; });
    subScores[key] = sum * sc.multiplier;
  });
  if (subScores.total !== undefined) return subScores.total;
  return Object.values(subScores).reduce((a, b) => a + b, 0);
}
function groupSelfTestResultsByPerson(results) {
  const groups = new Map();
  results.forEach((item) => {
    const rawName = (item.respondent_name || '').trim() || 'Chưa rõ tên';
    const normName = rawName.normalize('NFC').toLowerCase();
    const hasAge = item.respondent_age !== null && item.respondent_age !== undefined && item.respondent_age !== '';
    const ageKey = hasAge ? String(item.respondent_age) : '__unknown__';
    const key = `${normName}|${ageKey}`;
    if (!groups.has(key)) groups.set(key, { name: rawName, age: hasAge ? ageKey : '', tests: [] });
    groups.get(key).tests.push(item);
  });
  const nameOccurrence = new Map();
  groups.forEach((group) => {
    const key = group.name.normalize('NFC').toLowerCase();
    nameOccurrence.set(key, (nameOccurrence.get(key) || 0) + 1);
  });
  const finalGroups = Array.from(groups.values()).map((group) => {
    const key = group.name.normalize('NFC').toLowerCase();
    const needsSuffix = nameOccurrence.get(key) > 1;
    const sheetSuffix = needsSuffix ? (group.age ? ` (${group.age} tuổi)` : ' (chưa rõ tuổi)') : '';
    return { ...group, sheetSuffix };
  });
  return finalGroups.sort((a, b) => {
    const aMax = Math.max(...a.tests.map((t) => new Date(t.created_at).getTime()));
    const bMax = Math.max(...b.tests.map((t) => new Date(t.created_at).getTime()));
    return bMax - aMax;
  });
}
let answerCatalogPromise = null;
function loadAnswerCatalog() {
  if (!answerCatalogPromise) {
    answerCatalogPromise = fetch('/data/self-test-answer-catalog.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return answerCatalogPromise;
}

const router = useRouter();
const expertPortal = useExpertPortalStore();
const notif = useNotificationsStore();

const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

// ===== Self-test results list =====
const searchName = ref('');
const searchCode = ref('');
const searchAgeMin = ref('');
const searchAgeMax = ref('');
const searchFlagged = ref(false);
const filters = reactive({ search: '', code: '', ageMin: '', ageMax: '', flaggedOnly: false });

const patientViewActive = ref(false);
const selfTestResults = ref([]);
const selfTestPage = ref(0);
const selfTestLimit = 10;
const selfTestTotal = ref(0);
const selfTestLoading = ref(false);
const selfTestError = ref(false);

const selfTestTotalPages = computed(() => Math.max(1, Math.ceil(selfTestTotal.value / selfTestLimit)));
const selfTestFrom = computed(() => selfTestPage.value * selfTestLimit + 1);
const selfTestTo = computed(() => Math.min(selfTestTotal.value, (selfTestPage.value + 1) * selfTestLimit));
const selfTestPageWindow = computed(() => pageWindow(selfTestPage.value, selfTestTotalPages.value));
const selfTestEmptyText = computed(() => {
  const hasFilter = Object.values(filters).some(Boolean);
  return selfTestTotal.value ? 'Không có kết quả ở trang này.' : (hasFilter ? 'Không tìm thấy kết quả khớp với bộ lọc.' : 'Chưa có ai tự làm test trên tài khoản này.');
});

function buildSelfTestQuery(extra) {
  const qs = new URLSearchParams(extra);
  if (filters.search) qs.set('search', filters.search);
  if (filters.code) qs.set('code', filters.code);
  if (filters.ageMin) qs.set('age_min', filters.ageMin);
  if (filters.ageMax) qs.set('age_max', filters.ageMax);
  if (filters.flaggedOnly) qs.set('flagged', 'true');
  return qs;
}

async function loadSelfTestResults(page = 0) {
  selfTestPage.value = Math.max(0, page);
  selfTestLoading.value = true;
  selfTestError.value = false;
  try {
    const qs = buildSelfTestQuery({ limit: String(selfTestLimit), offset: String(selfTestPage.value * selfTestLimit) });
    const data = await apiClient.get(`/expert-portal/self-test-results?${qs.toString()}`, { noCache: true });
    selfTestResults.value = data?.items || [];
    selfTestTotal.value = data?.total || 0;
  } catch (_error) {
    selfTestResults.value = [];
    selfTestTotal.value = 0;
    selfTestError.value = true;
  } finally {
    selfTestLoading.value = false;
  }
}

function toggleFlag(item) {
  apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged })
    .then((updated) => { item.flagged = updated.flagged; })
    .catch((error) => setBanner(error.message || 'Không thể đánh dấu.', 'error'));
}

const patientGroups = ref([]);
const patientLoading = ref(false);
async function loadPatientSummaryView() {
  patientLoading.value = true;
  patientGroups.value = [];
  try {
    const qs = buildSelfTestQuery({ limit: '0' });
    const data = await apiClient.get(`/expert-portal/self-test-results?${qs.toString()}`, { noCache: true });
    const results = data?.items || [];
    patientGroups.value = groupSelfTestResultsByPerson(results);
  } catch (_error) {
    patientGroups.value = [];
  } finally {
    patientLoading.value = false;
  }
}

function runSearch() {
  filters.search = searchName.value.trim();
  filters.code = searchCode.value;
  filters.ageMin = searchAgeMin.value.toString().trim();
  filters.ageMax = searchAgeMax.value.toString().trim();
  filters.flaggedOnly = searchFlagged.value;
  if (patientViewActive.value) loadPatientSummaryView();
  else loadSelfTestResults(0);
}
function resetSearch() {
  searchName.value = '';
  searchCode.value = '';
  searchAgeMin.value = '';
  searchAgeMax.value = '';
  searchFlagged.value = false;
  filters.search = '';
  filters.code = '';
  filters.ageMin = '';
  filters.ageMax = '';
  filters.flaggedOnly = false;
  if (patientViewActive.value) loadPatientSummaryView();
  else loadSelfTestResults(0);
}
function togglePatientView() {
  patientViewActive.value = !patientViewActive.value;
  if (patientViewActive.value) loadPatientSummaryView();
  else loadSelfTestResults(0);
}

// ===== Patient modal =====
const showPatientModal = ref(false);
const selectedPatientGroup = ref(null);
const sortedPatientTests = computed(() => {
  if (!selectedPatientGroup.value) return [];
  return selectedPatientGroup.value.tests.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});
function openPatientModal(group) {
  selectedPatientGroup.value = group;
  showPatientModal.value = true;
}
function openTestFromPatientModal(t) {
  showPatientModal.value = false;
  openDetailModal(t);
}

// ===== Clients + assessment form =====
const clients = ref([]);
const clientsLoading = ref(false);
const clientsError = ref(false);
const selectedClient = ref(null);
const testType = ref('CARS');
const carsAnswers = reactive({});
const sdqAnswers = reactive({});
const formTitle = computed(() => (testType.value === 'CARS' ? 'CARS — Thang đánh giá mức độ tự kỷ' : 'SDQ-25 — Bản quan sát'));

async function loadClients() {
  clientsLoading.value = true;
  clientsError.value = false;
  try {
    clients.value = await apiClient.get('/expert-portal/clients', { noCache: true });
  } catch (_error) {
    clients.value = [];
    clientsError.value = true;
  } finally {
    clientsLoading.value = false;
  }
}

function selectClient(userId) {
  selectedClient.value = clients.value.find((c) => c.user_id === userId) || null;
  if (!selectedClient.value) return;
  Object.keys(carsAnswers).forEach((k) => delete carsAnswers[k]);
  Object.keys(sdqAnswers).forEach((k) => delete sdqAnswers[k]);
  loadHistory();
}

async function submitCars() {
  if (Object.keys(carsAnswers).length < CARS_DOMAINS.length) {
    setBanner('Vui lòng chấm đủ cả 15 lĩnh vực trước khi nộp.', 'error');
    return;
  }
  const total = CARS_DOMAINS.reduce((sum, d) => sum + (carsAnswers[d.key] || 0), 0);
  const band = findBand(total, CARS_BANDS);
  try {
    await apiClient.post(`/expert-portal/clients/${selectedClient.value.user_id}/assessments/CARS/submit`, {
      raw_answers: CARS_DOMAINS.map((d) => {
        const score = carsAnswers[d.key];
        return { question: d.label, answer: Number.isInteger(score) ? (d.levels[score] || String(score)) : String(score), score };
      }),
      total_score: total,
      severity: band.label,
      dimension_scores: {},
      interpreted_result: { bands: CARS_BANDS }
    });
    setBanner(`Đã lưu CARS — Tổng điểm ${total}, xếp loại: ${band.label}.`, 'success');
    Object.keys(carsAnswers).forEach((k) => delete carsAnswers[k]);
    loadHistory();
  } catch (error) {
    setBanner(error.message || 'Không thể lưu kết quả CARS.', 'error');
  }
}

async function submitSdqObs() {
  if (Object.keys(sdqAnswers).length < SDQ_OBS_ITEMS.length) {
    setBanner('Vui lòng trả lời đủ cả 25 câu trước khi nộp.', 'error');
    return;
  }
  const dimensionScores = {};
  Object.keys(SDQ_DIMENSION_LABELS).forEach((dim) => {
    const items = SDQ_OBS_ITEMS.filter((it) => it.dim === dim);
    dimensionScores[dim] = items.reduce((sum, it) => sum + (sdqAnswers[it.n] || 0), 0);
  });
  const total = Object.keys(dimensionScores).filter((dim) => dim !== 'prosocial').reduce((sum, dim) => sum + dimensionScores[dim], 0);
  const band = findBand(total, SDQ_TOTAL_BANDS);
  const dimensionResult = Object.fromEntries(Object.entries(dimensionScores).map(([dim, score]) => {
    if (dim === 'prosocial') return [dim, { score, severity: score < 5 ? 'Cần hỗ trợ thêm kỹ năng xã hội' : 'Tốt' }];
    const cutoff = SDQ_CUTOFFS[dim];
    return [dim, { score, severity: score >= cutoff ? 'Cần chú ý' : 'Bình thường' }];
  }));
  try {
    await apiClient.post(`/expert-portal/clients/${selectedClient.value.user_id}/assessments/SDQ25_OBS/submit`, {
      raw_answers: SDQ_OBS_ITEMS.map((it) => {
        const score = sdqAnswers[it.n];
        const opt = SDQ_OBS_OPTIONS.find((o) => (it.reverse ? o.reverse : o.normal) === score);
        return { question: `${it.n}. ${it.text}`, answer: opt ? opt.label : String(score), score };
      }),
      total_score: total,
      severity: band.label,
      dimension_scores: dimensionResult,
      interpreted_result: { dimension_labels: SDQ_DIMENSION_LABELS }
    });
    setBanner(`Đã lưu SDQ-25 quan sát — Tổng điểm khó khăn ${total}, xếp loại: ${band.label}.`, 'success');
    Object.keys(sdqAnswers).forEach((k) => delete sdqAnswers[k]);
    loadHistory();
  } catch (error) {
    setBanner(error.message || 'Không thể lưu kết quả SDQ-25.', 'error');
  }
}

const history = ref([]);
const historyLoading = ref(false);
const historyError = ref(false);
async function loadHistory() {
  if (!selectedClient.value) return;
  historyLoading.value = true;
  historyError.value = false;
  try {
    history.value = await apiClient.get(`/expert-portal/clients/${selectedClient.value.user_id}/assessments`, { noCache: true });
  } catch (_error) {
    history.value = [];
    historyError.value = true;
  } finally {
    historyLoading.value = false;
  }
}

// ===== Detail modal =====
const showDetail = ref(false);
const detailItem = ref(null);
const detailClient = ref(null);
const detailRows = ref([]);
const editRows = ref([]);
const detailEditing = ref(false);
const detailCatalog = ref(null);
const saving = ref(false);
const attachmentUrl = ref(null);
const attachmentLoading = ref(false);
const attachmentError = ref(false);
const editName = ref('');
const editAge = ref('');
const editScore = ref('');
const editSeverity = ref('');
const editNote = ref('');

const displayRows = computed(() => (detailEditing.value ? editRows.value : detailRows.value));
const isOwned = computed(() => !detailClient.value && detailItem.value?.is_owner !== false);
const canFlag = computed(() => !detailClient.value && !!detailItem.value?.id);

const detailMetaText = computed(() => {
  const item = detailItem.value;
  if (!item) return '';
  const parts = [];
  if (detailClient.value) parts.push(`Client: ${detailClient.value.full_name || detailClient.value.email}`);
  if (item.respondent_name) parts.push(`Người làm bài: ${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
  parts.push(`Điểm: ${item.total_score}`);
  parts.push(`Xếp loại: ${item.severity || 'Đã hoàn thành'}`);
  parts.push(formatDateTime(item.created_at));
  if (item.note) parts.push(`Ghi chú: ${item.note}`);
  if (item.edited_at) parts.push(`(đã sửa lúc ${formatDateTime(item.edited_at)})`);
  return parts.join(' · ');
});

function openDetailModal(item, client) {
  detailItem.value = item;
  detailClient.value = client || null;
  detailRows.value = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];
  editRows.value = [];
  detailEditing.value = false;
  detailCatalog.value = null;
  attachmentUrl.value = null;
  attachmentLoading.value = false;
  attachmentError.value = false;
  showSharePanel.value = false;
  showDetail.value = true;
}
function closeDetail() {
  showDetail.value = false;
  detailItem.value = null;
  detailClient.value = null;
}

async function viewAttachment() {
  attachmentLoading.value = true;
  attachmentError.value = false;
  try {
    const blob = await apiClient.getBlob(`/assessments/results/${detailItem.value.id}/attachment`);
    attachmentUrl.value = URL.createObjectURL(blob);
  } catch (_e) {
    attachmentError.value = true;
  } finally {
    attachmentLoading.value = false;
  }
}

function toggleFlagInDetail() {
  const item = detailItem.value;
  apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged })
    .then((updated) => {
      item.flagged = updated.flagged;
      const listed = selfTestResults.value.find((r) => r.id === item.id);
      if (listed) listed.flagged = item.flagged;
    })
    .catch((error) => setBanner(error.message || 'Không thể đánh dấu.', 'error'));
}

async function toggleEdit() {
  if (!detailItem.value) return;
  detailEditing.value = !detailEditing.value;
  const item = detailItem.value;

  if (detailEditing.value) {
    editName.value = item.respondent_name || '';
    editAge.value = item.respondent_age ?? '';
    editScore.value = item.total_score ?? '';
    editSeverity.value = item.severity || '';
    editNote.value = item.note || '';

    const catalog = await loadAnswerCatalog();
    if (!detailItem.value || detailItem.value !== item) return;
    detailCatalog.value = catalog;
    editRows.value = detailRows.value.map((r) => {
      const options = findCatalogOptions(catalog, item.code, r);
      if (options) {
        let selIdx = options.findIndex((opt) => opt.label === r.answer);
        if (selIdx === -1) selIdx = options.findIndex((opt) => opt.score === r.score);
        if (selIdx === -1) selIdx = 0;
        return { ...r, options, selIdx };
      }
      return { ...r, options: null };
    });
    recomputeTotal();
  } else {
    detailCatalog.value = null;
  }
}

function recomputeTotal() {
  const item = detailItem.value;
  const scoresByIndex = editRows.value.map((r) => (r.options ? Number(r.options[r.selIdx]?.score) : Number(r.score)));
  const total = computeTotalFromRowScores(item?.code, detailCatalog.value, scoresByIndex);
  if (total !== null) editScore.value = total;
}

async function saveEdit() {
  const item = detailItem.value;
  const editedRows = editRows.value.map((r, i) => {
    if (r.options) {
      const opt = r.options[r.selIdx];
      return { question: r.question, answer: opt ? opt.label : r.answer, score: opt ? opt.score : r.score };
    }
    const original = detailRows.value[i];
    return { question: r.question, answer: r.answer, score: r.score !== '' ? Number(r.score) : original.score };
  });

  const payload = {
    respondent_name: String(editName.value || '').trim() || null,
    respondent_age: String(editAge.value || '').trim() || null,
    total_score: Number(editScore.value),
    severity: String(editSeverity.value || '').trim() || null,
    note: String(editNote.value || '').trim() || null,
    raw_answers: editedRows
  };
  if (!Number.isFinite(payload.total_score)) {
    setBanner('Điểm tổng không hợp lệ.', 'error');
    return;
  }

  saving.value = true;
  try {
    const updated = await apiClient.patch(`/assessments/results/${item.id}`, payload);
    Object.assign(item, updated, { raw_answers: editedRows });
    detailRows.value = editedRows.map(normalizeAnswerRow);
    detailEditing.value = false;
    setBanner('Đã lưu thay đổi kết quả.', 'success');
    loadSelfTestResults(selfTestPage.value);
  } catch (error) {
    setBanner(error.message || 'Không thể lưu thay đổi.', 'error');
  } finally {
    saving.value = false;
  }
}

async function deleteResult() {
  const item = detailItem.value;
  if (!window.confirm(`Xoá kết quả "${item.name}" của ${item.respondent_name || 'người này'}? Không thể hoàn tác.`)) return;
  try {
    await apiClient.delete(`/assessments/results/${item.id}`);
    setBanner('Đã xoá kết quả.', 'success');
    closeDetail();
    if (patientViewActive.value) loadPatientSummaryView();
    else loadSelfTestResults(selfTestPage.value);
  } catch (error) {
    setBanner(error.message || 'Không thể xoá kết quả.', 'error');
  }
}

// ===== Share / transfer =====
const showSharePanel = ref(false);
const shareEntries = ref([]);
const shareLoading = ref(false);
const shareError = ref(false);
const colleagues = ref([]);
let colleaguesLoaded = false;
const selectedColleagueIds = ref([]);
const transferTarget = ref('');

async function ensureColleaguesLoaded() {
  if (colleaguesLoaded) return colleagues.value;
  try {
    colleagues.value = await apiClient.get('/expert-portal/colleagues', { noCache: true });
  } catch (_error) {
    colleagues.value = [];
  }
  colleaguesLoaded = true;
  return colleagues.value;
}

async function refreshShareList() {
  shareLoading.value = true;
  shareError.value = false;
  try {
    shareEntries.value = await apiClient.get(`/assessments/results/${detailItem.value.id}/shares`, { noCache: true });
  } catch (_error) {
    shareError.value = true;
  } finally {
    shareLoading.value = false;
  }
}

async function toggleSharePanel() {
  showSharePanel.value = !showSharePanel.value;
  if (!showSharePanel.value) return;
  await ensureColleaguesLoaded();
  selectedColleagueIds.value = [];
  transferTarget.value = '';
  refreshShareList();
}

async function removeShare(targetId) {
  try {
    await apiClient.delete(`/assessments/results/${detailItem.value.id}/share/${targetId}`);
    refreshShareList();
  } catch (error) {
    setBanner(error.message || 'Không thể gỡ chia sẻ.', 'error');
  }
}

async function confirmShare() {
  if (!selectedColleagueIds.value.length) {
    setBanner('Vui lòng chọn ít nhất 1 chuyên gia cần chia sẻ.', 'error');
    return;
  }
  try {
    await apiClient.post(`/assessments/results/${detailItem.value.id}/share`, { target_user_ids: selectedColleagueIds.value });
    setBanner(`Đã chia sẻ cho ${selectedColleagueIds.value.length} chuyên gia.`, 'success');
    selectedColleagueIds.value = [];
    refreshShareList();
  } catch (error) {
    setBanner(error.message || 'Không thể chia sẻ.', 'error');
  }
}

async function doTransfer() {
  if (!transferTarget.value) {
    setBanner('Vui lòng chọn chuyên gia cần chuyển hồ sơ.', 'error');
    return;
  }
  const targetName = colleagues.value.find((c) => c.user_id === transferTarget.value)?.full_name || 'chuyên gia này';
  const item = detailItem.value;
  if (!window.confirm(`Chuyển hẳn kết quả "${item.name}" của ${item.respondent_name || 'người này'} cho ${targetName}?\n\nBạn sẽ KHÔNG còn thấy kết quả này trong danh sách của mình nữa.`)) return;
  try {
    await apiClient.post(`/assessments/results/${item.id}/transfer`, { target_user_id: transferTarget.value });
    setBanner('Đã chuyển hồ sơ cho chuyên gia khác.', 'success');
    closeDetail();
    if (patientViewActive.value) loadPatientSummaryView();
    else loadSelfTestResults(selfTestPage.value);
  } catch (error) {
    setBanner(error.message || 'Không thể chuyển hồ sơ.', 'error');
  }
}

// ===== CSV / PDF export =====
function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
function downloadCsv(filename, lines) {
  const csvContent = '﻿' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportCsv() {
  if (!detailItem.value) return;
  const item = detailItem.value;
  const client = detailClient.value;
  const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];
  const lines = [];
  lines.push(['Bài test', item.name].map(csvEscape).join(','));
  if (client) lines.push(['Client', client.full_name || client.email].map(csvEscape).join(','));
  if (item.respondent_name) lines.push(['Người làm bài', `${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`].map(csvEscape).join(','));
  lines.push(['Điểm', item.total_score].map(csvEscape).join(','));
  lines.push(['Xếp loại', item.severity || ''].map(csvEscape).join(','));
  lines.push(['Ngày', formatDateTime(item.created_at)].map(csvEscape).join(','));
  if (item.note) lines.push(['Ghi chú', item.note].map(csvEscape).join(','));
  lines.push('');
  lines.push(['#', 'Câu hỏi / Mục', 'Trả lời', 'Điểm'].map(csvEscape).join(','));
  rows.forEach((r) => lines.push([r.no, r.question, r.answer, r.score].map(csvEscape).join(',')));
  downloadCsv(`${(item.name || 'ket-qua').replace(/\s+/g, '-')}-${item.id.slice(0, 8)}.csv`, lines);
}
function exportPdf() {
  if (!detailItem.value) return;
  const item = detailItem.value;
  const client = detailClient.value;
  const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];

  const metaLines = [];
  if (client) metaLines.push(`Client: ${esc(client.full_name || client.email)}`);
  if (item.respondent_name) metaLines.push(`Người làm bài: ${esc(item.respondent_name)}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
  metaLines.push(`Điểm: ${esc(String(item.total_score))}`);
  metaLines.push(`Xếp loại: ${esc(item.severity || 'Đã hoàn thành')}`);
  metaLines.push(`Ngày: ${esc(formatDateTime(item.created_at))}`);
  if (item.note) metaLines.push(`Ghi chú: ${esc(item.note)}`);

  const tableRows = rows.map((r) => `<tr><td>${r.no}</td><td>${esc(String(r.question))}</td><td>${esc(String(r.answer))}</td><td>${esc(String(r.score))}</td></tr>`).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    setBanner('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để xuất PDF.', 'error');
    return;
  }
  printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>${esc(item.name)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
                h1 { font-size: 20px; margin-bottom: 4px; }
                .meta { font-size: 13px; color: #555; margin-bottom: 16px; line-height: 1.6; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
                th { background: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>${esc(item.name)}</h1>
            <div class="meta">${metaLines.join('<br>')}</div>
            <table>
                <thead><tr><th>#</th><th>Câu hỏi / Mục</th><th>Trả lời</th><th>Điểm</th></tr></thead>
                <tbody>${tableRows || '<tr><td colspan="4">Không có dữ liệu chi tiết.</td></tr>'}</tbody>
            </table>
        </body>
        </html>
    `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

// ===== Export all (Excel) =====
const exportingAll = ref(false);
const exportAllLabel = computed(() => (exportingAll.value ? '⏳ Đang tạo file...' : '📊 Xuất Excel toàn bộ'));

function buildInterpretation(item) {
  const ir = item.interpreted_result;
  if (ir && typeof ir === 'object') {
    if (ir.summary_html) {
      const div = document.createElement('div');
      div.innerHTML = ir.summary_html;
      return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    }
    if (ir.scored && ir.standard_score !== undefined) {
      const parts = [`Điểm thô: ${ir.raw_total}/36`];
      if (ir.standard_score !== null) parts.push(`SS: ${ir.standard_score}`, `Percentile: ${ir.percentile}`, `Xếp loại: ${ir.iq_label}`);
      else if (ir.note) parts.push(ir.note);
      return parts.join(' — ');
    }
    if (ir.note) return ir.note;
  }
  if (item.dimension_scores && typeof item.dimension_scores === 'object' && Object.keys(item.dimension_scores).length) {
    return Object.entries(item.dimension_scores).map(([key, value]) => `${key}: ${value?.severity || value?.score || ''}`).join('; ');
  }
  return `Điểm ${item.total_score} — ${item.severity || 'Đã hoàn thành'}`;
}
function sanitizeSheetName(raw, usedNames) {
  let base = String(raw).replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet';
  let candidate = base;
  let counter = 2;
  while (usedNames.has(candidate)) {
    const suffix = ` (${counter})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
    counter += 1;
  }
  usedNames.add(candidate);
  return candidate;
}
const XLS_COLORS = { header: 'FF7BBF95', headerText: 'FFFFFFFF', section: 'FFE8CBA7', subHeader: 'FFC5E8F5', borderLine: 'FFD4A574', zebra: 'FFFFF8F0', darkText: 'FF4A3728' };
function xlsThinBorder() {
  const style = { style: 'thin', color: { argb: XLS_COLORS.borderLine } };
  return { top: style, left: style, bottom: style, right: style };
}
function xlsStyleHeaderRow(row, fillArgb = XLS_COLORS.header, fontArgb = XLS_COLORS.headerText) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
    cell.font = { bold: true, color: { argb: fontArgb } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = xlsThinBorder();
  });
}
function xlsStyleDataRow(row, zebra) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = xlsThinBorder();
    cell.alignment = { vertical: 'top', wrapText: true };
    if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLS_COLORS.zebra } };
  });
}
function xlsStyleSectionRow(row, span) {
  row.font = { bold: true, color: { argb: XLS_COLORS.darkText } };
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLS_COLORS.section } };
  });
  if (span) row.worksheet.mergeCells(`A${row.number}:${span}${row.number}`);
}

async function exportAllSelfTests() {
  if (!selfTestTotal.value) {
    setBanner('Chưa có ai tự làm test để xuất.', 'error');
    return;
  }
  exportingAll.value = true;
  try {
    const allData = await apiClient.get('/expert-portal/self-test-results?limit=0', { noCache: true });
    const allResults = allData?.items || [];
    if (!allResults.length) {
      setBanner('Chưa có ai tự làm test để xuất.', 'error');
      return;
    }

    const mod = await import('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm');
    const ExcelJS = mod.default || mod;
    const wb = new ExcelJS.Workbook();
    const groupList = groupSelfTestResultsByPerson(allResults);

    const summarySheet = wb.addWorksheet('Danh sách chung');
    summarySheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Họ tên', key: 'name', width: 22 },
      { header: 'Tuổi', key: 'age', width: 8 },
      { header: 'Ghi chú', key: 'note', width: 24 },
      { header: 'Bài test', key: 'test', width: 28 },
      { header: 'Điểm tổng', key: 'score', width: 10 },
      { header: 'Xếp loại', key: 'severity', width: 16 },
      { header: 'Diễn giải kết quả', key: 'interp', width: 60 },
      { header: 'Thời gian', key: 'time', width: 20 }
    ];
    xlsStyleHeaderRow(summarySheet.getRow(1));
    summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

    let stt = 0;
    groupList.forEach((group) => {
      const startRow = summarySheet.rowCount + 1;
      group.tests.forEach((t, i) => {
        stt += 1;
        const row = summarySheet.addRow({
          stt, name: group.name, age: group.age, note: t.note || '', test: t.name,
          score: t.total_score, severity: t.severity || '', interp: buildInterpretation(t), time: formatDateTime(t.created_at)
        });
        xlsStyleDataRow(row, i % 2 === 1);
      });
      const endRow = summarySheet.rowCount;
      if (endRow > startRow) {
        summarySheet.mergeCells(`B${startRow}:B${endRow}`);
        summarySheet.mergeCells(`C${startRow}:C${endRow}`);
        summarySheet.getCell(`B${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        summarySheet.getCell(`C${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    const usedNames = new Set(['Danh sách chung']);
    let personIndex = 0;
    groupList.forEach((group) => {
      personIndex += 1;
      const sheetName = sanitizeSheetName(`${personIndex}. ${group.name}${group.sheetSuffix}`, usedNames);
      const sheet = wb.addWorksheet(sheetName);
      sheet.columns = [{ key: 'c1', width: 28 }, { key: 'c2', width: 42 }, { key: 'c3', width: 22 }, { key: 'c4', width: 18 }];

      const titleRow = sheet.addRow([`Họ tên: ${group.name}`]);
      xlsStyleSectionRow(titleRow, 'D');
      titleRow.font = { bold: true, size: 13, color: { argb: XLS_COLORS.darkText } };

      const infoText = group.sheetSuffix
        ? `Tuổi: ${group.age || 'Không rõ'}    |    Số bài đã làm: ${group.tests.length}    |    ⚠️ Có người khác trùng tên nhưng khác tuổi — đã tách riêng sheet.`
        : `Tuổi: ${group.age || 'Không rõ'}    |    Số bài đã làm: ${group.tests.length}`;
      const infoRow = sheet.addRow([infoText]);
      sheet.mergeCells(`A${infoRow.number}:D${infoRow.number}`);
      infoRow.font = { italic: true };

      sheet.addRow([]);
      const summaryTitleRow = sheet.addRow(['Bảng tổng hợp các bài đã làm']);
      xlsStyleSectionRow(summaryTitleRow, 'D');
      const summaryHeaderRow = sheet.addRow(['Bài test', 'Điểm / Xếp loại', 'Thời gian', 'Ghi chú']);
      xlsStyleHeaderRow(summaryHeaderRow, XLS_COLORS.subHeader, XLS_COLORS.darkText);
      group.tests.forEach((t, i) => {
        const row = sheet.addRow([t.name, `${t.total_score} — ${t.severity || ''}`, formatDateTime(t.created_at), t.note || '']);
        xlsStyleDataRow(row, i % 2 === 1);
      });

      sheet.addRow([]);
      group.tests.forEach((t) => {
        const rows = Array.isArray(t.raw_answers) ? t.raw_answers.map(normalizeAnswerRow) : [];
        const sectionRow = sheet.addRow([`Chi tiết: ${t.name} — ${formatDateTime(t.created_at)}`]);
        xlsStyleSectionRow(sectionRow, 'D');
        const qHeaderRow = sheet.addRow(['#', 'Câu hỏi / Mục', 'Trả lời', 'Điểm']);
        xlsStyleHeaderRow(qHeaderRow, XLS_COLORS.subHeader, XLS_COLORS.darkText);
        if (rows.length) {
          rows.forEach((r, i) => {
            const row = sheet.addRow([r.no, r.question, r.answer, r.score]);
            xlsStyleDataRow(row, i % 2 === 1);
          });
        } else {
          xlsStyleDataRow(sheet.addRow(['', 'Không có dữ liệu chi tiết từng câu.', '', '']));
        }
        sheet.addRow([]);
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-tu-test-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBanner(`Đã xuất Excel cho ${allResults.length} lượt test của ${groupList.length} người (${groupList.length + 1} sheet).`, 'success');
  } catch (error) {
    console.error('Export all self-tests failed:', error);
    setBanner('Không thể tạo file Excel. Vui lòng thử lại.', 'error');
  } finally {
    exportingAll.value = false;
  }
}

onMounted(async () => {
  try {
    const { overview } = await expertPortal.load();
    if (!overview?.expert) {
      router.replace('/expert-apply');
      return;
    }
  } catch (error) {
    console.error('Expert client-assessments guard load failed:', error);
    setBanner('Không thể tải dữ liệu chuyên gia lúc này.', 'error');
    return;
  }

  await Promise.all([loadClients(), loadSelfTestResults()]);
});
</script>

<style scoped src="../../assets/expertDashboard.css"></style>
<style scoped src="../../assets/clientAssessments.css"></style>
