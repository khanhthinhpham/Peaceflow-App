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
        <!-- Hàng trên cùng: lưu ý (rút gọn) bên trái, công tắc chia sẻ bên phải. -->
        <div class="page-header">
          <div class="disclaimer-banner">
            <TestIcon name="alert" class="db-icon" />
            <div v-html="t('moodAssessment.selector.disclaimerShort')"></div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-right:120px;">
            <label class="badge-pill" :title="t('moodAssessment.shareWithExperts.desc')" style="cursor:pointer;gap:6px;background:var(--color-surface-muted);color:var(--color-text);">
              <span style="font-size:0.72rem;font-weight:700;">{{ plainText(t('moodAssessment.shareWithExperts.title')) }}</span>
              <label class="toggle-switch" style="transform:scale(0.72);margin:-4px -6px;">
                <input type="checkbox" v-model="shareAssessmentsWithExperts" :disabled="shareAssessmentsSaving" @change="toggleShareAssessmentsWithExperts">
                <span class="toggle-slider"></span>
              </label>
            </label>
          </div>
        </div>


        <div class="respondent-card">
          <h3 class="rc-title-toggle" @click="showRespondentHint = !showRespondentHint">
            {{ plainText(t('moodAssessment.selector.respondentTitle')) }}
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
            <label class="catalog-search-wrap">
              <TestIcon name="search" class="catalog-search-icon" />
              <input
                type="search"
                class="catalog-search"
                v-model="testSearchQuery"
                :placeholder="plainText(t('moodAssessment.selector.searchPlaceholder'))"
              >
            </label>
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
            <!-- Rủ bạn bè làm thử CHÍNH bài test này (không kèm điểm số gì cả — an toàn về
                 riêng tư), khác hẳn chia sẻ KẾT QUẢ cá nhân ở trang result bên dưới. -->
            <button
              type="button"
              class="tsc-share-btn"
              :title="t('share.testInviteBtn')"
              @click.stop="shareCardKey = shareCardKey === card.key ? null : card.key"
            ><TestIcon name="link" /></button>
            <div v-if="shareCardKey === card.key" class="tsc-share-popover" @click.stop>
              <ShareButtons :url="`${frontendTestUrl(card.key)}`" :text="card.meta.name" />
            </div>
            <div class="tsc-icon"><TestIcon :name="card.key" /></div>
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
            <div class="tsc-icon"><TestIcon name="raven" /></div>
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

          <div
            v-if="showScreeningCard"
            class="test-select-card sdq"
            @click="router.push('/sang-loc-dau-nam')"
          >
            <div class="tsc-icon"><TestIcon name="screening" /></div>
            <div class="tsc-name">Phiếu khảo sát/sàng lọc tâm lý đầu năm học</div>
            <div class="tsc-fullname">Phiếu khảo sát/sàng lọc đầu năm (dành cho trường học)</div>
            <div class="tsc-desc">Tìm hiểu nhu cầu hỗ trợ tâm lý – xã hội của học sinh, giúp nhà trường xây dựng kế hoạch tư vấn phù hợp.</div>
            <div class="tsc-meta">
              <span class="badge-pill badge-sky">7 phần</span>
              <span class="badge-pill badge-mint">~10 phút</span>
              <span class="badge-pill" style="background:var(--peach-light);color:#a1683f;border:1.5px solid var(--peach);">Dành cho trường học</span>
            </div>
          </div>

          <div v-if="!pagedTestCards.length && !showRavenCard && !showScreeningCard" class="paper-card" style="padding:18px;color:var(--text-secondary);">
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
          <div class="history-title">{{ plainText(t('moodAssessment.selector.historyTitle')) }}</div>
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
        <div class="th-icon" style="margin:20px 0 14px;"><TestIcon :name="guidedAssessment.key || ''" /></div>
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
            <div class="th-icon"><TestIcon :name="currentTestId || ''" /></div>
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
            <!-- Một vài câu của PSQI hỏi giờ giấc cụ thể (giờ đi ngủ/thức dậy, số phút/số
                 tiếng) thay vì chọn trắc nghiệm — cần nhập số/giờ để tính đúng "hiệu suất giấc
                 ngủ" theo công thức gốc, không gộp được vào likert như các câu khác. -->
            <div v-if="currentQuestion.inputType" class="psqi-input-wrap" style="display:flex;align-items:center;gap:10px;justify-content:center;margin:20px 0;">
              <input
                v-if="currentQuestion.inputType === 'time'"
                type="time"
                class="psqi-input"
                v-model="textAnswerDraft"
                style="font-size:1.1rem;padding:10px 14px;border:none;border-radius:var(--radius-control);background:var(--color-canvas);"
              >
              <template v-else>
                <input
                  type="number"
                  inputmode="decimal"
                  class="psqi-input"
                  v-model="textAnswerDraft"
                  :max="currentQuestion.inputMax"
                  :step="currentQuestion.inputStep || 1"
                  min="0"
                  style="font-size:1.1rem;padding:10px 14px;border:none;border-radius:var(--radius-control);background:var(--color-canvas);width:120px;text-align:center;"
                >
                <span v-if="currentQuestion.inputSuffix" style="color:var(--text-secondary);font-weight:700;">{{ currentQuestion.inputSuffix }}</span>
              </template>
            </div>
            <div v-else class="likert-wrap" :class="`cols-${currentOptions.length}`">
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
              <div class="q-nav-info">{{ canProceed ? t('moodAssessment.test.selectedHint') : t('moodAssessment.test.chooseHint') }}</div>
              <button class="btn-primary" v-show="canProceed" @click="currentQuestion.inputType ? confirmTextAnswer() : nextQuestion()">{{ t('moodAssessment.test.nextBtn') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== RESULT PANEL ===== -->
      <div class="result-panel" :class="{ active: view === 'result' }" v-if="result">
        <div class="result-toolbar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
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

          <!-- Có kết quả đã lưu (savedResultId) -> chia sẻ ĐÚNG kết quả này (link riêng,
               kèm điểm/mức xếp loại trong caption). Người dùng tự bấm chia sẻ nên đây là lựa
               chọn của chính họ — không tự động công khai kết quả cho ai khác. Chưa lưu được
               (vd lỗi mạng) thì rơi về mời bạn bè làm thử chung chung như cũ, không kèm điểm. -->
          <div class="result-share-row">
            <ShareButtons
              v-if="savedResultId"
              :url="resultShareUrl(savedResultId)"
              :text="t('share.resultShareText', { testName: result.testName, level: result.overallSeverityLabel, score: result.overallScore })"
              :label="t('share.resultShareLabel')"
            />
            <ShareButtons
              v-else-if="currentTestId"
              :url="frontendTestUrl(currentTestId)"
              :text="t('share.testInviteText', { testName: result.testName })"
              :label="t('share.testInviteLabel')"
            />
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

          <!-- Gợi ý đúng chuyên gia khớp với kết quả bài test (ghép qua tag chuyên môn,
               xem GET /experts + buildMatchingTags ở backend) — nếu không tìm được ai phù
               hợp thì fallback về nút chung dẫn sang trang Chuyên gia. -->
          <div v-if="recommendedExperts.length" style="display:flex;flex-direction:column;gap:10px;margin-bottom:10px;">
            <div v-for="expert in recommendedExperts" :key="expert.id" class="paper-card" style="display:flex;align-items:center;gap:10px;padding:10px;">
              <div style="width:44px;height:44px;border-radius:50%;background:var(--warm-white);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">{{ expert.avatar }}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:0.85rem;">{{ expert.name }}</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);">{{ expert.degree }}</div>
                <div style="font-size:0.68rem;color:var(--text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ expert.specialties.slice(0, 2).join(' · ') }}</div>
              </div>
              <router-link :to="`/experts?book=${expert.id}`" class="btn-primary" style="padding:6px 12px;font-size:0.78rem;flex-shrink:0;">{{ t('moodAssessment.result.bookNowBtn') }}</router-link>
            </div>
          </div>
          <router-link v-else to="/experts" class="btn-primary" style="width:100%;justify-content:center;">{{ t('moodAssessment.result.bookNowBtn') }}</router-link>
        </div>

        <div class="result-disclaimer" style="padding:12px 16px;background:rgba(255,203,164,0.15);border:1.5px solid var(--peach);border-radius:var(--border-radius-sm);font-size:0.75rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;" v-html="t('moodAssessment.result.disclaimer')"></div>

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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient, SHARE_BASE_URL } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import ShareButtons from '../components/ShareButtons.vue';
import TestIcon from '../components/TestIcon.vue';
// Chuỗi i18n có emoji đứng đầu (📝, 🔍, 📅) — bỏ đi khi hiển thị; ô tìm kiếm dùng icon nét đơn sắc.
const plainText = (str) => String(str).replace(/^[^\p{L}\p{N}]+/u, '');
import { TESTS as TESTS_VI } from '../lib/assessmentTests';
import { TESTS as TESTS_EN } from '../lib/assessmentTests.en';
import { ASSESSMENT_META as ASSESSMENT_META_VI, ASSESSMENT_CATEGORIES as ASSESSMENT_CATEGORIES_VI } from '../lib/assessmentMeta';
import { ASSESSMENT_META as ASSESSMENT_META_EN, ASSESSMENT_CATEGORIES as ASSESSMENT_CATEGORIES_EN } from '../lib/assessmentMeta.en';

const RESPONDENT_STORAGE_KEY = 'peaceflow_respondent_info';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
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

// Chia sẻ (rủ làm thử) từng bài test — chỉ 1 popover mở tại 1 thời điểm, bấm ra ngoài là đóng.
const shareCardKey = ref(null);
// Trỏ về route /assessments/:code/share ở BACKEND (không phải thẳng link SPA) — route đó tự
// biết trả HTML có og:title/og:description đúng bài test khi bot Facebook/Threads quét, và
// tự chuyển người dùng thật sang đúng trang /mood-assessment?test=... Xem giải thích ở
// assessment.routes.js (lý do giống hệt article.routes.js cho bài viết).
function frontendTestUrl(testKey) {
  return `${SHARE_BASE_URL}/assessments/${encodeURIComponent(testKey)}/share`;
}
// Link chia sẻ ĐÚNG kết quả vừa làm (chỉ có khi đã lưu thành công — xem savedResultId) —
// khác frontendTestUrl() ở trên (chỉ giới thiệu chung bài test, không kèm điểm số).
function resultShareUrl(resultId) {
  return `${SHARE_BASE_URL}/assessments/results/${encodeURIComponent(resultId)}/share-card`;
}
function closeSharePopoverOnOutsideClick(event) {
  if (!shareCardKey.value) return;
  if (event.target.closest('.tsc-share-popover, .tsc-share-btn')) return;
  shareCardKey.value = null;
}
onMounted(() => document.addEventListener('click', closeSharePopoverOnOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', closeSharePopoverOnOutsideClick));
const currentQIndex = ref(0);
const answers = ref([]);
const textAnswerDraft = ref('');
const result = ref(null);
const resultSaveNote = ref('');
const recommendedExperts = ref([]);
// ID bản ghi kết quả vừa lưu — chỉ có khi lưu thành công (xem onAssessmentFinished), dùng
// để dựng link chia sẻ ĐÚNG KẾT QUẢ này (khác hẳn link mời làm thử chung chung).
const savedResultId = ref(null);
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
const canProceed = computed(() => (
  currentQuestion.value?.inputType
    ? String(textAnswerDraft.value || '').trim() !== ''
    : answers.value[currentQIndex.value] !== undefined
));
// Câu hỏi nhập giờ/số (PSQI) không tự lưu theo từng ký tự gõ — chỉ ghi vào answers[] khi
// bấm "Tiếp tục" (confirmTextAnswer). Khi lùi/tới lại 1 câu đã nhập, nạp lại giá trị cũ vào
// ô input để người dùng thấy đúng những gì đã trả lời.
watch(currentQIndex, () => {
  const q = currentQuestion.value;
  const prevAnswer = answers.value[currentQIndex.value];
  textAnswerDraft.value = (q?.inputType && prevAnswer !== undefined) ? String(prevAnswer) : '';
});
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

// Thẻ "Phiếu khảo sát/sàng lọc tâm lý đầu năm học" — không phải bài Likert tự chấm trong TESTS nên đứng ngoài
// pagedTestCards, dẫn sang trang riêng /sang-loc-dau-nam (form 7 phần cho trường học).
// Không lọc theo category vì không thuộc nhóm lâm sàng nào cụ thể, chỉ áp search + trang 1.
const showScreeningCard = computed(() => {
  if (catalogPage.value !== 1) return false;
  const query = testSearchQuery.value.trim().toLowerCase();
  if (!query) return true;
  return 'phiếu khảo sát/sàng lọc tâm lý đầu năm học'.includes(query);
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
  textAnswerDraft.value = '';
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

// Dành riêng cho câu hỏi dạng nhập giờ/số (hiện chỉ có ở PSQI) — Likert tự lưu điểm +
// auto-advance ngay khi bấm (xem selectAnswer), còn kiểu nhập liệu này cần bấm "Tiếp tục"
// mới ghi câu trả lời, vì người dùng cần thời gian gõ số thay vì chọn 1 lựa chọn có sẵn.
function confirmTextAnswer() {
  if (isAdvancing) return;
  const val = String(textAnswerDraft.value || '').trim();
  if (!val) return;

  const q = currentQuestion.value;
  const next = [...answers.value];
  next[currentQIndex.value] = q.inputType === 'number' ? Number(val) : val;
  answers.value = next;

  if (currentQIndex.value < TESTS.value[currentTestId.value].totalQ - 1) {
    nextQuestion();
  } else {
    forceFullProgress.value = true;
    setTimeout(finishTest, 200);
  }
}

function prevQuestion() {
  renderQuestion(currentQIndex.value - 1);
}

function parseTimeToMinutes(value) {
  if (!value || typeof value !== 'string' || !value.includes(':')) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// Tính điểm PSQI qua đúng 7 thành phần theo quy trình kỹ thuật của Bộ Y tế (mục 36) —
// không thể gộp vào cơ chế "cộng dồn indices" dùng chung cho các bài khác vì mỗi thành
// phần có công thức/bảng quy đổi riêng (xem chỉ số câu hỏi ở assessmentTests.js: 0=giờ đi
// ngủ, 1=phút vào giấc, 2=giờ thức dậy, 3=số giờ ngủ, 4-12=câu 5a-5i, 13=câu6, 14=câu7,
// 15=câu8, 16=câu9).
function computePsqiScore(a) {
  const num = (v) => Number(v) || 0;

  // TP1 - Chất lượng chủ quan = điểm câu 9.
  const c1 = num(a[16]);

  // TP2 - Độ trễ giấc ngủ = điểm câu 2 (quy đổi phút) + điểm câu 5a, quy đổi tổng (0-6) về 0-3.
  const minutesScore = num(a[1]) <= 15 ? 0 : num(a[1]) <= 30 ? 1 : num(a[1]) <= 60 ? 2 : 3;
  const latencySum = minutesScore + num(a[4]);
  const c2 = latencySum === 0 ? 0 : latencySum <= 2 ? 1 : latencySum <= 4 ? 2 : 3;

  // TP3 - Thời lượng ngủ = điểm câu 4 (số giờ ngủ thực tế).
  const hoursSlept = num(a[3]);
  const c3 = hoursSlept > 7 ? 0 : hoursSlept >= 6 ? 1 : hoursSlept >= 5 ? 2 : 3;

  // TP4 - Hiệu suất giấc ngủ = (giờ ngủ được / giờ nằm trên giường) x 100%.
  const bedMinutes = parseTimeToMinutes(a[0]);
  const wakeMinutes = parseTimeToMinutes(a[2]);
  let timeInBedHours = 0;
  if (bedMinutes !== null && wakeMinutes !== null) {
    let diff = wakeMinutes - bedMinutes;
    if (diff <= 0) diff += 24 * 60; // qua đêm: đi ngủ tối hôm trước, dậy sáng hôm sau
    timeInBedHours = diff / 60;
  }
  const efficiency = timeInBedHours > 0 ? (hoursSlept / timeInBedHours) * 100 : 100;
  const c4 = efficiency > 85 ? 0 : efficiency >= 75 ? 1 : efficiency >= 65 ? 2 : 3;

  // TP5 - Rối loạn giấc ngủ = tổng điểm 5b-5i, quy đổi theo bảng Bộ Y tế (0 / 1-9 / 10-18 / 19-27).
  const disturbanceSum = [5, 6, 7, 8, 9, 10, 11, 12].reduce((sum, idx) => sum + num(a[idx]), 0);
  const c5 = disturbanceSum === 0 ? 0 : disturbanceSum <= 9 ? 1 : disturbanceSum <= 18 ? 2 : 3;

  // TP6 - Dùng thuốc ngủ = điểm câu 6 (thang 0-3 có sẵn).
  const c6 = num(a[13]);

  // TP7 - Rối loạn hoạt động ban ngày = tổng điểm câu 7 + câu 8, quy đổi (0 / 1-2 / 3-4 / 5-6).
  const daytimeSum = num(a[14]) + num(a[15]);
  const c7 = daytimeSum === 0 ? 0 : daytimeSum <= 2 ? 1 : daytimeSum <= 4 ? 2 : 3;

  return c1 + c2 + c3 + c4 + c5 + c6 + c7;
}

// EPI: thang Hướng ngoại (E) và Độ tin cậy/Lie (S) chấm điểm ĐẢO CHIỀU theo từng câu —
// câu trong trueIndices tính điểm khi trả lời "Có" (score=1), câu trong falseIndices
// tính điểm khi trả lời "Không" (score=0). Khác thang Tính thần kinh (toàn bộ cùng
// chiều), nên cần hàm riêng thay vì cộng dồn theo indices/multiplier chuẩn.
function computeKeyedScore(answerList, trueIndices, falseIndices) {
  let score = 0;
  trueIndices.forEach((idx) => { if (Number(answerList[idx]) === 1) score += 1; });
  falseIndices.forEach((idx) => { if (Number(answerList[idx]) === 0) score += 1; });
  return score;
}

// Vanderbilt: mỗi lĩnh vực sàng lọc bằng cách ĐẾM số câu đạt điểm 2 ("Thường xuyên")
// hoặc 3 ("Rất thường xuyên") trở lên, không phải cộng tổng điểm — nên điểm hiển thị ở
// đây chính là SỐ CÂU đạt ngưỡng đó (so với countThreshold để xếp loại).
function computeCountThresholdScore(answerList, indices) {
  return indices.filter((idx) => Number(answerList[idx]) >= 2).length;
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
  recommendedExperts.value = [];
  savedResultId.value = null;

  // Evaluate logic
  const subScores = {};
  Object.keys(testData.scoring).forEach((key) => {
    const sc = testData.scoring[key];
    let finalScore;
    if (sc.custom === 'psqi_v1') {
      finalScore = computePsqiScore(answerList);
    } else if (sc.custom === 'epi_keyed') {
      finalScore = computeKeyedScore(answerList, sc.trueIndices, sc.falseIndices);
    } else if (sc.custom === 'count_threshold') {
      finalScore = computeCountThresholdScore(answerList, sc.indices);
    } else {
      let rawSum = 0;
      sc.indices.forEach((idx) => {
        rawSum += (answerList[idx] || 0);
      });
      finalScore = rawSum * sc.multiplier;
    }
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
    overallLevelClass: overallSeverity?.className || 'level-0',
    overallSeverityLabel: overallSeverity?.label || '',
    overallScore: overallSeverity?.score ?? null
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
      dominant_dimension: overallSeverity?.key || null,
      // Dùng để backend dựng đúng link ảnh banner (assessment-images/{code}/{class}.png)
      // cho preview chia sẻ kết quả (share-card) — xem resultImageUrl ở trên, cùng quy ước.
      overall_level_class: overallSeverity?.className || 'level-0'
    }
  });
}

// Gợi ý 1-2 chuyên gia khớp với đúng kết quả bài test vừa nộp — tái dùng logic ghép
// "matched" sẵn có ở GET /experts (dựa trên bản ghi assessment_results mới nhất của user,
// nên phải gọi SAU KHI /assessments/:code/submit đã lưu xong kết quả này).
async function loadRecommendedExperts() {
  try {
    const data = await apiClient.get('/experts');
    recommendedExperts.value = (data?.experts || [])
      .filter((expert) => expert.matched)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 2);
  } catch (error) {
    console.error('Load recommended experts failed:', error);
    recommendedExperts.value = [];
  }
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
    savedResultId.value = saved?.id || null;

    await Promise.all([
      loadAssessmentData(),
      loadAiSummary(saved?.id),
      loadRecommendedExperts()
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

// Công tắc toàn cục "Chia sẻ bài test tự làm với chuyên gia" — giống hệt mood check-in
// (cùng đọc/ghi qua PUT/GET /profile), khác với nhật ký (chia sẻ riêng từng bài).
const shareAssessmentsWithExperts = ref(false);
const shareAssessmentsSaving = ref(false);
async function toggleShareAssessmentsWithExperts() {
  shareAssessmentsSaving.value = true;
  try {
    await apiClient.put('/profile', { share_assessments_with_experts: shareAssessmentsWithExperts.value });
  } catch (_e) {
    shareAssessmentsWithExperts.value = !shareAssessmentsWithExperts.value;
  } finally {
    shareAssessmentsSaving.value = false;
  }
}

onMounted(() => {
  loadRespondentFromStorage();

  loadAssessmentData()
    .catch((error) => {
      console.error('Assessment page init failed:', error);
    })
    .finally(() => {
      // Deep-link từ nút Chia sẻ ở mỗi thẻ bài test (vd /mood-assessment?test=dass21) ->
      // mở thẳng đúng bài đó, giống hệt bấm vào thẻ. Chờ load xong data ở trên trước (điểm
      // cũ/bản test tùy chỉnh của admin) để mở bài vào đúng trạng thái, không thiếu dữ liệu.
      const testKey = route.query.test;
      if (testKey && TESTS.value[testKey]) startTest(testKey);
    });

  apiClient.get('/profile').then((profileData) => {
    shareAssessmentsWithExperts.value = profileData?.share_assessments_with_experts ?? false;
  }).catch(() => {});
});
</script>

<style scoped src="../assets/assessment.css"></style>
<style scoped>
/* Đồng bộ với trang tổng quan (DashboardView.vue): nền ivory + ảnh lá, thẻ trắng bo mềm không
   viền/bóng giấy, chữ Inter, tiêu đề --font-heading, nút phẳng. Đặt SAU assessment.css để
   thắng thứ tự nguồn; assessment.css còn dùng chung cho ScreeningFormView/SupportRegistrationView
   nên không sửa thẳng file đó. */
.assessment-page {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55; color: var(--color-text);
  background: var(--color-canvas); -webkit-font-smoothing: antialiased; position: relative; isolation: isolate; min-height: 100vh;
}
.assessment-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.5; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { padding: 20px 20px 32px; }
.assessment-page :is(input, textarea, select, button) { font-family: inherit; }

.page-header { margin-bottom: 16px; justify-content: space-between; flex-wrap: nowrap; gap: 16px; }
.page-header > .disclaimer-banner { flex: 1 1 auto; min-width: 0; margin: 0; padding: 10px 16px; align-items: center; }
.page-header > div:last-child { flex-shrink: 0; }
.disclaimer-banner .db-icon { width: 20px; height: 20px; color: var(--color-terracotta); flex-shrink: 0; }
@media (max-width: 700px) {
  .page-header { flex-wrap: wrap; }
}
.page-title { font-family: var(--font-heading); font-size: 26px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); }
.page-subtitle { font-size: 14px; color: var(--color-text-muted); margin-top: 2px; }

/* Thẻ: nền trắng, bo --radius-card, không viền/bóng giấy. */
.paper-card, .test-select-card, .respondent-card, .history-card, .review-modal {
  background: var(--color-surface); border: none; border-radius: var(--radius-card); box-shadow: none;
}
.test-select-card { padding: 22px; transition: transform var(--duration-normal) var(--ease-standard), background-color var(--duration-normal) var(--ease-standard); }
.test-select-card::before { display: none; }
.test-select-card:hover, .history-card:hover { box-shadow: none; transform: translateY(-2px); background: color-mix(in srgb, var(--color-brand-soft) 35%, var(--color-surface)); }
/* Icon bài test đơn sắc: không khung nền, nét xanh thương hiệu cho mọi bài. */
.tsc-icon, .th-icon { border: none !important; border-radius: 0; background: none !important; color: var(--color-brand); width: auto; height: auto; justify-content: flex-start; }
.tsc-icon :deep(.test-icon) { width: 40px; height: 40px; stroke-width: 1.6; }
/* Đầu thẻ nằm ngang: icon bên trái, tên + tên đầy đủ xếp bên phải. */
.test-select-card { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 14px; align-content: start; }
.test-select-card > * { grid-column: 1 / -1; }
.test-select-card > .tsc-icon { grid-column: 1; grid-row: 1 / span 2; align-self: center; margin: 0 0 12px; }
.test-select-card > .tsc-name { grid-column: 2; grid-row: 1; align-self: end; margin: 0; padding-right: 28px; }
.test-select-card > .tsc-fullname { grid-column: 2; grid-row: 2; align-self: start; margin: 0 0 12px; }
/* Mobile (lưới 2 cột hẹp): xếp dọc, căn giữa — icon, tên viết tắt, tên đầy đủ; nút chia sẻ ở góc phải. */
@media (max-width: 600px) {
  .test-select-card { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 16px 12px 14px; text-align: center; }
  .test-select-card > * { align-self: center; }
  .test-select-card > .tsc-icon, .test-select-card > .tsc-name, .test-select-card > .tsc-fullname { align-self: center; }
  .test-select-card > .tsc-icon { margin: 4px 0 10px; justify-content: center; }
  .tsc-icon :deep(.test-icon) { width: 30px; height: 30px; }
  .test-select-card > .tsc-name { padding-right: 0; margin: 0 0 2px; font-size: 15px; line-height: 1.3; }
  .test-select-card > .tsc-fullname { margin: 0; font-size: 12px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .tsc-share-btn { top: 10px; right: 10px; width: 30px; height: 30px; }
}
.th-icon :deep(.test-icon) { width: 44px; height: 44px; stroke-width: 1.6; }
.tsc-share-btn { color: var(--color-text-muted); }
.catalog-search-wrap { position: relative; flex: 1 1 auto; display: flex; min-width: 0; }
.catalog-search-wrap .catalog-search { flex: 1; width: 100%; padding-left: 40px; }
.catalog-search-wrap .catalog-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--color-text-subtle); pointer-events: none; }
.tsc-share-btn :deep(.test-icon) { width: 15px; height: 15px; }
.tsc-share-btn:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.tsc-name { font-family: var(--font-heading); font-size: 17px; font-weight: 800; color: var(--color-text); }
.tsc-fullname, .tsc-last, .hc-test, .hc-date { color: var(--color-text-subtle); font-size: 12px; }
.tsc-desc { font-size: 13.5px; color: var(--color-text-muted); }
.tsc-share-btn { border: none; background: var(--color-surface-muted); }
.tsc-share-popover { border: none; background: var(--color-surface); border-radius: var(--radius-card); box-shadow: var(--shadow-soft); }

/* Nút phẳng như .pf-btn-* của Dashboard. */
.btn-primary, .btn-outline {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; padding: 8px 16px; border: none; border-radius: var(--radius-control); box-shadow: none;
  font-family: inherit; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transform: none;
  transition: background-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn-primary { background: var(--color-brand); color: var(--color-on-brand); }
.btn-primary:hover { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); box-shadow: none; transform: none; }
.btn-outline { background: var(--color-surface-muted); color: var(--color-text); }
.btn-outline:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.btn-primary:disabled, .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.assessment-page :is(a, button, summary):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

/* Nhãn: nền nhạt, không viền. */
.badge-pill { border: none !important; font-size: 12px; }
.badge-mint { background: var(--color-brand-soft); color: var(--color-brand); }
.badge-peach { background: var(--color-terracotta-soft); color: var(--color-terracotta); }

.disclaimer-banner { margin: 0 130px 12px 0; border: none; border-radius: var(--radius-card); background: var(--color-terracotta-soft); color: var(--color-text); font-size: 13.5px; }

.respondent-card { padding: 20px 24px; }
.respondent-card h3 { font-family: var(--font-heading); font-size: 17px; font-weight: 800; }
.rp-field label { font-size: 13px; font-weight: 600; color: var(--color-text-muted); }
.rp-field input, .rp-field textarea, .catalog-search {
  border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas);
  color: var(--color-text); font-size: 14px; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard);
}
.rp-field input:focus, .rp-field textarea:focus, .catalog-search:focus { outline: none; border-color: var(--color-brand); background: var(--color-surface); box-shadow: none; }
.catalog-search { background: var(--color-surface); }
.catalog-filter-menu { border: none; border-radius: var(--radius-card); box-shadow: var(--shadow-soft); }
.catalog-filter-option:hover { background: var(--color-canvas); }
.catalog-filter-all { border-bottom-color: var(--color-surface-muted); }
.catalog-filter-count { background: var(--color-brand); }

.history-title, .ri-title, .rc-title { font-family: var(--font-heading); font-size: 19px; font-weight: 800; color: var(--color-text); }
.history-card { padding: 16px 18px; transition: transform var(--duration-normal) var(--ease-standard), background-color var(--duration-normal) var(--ease-standard); }
/* Mobile: lịch sử xếp 2 thẻ một hàng, thẻ gọn lại cho vừa cột hẹp. */
@media (max-width: 600px) {
  .history-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .history-card { padding: 12px; min-width: 0; }
  .hc-test { font-size: 13px; }
  .hc-date { font-size: 11.5px; }
  .hc-scores { gap: 4px; flex-wrap: wrap; }
  .hc-score-item { font-size: 11px; padding: 2px 6px; }
}

/* Làm bài: thẻ đầu + câu hỏi phẳng, lựa chọn dạng ô mềm. */
.test-header-card, .result-header { background: linear-gradient(135deg, var(--color-brand-soft), var(--color-surface)); }
.th-info .th-name, .rh-title { font-family: var(--font-heading); font-weight: 800; }
.th-progress-bar { border: none; background: var(--color-surface); }
.th-progress-fill { background: var(--color-brand); }
.q-text { font-family: var(--font-heading); }
.likert-option {
  border: 1.5px solid transparent; border-radius: var(--radius-card); background: var(--color-canvas); box-shadow: none;
  transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
@media (hover: hover) and (pointer: fine) {
  .likert-option:hover { border-color: transparent; background: var(--color-brand-soft); box-shadow: none; transform: none; }
}
.likert-option.selected { border-color: var(--color-brand); background: var(--color-brand-soft); box-shadow: none; transform: none; }
.likert-option.selected .lo-label { color: var(--color-brand); }
.lo-label { font-size: 12.5px; color: var(--color-text-muted); }

/* Kết quả */
.result-share-row { border-top: 1px solid var(--color-surface-muted); }
.rs-card { border: none; border-radius: var(--radius-card); }
.expert-recommend { border: none; border-radius: var(--radius-card); background: var(--color-surface); }
.result-disclaimer { border: none !important; border-radius: var(--radius-card) !important; background: var(--color-terracotta-soft) !important; color: var(--color-text-muted) !important; }
.review-close { border: none; background: var(--color-surface-muted); }

/* Popup khẩn cấp giống bản ở trang check-in. */
.emergency-popup { border: none; border-radius: var(--radius-panel); box-shadow: var(--shadow-soft); }
.ep-btn { border: none; border-radius: var(--radius-control); box-shadow: none; }
</style>
