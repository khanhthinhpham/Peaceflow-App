import { apiClient } from './api-client.js';

const assessmentPage = {
    assessment: null,

    async init() {
        try {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code') || 'GAD7';

            this.showLoading(true);

            const res = await apiClient.get(`/assessments/${code}`);
            this.assessment = res.data?.data;

            if (!this.assessment) {
                throw new Error('ASSESSMENT_NOT_FOUND');
            }

            this.renderAssessment();
            this.bindSubmit();
        } catch (error) {
            console.error(error);
            this.showError('Không thể tải bài đánh giá.');
        } finally {
            this.showLoading(false);
        }
    },

    renderAssessment() {
        const titleEl = document.querySelector('[data-assessment-title]');
        const descEl = document.querySelector('[data-assessment-description]');
        const formEl = document.querySelector('[data-assessment-form]');
        const questionsEl = document.querySelector('[data-assessment-questions]');

        if (titleEl) titleEl.textContent = this.assessment.name;
        if (descEl) descEl.textContent = this.assessment.description || '';

        if (!formEl || !questionsEl) return;

        questionsEl.innerHTML = (this.assessment.question_schema || []).map((q, idx) => {
            return `
        <div class="assessment-question">
          <label class="question-label">${idx + 1}. ${q.label || q.key}</label>
          <select name="${q.key}" required>
            ${this.renderOptionsByType(q.type)}
          </select>
        </div>
      `;
        }).join('');
    },

    renderOptionsByType(type) {
        if (type === 'scale_0_4') {
            return `
        <option value="">Chọn</option>
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      `;
        }

        if (type === 'number') {
            return `
        <option value="">Chọn</option>
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
      `;
        }

        return `
      <option value="">Chọn</option>
      <option value="0">0</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
    `;
    },

    bindSubmit() {
        const formEl = document.querySelector('[data-assessment-form]');
        if (!formEl) return;

        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const formData = new FormData(formEl);
                const answers = {};

                for (const [key, value] of formData.entries()) {
                    answers[key] = Number(value);
                }

                const res = await apiClient.post(`/assessments/${this.assessment.code}/submit`, {
                    answers
                });

                const result = res.data?.data;
                this.renderResult(result);
            } catch (error) {
                console.error(error);
                this.showError('Không thể nộp bài đánh giá.');
            }
        });
    },

    renderResult(result) {
        const resultEl = document.querySelector('[data-assessment-result]');
        if (!resultEl) return;

        const severity = result?.severity || 'N/A';
        const score = result?.total_score ?? 'N/A';

        resultEl.innerHTML = `
      <div class="assessment-result-card">
        <h3>Kết quả của bạn</h3>
        <p><strong>Tổng điểm:</strong> ${score}</p>
        <p><strong>Mức độ:</strong> ${severity}</p>
      </div>
    `;

        resultEl.style.display = 'block';

        const highSeverityList = ['severe', 'moderately_severe', 'high', 'critical'];
        if (highSeverityList.includes(String(severity).toLowerCase())) {
            this.showWarning('Kết quả cho thấy bạn đang ở mức cần quan tâm cao hơn. Nếu thấy quá tải, hãy dùng mục Hỗ trợ khẩn cấp ngay.');
        }
    },

    showLoading(isLoading) {
        const el = document.querySelector('[data-assessment-loading]');
        if (el) el.style.display = isLoading ? 'block' : 'none';
    },

    showError(message) {
        const el = document.querySelector('[data-assessment-error]');
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
    },

    showWarning(message) {
        const el = document.querySelector('[data-assessment-warning]');
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    assessmentPage.init();
});
