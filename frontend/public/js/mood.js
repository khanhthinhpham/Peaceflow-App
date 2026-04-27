import { apiClient } from './api-client.js';

export const moodManager = {
    selectedScore: 5,
    selectedMood: null,
    selectedTags: new Set(),

    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedMood = btn.dataset.mood;
                this.selectedMoodLabel = btn.dataset.label;
            });
        });

        // Tag selection
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
                const tag = btn.dataset.tag;
                if (this.selectedTags.has(tag)) {
                    this.selectedTags.delete(tag);
                } else {
                    this.selectedTags.add(tag);
                }
            });
        });

        // Slider
        const slider = document.getElementById('intensitySlider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.selectedScore = parseInt(e.target.value);
                this.updateSliderUI(this.selectedScore);
            });
        }
    },

    updateSliderUI(score) {
        const valEl = document.getElementById('sliderValue');
        if (valEl) valEl.innerText = score;
        // Other UI updates...
    },

    async submitCheckin() {
        if (!this.selectedMood) {
            alert('Vui lòng chọn tâm trạng của bạn!');
            return;
        }

        const payload = {
            mood_score: this.selectedScore,
            anxiety_score: 5, // Default or from another UI element
            stress_score: 5,
            energy_score: 5,
            sleep_quality_score: 5,
            dominant_emotion: this.selectedMood,
            triggers: Array.from(this.selectedTags),
            notes: document.getElementById('moodNotes')?.value || ''
        };

        try {
            await apiClient.post('/moods', payload);
            // Redirect to dashboard or success step
            if (window.goCheckinStep) window.goCheckinStep(4);
            else window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Error submitting mood:', error);
            alert('Lỗi khi lưu tâm trạng: ' + error.message);
        }
    }
};

window.submitCheckin = () => moodManager.submitCheckin();

if (window.location.pathname.includes('mood-checkin.html')) {
    moodManager.init();
}
