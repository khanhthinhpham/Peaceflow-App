<template>
  <div class="screening-page">
    <div class="screening-shell">
      <div class="screening-banner-wrap">
        <img src="/images/support-registration-banner.png" alt="Phiếu đăng ký hỗ trợ" class="screening-banner">
        <router-link to="/dashboard" class="screening-exit-btn" aria-label="Thoát">✕</router-link>
      </div>

      <div class="paper-card screening-card" v-if="!submitted">
        <p class="screening-step-desc" style="margin-bottom:18px;">Dành cho học sinh, phụ huynh hoặc giáo viên muốn đăng ký hỗ trợ cụ thể cho 1 học sinh. Các trường có dấu * là bắt buộc.</p>

        <div class="form-group">
          <label class="form-label">Người cung cấp thông tin *</label>
          <div class="screening-checklist">
            <label v-for="opt in INFORMANT_OPTIONS" :key="opt.key" class="screening-check-item">
              <input type="radio" :value="opt.key" v-model="form.informant">
              {{ opt.label }}
            </label>
          </div>
          <input v-if="form.informant === 'khac'" v-model="form.informantOther" type="text" class="form-input" style="margin-top:8px;" placeholder="Ghi rõ...">
        </div>

        <div class="form-group">
          <label class="form-label">Email{{ emailPhoneRequired ? ' *' : ' (không bắt buộc)' }}</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="you@example.com">
        </div>

        <div class="form-group">
          <label class="form-label">Số điện thoại{{ emailPhoneRequired ? ' *' : ' (không bắt buộc)' }}</label>
          <input v-model="form.phone" type="text" class="form-input" placeholder="09xxxxxxxx">
        </div>

        <div class="form-group">
          <label class="form-label">Trường *</label>
          <select v-model="form.schoolId" class="form-input">
            <option value="" disabled>Chọn trường...</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
            <option value="khac">Khác</option>
          </select>
          <input v-if="form.schoolId === 'khac'" v-model="form.schoolOther" type="text" class="form-input" style="margin-top:8px;" placeholder="Ghi rõ tên trường...">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Khối *</label>
            <select v-model="form.grade" class="form-input">
              <option value="" disabled>Chọn khối...</option>
              <option v-for="g in GRADES" :key="g" :value="g">{{ g }}</option>
              <option value="khac">Khác</option>
            </select>
            <input v-if="form.grade === 'khac'" v-model="form.gradeOther" type="text" class="form-input" style="margin-top:8px;" placeholder="Ghi rõ...">
          </div>
          <div class="form-group">
            <label class="form-label">Lớp *</label>
            <input v-model="form.className" type="text" class="form-input" placeholder="VD: 9A1">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Họ tên học sinh cần hỗ trợ *</label>
          <input v-model="form.studentName" type="text" class="form-input" placeholder="Nguyễn Văn A">
        </div>

        <div class="form-group">
          <label class="form-label">Vấn đề học sinh đang gặp phải *</label>
          <img src="/images/issue-category-guide.png" alt="Hướng dẫn các nhóm vấn đề: Học tập, Hướng nghiệp, Giao tiếp, Phát triển bản thân" class="screening-risk-guide-img">
          <div class="screening-checklist">
            <label v-for="opt in ISSUE_CATEGORY_OPTIONS" :key="opt.key" class="screening-check-item">
              <input type="checkbox" :value="opt.key" v-model="form.issueCategories">
              <div>
                <strong>{{ opt.label }}</strong>
                <div v-if="opt.hint" class="screening-check-hint">{{ opt.hint }}</div>
              </div>
            </label>
            <label class="screening-check-item">
              <input type="checkbox" :value="'khac'" v-model="form.issueCategories">
              Khác
            </label>
          </div>
          <input v-if="form.issueCategories.includes('khac')" v-model="form.issueCategoriesOther" type="text" class="form-input" style="margin-top:8px;" placeholder="Ghi rõ...">
        </div>

        <div class="form-group">
          <label class="form-label">Mô tả rõ hơn về vấn đề *</label>
          <textarea v-model="form.issueDescription" class="form-input" rows="4" placeholder="Tối thiểu khoảng 20 ký tự"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Mức độ cần hỗ trợ theo nhận định ban đầu *</label>
          <img src="/images/risk-level-guide.png" alt="Hướng dẫn mức độ Xanh/Vàng/Đỏ" class="screening-risk-guide-img">
          <div class="screening-risk-options">
            <label
              v-for="opt in RISK_LEVEL_OPTIONS"
              :key="opt.key"
              class="screening-risk-card"
              :class="[`band-${opt.key}`, { selected: form.riskLevel === opt.key }]"
            >
              <input type="radio" :value="opt.key" v-model="form.riskLevel">
              <strong>{{ opt.label }}</strong>
              <div class="screening-check-hint">{{ opt.hint }}</div>
            </label>
            <label class="screening-risk-card" :class="{ selected: form.riskLevel === 'khac' }">
              <input type="radio" value="khac" v-model="form.riskLevel">
              <strong>Khác</strong>
            </label>
          </div>
          <input v-if="form.riskLevel === 'khac'" v-model="form.riskLevelOther" type="text" class="form-input" style="margin-top:8px;" placeholder="Ghi rõ...">
        </div>

        <div class="form-group">
          <label class="form-label">Hình thức mong muốn hỗ trợ *</label>
          <div class="screening-checklist">
            <label v-for="opt in SUPPORT_FORMAT_OPTIONS" :key="opt.key" class="screening-check-item">
              <input type="checkbox" :value="opt.key" v-model="form.supportFormat">
              {{ opt.label }}
            </label>
            <label class="screening-check-item">
              <input type="checkbox" :value="'khac'" v-model="form.supportFormat">
              Khác
            </label>
          </div>
          <input v-if="form.supportFormat.includes('khac')" v-model="form.supportFormatOther" type="text" class="form-input" style="margin-top:8px;" placeholder="Ghi rõ...">
        </div>

        <div class="screening-consent-box">
          <label class="screening-consent-item">
            <input type="checkbox" v-model="form.consent">
            <span>Tôi xác nhận các thông tin trên được cung cấp nhằm mục đích giúp nhà trường hiểu và hỗ trợ học sinh phù hợp hơn.</span>
          </label>
        </div>
        <div class="form-group" style="margin-top:10px;">
          <label class="form-label">Chia sẻ thêm (không bắt buộc)</label>
          <textarea v-model="form.confirmNote" class="form-input" rows="3"></textarea>
        </div>

        <p v-if="submitError" style="color:var(--coral);font-size:0.85rem;margin-top:10px;">{{ submitError }}</p>

        <div class="screening-nav" style="justify-content:flex-end;">
          <button type="button" class="btn-primary" :disabled="submitting" @click="submit">{{ submitting ? 'Đang gửi...' : 'Gửi phiếu đăng ký' }}</button>
        </div>
      </div>

      <div class="paper-card screening-card screening-done" v-else>
        <div style="font-size:2.4rem;">✅</div>
        <h2 class="screening-step-title">Đã gửi phiếu đăng ký!</h2>
        <p class="screening-step-desc">Cảm ơn bạn đã đăng ký. Nhà trường/tổ tư vấn sẽ liên hệ hỗ trợ trong thời gian sớm nhất.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { apiClient } from '../lib/apiClient';

const GRADES = ['6', '7', '8', '9', '10', '11', '12'];

const INFORMANT_OPTIONS = [
  { key: 'hoc_sinh', label: 'Học sinh' },
  { key: 'cha_me', label: 'Cha/mẹ hoặc người thân' },
  { key: 'giao_vien', label: 'Giáo viên/cán bộ nhà trường' }
];

const ISSUE_CATEGORY_OPTIONS = [
  { key: 'hoc_tap', label: 'Học tập', hint: 'Áp lực học tập, điểm số/thi cử; khó tập trung; giảm động lực; khó khăn về phương pháp học...' },
  { key: 'huong_nghiep', label: 'Hướng nghiệp', hint: 'Chưa xác định được sở thích, năng lực; băn khoăn lựa chọn môn học, ngành học, nghề nghiệp...' },
  { key: 'giao_tiep', label: 'Giao tiếp và các mối quan hệ', hint: 'Khó khăn trong quan hệ với bạn bè, thầy cô, cha mẹ; mâu thuẫn, cô lập, bắt nạt/bạo lực học đường...' },
  { key: 'phat_trien_ban_than', label: 'Phát triển bản thân', hint: 'Căng thẳng, lo lắng, buồn chán; thiếu tự tin; khó quản lý cảm xúc/hành vi...' }
];

const RISK_LEVEL_OPTIONS = [
  { key: 'xanh', label: 'Xanh', hint: 'Mức độ nhẹ hoặc tạm thời; vẫn duy trì tương đối bình thường việc học tập, sinh hoạt.' },
  { key: 'vang', label: 'Vàng', hint: 'Cần được quan tâm và hỗ trợ — khó khăn kéo dài, lặp lại hoặc ảnh hưởng rõ đến học tập, cảm xúc.' },
  { key: 'do', label: 'Đỏ', hint: 'Cần ưu tiên hỗ trợ ngay — có dấu hiệu nguy cơ mất an toàn hoặc ảnh hưởng nghiêm trọng.' }
];

const SUPPORT_FORMAT_OPTIONS = [
  { key: 'tai_lieu', label: 'Nhận tài liệu/hướng dẫn' },
  { key: 'tu_van_truong', label: 'Tư vấn/hỗ trợ tại trường' },
  { key: 'ket_noi_chuyen_gia', label: 'Kết nối chuyên gia' },
  { key: 'ho_tro_khan', label: 'Hỗ trợ khẩn' }
];

const schools = ref([]);
onMounted(async () => {
  try {
    schools.value = await apiClient.get('/screening/schools', { noCache: true });
  } catch (_error) {
    schools.value = [];
  }
});

const form = reactive({
  email: '',
  informant: '',
  informantOther: '',
  schoolId: '',
  schoolOther: '',
  grade: '',
  gradeOther: '',
  className: '',
  studentName: '',
  issueCategories: [],
  issueCategoriesOther: '',
  issueDescription: '',
  riskLevel: '',
  riskLevelOther: '',
  supportFormat: [],
  supportFormatOther: '',
  phone: '',
  consent: false,
  confirmNote: ''
});

const submitting = ref(false);
const submitError = ref('');
const submitted = ref(false);

// Học sinh tự điền thường không muốn/không tiện cho email-SĐT riêng; cha mẹ/giáo viên thì
// nhà trường cần liên hệ lại được nên 2 trường này bắt buộc với họ.
const emailPhoneRequired = computed(() => form.informant === 'cha_me' || form.informant === 'giao_vien');

function validate() {
  if (!form.informant) return 'Vui lòng chọn người cung cấp thông tin.';
  if (emailPhoneRequired.value && !form.email.trim()) return 'Vui lòng nhập email.';
  if (emailPhoneRequired.value && !form.phone.trim()) return 'Vui lòng nhập số điện thoại.';
  if (!form.schoolId) return 'Vui lòng chọn trường.';
  if (!form.grade) return 'Vui lòng chọn khối.';
  if (!form.className.trim()) return 'Vui lòng nhập lớp.';
  if (!form.studentName.trim()) return 'Vui lòng nhập họ tên học sinh cần hỗ trợ.';
  if (!form.issueCategories.length) return 'Vui lòng chọn ít nhất một vấn đề học sinh đang gặp phải.';
  if (!form.issueDescription.trim()) return 'Vui lòng mô tả rõ hơn về vấn đề.';
  if (!form.riskLevel) return 'Vui lòng chọn mức độ cần hỗ trợ.';
  if (!form.supportFormat.length) return 'Vui lòng chọn ít nhất một hình thức mong muốn hỗ trợ.';
  return '';
}

async function submit() {
  const error = validate();
  if (error) {
    submitError.value = error;
    return;
  }
  submitting.value = true;
  submitError.value = '';
  try {
    await apiClient.post('/support-registrations', {
      email: form.email,
      informant: form.informant,
      informantOther: form.informantOther,
      schoolId: form.schoolId !== 'khac' ? form.schoolId : null,
      schoolOther: form.schoolId === 'khac' ? form.schoolOther : '',
      grade: form.grade !== 'khac' ? form.grade : null,
      gradeOther: form.grade === 'khac' ? form.gradeOther : '',
      className: form.className,
      studentName: form.studentName,
      issueCategories: form.issueCategories,
      issueCategoriesOther: form.issueCategoriesOther,
      issueDescription: form.issueDescription,
      riskLevel: form.riskLevel,
      riskLevelOther: form.riskLevelOther,
      supportFormat: form.supportFormat,
      supportFormatOther: form.supportFormatOther,
      phone: form.phone,
      consent: form.consent,
      confirmNote: form.confirmNote
    });
    submitted.value = true;
  } catch (err) {
    submitError.value = err.message || 'Không gửi được phiếu đăng ký, vui lòng thử lại.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped src="../assets/assessment.css"></style>
<style scoped src="../assets/screeningShared.css"></style>
