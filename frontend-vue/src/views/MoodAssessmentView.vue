<template>
  <div class="assessment-page">
    <!-- Emergency Overlay -->
    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-icon">❤️</div>
        <div class="ep-title">{{ t('moodAssessment.emergency.title') }}</div>
        <p class="ep-text">{{ t('moodAssessment.emergency.text') }}</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">{{ t('moodAssessment.emergency.hotlineLabel') }}</div>
        </div>
        <div class="ep-actions">
          <a href="tel:0931773637" class="ep-btn ep-btn-red">{{ t('moodAssessment.emergency.callHotline') }}</a>
          <router-link to="/experts" class="ep-btn ep-btn-green">{{ t('moodAssessment.emergency.connectExpert') }}</router-link>
          <button class="ep-btn ep-btn-ghost" @click="emergencyOpen = false">{{ t('moodAssessment.emergency.understood') }}</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <!-- ===== TEST SELECTOR VIEW ===== -->
      <div v-show="view === 'selector'">
        <div class="page-header">
          <div>
            <div class="page-title">{{ t('moodAssessment.selector.pageTitle') }}</div>
            <div class="page-subtitle">{{ t('moodAssessment.selector.pageSubtitle') }}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <router-link to="/mood-checkin" class="btn-outline">{{ t('moodAssessment.selector.back') }}</router-link>
            <router-link to="/mood-chat" class="btn-outline">{{ t('moodAssessment.selector.chatAi') }}</router-link>
          </div>
        </div>

        <div class="disclaimer-banner">
          <span class="db-icon">⚠️</span>
          <div v-html="t('moodAssessment.selector.disclaimer')"></div>
        </div>

        <div class="respondent-card">
          <h3 class="rc-title-toggle" @click="showRespondentHint = !showRespondentHint">
            {{ t('moodAssessment.selector.respondentTitle') }}
            <span class="rc-toggle-arrow" :class="{ open: showRespondentHint }">▾</span>
          </h3>
          <p v-show="showRespondentHint" class="rc-sub" v-html="t('moodAssessment.selector.respondentSub')"></p>
          <div class="rc-fields">
            <div class="rp-field">
              <label for="respondentName">{{ t('moodAssessment.selector.nameLabel') }}</label>
              <input type="text" id="respondentName" v-model="respondent.name" :placeholder="t('moodAssessment.selector.namePlaceholder')">
            </div>
            <div class="rp-field">
              <label for="respondentDob" :title="t('moodAssessment.selector.dobTitle')">{{ t('moodAssessment.selector.dobLabel') }}</label>
              <input type="date" id="respondentDob" v-model="respondent.dob" @input="onDobInput">
            </div>
            <div class="rp-field">
              <label for="respondentAge">{{ t('moodAssessment.selector.ageLabel') }}</label>
              <input type="number" id="respondentAge" v-model="respondent.age" min="0" max="120" :placeholder="t('moodAssessment.selector.agePlaceholder')">
            </div>
            <div class="rp-field">
              <label for="respondentAgeMonths" :title="t('moodAssessment.selector.ageMonthsTitle')">{{ t('moodAssessment.selector.ageMonthsLabel') }}</label>
              <input type="number" id="respondentAgeMonths" v-model="respondent.ageMonths" min="0" max="11" :placeholder="t('moodAssessment.selector.ageMonthsPlaceholder')">
            </div>
            <div class="rp-field rc-field-note">
              <label for="respondentNote">{{ t('moodAssessment.selector.noteLabel') }}</label>
              <textarea id="respondentNote" v-model="respondent.note" :placeholder="t('moodAssessment.selector.notePlaceholder')"></textarea>
            </div>
          </div>
        </div>

        <div class="catalog-toolbar">
          <div class="catalog-controls">
            <input
              type="search"
              class="catalog-search"
              v-model="testSearchQuery"
              :placeholder="t('moodAssessment.selector.searchPlaceholder')"
            >
            <details class="catalog-filter-dropdown">
              <summary class="btn-outline">
                {{ t('moodAssessment.selector.filterCategories') }}
                <span v-if="selectedCategories.length" class="catalog-filter-count">{{ selectedCategories.length }}</span>
              </summary>
              <div class="catalog-filter-menu">
                <label class="catalog-filter-option catalog-filter-all">
                  <input type="checkbox" :checked="!selectedCategories.length" @change="clearCategories">
                  <span>{{ t('moodAssessment.selector.categoryAll') }}</span>
                </label>
                <label v-for="[code, label] in availableCategories" :key="code" class="catalog-filter-option">
                  <input v-model="selectedCategories" type="checkbox" :value="code">
                  <span>{{ label }}</span>
                </label>
              </div>
            </details>
          </div>
        </div>

        <div class="test-grid">
          <div
            v-for="card in pagedTestCards"
            :key="card.key"
            class="test-select-card"
            :class="card.meta.cardClass"
            @click="openAssessment(card)"
          >
            <div class="tsc-icon" :style="card.meta.iconStyle">{{ card.meta.icon }}</div>
            <div class="tsc-name">{{ card.meta.name }}</div>
            <div class="tsc-fullname">{{ card.meta.fullname }}</div>
            <div class="tsc-desc">{{ card.meta.desc }}</div>
            <div class="tsc-meta">
              <span
                v-for="(badge, bIdx) in card.meta.badges"
                :key="bIdx"
                class="badge-pill"
                :class="badge.className || ''"
                :style="badge.style || null"
              >{{ badge.label }}</span>
              <span v-if="card.scorePill !== null" class="badge-pill badge-mint">{{ t('moodAssessment.selector.scorePillLabel', { score: card.scorePill }) }}</span>
            </div>
            <div class="tsc-last">{{ t('moodAssessment.selector.lastTimeLabel', { label: card.latestLabel }) }}</div>
          </div>

          <div
            v-if="showRavenCard"
            class="test-select-card sdq"
            @click="router.push('/raven-test')"
          >
            <div class="tsc-icon" style="background:var(--sky-light);border-color:var(--lavender);">🧩</div>
            <div class="tsc-name">{{ t('moodAssessment.selector.ravenName') }}</div>
            <div class="tsc-fullname">{{ t('moodAssessment.selector.ravenFullname') }}</div>
            <div class="tsc-desc">{{ t('moodAssessment.selector.ravenDesc') }}</div>
            <div class="tsc-meta">
              <span class="badge-pill badge-sky">{{ t('moodAssessment.selector.ravenBadgeQuestions') }}</span>
              <span class="badge-pill badge-mint">{{ t('moodAssessment.selector.ravenBadgeDuration') }}</span>
              <span class="badge-pill" style="background:var(--lavender-light);color:#8a6aaa;border:1.5px solid var(--lavender);">{{ t('moodAssessment.selector.ravenBadgeGrading') }}</span>
            </div>
            <div class="tsc-last">{{ t('moodAssessment.selector.ravenLastLabel') }}</div>
          </div>

          <div v-if="!pagedTestCards.length && !showRavenCard" class="paper-card" style="padding:18px;color:var(--text-secondary);">
            {{ t('moodAssessment.selector.noResults') }}
          </div>
        </div>

        <div v-if="catalogTotalPages > 1" class="catalog-pagination">
          <button type="button" class="btn-outline" :disabled="catalogPage === 1" @click="goToCatalogPage(catalogPage - 1)">‹</button>
          <span class="catalog-page-label">{{ t('moodAssessment.selector.pageLabel', { current: catalogPage, total: catalogTotalPages }) }}</span>
          <button type="button" class="btn-outline" :disabled="catalogPage === catalogTotalPages" @click="goToCatalogPage(catalogPage + 1)">›</button>
        </div>

        <!-- History -->
        <div class="history-section">
          <div class="history-title">{{ t('moodAssessment.selector.historyTitle') }}</div>
          <div class="history-grid">
            <div v-if="!history.length" class="paper-card" style="padding:18px;color:var(--text-secondary);line-height:1.6;">
              {{ t('moodAssessment.selector.noHistory') }}
            </div>
            <div
              v-for="(item, hIdx) in historyCards"
              :key="hIdx"
              class="paper-card history-card"
              @click="openHistoryReview(item)"
            >
              <div class="hc-test">{{ item.name }}</div>
              <div class="hc-date">{{ item.dateLabel }}</div>
              <div class="hc-scores">
                <span
                  v-for="(pill, pIdx) in item.pills"
                  :key="pIdx"
                  class="hc-score-item"
                  :style="pill.style"
                >{{ pill.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MODAL XEM LẠI KẾT QUẢ CŨ ===== -->
      <div v-if="reviewDetail" class="review-overlay" @click.self="closeHistoryReview">
        <div class="review-modal paper-card">
          <div class="review-head">
            <div>
              <div class="review-title">{{ reviewDetail.name }}</div>
              <div class="review-date">{{ t('moodAssessment.review.completedAtLabel', { date: reviewDetail.dateLabel }) }}</div>
            </div>
            <button class="review-close" @click="closeHistoryReview" :aria-label="t('moodAssessment.review.closeAria')">✕</button>
          </div>

          <div class="review-total">
            <div class="review-total-score">{{ reviewDetail.totalScore }}</div>
            <span v-if="reviewDetail.severity" class="hc-score-item" :style="reviewDetail.severityStyle">{{ reviewDetail.severity }}</span>
          </div>

          <div v-if="reviewDetail.dimensions.length" class="review-dims">
            <div v-for="dim in reviewDetail.dimensions" :key="dim.key" class="review-dim">
              <span class="review-dim-label">{{ dim.label }}</span>
              <span class="review-dim-score">{{ dim.score }}</span>
              <span v-if="dim.severity" class="hc-score-item" :style="dim.style">{{ dim.severity }}</span>
            </div>
          </div>

          <div v-if="reviewDetail.respondentName || reviewDetail.note || reviewDetail.hasAttachment" class="review-meta">
            <div v-if="reviewDetail.respondentName">
              {{ t('moodAssessment.review.respondentLabel') }} <strong>{{ reviewDetail.respondentName }}</strong>
              <span v-if="reviewDetail.respondentAge"> {{ t('moodAssessment.review.ageUnit', { age: reviewDetail.respondentAge }) }}</span>
            </div>
            <div v-if="reviewDetail.note">{{ t('moodAssessment.review.noteLabel', { note: reviewDetail.note }) }}</div>
            <div v-if="reviewDetail.hasAttachment">{{ t('moodAssessment.review.attachmentLabel') }}</div>
          </div>

          <div class="review-actions">
            <button class="btn-primary" @click="retakeFromReview">{{ t('moodAssessment.review.retakeBtn') }}</button>
            <button class="btn-outline" @click="closeHistoryReview">{{ t('moodAssessment.review.closeBtn') }}</button>
          </div>
        </div>
      </div>

      <!-- ===== SPECIALIST-ADMINISTERED ASSESSMENT ===== -->
      <section v-if="view === 'guided' && guidedAssessment" class="paper-card" style="max-width:760px;margin:0 auto;padding:28px;">
        <button class="btn-outline" @click="backToSelector">{{ t('moodAssessment.selector.guided.backBtn') }}</button>
        <div :style="guidedAssessment.iconStyle" style="width:52px;height:52px;border:2px solid;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.7rem;margin:20px 0 14px;">{{ guidedAssessment.icon }}</div>
        <h1 style="font-size:1.35rem;margin:0 0 8px;">{{ guidedAssessment.name }}</h1>
        <p style="margin:0 0 16px;color:var(--text-secondary);font-weight:600;">{{ guidedAssessment.fullname }}</p>
        <p style="line-height:1.65;">{{ guidedAssessment.desc }}</p>
        <template v-if="guidedAssessment.definition">
          <h2 style="font-size:1.05rem;margin:22px 0 10px;">{{ t('moodAssessment.selector.guided.definitionTitle') }}</h2>
          <div class="guided-definition">{{ guidedAssessment.definition }}</div>
        </template>
        <div style="padding:14px 16px;border-radius:12px;background:var(--peach-light);color:var(--text-primary);line-height:1.6;margin:18px 0;">
          <strong>{{ t('moodAssessment.selector.guided.specialistTitle') }}</strong><br>
          {{ guidedAssessment.specialistNote }}
        </div>
        <router-link to="/experts" class="btn-primary">{{ t('moodAssessment.selector.guided.expertBtn') }}</router-link>
      </section>

      <!-- ===== TEST AREA ===== -->
      <div class="test-area" :style="{ display: view === 'test' ? 'block' : 'none' }">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <button class="btn-outline" @click="backToSelector">{{ t('moodAssessment.test.backBtn') }}</button>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="badge-pill badge-mint">{{ currentTest?.name }}</span>
            <button class="btn-outline" style="font-size:0.78rem;padding:7px 14px;" @click="emergencyOpen = true">{{ t('moodAssessment.test.emergencyBtn') }}</button>
          </div>
        </div>

        <!-- Test Header -->
        <div class="paper-card test-header-card" v-if="currentTest">
          <div class="th-top">
            <div class="th-icon" :style="{ background: currentTest.iconBg, borderColor: currentTest.iconBorder }">{{ currentTest.icon }}</div>
            <div class="th-info">
              <div class="th-name">{{ currentTest.name }}</div>
              <div class="th-fullname">{{ currentTest.fullname }}</div>
            </div>
            <div style="margin-left:auto;text-align:right;">
              <div style="font-size:1.2rem;font-weight:800;">{{ currentQIndex + 1 }}/{{ currentTest.totalQ }}</div>
              <div style="font-size:0.72rem;color:var(--text-secondary);">{{ t('moodAssessment.test.questionCountUnit') }}</div>
            </div>
          </div>
          <div class="th-progress-wrap">
            <div class="th-progress-bar">
              <div class="th-progress-fill" :style="{ width: displayedProgressPct + '%' }"></div>
            </div>
            <div class="th-progress-labels">
              <span>{{ t('moodAssessment.test.questionLabel', { n: currentQIndex + 1 }) }}</span>
              <span>{{ displayedProgressPct }}%</span>
            </div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="question-wrap" v-if="currentQuestion">
          <div class="paper-card question-card">
            <div class="q-num">{{ t('moodAssessment.test.questionLabelFull', { n: currentQIndex + 1, total: currentTest.totalQ }) }}</div>
            <div class="q-category badge-pill badge-peach">{{ currentQuestion.catLabel }}</div>
            <div class="q-text">{{ currentQuestion.text }}</div>
            <div class="q-subtext">{{ currentTest.timeRef ? t('moodAssessment.test.timeRefPrefix', { time: currentTest.timeRef }) : '' }}</div>
            <div class="likert-wrap" :class="`cols-${currentOptions.length}`">
              <div
                v-for="(opt, oIdx) in currentOptions"
                :key="oIdx"
                class="likert-option"
                :class="{ selected: answers[currentQIndex] === opt.score }"
                @click="selectAnswer(opt.score)"
              >
                <span class="lo-emoji">{{ opt.emoji }}</span>
                <span class="lo-label">{{ opt.label }}</span>
              </div>
            </div>
            <div class="q-nav">
              <button class="btn-outline" v-show="currentQIndex > 0" @click="prevQuestion">{{ t('moodAssessment.test.prevBtn') }}</button>
              <div class="q-nav-info">{{ answers[currentQIndex] !== undefined ? t('moodAssessment.test.selectedHint') : t('moodAssessment.test.chooseHint') }}</div>
              <button class="btn-primary" v-show="answers[currentQIndex] !== undefined" @click="nextQuestion">{{ t('moodAssessment.test.nextBtn') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== RESULT PANEL ===== -->
      <div class="result-panel" :class="{ active: view === 'result' }" v-if="result">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <button class="btn-outline" @click="backToSelector">{{ t('moodAssessment.result.backBtn') }}</button>
          <div style="display:flex;gap:8px;">
            <button class="btn-outline" @click="retakeTest">{{ t('moodAssessment.result.retakeBtn') }}</button>
            <button class="btn-primary" @click="printResult">{{ t('moodAssessment.result.exportPdfBtn') }}</button>
          </div>
        </div>

        <div class="paper-card result-header">
          <div v-if="resultImageUrl && !brokenResultImage" class="rh-banner">
            <img :src="resultImageUrl" :alt="result.testName" class="rh-banner-img" @error="brokenResultImage = true">
          </div>
          <div class="rh-top">
            <div v-if="!resultImageUrl || brokenResultImage" class="rh-mascot">{{ result.icon }}</div>
            <div>
              <div class="rh-title">{{ t('moodAssessment.result.title', { testName: result.testName }) }}</div>
              <div class="rh-subtitle">{{ resultSubtitle }}</div>
            </div>
          </div>

          <div class="result-scores-grid" :class="`rsg-${Math.min(3, result.cards.length)}`">
            <div v-for="card in result.cards" :key="card.key" class="rs-card" :class="card.levelClass">
              <div class="rs-icon">{{ card.icon }}</div>
              <div class="rs-label">{{ card.displayLabel }}</div>
              <div><span class="rs-score">{{ card.score }}</span><span class="rs-max">/ {{ result.maxScore }}</span></div>
              <div class="rs-level-badge" style="background:rgba(255,255,255,0.4); border:1px solid currentColor;">{{ card.levelLabel }}</div>
            </div>
          </div>
        </div>

        <div class="paper-card result-interpretation">
          <div class="ri-title">{{ t('moodAssessment.result.interpretationTitle') }}</div>
          <div>
            <ul style="padding:0; margin:0; list-style:none;">
              <li v-for="item in result.interpretation" :key="item.key" class="ri-item" :class="item.tone">
                <span class="ri-icon">{{ item.icon }}</span>
                <div><strong>{{ item.displayLabel }}:</strong> <span v-html="t('moodAssessment.result.interpretationText', { score: item.score, level: item.levelLabel })"></span> {{ item.note }}</div>
              </li>
            </ul>
          </div>
        </div>

        <div class="paper-card result-ai-summary" v-if="aiSummaryLoading || aiSummaryText">
          <div class="ai-summary-header">
            <span class="ai-summary-icon">🤖</span>
            <span class="ri-title" style="margin-bottom:0;">{{ t('moodAssessment.result.aiTitle') }}</span>
            <span class="badge-pill badge-mint" style="margin-left:auto;">AI</span>
          </div>
          <div v-if="aiSummaryLoading" class="ai-summary-loading">{{ t('moodAssessment.result.aiLoading') }}</div>
          <div v-else class="ai-summary-text">{{ aiSummaryText }}</div>
          <template v-if="aiInterpretation">
            <div class="ai-summary-task-title">{{ t('moodAssessment.result.aiJudgmentTitle') }}</div>
            <div class="ai-summary-text">{{ aiInterpretation }}</div>
          </template>
        </div>

        <div class="paper-card result-comparison">
          <div class="rc-title">{{ t('moodAssessment.result.comparisonTitle') }}</div>
          <div class="rc-bars">
            <div
              v-if="!result.comparison"
              style="font-size:0.8rem;color:var(--text-secondary);font-style:italic;padding:8px 0;"
            >{{ t('moodAssessment.result.noComparisonYet') }}</div>
            <div v-for="bar in (result.comparison || [])" :key="bar.key" class="rcb-item" style="margin-bottom:8px;">
              <div class="rcb-label">{{ bar.label }}</div>
              <div class="rcb-bars">
                <div class="rcb-bar-wrap">
                  <div class="rcb-date">{{ t('moodAssessment.result.currentLabel') }}</div>
                  <div class="rcb-bar"><div class="rcb-fill" :style="{ width: bar.currPct + '%', background: 'var(--mint-dark)' }"></div></div>
                  <div class="rcb-val">{{ bar.currentSc }}</div>
                </div>
                <div class="rcb-bar-wrap">
                  <div class="rcb-date">{{ t('moodAssessment.result.previousLabel') }}</div>
                  <div class="rcb-bar"><div class="rcb-fill" :style="{ width: bar.prevPct + '%', background: 'var(--kraft-dark)' }"></div></div>
                  <div class="rcb-val">{{ bar.prevSc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="expert-recommend" v-show="result.isWarning">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:1.4rem;">🩺</span>
            <div>
              <div style="font-size:0.9rem;font-weight:700;">{{ t('moodAssessment.result.expertRecommendTitle') }}</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);">{{ t('moodAssessment.result.expertRecommendDesc') }}</div>
            </div>
          </div>
          <router-link to="/experts" class="btn-primary" style="width:100%;justify-content:center;">{{ t('moodAssessment.result.bookNowBtn') }}</router-link>
        </div>

        <div style="padding:12px 16px;background:rgba(255,203,164,0.15);border:1.5px solid var(--peach);border-radius:var(--border-radius-sm);font-size:0.75rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;" v-html="t('moodAssessment.result.disclaimer')"></div>

        <div class="result-actions">
          <router-link to="/tasks" class="btn-primary">{{ t('moodAssessment.result.startTasksBtn') }}</router-link>
          <router-link to="/mood-chat" class="btn-outline">{{ t('moodAssessment.result.chatBtn') }}</router-link>
          <router-link to="/experts" class="btn-outline">{{ t('moodAssessment.result.expertsBtn') }}</router-link>
          <router-link to="/dashboard" class="btn-outline">{{ t('moodAssessment.result.dashboardBtn') }}</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { TESTS as TESTS_VI } from '../lib/assessmentTests';
import { TESTS as TESTS_EN } from '../lib/assessmentTests.en';
import { ASSESSMENT_META as ASSESSMENT_META_VI, ASSESSMENT_CATEGORIES as ASSESSMENT_CATEGORIES_VI } from '../lib/assessmentMeta';
import { ASSESSMENT_META as ASSESSMENT_META_EN, ASSESSMENT_CATEGORIES as ASSESSMENT_CATEGORIES_EN } from '../lib/assessmentMeta.en';

const RESPONDENT_STORAGE_KEY = 'peaceflow_respondent_info';

const auth = useAuthStore();
const router = useRouter();
const { t, locale } = useI18n();
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));
// Chọn bộ dữ liệu bài test theo ngôn ngữ UI — TESTS bị mutate trực tiếp ở chỗ khác
// (vd TESTS[key].prevScores = ...) nên giữ nguyên tham chiếu object theo từng ngôn ngữ,
// không tạo object mới mỗi lần computed chạy lại.
// Bài test admin tự tạo qua /admin/assessments-catalog (is_custom=true) không có trong file
// JS hardcode — API /assessments trả kèm question_schema/scoring_rules/interpretation_rules
// cho riêng các bài này, "adapt" sang đúng shape TESTS/ASSESSMENT_META hiện có để dùng chung
// 100% engine làm bài/tính điểm đã có, không cần sửa logic render/chấm điểm.
function buildCustomTestEntry(a) {
  const likertOptions = (a.scoring_rules?.likert_options || []).map((o) => ({ emoji: '', label: o.label, score: o.score }));
  const questions = (a.question_schema || []).map((q) => ({
    text: q.label, cat: 'default', catLabel: a.name,
    // Cau tu dat lua chon rieng (khac cau khac, kieu cau hoi tu sat trong BDI) — ghi de
    // likertOptions dung chung, dung chinh co che sẵn co cua engine lam bai.
    ...(Array.isArray(q.options) && q.options.length ? { likertOptions: q.options.map((o) => ({ emoji: '', label: o.label, score: o.score })) } : {})
  }));
  const maxScore = questions.reduce((sum, q) => {
    const opts = q.likertOptions || likertOptions;
    return sum + Math.max(0, ...opts.map((o) => o.score));
  }, 0);
  const bands = a.interpretation_rules?.bands || [];
  return {
    name: a.name, fullname: a.name,
    icon: a.icon || '📝', iconBg: 'var(--sky-light)', iconBorder: 'var(--sky)',
    timeRef: 'Gần đây', totalQ: questions.length, maxScore,
    subscales: ['default'],
    questions,
    likertOptions,
    scoring: {
      default: {
        indices: questions.map((_, idx) => idx),
        multiplier: 1,
        levels: bands.map((b, idx) => ({ max: b.max, label: b.label, class: `level-${idx}` }))
      }
    },
    prevScores: null
  };
}
function buildCustomMetaEntry(a) {
  return {
    apiCode: a.code, name: a.name, fullname: a.name, icon: a.icon || '📝', cardClass: 'custom',
    iconStyle: 'background:var(--sky-light);border-color:var(--sky);',
    desc: a.description || '', category: a.category || 'clinician',
    badges: [
      { className: 'badge-peach', label: t('moodAssessment.selector.questionCountBadge', { n: (a.question_schema || []).length }) },
      { className: 'badge-mint', label: t('moodAssessment.selector.durationBadge', { n: Math.max(1, Math.round((a.question_schema || []).length * 0.25)) }) }
    ]
  };
}
const customAssessments = computed(() => assessments.value.filter((a) => a.is_custom && a.question_schema));

const TESTS = computed(() => {
  const base = locale.value === 'en' ? TESTS_EN : TESTS_VI;
  if (!customAssessments.value.length) return base;
  const extra = {};
  for (const a of customAssessments.value) extra[a.code.toLowerCase()] = buildCustomTestEntry(a);
  return { ...base, ...extra };
});
const ASSESSMENT_META = computed(() => {
  const base = locale.value === 'en' ? ASSESSMENT_META_EN : ASSESSMENT_META_VI;
  if (!customAssessments.value.length) return base;
  const extra = {};
  for (const a of customAssessments.value) extra[a.code.toLowerCase()] = buildCustomMetaEntry(a);
  return { ...base, ...extra };
});
const ASSESSMENT_CATEGORIES = computed(() => (locale.value === 'en' ? ASSESSMENT_CATEGORIES_EN : ASSESSMENT_CATEGORIES_VI));

// ============================================================
// STATE
// ============================================================
const view = ref('selector'); // 'selector' | 'test' | 'result'
const emergencyOpen = ref(false);
const currentTestId = ref(null);
const currentQIndex = ref(0);
const answers = ref([]);
const result = ref(null);
const resultSaveNote = ref('');
const aiSummaryText = ref('');
const aiSummaryLoading = ref(false);
const aiInterpretation = ref('');
const resultSubtitleBase = ref('');
const guidedAssessment = ref(null);

const assessments = ref([]);
const history = ref([]);

const respondent = reactive({ name: '', dob: '', age: '', ageMonths: '', note: '' });
const showRespondentHint = ref(false);

// Bo loc danh muc bai test: tim kiem theo ten, loc theo category, phan trang — vi danh
// muc da tang tu 15 len ~40 bai, hien 1 luoi phang khong con du dung nua.
const testSearchQuery = ref('');
const selectedCategories = ref([]);
const catalogPage = ref(1);
const CATALOG_PAGE_SIZE = 12;
watch([testSearchQuery, selectedCategories], () => { catalogPage.value = 1; }, { deep: true });

let isAdvancing = false;
let hasFinishedCurrentTest = false;

// Ở câu cuối, thanh tiến độ được đẩy lên 100% trước khi chuyển sang màn kết quả.
const forceFullProgress = ref(false);

const currentTest = computed(() => (currentTestId.value ? TESTS.value[currentTestId.value] : null));
const currentQuestion = computed(() => currentTest.value?.questions[currentQIndex.value] || null);
const currentOptions = computed(() => currentQuestion.value?.likertOptions || currentTest.value?.likertOptions || []);
const progressPct = computed(() => (currentTest.value ? Math.round((currentQIndex.value / currentTest.value.totalQ) * 100) : 0));
const displayedProgressPct = computed(() => (forceFullProgress.value ? 100 : progressPct.value));
const resultSubtitle = computed(() => `${resultSubtitleBase.value}${resultSaveNote.value}`);
const brokenResultImage = ref(false);
const resultImageUrl = computed(() => {
  if (!result.value?.testId || !result.value?.overallLevelClass) return null;
  return `/assessment-images/${result.value.testId}/${result.value.overallLevelClass}.png`;
});

function printResult() {
  window.print();
}

// ============================================================
// RESPONDENT INFO
// ============================================================
function loadRespondentFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(RESPONDENT_STORAGE_KEY) || 'null');
    if (saved) {
      respondent.name = saved.name || '';
      respondent.dob = saved.dob || '';
      respondent.age = saved.age || '';
      respondent.ageMonths = saved.ageMonths || '';
      respondent.note = saved.note || '';
    }
  } catch (_error) { /* ignore corrupted storage */ }
}

function readRespondentInfo() {
  return {
    name: String(respondent.name || '').trim(),
    dob: String(respondent.dob || '').trim(),
    age: String(respondent.age || '').trim(),
    ageMonths: String(respondent.ageMonths || '').trim(),
    note: String(respondent.note || '').trim()
  };
}

function saveRespondentInfo(info) {
  localStorage.setItem(RESPONDENT_STORAGE_KEY, JSON.stringify(info));
}

// Tính tuổi (năm + tháng lẻ) từ ngày sinh, dùng để tự điền 2 ô Tuổi/Tháng lẻ
// khi người dùng chọn cách điền ngày sinh thay vì điền tuổi trực tiếp.
function calcAgeFromDob(dobStr) {
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  if (today.getDate() < dob.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years < 0) return null;
  return { years, months };
}

function onDobInput(event) {
  const computedAge = calcAgeFromDob(event.target.value);
  if (computedAge) {
    respondent.age = String(computedAge.years);
    respondent.ageMonths = String(computedAge.months);
  }
}

watch(respondent, () => saveRespondentInfo(readRespondentInfo()), { deep: true });

function getAccountOwnerName() {
  const user = auth.user;
  return (user && (user.display_name || user.full_name)) || t('moodAssessment.defaultOwnerName');
}

// ============================================================
// SELECTOR / HISTORY RENDERING
// ============================================================
function formatDate(value) {
  if (!value) return t('moodAssessment.dates.never');
  return new Intl.DateTimeFormat(intlLocale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function formatRelativeDate(value) {
  if (!value) return t('moodAssessment.dates.noData');

  const target = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now - target) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return t('moodAssessment.dates.today', { date: formatDate(value) });
  if (diffDays === 1) return t('moodAssessment.dates.oneDayAgo', { date: formatDate(value) });
  return t('moodAssessment.dates.daysAgo', { n: diffDays, date: formatDate(value) });
}

function getAssessmentKeyByCode(code) {
  return Object.keys(ASSESSMENT_META.value).find((key) => ASSESSMENT_META.value[key].apiCode === code) || null;
}

function getSeverityBadgeStyle(severity) {
  const value = String(severity || '').toLowerCase();
  if (value.includes('nghiêm') || value.includes('severe') || value.includes('nặng')) {
    return 'background:var(--coral-light);color:#c05050;';
  }
  if (value.includes('vừa') || value.includes('moderate') || value.includes('poor')) {
    return 'background:var(--peach-light);color:var(--peach-dark);';
  }
  return 'background:var(--mint-light);color:var(--mint-dark);';
}

const testCards = computed(() => Object.entries(ASSESSMENT_META.value).map(([key, meta]) => {
  const apiRow = assessments.value.find((item) => item.code === meta.apiCode);
  return {
    key,
    meta,
    latestLabel: apiRow?.latest_taken_at ? formatRelativeDate(apiRow.latest_taken_at) : t('moodAssessment.dates.never'),
    scorePill: apiRow?.latest_total_score !== null && apiRow?.latest_total_score !== undefined
      ? apiRow.latest_total_score
      : null
  };
}));

// Danh sach category thuc te dang co bai test (bo qua category rong de khong hien nut loc
// vo nghia), giu dung thu tu khai bao trong ASSESSMENT_CATEGORIES.
const availableCategories = computed(() => {
  const present = new Set(testCards.value.map((card) => card.meta.category).filter(Boolean));
  return Object.entries(ASSESSMENT_CATEGORIES.value).filter(([code]) => present.has(code));
});

const filteredTestCards = computed(() => {
  const query = testSearchQuery.value.trim().toLowerCase();
  return testCards.value.filter((card) => {
    if (selectedCategories.value.length && !selectedCategories.value.includes(card.meta.category)) return false;
    if (!query) return true;
    return card.meta.name.toLowerCase().includes(query) || card.meta.fullname.toLowerCase().includes(query);
  });
});
function clearCategories() {
  selectedCategories.value = [];
}

const catalogTotalPages = computed(() => Math.max(1, Math.ceil(filteredTestCards.value.length / CATALOG_PAGE_SIZE)));
const pagedTestCards = computed(() => {
  const start = (catalogPage.value - 1) * CATALOG_PAGE_SIZE;
  return filteredTestCards.value.slice(start, start + CATALOG_PAGE_SIZE);
});
function goToCatalogPage(page) {
  catalogPage.value = Math.min(Math.max(1, page), catalogTotalPages.value);
}

// Raven CPM nam ngoai ASSESSMENT_META (co trang /raven-test rieng) nen khong nam trong
// pagedTestCards — van phai tu ap dung loc category/search, va chi hien o trang 1 de
// khong lap lai tren moi trang phan trang.
const showRavenCard = computed(() => {
  if (catalogPage.value !== 1) return false;
  if (selectedCategories.value.length && !selectedCategories.value.includes('cognitive')) return false;
  const query = testSearchQuery.value.trim().toLowerCase();
  if (!query) return true;
  const ravenName = t('moodAssessment.selector.ravenName').toLowerCase();
  const ravenFullname = t('moodAssessment.selector.ravenFullname').toLowerCase();
  return ravenName.includes(query) || ravenFullname.includes(query);
});

const historyCards = computed(() => history.value.map((item) => {
  const key = getAssessmentKeyByCode(item.code);
  const meta = key ? ASSESSMENT_META.value[key] : null;
  const dimensions = item.dimension_scores && typeof item.dimension_scores === 'object'
    ? Object.entries(item.dimension_scores)
    : [];
  const pills = dimensions.length
    ? dimensions.slice(0, 3).map(([dimension, data]) => ({
      style: getSeverityBadgeStyle(data?.severity),
      text: `${dimension}: ${data?.score ?? '--'}`
    }))
    : [{
      style: getSeverityBadgeStyle(item.severity),
      text: `${item.severity || t('moodAssessment.defaultSeverityCompleted')} • ${item.total_score}`
    }];

  return {
    startKey: key || 'dass21',
    name: meta?.name || item.code,
    dateLabel: formatRelativeDate(item.created_at),
    pills,
    raw: item,
    testKey: key
  };
}));

// ===== Xem lại kết quả cũ =====
// Trước đây bấm vào thẻ lịch sử lại mở ra bài test MỚI (hành vi này có từ bản cũ:
// onclick="startTest('dass21')"), nên khách tưởng mất kết quả cũ. Giờ bấm vào sẽ mở
// modal xem lại chính kết quả đó, muốn làm lại thì bấm nút riêng trong modal.
const reviewCard = ref(null);

function openHistoryReview(card) {
  reviewCard.value = card;
}

function closeHistoryReview() {
  reviewCard.value = null;
}

function retakeFromReview() {
  const key = reviewCard.value?.startKey || 'dass21';
  closeHistoryReview();
  startTest(key);
}

// Nhãn đọc được cho từng khía cạnh: lấy catLabel trong định nghĩa bài test (vd 'depression'
// -> 'Trầm cảm'); 'total' -> 'Tổng điểm'; không tìm được thì giữ nguyên key.
function getDimensionLabel(testKey, dimension) {
  if (dimension === 'total') return t('moodAssessment.totalScoreLabel');
  const test = testKey ? TESTS.value[testKey] : null;
  const question = test?.questions?.find((q) => q.cat === dimension);
  return question?.catLabel || dimension;
}

const reviewDetail = computed(() => {
  const card = reviewCard.value;
  if (!card) return null;
  const item = card.raw || {};
  const dims = item.dimension_scores && typeof item.dimension_scores === 'object'
    ? Object.entries(item.dimension_scores)
    : [];

  return {
    name: card.name,
    dateLabel: item.created_at
      ? new Date(item.created_at).toLocaleString(intlLocale.value, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : card.dateLabel,
    totalScore: item.total_score,
    severity: item.severity,
    severityStyle: getSeverityBadgeStyle(item.severity),
    respondentName: item.respondent_name,
    respondentAge: item.respondent_age,
    note: item.note,
    hasAttachment: item.has_attachment,
    dimensions: dims.map(([dimension, data]) => ({
      key: dimension,
      label: getDimensionLabel(card.testKey, dimension),
      score: data?.score ?? '--',
      severity: data?.severity || '',
      style: getSeverityBadgeStyle(data?.severity)
    }))
  };
});

function syncPrevScores() {
  Object.entries(ASSESSMENT_META.value).forEach(([key, meta]) => {
    const latest = assessments.value.find((item) => item.code === meta.apiCode);
    if (!latest) return;

    const dimensions = latest.latest_dimension_scores;
    if (dimensions && typeof dimensions === 'object' && Object.keys(dimensions).length) {
      TESTS.value[key].prevScores = Object.fromEntries(
        Object.entries(dimensions).map(([dimension, value]) => [dimension, Number(value?.score ?? value ?? 0)])
      );
    } else if (latest.latest_total_score !== null && latest.latest_total_score !== undefined) {
      const firstSubscale = TESTS.value[key]?.subscales?.[0];
      TESTS.value[key].prevScores = firstSubscale
        ? { [firstSubscale]: Number(latest.latest_total_score) }
        : null;
    } else {
      TESTS.value[key].prevScores = null;
    }
  });
}

async function loadAssessmentData() {
  const [assessmentsData, historyData] = await Promise.all([
    apiClient.get('/assessments'),
    apiClient.get('/assessments/history?limit=6')
  ]);

  assessments.value = Array.isArray(assessmentsData) ? assessmentsData : [];
  history.value = Array.isArray(historyData) ? historyData : [];
  syncPrevScores();
}

// ============================================================
// TEST FLOW
// ============================================================
// Thông tin người làm bài dùng chung cho MỌI bài test trong trang này — chỉ
// cần điền một lần ở thẻ đầu trang, không hỏi lại mỗi khi bắt đầu bài mới.
// Nếu chưa điền, KHÔNG chặn làm bài — mặc định lấy tên chủ tài khoản đang
// đăng nhập, người dùng có thể sửa lại bất cứ lúc nào ở thẻ này.
function startTest(testId) {
  let info = readRespondentInfo();
  if (!info.name) {
    info = { ...info, name: getAccountOwnerName() };
    respondent.name = info.name;
  }
  saveRespondentInfo(info);
  beginTestFlow(testId);
}

function openAssessment(card) {
  if (card.meta.mode === 'specialist') {
    guidedAssessment.value = card.meta;
    view.value = 'guided';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  startTest(card.key);
}

function beginTestFlow(testId) {
  currentTestId.value = testId;
  currentQIndex.value = 0;
  answers.value = [];
  isAdvancing = false;
  hasFinishedCurrentTest = false;
  forceFullProgress.value = false;

  view.value = 'test';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestion(index) {
  const testData = currentTest.value;
  if (index < 0 || index >= testData.totalQ) return;
  currentQIndex.value = index;
}

function selectAnswer(score) {
  // Chặn bấm liên tục/nhiều lần trong lúc đang chuyển câu — tránh xếp chồng
  // nhiều setTimeout(finishTest) dẫn đến nộp bài trùng lặp ở câu cuối.
  if (isAdvancing) return;
  isAdvancing = true;

  const next = [...answers.value];
  next[currentQIndex.value] = score;
  answers.value = next;

  // EMERGENCY TRIGGER: câu hỏi về ý nghĩ tự sát/tự làm hại bản thân ở từng bài — vị trí
  // (0-based) trong mảng questions của từng bài, bấm điểm > 0 là có ý nghĩ tự sát.
  const SUICIDE_ITEM_INDEX = { phq9: 8, bdi: 8, hdrs: 2, cdi: 26, epds: 9 };
  const suicideIndex = SUICIDE_ITEM_INDEX[currentTestId.value];
  if (suicideIndex !== undefined && currentQIndex.value === suicideIndex && score > 0) {
    emergencyOpen.value = true;
  }

  // Auto-advance
  setTimeout(() => {
    if (currentQIndex.value < TESTS.value[currentTestId.value].totalQ - 1) {
      nextQuestion();
      isAdvancing = false;
    } else {
      // Completed -> ensure Progress hits 100%
      forceFullProgress.value = true;
      setTimeout(finishTest, 400);
    }
  }, 350); // slight delay for visual UX
}

function nextQuestion() {
  renderQuestion(currentQIndex.value + 1);
}

function prevQuestion() {
  renderQuestion(currentQIndex.value - 1);
}

function getSeverityRank(className) {
  if (className === 'level-4') return 4;
  if (className === 'level-3') return 3;
  if (className === 'level-2') return 2;
  if (className === 'level-1') return 1;
  return 0;
}

function finishTest() {
  // Chốt chặn cuối: dù có gọi finishTest() nhiều lần do race-condition nào khác,
  // chỉ xử lý và nộp bài đúng 1 lần cho mỗi lượt làm test.
  if (hasFinishedCurrentTest) return;
  hasFinishedCurrentTest = true;

  const testData = currentTest.value;
  const answerList = answers.value;

  const now = new Date();
  resultSubtitleBase.value = t('moodAssessment.result.completedAt', {
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    date: now.toLocaleDateString(intlLocale.value)
  });
  resultSaveNote.value = '';
  aiSummaryText.value = '';
  aiSummaryLoading.value = false;
  aiInterpretation.value = '';

  // Evaluate logic
  const subScores = {};
  Object.keys(testData.scoring).forEach((key) => {
    const sc = testData.scoring[key];
    let rawSum = 0;
    sc.indices.forEach((idx) => {
      rawSum += (answerList[idx] || 0);
    });
    const finalScore = rawSum * sc.multiplier;
    subScores[key] = { score: finalScore, config: sc };
  });

  const keys = Object.keys(subScores);
  let isWarning = false;
  const cards = [];
  const interpretation = [];
  let analysisStr = '';

  keys.forEach((key) => {
    const s = subScores[key];
    const levelConfig = s.config.levels.find((l) => s.score <= l.max) || s.config.levels[s.config.levels.length - 1];

    let icon = '📊';
    if (levelConfig.class === 'level-0' || levelConfig.class === 'level-1') icon = '✅';
    else if (levelConfig.class === 'level-2') icon = '⚠️';
    else {
      icon = '🚨';
      if (key !== 'somatic' && key !== 'psychic') isWarning = true;
    }

    // For general tests, if label is specifically psychic or somatic, adapt it
    const displayLabel = levelConfig.label === 'Tâm lý' || levelConfig.label === 'Thể chất'
      ? levelConfig.label
      : (testData.questions.find((q) => q.cat === key)?.catLabel || key);

    cards.push({
      key,
      icon,
      displayLabel,
      score: s.score,
      levelClass: levelConfig.class,
      levelLabel: levelConfig.label
    });

    const tone = levelConfig.class === 'level-0' || levelConfig.class === 'level-1'
      ? 'good'
      : (levelConfig.class === 'level-2' ? 'medium' : 'bad');
    const note = isWarning
      ? t('moodAssessment.result.noteWarning')
      : t('moodAssessment.result.noteGood');

    interpretation.push({ key, tone, icon, displayLabel, score: s.score, levelLabel: levelConfig.label, note });

    analysisStr += `<li class="ri-item ${tone}">
                <span class="ri-icon">${icon}</span>
                <div><strong>${displayLabel}:</strong> ${t('moodAssessment.result.interpretationText', { score: s.score, level: levelConfig.label })} ${note}</div>
            </li>`;
  });

  // Previous Comparison Logic
  let comparison = null;
  if (testData.prevScores) {
    comparison = [];
    keys.forEach((key) => {
      const currentSc = subScores[key].score;
      const prevSc = testData.prevScores[key];
      if (prevSc === undefined) return;

      const maxLvl = testData.scoring[key].levels.slice(-1)[0].max;
      const maxSc = maxLvl > 100 ? testData.maxScore : maxLvl;

      const currPct = Math.min(100, Math.max(0, Math.round((currentSc / maxSc) * 100)));
      const prevPct = Math.min(100, Math.max(0, Math.round((prevSc / maxSc) * 100)));

      const label = testData.questions.find((q) => q.cat === key)?.catLabel || key;

      comparison.push({ key, label, currentSc, prevSc, currPct, prevPct });
    });
  }

  const overallSeverity = keys
    .map((key) => {
      const s = subScores[key];
      const levelConfig = s.config.levels.find((l) => s.score <= l.max) || s.config.levels[s.config.levels.length - 1];
      return { key, score: s.score, label: levelConfig.label, className: levelConfig.class };
    })
    .sort((left, right) => getSeverityRank(right.className) - getSeverityRank(left.className))[0];

  result.value = {
    testId: currentTestId.value,
    testName: testData.name,
    icon: testData.icon,
    maxScore: testData.maxScore,
    cards,
    interpretation,
    comparison,
    isWarning,
    overallLevelClass: overallSeverity?.className || 'level-0'
  };
  brokenResultImage.value = false;
  view.value = 'result';

  onAssessmentFinished({
    testId: currentTestId.value,
    testName: testData.name,
    rawAnswers: answerList.map((score, index) => {
      const q = testData.questions[index];
      const opts = q.likertOptions || testData.likertOptions;
      const chosen = opts.find((opt) => opt.score === score);
      return {
        question_no: index + 1,
        question: q.text,
        category: q.catLabel || null,
        answer: chosen ? chosen.label : null,
        score
      };
    }),
    totalScore: subScores.total
      ? subScores.total.score
      : keys.reduce((sum, key) => sum + (subScores[key]?.score || 0), 0),
    severity: overallSeverity?.label || null,
    dimensionScores: Object.fromEntries(keys.map((key) => {
      const s = subScores[key];
      const levelConfig = s.config.levels.find((l) => s.score <= l.max) || s.config.levels[s.config.levels.length - 1];
      return [key, { score: s.score, severity: levelConfig.label, className: levelConfig.class }];
    })),
    interpretedResult: {
      is_warning: isWarning,
      summary_html: analysisStr,
      dominant_dimension: overallSeverity?.key || null
    }
  });
}

async function loadAiSummary(resultId) {
  if (!resultId) return;
  aiSummaryLoading.value = true;
  try {
    const data = await apiClient.post(`/assessments/results/${resultId}/ai-summary`, {});
    aiSummaryText.value = data?.summary || '';
    aiInterpretation.value = data?.interpretation || '';
  } catch (error) {
    console.error('Assessment AI summary load failed:', error);
    aiSummaryText.value = '';
    aiInterpretation.value = '';
  } finally {
    aiSummaryLoading.value = false;
  }
}

async function onAssessmentFinished(payload) {
  const meta = ASSESSMENT_META.value[payload.testId];
  if (!meta) return;

  try {
    const savedRespondent = JSON.parse(localStorage.getItem(RESPONDENT_STORAGE_KEY) || 'null') || {};
    const saved = await apiClient.post(`/assessments/${meta.apiCode}/submit`, {
      raw_answers: payload.rawAnswers,
      total_score: payload.totalScore,
      severity: payload.severity,
      dimension_scores: payload.dimensionScores,
      interpreted_result: payload.interpretedResult,
      respondent_name: savedRespondent.name || null,
      respondent_age: savedRespondent.age ? Number(savedRespondent.age) : null,
      note: savedRespondent.note || null
    });

    resultSaveNote.value = t('moodAssessment.dates.savedNote');

    await Promise.all([
      loadAssessmentData(),
      loadAiSummary(saved?.id)
    ]);
  } catch (error) {
    console.error('Assessment submit failed:', error);
    resultSaveNote.value = t('moodAssessment.dates.notSavedNote');
  }
}

function retakeTest() {
  beginTestFlow(currentTestId.value);
}

function backToSelector() {
  view.value = 'selector';
  guidedAssessment.value = null;
}

onMounted(() => {
  loadRespondentFromStorage();

  loadAssessmentData().catch((error) => {
    console.error('Assessment page init failed:', error);
  });
});
</script>

<style scoped src="../assets/assessment.css"></style>
