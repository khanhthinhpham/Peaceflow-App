<template>
  <div class="screening-page">
    <div class="screening-shell">
      <div class="screening-banner-wrap">
        <img src="/images/screening-banner.png" alt="Phiếu khảo sát/sàng lọc đầu năm" class="screening-banner">
        <router-link to="/dashboard" class="screening-exit-btn" aria-label="Thoát">✕</router-link>
      </div>

      <div class="paper-card screening-card" v-if="!submitted">
        <div class="screening-progress">
          <div class="screening-progress-bar"><div class="screening-progress-fill" :style="{ width: progressPct + '%' }"></div></div>
          <div class="screening-progress-label">Phần {{ step + 1 }} / {{ STEP_COUNT }}</div>
        </div>

        <!-- Đã có điểm từ Phần 2 — note luôn điểm + mức độ Xanh/Vàng/Đỏ lên đây để em biết,
             thay vì để tới cuối mới xem (ẩn ở Phần 1 vì chưa có điểm). -->
        <div v-if="step >= 2 && wellbeingResult" class="screening-score-note" :class="`band-${wellbeingResult.band}`">
          <span class="screening-score-note-score">{{ wellbeingResult.total }}/30 điểm</span>
          <span class="screening-score-note-band">{{ wellbeingResult.bandLabel }}</span>
        </div>

        <!-- Phần 1: Thông tin chung -->
        <section v-if="step === 0">
          <h2 class="screening-step-title">Phần 1. Thông tin chung</h2>
          <p class="screening-step-desc">Thông tin này giúp nhà trường có thể hỗ trợ em khi cần. Thông tin cá nhân sẽ được bảo mật.</p>

          <div class="form-group">
            <label class="form-label">Trường *</label>
            <select v-model="form.schoolId" class="form-input">
              <option value="" disabled>Chọn trường...</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Họ và tên học sinh</label>
            <input v-model="form.studentName" type="text" class="form-input" placeholder="Nguyễn Văn A">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Khối *</label>
              <select v-model="form.grade" class="form-input">
                <option value="" disabled>Chọn khối...</option>
                <option v-for="g in GRADES" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Lớp *</label>
              <input v-model="form.className" type="text" class="form-input" placeholder="VD: 9A1">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Giới tính</label>
            <select v-model="form.gender" class="form-input">
              <option value="unspecified">Không muốn trả lời</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Số điện thoại hoặc email liên hệ nếu cần</label>
            <input v-model="form.contact" type="text" class="form-input" placeholder="Không bắt buộc">
          </div>
        </section>

        <!-- Phần 2: Cảm nhận chung -->
        <section v-if="step === 1">
          <h2 class="screening-step-title">Phần 2. Cảm nhận chung về học tập và cuộc sống</h2>
          <p class="screening-step-desc">Với mỗi câu, em chọn mức độ phù hợp nhất với bản thân.</p>

          <div v-for="(q, i) in WELLBEING_QUESTIONS" :key="i" class="screening-likert-block">
            <div class="screening-likert-text">{{ q }}</div>
            <div class="screening-likert-scale-hint">
              <span>1 = Hoàn toàn không đúng với em</span>
              <span>5 = Rất đúng với em</span>
            </div>
            <div class="likert-wrap cols-5">
              <div
                v-for="n in 5"
                :key="n"
                class="likert-option"
                :class="{ selected: form.wellbeingScores[i] === n }"
                @click="form.wellbeingScores[i] = n"
              >
                <span class="lo-label" style="font-size:0.95rem;font-weight:800;">{{ n }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Phần 3: Khó khăn đang gặp -->
        <section v-if="step === 2">
          <h2 class="screening-step-title">Phần 3. Các khó khăn em đang gặp</h2>
          <p class="screening-step-desc">Em có thể chọn nhiều đáp án.</p>

          <div class="screening-checklist">
            <label v-for="opt in DIFFICULTY_OPTIONS" :key="opt.key" class="screening-check-item">
              <input type="checkbox" :value="opt.key" v-model="form.difficulties">
              {{ opt.label }}
            </label>
          </div>
          <div class="form-group" style="margin-top:10px;">
            <label class="form-label">Mục khác</label>
            <input v-model="form.difficultiesOther" type="text" class="form-input" placeholder="Không bắt buộc">
          </div>
        </section>

        <!-- Phần 4: Nhu cầu hỗ trợ -->
        <section v-if="step === 3">
          <h2 class="screening-step-title">Phần 4. Nhu cầu được hỗ trợ</h2>
          <p class="screening-step-desc">Em có thể chọn nhiều nội dung mà em mong muốn được hỗ trợ.</p>

          <div class="screening-checklist">
            <label v-for="opt in SUPPORT_NEED_OPTIONS" :key="opt.key" class="screening-check-item">
              <input type="checkbox" :value="opt.key" v-model="form.supportNeeds">
              {{ opt.label }}
            </label>
          </div>
          <div class="form-group" style="margin-top:10px;">
            <label class="form-label">Mục khác</label>
            <input v-model="form.supportNeedsOther" type="text" class="form-input" placeholder="Không bắt buộc">
          </div>
        </section>

        <!-- Phần 5: Đồng ý liên hệ -->
        <section v-if="step === 4">
          <h2 class="screening-step-title">Phần 5. Đồng ý liên hệ hỗ trợ</h2>
          <div class="form-group">
            <label class="form-label">Em muốn chia sẻ thêm điều gì với nhà trường không?</label>
            <textarea v-model="form.shareNote" class="form-input" rows="4" placeholder="Không bắt buộc"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Nếu nhà trường nhận thấy em cần được hỗ trợ thêm, em có đồng ý để tổ tư vấn hoặc giáo viên được phân công liên hệ với em không? *</label>
            <div style="display:flex;gap:10px;">
              <label class="screening-radio-pill" :class="{ selected: form.consentContact === true }">
                <input type="radio" :value="true" v-model="form.consentContact"> Có
              </label>
              <label class="screening-radio-pill" :class="{ selected: form.consentContact === false }">
                <input type="radio" :value="false" v-model="form.consentContact"> Không
              </label>
            </div>
          </div>
        </section>

        <!-- Phần 6: Phiếu đăng ký hỗ trợ -->
        <section v-if="step === 5">
          <h2 class="screening-step-title">Phiếu đăng ký hỗ trợ</h2>
          <p class="screening-step-desc">Phần này không bắt buộc — chỉ điền nếu em muốn đăng ký được hỗ trợ cụ thể hơn.</p>

          <div class="form-group">
            <label class="form-label">Vấn đề học sinh đang gặp phải</label>
            <div class="screening-checklist">
              <label v-for="opt in REFERRAL_CATEGORY_OPTIONS" :key="opt.key" class="screening-check-item">
                <input type="checkbox" :value="opt.key" v-model="form.referralCategories">
                <div>
                  <strong>{{ opt.label }}</strong>
                  <div class="screening-check-hint">{{ opt.hint }}</div>
                </div>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mức độ cần hỗ trợ theo nhận định ban đầu</label>
            <img src="/images/risk-level-guide.png" alt="Hướng dẫn mức độ Xanh/Vàng/Đỏ" class="screening-risk-guide-img">
            <div class="screening-risk-options">
              <label
                v-for="opt in RISK_LEVEL_OPTIONS"
                :key="opt.key"
                class="screening-risk-card"
                :class="[`band-${opt.key}`, { selected: form.referralRiskLevel === opt.key }]"
              >
                <input type="radio" :value="opt.key" v-model="form.referralRiskLevel">
                <strong>{{ opt.label }}</strong>
                <div class="screening-check-hint">{{ opt.hint }}</div>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Hình thức mong muốn hỗ trợ</label>
            <div class="screening-checklist">
              <label v-for="opt in SUPPORT_FORMAT_OPTIONS" :key="opt.key" class="screening-check-item">
                <input type="checkbox" :value="opt.key" v-model="form.referralSupportFormat">
                {{ opt.label }}
              </label>
            </div>
          </div>

        </section>

        <!-- Phần 7: Xác nhận -->
        <section v-if="step === 6">
          <h2 class="screening-step-title">Xác nhận</h2>
          <p class="screening-step-desc">Em xác nhận rằng các thông tin trên được cung cấp nhằm mục đích giúp nhà trường hiểu và hỗ trợ học sinh tốt hơn.</p>
          <div class="form-group">
            <label class="form-label">Mô tả (không bắt buộc)</label>
            <textarea v-model="form.confirmNote" class="form-input" rows="3"></textarea>
          </div>
          <p v-if="submitError" style="color:var(--coral);font-size:0.85rem;">{{ submitError }}</p>
        </section>

        <div class="screening-nav">
          <button type="button" class="btn-outline" :disabled="step === 0" @click="step--">← Quay lại</button>
          <button v-if="step < STEP_COUNT - 1" type="button" class="btn-primary" :disabled="!canNext" @click="goNext">Tiếp tục →</button>
          <button v-else type="button" class="btn-primary" :disabled="submitting || !canNext" @click="submit">{{ submitting ? 'Đang gửi...' : 'Gửi phiếu khảo sát' }}</button>
        </div>
      </div>

      <div class="paper-card screening-card screening-done" v-else>
        <div style="font-size:2.4rem;">✅</div>
        <h2 class="screening-step-title">Đã gửi phiếu khảo sát!</h2>
        <p class="screening-step-desc">Cảm ơn em đã chia sẻ. Nhà trường sẽ xem xét và liên hệ nếu em đồng ý hoặc nếu cần hỗ trợ thêm.</p>

        <div class="paper-card result-ai-summary" style="text-align:left;" v-if="aiSummaryLoading || aiSummaryText">
          <div class="ai-summary-header">
            <span class="ai-summary-icon">🤖</span>
            <span class="ri-title" style="margin-bottom:0;">Nhận xét từ AI</span>
            <span class="badge-pill badge-mint" style="margin-left:auto;">AI</span>
          </div>
          <div v-if="aiSummaryLoading" class="ai-summary-loading">Đang phân tích kết quả...</div>
          <div v-else class="ai-summary-text">{{ aiSummaryText }}</div>
          <template v-if="aiInterpretation">
            <div class="ai-summary-task-title">Gợi ý</div>
            <div class="ai-summary-text">{{ aiInterpretation }}</div>
          </template>
        </div>

        <!-- Kết quả Phần 2 ra mức Đỏ — gợi ý luôn lối vào hỗ trợ khẩn cấp, không đợi nhà
             trường liên hệ lại (có thể mất thời gian), vì đây là lúc em đang cần nhất. -->
        <div v-if="wellbeingResult?.band === 'do'" class="screening-emergency-suggest">
          <p>Nếu em đang cảm thấy không ổn, đừng chờ đợi một mình — có người sẵn sàng lắng nghe ngay bây giờ.</p>
          <router-link to="/emergency" class="btn-primary" style="background:var(--coral);border-color:var(--coral-dark, var(--coral));">🆘 Hỗ trợ khẩn cấp</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { apiClient } from '../lib/apiClient';

const GRADES = ['6', '7', '8', '9', '10', '11', '12'];

const WELLBEING_QUESTIONS = [
  'Em cảm thấy nhìn chung mình thích nghi được với việc học ở trường.',
  'Em không cảm thấy áp lực vì học tập, điểm số hoặc thi cử.',
  'Em cảm thấy có ít nhất một thầy/cô mà em có thể trao đổi khi cần.',
  'Em cảm thấy có bạn bè hoặc người thân có thể lắng nghe em.',
  'Em không cảm thấy khó ngủ, mệt mỏi hoặc mất tập trung vì lo lắng.',
  'Em cảm thấy mình biết cách tìm kiếm sự giúp đỡ khi gặp khó khăn.'
];

const DIFFICULTY_OPTIONS = [
  { key: 'ap_luc_hoc_tap', label: 'Áp lực học tập, thi cử' },
  { key: 'lo_lang_cang_thang', label: 'Lo lắng, căng thẳng' },
  { key: 'buon_chan_mat_hung_thu', label: 'Buồn chán, mất hứng thú' },
  { key: 'kho_kiem_soat_cam_xuc', label: 'Khó kiểm soát cảm xúc' },
  { key: 'mau_thuan_ban_be', label: 'Mâu thuẫn với bạn bè' },
  { key: 'mau_thuan_gia_dinh', label: 'Mâu thuẫn với cha mẹ/người thân' },
  { key: 'bi_treu_choc_bat_nat', label: 'Bị trêu chọc, bắt nạt hoặc cô lập' },
  { key: 'kho_khan_mang_xa_hoi', label: 'Khó khăn khi sử dụng mạng xã hội' },
  { key: 'kho_khan_dinh_huong_nghe_nghiep', label: 'Khó khăn về định hướng nghề nghiệp' },
  { key: 'kho_khan_hoan_canh_gia_dinh', label: 'Khó khăn về hoàn cảnh gia đình' },
  { key: 'khong_co_kho_khan', label: 'Không có khó khăn đáng kể' }
];

const SUPPORT_NEED_OPTIONS = [
  { key: 'ky_nang_quan_ly_cang_thang', label: 'Kỹ năng quản lý căng thẳng' },
  { key: 'ky_nang_hoc_tap', label: 'Kỹ năng học tập hiệu quả' },
  { key: 'ky_nang_dieu_hoa_cam_xuc', label: 'Kỹ năng điều hoà cảm xúc' },
  { key: 'ky_nang_giao_tiep', label: 'Kỹ năng giao tiếp và giải quyết mâu thuẫn' },
  { key: 'phong_chong_bao_luc', label: 'Phòng chống bạo lực học đường' },
  { key: 'an_toan_mang', label: 'An toàn trên môi trường mạng' },
  { key: 'tu_van_huong_nghiep', label: 'Tư vấn hướng nghiệp' },
  { key: 'tro_chuyen_rieng', label: 'Trò chuyện riêng với thầy/cô hoặc tổ tư vấn' },
  { key: 'khong_co_nhu_cau', label: 'Không có nhu cầu hiện tại' }
];

const REFERRAL_CATEGORY_OPTIONS = [
  { key: 'hoc_tap', label: 'Học tập', hint: 'Áp lực học tập, điểm số/thi cử; khó tập trung; giảm động lực; khó khăn về phương pháp học...' },
  { key: 'huong_nghiep', label: 'Hướng nghiệp', hint: 'Chưa xác định được sở thích, năng lực; băn khoăn lựa chọn môn học, ngành học, nghề nghiệp...' },
  { key: 'giao_tiep', label: 'Giao tiếp và các mối quan hệ', hint: 'Khó khăn trong quan hệ với bạn bè, thầy cô, cha mẹ; mâu thuẫn, cô lập, bắt nạt/bạo lực học đường...' },
  { key: 'phat_trien_ban_than', label: 'Phát triển bản thân', hint: 'Căng thẳng, lo lắng, buồn chán; thiếu tự tin; khó quản lý cảm xúc/hành vi...' }
];

const RISK_LEVEL_OPTIONS = [
  { key: 'xanh', label: 'Xanh — mức độ nhẹ', hint: 'Khó khăn ở mức nhẹ hoặc tạm thời; vẫn duy trì tương đối bình thường việc học tập, sinh hoạt.' },
  { key: 'vang', label: 'Vàng — cần được quan tâm và hỗ trợ', hint: 'Khó khăn kéo dài, lặp lại hoặc ảnh hưởng rõ đến học tập, cảm xúc, sinh hoạt hay các mối quan hệ.' },
  { key: 'do', label: 'Đỏ — cần ưu tiên hỗ trợ ngay', hint: 'Có dấu hiệu nguy cơ mất an toàn hoặc ảnh hưởng nghiêm trọng — cần báo người có trách nhiệm ngay.' }
];

const SUPPORT_FORMAT_OPTIONS = [
  { key: 'tai_lieu', label: 'Nhận tài liệu/hướng dẫn' },
  { key: 'tu_van_truong', label: 'Tư vấn/hỗ trợ tại trường' },
  { key: 'ket_noi_chuyen_gia', label: 'Kết nối chuyên gia' },
  { key: 'ho_tro_khan', label: 'Hỗ trợ khẩn' }
];

const STEP_COUNT = 7;
const step = ref(0);
const progressPct = computed(() => Math.round(((step.value + 1) / STEP_COUNT) * 100));

const schools = ref([]);
onMounted(async () => {
  try {
    schools.value = await apiClient.get('/screening/schools', { noCache: true });
  } catch (_error) {
    schools.value = [];
  }
});

const form = reactive({
  schoolId: '',
  studentName: '',
  grade: '',
  className: '',
  gender: 'unspecified',
  contact: '',
  wellbeingScores: [0, 0, 0, 0, 0, 0],
  difficulties: [],
  difficultiesOther: '',
  supportNeeds: [],
  supportNeedsOther: '',
  shareNote: '',
  consentContact: null,
  referralCategories: [],
  referralRiskLevel: '',
  referralSupportFormat: [],
  confirmNote: ''
});

// Nhân bản ĐÚNG công thức chấm điểm server-side (riskBandFromScore ở screening.routes.js)
// để note ngay cho em xem, không cần đợi submit xong. Server vẫn tự tính lại khi lưu,
// đây chỉ là xem trước.
const WELLBEING_BAND_LABELS = { do: '🔴 Đỏ — cần ưu tiên hỗ trợ ngay', vang: '🟡 Vàng — cần được quan tâm', xanh: '🟢 Xanh — mức độ nhẹ' };
const wellbeingResult = computed(() => {
  if (!form.wellbeingScores.every((n) => n >= 1)) return null;
  const total = form.wellbeingScores.reduce((sum, n) => sum + n, 0);
  const band = total <= 10 ? 'do' : total <= 19 ? 'vang' : 'xanh';
  return { total, band, bandLabel: WELLBEING_BAND_LABELS[band] };
});

const canNext = computed(() => {
  if (step.value === 0) return Boolean(form.schoolId && form.grade && form.className.trim());
  if (step.value === 1) return form.wellbeingScores.every((n) => n >= 1);
  if (step.value === 4) return form.consentContact !== null;
  return true;
});

function goNext() {
  if (canNext.value) step.value++;
}

const submitting = ref(false);
const submitError = ref('');
const submitted = ref(false);

// Nhận xét AI cho kết quả Phần 2 — dùng chung endpoint/giọng văn với các bài test tự làm
// khác (DASS-21, GAD-7...) ở MoodAssessmentView.vue.
const aiSummaryText = ref('');
const aiSummaryLoading = ref(false);
const aiInterpretation = ref('');
async function loadAiSummary(responseId) {
  if (!responseId) return;
  aiSummaryLoading.value = true;
  try {
    const data = await apiClient.post(`/screening/responses/${responseId}/ai-summary`, {});
    aiSummaryText.value = data?.summary || '';
    aiInterpretation.value = data?.interpretation || '';
  } catch (error) {
    console.error('Screening AI summary load failed:', error);
    aiSummaryText.value = '';
    aiInterpretation.value = '';
  } finally {
    aiSummaryLoading.value = false;
  }
}

async function submit() {
  if (!canNext.value) return;
  submitting.value = true;
  submitError.value = '';
  try {
    const data = await apiClient.post('/screening/responses', {
      schoolId: form.schoolId,
      studentName: form.studentName,
      grade: form.grade,
      className: form.className,
      gender: form.gender,
      contact: form.contact,
      wellbeingScores: form.wellbeingScores,
      difficulties: form.difficulties,
      difficultiesOther: form.difficultiesOther,
      supportNeeds: form.supportNeeds,
      supportNeedsOther: form.supportNeedsOther,
      shareNote: form.shareNote,
      consentContact: form.consentContact,
      referralCategories: form.referralCategories,
      referralRiskLevel: form.referralRiskLevel || null,
      referralSupportFormat: form.referralSupportFormat,
      confirmNote: form.confirmNote
    });
    submitted.value = true;
    loadAiSummary(data?.id);
  } catch (error) {
    submitError.value = error.message || 'Không gửi được phiếu khảo sát, vui lòng thử lại.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped src="../assets/assessment.css"></style>
<style scoped src="../assets/screeningShared.css"></style>
