import { apiClient } from './api-client.js';

const emergencyPage = {
    async init() {
        try {
            this.showLoading(true);

            const res = await apiClient.get('/emergency/resources');
            const payload = res.data?.data || {};

            this.renderResources(payload.resources || {});
            this.renderRecommendation(payload.recommendations || {});
            this.bindActions();
        } catch (error) {
            console.error(error);
            this.showError('Không thể tải dữ liệu hỗ trợ khẩn cấp.');
        } finally {
            this.showLoading(false);
        }
    },

    renderResources(resources) {
        const hotlineEl = document.querySelector('[data-emergency-hotlines]');
        const toolsEl = document.querySelector('[data-emergency-tools]');

        if (hotlineEl) {
            hotlineEl.innerHTML = (resources.hotlines || []).map(item => `
        <div class="emergency-card">
          <div><strong>${item.name}</strong></div>
          <div>${item.phone}</div>
          <button data-emergency-log="hotline_view" data-phone="${item.phone}">
            Gọi / Xem hotline
          </button>
        </div>
      `).join('');
        }

        if (toolsEl) {
            toolsEl.innerHTML = (resources.grounding_tools || []).map(item => `
        <div class="emergency-card">
          <div><strong>${item.title}</strong></div>
          <div>${item.description}</div>
          <button data-emergency-log="breathing_tool" data-tool-code="${item.code}">
            Sử dụng công cụ
          </button>
        </div>
      `).join('');
        }
    },

    renderRecommendation(recommendations) {
        const el = document.querySelector('[data-emergency-recommendation]');
        if (!el) return;

        const actions = recommendations.actions || [];

        el.innerHTML = `
      <div class="recommendation-box level-${recommendations.level || 'low'}">
        <h3>Mức hỗ trợ hiện tại: ${recommendations.level || 'low'}</h3>
        <p>${recommendations.message || ''}</p>
        <ul>
          ${actions.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    `;
    },

    bindActions() {
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-emergency-log]');
            if (!btn) return;

            const eventType = btn.getAttribute('data-emergency-log');
            const payload = {
                phone: btn.getAttribute('data-phone') || null,
                tool_code: btn.getAttribute('data-tool-code') || null,
                page: 'emergency'
            };

            try {
                await apiClient.post('/emergency/log', {
                    event_type: eventType,
                    payload
                });
            } catch (error) {
                console.error('Emergency log failed:', error);
            }
        });

        const escalateBtn = document.querySelector('[data-emergency-escalate]');
        if (escalateBtn) {
            escalateBtn.addEventListener('click', async () => {
                try {
                    const res = await apiClient.post('/emergency/escalate', {
                        source: 'emergency_page',
                        reason: 'user_manual_request'
                    });

                    const data = res.data?.data;
                    if (data?.next_steps) {
                        this.renderRecommendation(data.next_steps);
                    }

                    const resultEl = document.querySelector('[data-emergency-escalate-result]');
                    if (resultEl) {
                        resultEl.textContent = 'Đã ghi nhận yêu cầu hỗ trợ khẩn cấp. Hãy thực hiện ngay các bước gợi ý.';
                        resultEl.style.display = 'block';
                    }
                } catch (error) {
                    console.error(error);
                    this.showError('Không thể kích hoạt hỗ trợ khẩn cấp.');
                }
            });
        }
    },

    showLoading(isLoading) {
        const el = document.querySelector('[data-emergency-loading]');
        if (el) el.style.display = isLoading ? 'block' : 'none';
    },

    showError(message) {
        const el = document.querySelector('[data-emergency-error]');
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    emergencyPage.init();
});
