<template>
  <main class="main-content dash">
    <div class="dash-inner">
      <div class="dash-grid" :class="{ 'right-collapsed': rightCollapsed }">
        <!-- ======================= CỘT TRÁI ======================= -->
        <div class="col-left">
          <!-- 1. Check-in -->
          <section class="card checkin-card">
            <div class="ci-body">
              <div class="ci-titles">
                <div class="ci-hello-row">
                  <p class="ci-hello">{{ t('dashboard.hero.hello', { name: displayName }) }}</p>
                  <span v-if="isExpert" class="role-tag">{{ t('sidebar.tagExpert') }}</span>
                  <span v-if="isAdmin" class="role-tag">{{ t('sidebar.tagAdmin') }}</span>
                </div>
                <h1 class="ci-title">{{ checkinPromptTitle }}</h1>
              </div>

              <div class="mood-picker">
                <router-link
                  v-for="(mood, idx) in moodButtons"
                  :key="mood.id"
                  to="/mood-checkin"
                  class="mood-btn"
                  :class="{ 'is-active': idx === CHECKIN_CENTER_INDEX }"
                >
                  <span class="mood-icon-wrap">
                    <span class="mood-icon material-symbols-outlined" aria-hidden="true" :style="{ animationDelay: (idx * 1) + 's' }">{{ MOOD_SYMBOLS[mood.id] }}</span>
                    <span v-if="idx === CHECKIN_CENTER_INDEX" class="mood-check" aria-hidden="true"><span class="material-symbols-outlined">check</span></span>
                  </span>
                  <span class="mood-label">{{ mood.label }}</span>
                </router-link>
              </div>

              <p class="ci-foot">{{ t('dashboard.hero.footnote') }}</p>

              <div v-if="isNewUser" class="new-user-links">
                <router-link to="/tasks" class="btn pf-btn-secondary">{{ t('dashboard.newUser.tasksCta') }}</router-link>
                <router-link to="/journal" class="btn pf-btn-secondary">{{ t('dashboard.newUser.journalCta') }}</router-link>
              </div>
            </div>
          </section>

          <!-- 2. Bốn chỉ số -->
          <div class="kpi-grid">
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.moodLabel') }}</span>
              <div class="kpi-value"><b>{{ stats.mood }}</b><small>/10</small></div>
            </div>
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.streakLabel') }}</span>
              <div class="kpi-value"><b>{{ stats.streak }}</b><small>{{ t('dashboard.stats.streakUnit') }}</small></div>
            </div>
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.tasksLabel') }}</span>
              <div class="kpi-value"><b>{{ stats.tasks }}</b><small v-if="weeklyGoal">/{{ weeklyGoal }}</small></div>
            </div>
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.anxietyLabel') }}</span>
              <div class="kpi-value"><b :class="{ 'is-empty': stats.anxiety === '--' }">{{ stats.anxiety }}</b></div>
            </div>
          </div>

          <!-- 3. Trợ lý PeaceCat -->
          <section class="stack-16">
            <div class="ai-head">
              <div class="ai-head-left">
                <span class="ai-caption">{{ t('dashboard.insight.assistant') }}</span>
                <span class="ai-title pf-section-title">{{ insightTitle }}</span>
              </div>
              <button class="btn pf-btn-tertiary" :disabled="insightMode === 'loading'" @click="requestAiInsight">
                <span class="material-symbols-outlined" :class="{ spinning: insightMode === 'loading' }" aria-hidden="true">refresh</span>
                <span>{{ insightMode === 'loading' ? t('dashboard.insight.btnAnalyzing') : (aiRecommendation ? t('dashboard.insight.btnUpdate') : t('dashboard.insight.btnGet')) }}</span>
              </button>
            </div>
            <div class="card card-pad">
              <div class="ai-quote">
                <div class="ai-text" :class="{ loading: insightMode === 'loading' }" v-html="insightBodyHtml"></div>
                <p v-if="insightTags.length" class="ai-basis">
                  {{ t('dashboard.insight.basis') }} {{ insightTags.map((tag) => tag.text).join(' & ') }}
                </p>
              </div>
              <p v-if="insightNote" class="ai-note">{{ insightNote }}</p>

              <!-- Nhiệm vụ hôm nay: một chỗ duy nhất (gộp bài AI gợi ý + nhiệm vụ đề xuất), thẻ có ảnh, 2 thẻ/hàng -->
              <div class="task-section">
                <div class="task-section-head">
                  <h3 class="side-title pf-section-title">{{ t('dashboard.tasks.title') }}</h3>
                  <router-link to="/tasks" class="link-sm">{{ t('dashboard.tasks.viewAll') }}</router-link>
                </div>
                <div v-if="suggestionList.length" class="task-grid">
                  <router-link
                    v-for="item in suggestionList"
                    :key="item.id || item.title"
                    class="td-card"
                    :to="item.id ? { path: '/task-detail', query: { id: item.id } } : '/tasks'"
                  >
                    <div class="task-thumb">
                      <img
                        v-if="taskCardSrc(item) && !brokenThumbs.has(item.id)"
                        :src="taskCardSrc(item)"
                        :alt="item.title"
                        loading="lazy"
                        @error="brokenThumbs.add(item.id)"
                      >
                      <span v-if="taskBadge(item).cls === 'tb-priority'" class="task-badge">{{ taskBadge(item).text }}</span>
                    </div>
                    <div class="td-card-body">
                      <h4 class="task-name">{{ item.title }}</h4>
                      <p v-if="item.reason" class="task-reason">{{ item.reason }}</p>
                      <div class="td-card-foot">
                        <span class="task-time">{{ item.duration_minutes || 0 }} {{ t('dashboard.tasks.minutesUnit') }} · {{ taskBadge(item).text }}</span>
                        <span class="task-xp">+{{ item.xp_reward || 0 }} XP</span>
                      </div>
                    </div>
                  </router-link>
                </div>
                <p v-else class="empty-text">{{ t('dashboard.tasks.empty') }}</p>
              </div>
            </div>
          </section>

          <!-- 4. Xu hướng tâm trạng -->
          <section class="stack-16">
            <div class="sec-head">
              <div>
                <span class="eyebrow">{{ t('dashboard.chart.eyebrow') }}</span>
                <h3 class="sec-title pf-section-title">{{ t('dashboard.chart.heading') }}</h3>
              </div>
              <div class="seg">
                <button
                  v-for="tab in CHART_TABS"
                  :key="tab.period"
                  class="seg-btn"
                  :class="{ 'is-active': chartPeriod === tab.period }"
                  @click="switchChart(tab.period)"
                >{{ t(tab.labelKey) }}</button>
              </div>
            </div>
            <div class="card card-pad">
              <div class="trend-wrap">
                <div class="mood-chart-area" v-html="chartSvgHtml"></div>
                <div class="chart-labels" :style="{ gridTemplateColumns: `repeat(${Math.max(chartLabels.length, 1)}, minmax(0, 1fr))` }">
                  <span v-if="!chartLabels.length">{{ t('dashboard.chart.noData') }}</span>
                  <span
                    v-for="(label, idx) in chartLabels"
                    :key="idx"
                    :class="{ 'is-current': idx === chartLabels.length - 1 }"
                  >{{ label }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 5. Radar sức khỏe tổng thể -->
          <section class="stack-16">
            <div class="sec-head">
              <div>
                <span class="eyebrow">{{ t('dashboard.wellness.eyebrow') }}</span>
                <h3 class="sec-title pf-section-title">{{ t('dashboard.wellness.title') }}</h3>
              </div>
              <a v-if="radarMetrics.length" href="#" class="link-arrow" @click.prevent>
                <span>{{ t('dashboard.wellness.viewDetailPlain') }}</span>
              </a>
            </div>
            <div class="card card-pad">
              <div v-if="radarMetrics.length" class="radar-grid">
                <div class="radar-svg-wrap" v-html="radarSvgHtml"></div>
                <div class="radar-badges">
                  <div v-for="metric in radarMetrics" :key="metric.key" class="radar-badge">
                    <span class="rb-label">{{ metric.label }}</span>
                    <span class="rb-value" :class="{ 'is-empty': metric.value === null || metric.value === undefined }">
                      {{ metric.value === null || metric.value === undefined ? '--' : `${metric.value} / 10` }}
                    </span>
                  </div>
                </div>
              </div>
              <p v-else class="empty-text">{{ t('dashboard.wellness.notEnough') }}</p>
            </div>
          </section>
        </div>

        <!-- ======================= CỘT PHẢI ======================= -->
        <button
          v-if="showEmergencyBanner && !rail.docked"
          type="button"
          class="safety-fab"
          :title="t('dashboard.emergencyBanner.badge')"
          :aria-label="t('dashboard.emergencyBanner.badge')"
          @click="safetyPopupOpen = true"
        ><span class="safety-fab-sos">SOS</span><span class="rail-label">{{ t('dashboard.emergencyBanner.badge') }}</span></button>
        <Teleport to="body">
          <div v-if="safetyPopupOpen" class="safety-overlay" @click.self="safetyPopupOpen = false">
            <div class="safety-dialog" role="dialog" aria-modal="true" :aria-label="t('dashboard.emergencyBanner.badge')">
              <button type="button" class="safety-close" :aria-label="t('common.common.close')" @click="safetyPopupOpen = false"><NavIcon name="close" /></button>
              <span class="sb-badge">{{ t('dashboard.emergencyBanner.badge') }}</span>
              <p class="sb-desc">
                {{ t('dashboard.emergencyBanner.desc') }}
                <span v-if="emergencyReasonText" class="sb-reason">{{ t('dashboard.emergencyBanner.reasonPrefix') }} {{ emergencyReasonText }}</span>
              </p>
              <router-link to="/emergency" class="btn pf-btn-danger pf-btn-block" @click="safetyPopupOpen = false">{{ t('dashboard.emergencyBanner.openBtn') }}</router-link>
            </div>
          </div>
        </Teleport>
        <!-- Khu vườn tâm hồn mở toàn màn hình: kéo để xoay, cuộn để phóng to -->
        <Teleport to="body">
          <Transition name="garden-full">
            <div v-if="gardenExpanded" class="garden-full" :class="{ 'is-revealing': gardenRevealing }" role="dialog" aria-modal="true" :aria-label="t('dashboard.garden.title')">
              <MoodGarden3D ref="gardenSceneRef" interactive :bubble-for="gardenLanternBubble?.id ?? null" :health="gardenViewHealth" :hour="gardenPreviewHour" :label="gardenStatusText" :layout="gardenLayout" :memories="gardenRevealReady && !gardenCheckinOpen ? gardenMemories : gardenSeenMemories" :lanterns="gardenLanterns" :breathing="!!gardenBreath && !gardenBreath.done" @garden-event="onGardenEvent">
                <!-- lời biết ơn hiện ngay cạnh chiếc đèn lồng đang bay -->
                <template #bubble>
                  <div v-if="gardenLanternBubble" class="garden-lantern-bubble" role="status" aria-live="polite">
                    <p class="garden-lantern-bubble-date">{{ gardenLanternBubble.title }}</p>
                    <p class="garden-lantern-bubble-text">{{ gardenLanternBubble.text }}</p>
                    <button type="button" class="garden-lantern-bubble-close" :aria-label="t('common.common.close')" @click="gardenLanternBubble = null"><NavIcon name="close" /></button>
                  </div>
                </template>
              </MoodGarden3D>
              <!-- Cùng con vật hít thở: hít 4s · giữ 2s · thở ra 6s × 3 nhịp, dừng lúc nào cũng được -->
              <div v-if="gardenBreath" class="garden-breath" role="status" aria-live="polite">
                <p class="garden-breath-title">{{ gardenBreath.done ? t('dashboard.garden.breathDone') : t('dashboard.garden.breathTitle', { animal: t(`dashboard.garden.animals.${gardenBreath.animal}`) }) }}</p>
                <div class="garden-breath-circle" :class="`is-${gardenBreath.phase}`"><span>{{ gardenBreath.done ? '' : t(`dashboard.garden.breath_${gardenBreath.phase}`) }}</span></div>
                <p v-if="!gardenBreath.done" class="garden-breath-round">{{ t('dashboard.garden.breathRound', { n: gardenBreath.round, total: BREATH_ROUNDS }) }}</p>
                <button v-if="!gardenBreath.done" type="button" class="garden-breath-stop" @click="stopGardenBreath">{{ t('dashboard.garden.breathStop') }}</button>
              </div>
              <div v-else-if="gardenCard" class="garden-card" :class="`is-${gardenCard.kind}`" role="status" aria-live="polite">
                <span v-if="gardenCard.color" class="garden-card-dot" :style="{ background: gardenCard.color }"></span>
                <div class="garden-card-body">
                  <p class="garden-card-title">{{ gardenCard.title }}</p>
                  <p v-if="gardenCard.text" class="garden-card-text">{{ gardenCard.text }}</p>
                </div>
                <button type="button" class="garden-card-close" :aria-label="t('common.common.close')" @click="gardenCard = null"><NavIcon name="close" /></button>
              </div>
              <p v-else-if="gardenEditing" class="garden-call-hint" :class="{ 'is-notice': gardenEditNotice }" role="status" aria-live="polite">{{ gardenEditNotice || gardenEditHint }}</p>
              <p v-else-if="gardenSelected" class="garden-call-hint" role="status">{{ t('dashboard.garden.callHint', { animal: t(`dashboard.garden.animals.${gardenSelected}`) }) }}</p>
              <!-- Check-in ngay trong vườn: đúng các bước & dữ liệu như trang Check-in; đóng lại là hoa ký ức nở -->
              <div v-if="gardenCheckinOpen" class="garden-checkin-sheet" role="dialog" :aria-label="t('dashboard.garden.checkin.open')">
                <div class="garden-checkin-sheet-head">
                  <p v-if="gardenTodayMemory && !gardenCheckinSaved" class="garden-checkin-today">
                    <span class="garden-checkin-dot is-small" :style="{ background: MEMORY_COLORS[gardenTodayMemory.emotion] || '#E9DDBF' }"></span>
                    {{ t('dashboard.garden.checkin.today', { emotion: emotionLabel(gardenTodayMemory.emotion) }) }}
                  </p>
                  <span v-else></span>
                  <button type="button" class="garden-card-close" :aria-label="t('common.common.close')" @click="closeGardenCheckin"><NavIcon name="close" /></button>
                </div>
                <div class="garden-checkin-sheet-body">
                  <MoodCheckinView embedded @saved="onGardenCheckinSaved" @close="closeGardenCheckin" />
                </div>
              </div>
              <div v-if="lanternOpen" class="garden-lantern-compose" role="dialog" :aria-label="t('dashboard.garden.lantern.title')">
                <p class="garden-lantern-title">{{ t('dashboard.garden.lantern.title') }}</p>
                <textarea
                  ref="lanternInput"
                  v-model="lanternText"
                  maxlength="140"
                  rows="3"
                  :placeholder="t('dashboard.garden.lantern.placeholder')"
                  @keydown.enter.exact.prevent="sendLantern"
                ></textarea>
                <p v-if="lanternError" class="garden-lantern-error">{{ lanternError }}</p>
                <div class="garden-lantern-actions">
                  <span class="garden-lantern-count">{{ lanternText.length }}/140</span>
                  <button type="button" class="garden-lantern-cancel" @click="lanternOpen = false">{{ t('dashboard.garden.lantern.cancel') }}</button>
                  <button type="button" class="garden-lantern-send" :disabled="!lanternText.trim() || lanternSending" @click="sendLantern">
                    <NavIcon name="lantern" />{{ lanternSending ? t('dashboard.garden.lantern.sending') : t('dashboard.garden.lantern.send') }}
                  </button>
                </div>
              </div>
              <div class="garden-full-head">
                <div>
                  <h2 class="garden-full-title">{{ t('dashboard.garden.title') }}</h2>
                  <span v-if="gardenMetrics.length" class="rp-pill"><span class="rp-pill-sun"></span>{{ gardenStatusText }}</span>
                </div>
                <div class="garden-full-actions">
                  <button v-if="gardenEditing" type="button" class="garden-edit-done" @click="exitGardenEditor">
                    <NavIcon name="check" />{{ t('dashboard.garden.editor.done') }}
                  </button>
                  <button
                    v-if="!gardenEditing"
                    type="button"
                    class="garden-full-close"
                    :class="{ 'is-on': gardenCheckinOpen }"
                    :aria-label="t('dashboard.garden.checkin.open')"
                    :title="t('dashboard.garden.checkin.open')"
                    @click="openGardenCheckin"
                  ><NavIcon name="mood" /></button>
                  <button
                    v-if="!gardenEditing"
                    type="button"
                    class="garden-full-close"
                    :class="{ 'is-on': lanternOpen }"
                    :aria-label="t('dashboard.garden.lantern.open')"
                    :title="t('dashboard.garden.lantern.open')"
                    @click="openLantern"
                  ><NavIcon name="lantern" /></button>
                  <button
                    v-if="!gardenEditing"
                    type="button"
                    class="garden-full-close"
                    :aria-label="t('dashboard.garden.editor.open')"
                    :title="t('dashboard.garden.editor.open')"
                    @click="enterGardenEditor"
                  ><NavIcon name="edit" /></button>
                  <button
                    type="button"
                    class="garden-full-close"
                    :class="{ 'is-on': gardenSoundOn }"
                    :aria-pressed="gardenSoundOn"
                    :aria-label="gardenSoundOn ? t('dashboard.rightPanel.soundOff') : t('dashboard.rightPanel.soundOn')"
                    :title="gardenSoundOn ? t('dashboard.rightPanel.soundOff') : t('dashboard.rightPanel.soundOn')"
                    @click="gardenSoundOn = !gardenSoundOn"
                  ><NavIcon :name="gardenSoundOn ? 'volume' : 'volumeOff'" /></button>
                  <button
                    type="button"
                    class="garden-full-close"
                    :class="{ 'is-on': gardenCreditOpen }"
                    :aria-expanded="gardenCreditOpen"
                    aria-controls="garden-credit"
                    :aria-label="t('dashboard.rightPanel.gardenCreditToggle')"
                    :title="t('dashboard.rightPanel.gardenCreditToggle')"
                    @click="gardenCreditOpen = !gardenCreditOpen"
                  ><NavIcon name="info" /></button>
                  <button type="button" class="garden-full-close" :aria-label="t('common.common.close')" @click="gardenExpanded = false"><NavIcon name="close" /></button>
                </div>
              </div>
              <!-- Trang trí đảo: kho đồ + công cụ chỉnh món đang chọn -->
              <template v-if="gardenEditing">
                <div v-if="gardenGhost.active && !gardenEditSel" class="garden-edit-tools" role="toolbar" :aria-label="t('dashboard.garden.editor.placing')">
                  <button type="button" :title="t('dashboard.garden.editor.rotateLeft')" @click="gardenSceneRef?.editor.ghostRotate(-1)"><NavIcon name="rotateLeft" />{{ t('dashboard.garden.editor.rotateLeft') }}</button>
                  <button type="button" :title="t('dashboard.garden.editor.rotateRight')" @click="gardenSceneRef?.editor.ghostRotate(1)"><NavIcon name="rotate" />{{ t('dashboard.garden.editor.rotateRight') }}</button>
                  <button type="button" :title="t('dashboard.garden.editor.flip')" @click="gardenSceneRef?.editor.ghostFlip()"><NavIcon name="flip" />{{ t('dashboard.garden.editor.flip') }}</button>
                  <button type="button" :disabled="gardenGhost.scale <= 0.41" @click="gardenSceneRef?.editor.ghostScale(-1)"><NavIcon name="minus" />{{ t('dashboard.garden.editor.smaller') }}</button>
                  <button type="button" :disabled="gardenGhost.scale >= 2.49" @click="gardenSceneRef?.editor.ghostScale(1)"><NavIcon name="plus" />{{ t('dashboard.garden.editor.bigger') }}</button>
                  <button v-if="gardenTouch && gardenGhost.pending" type="button" class="is-place" :disabled="!gardenGhost.ok" @click="gardenSceneRef?.editor.placeGhost()"><NavIcon name="check" />{{ t('dashboard.garden.editor.placeHere') }}</button>
                </div>
                <div v-else-if="gardenEditSel?.path" class="garden-edit-tools" role="toolbar" :aria-label="t('dashboard.garden.editor.selected')">
                  <span class="garden-edit-tools-label">{{ t('dashboard.garden.editor.pathSelected') }}</span>
                  <button type="button" class="is-danger" @click="gardenSceneRef?.editor.remove()"><NavIcon name="trash" />{{ t('dashboard.garden.editor.remove') }}</button>
                </div>
                <div v-else-if="gardenEditSel" class="garden-edit-tools" role="toolbar" :aria-label="t('dashboard.garden.editor.selected')">
                  <button v-if="gardenEditSel.canTrim" type="button" class="is-trim" @click="gardenSceneRef?.editor.trim()"><NavIcon name="scissors" />{{ t('dashboard.garden.editor.trim') }}</button>
                  <button v-if="gardenEditSel.canDup" type="button" @click="gardenSceneRef?.editor.duplicate()"><NavIcon name="copy" />{{ t('dashboard.garden.editor.duplicate') }}</button>
                  <button type="button" @click="gardenSceneRef?.editor.flip()"><NavIcon name="flip" />{{ t('dashboard.garden.editor.flip') }}</button>
                  <button type="button" @click="gardenSceneRef?.editor.rotate()"><NavIcon name="rotate" />{{ t('dashboard.garden.editor.rotate') }}</button>
                  <button type="button" :disabled="gardenEditSel.scale <= 0.41" @click="gardenSceneRef?.editor.scale(-1)"><NavIcon name="minus" />{{ t('dashboard.garden.editor.smaller') }}</button>
                  <button type="button" :disabled="gardenEditSel.scale >= 2.49" @click="gardenSceneRef?.editor.scale(1)"><NavIcon name="plus" />{{ t('dashboard.garden.editor.bigger') }}</button>
                  <button type="button" class="is-danger" @click="gardenSceneRef?.editor.remove()"><NavIcon name="trash" />{{ t('dashboard.garden.editor.remove') }}</button>
                </div>
                <div class="garden-editor">
                  <div class="garden-editor-top">
                    <div class="garden-editor-tabs" role="tablist">
                      <button
                        v-for="grp in GARDEN_EDIT_GROUPS"
                        :key="grp"
                        type="button"
                        role="tab"
                        :aria-selected="gardenEditGroup === grp"
                        :class="{ 'is-active': gardenEditGroup === grp }"
                        @click="setGardenEditGroup(grp)"
                      >{{ t(`dashboard.garden.editor.groups.${grp}`) }}</button>
                    </div>
                    <div class="garden-editor-actions">
                      <button type="button" class="garden-editor-trim" :class="{ 'is-on': gardenEraseOn }" :aria-pressed="gardenEraseOn" :title="t('dashboard.garden.editor.eraseTool')" @click="toggleGardenErase"><NavIcon name="trash" /><span>{{ t('dashboard.garden.editor.eraseTool') }}</span></button>
                      <button type="button" class="garden-editor-trim" :class="{ 'is-on': gardenTrimOn }" :aria-pressed="gardenTrimOn" :title="t('dashboard.garden.editor.trimTool')" @click="toggleGardenTrim"><NavIcon name="scissors" /><span>{{ t('dashboard.garden.editor.trimTool') }}</span></button>
                      <button type="button" :disabled="!gardenEditState.canUndo" :title="t('dashboard.garden.editor.undo')" @click="gardenSceneRef?.editor.undo()"><NavIcon name="undo" /><span>{{ t('dashboard.garden.editor.undo') }}</span></button>
                      <button type="button" :title="t('dashboard.garden.editor.clearAll')" @click="clearGardenAll"><NavIcon name="close" /><span>{{ t('dashboard.garden.editor.clearAll') }}</span></button>
                      <button type="button" :disabled="!gardenEditState.edited" :title="t('dashboard.garden.editor.reset')" @click="resetGardenLayout"><NavIcon name="refresh" /><span>{{ t('dashboard.garden.editor.reset') }}</span></button>
                    </div>
                  </div>
                  <div v-if="gardenEditGroup === 'path'" class="garden-editor-items">
                    <button
                      v-for="pk in GARDEN_PATH_KINDS"
                      :key="pk.key"
                      type="button"
                      class="garden-editor-item"
                      :class="{ 'is-active': gardenEditTool === `path:${pk.key}` }"
                      :aria-pressed="gardenEditTool === `path:${pk.key}`"
                      @click="pickGardenTool(`path:${pk.key}`)"
                    >
                      <span class="garden-editor-thumb garden-path-swatch" :class="`is-${pk.key}`" :style="{ '--path-color': pk.color }"></span>
                      <span class="garden-editor-name">{{ t(`dashboard.garden.editor.path_${pk.key}`) }}</span>
                    </button>
                    <button v-if="gardenEditState.pathOpen" type="button" class="garden-editor-pathdone" @click="gardenSceneRef?.editor.endPath()"><NavIcon name="check" />{{ t('dashboard.garden.editor.endPath') }}</button>
                  </div>
                  <div v-else class="garden-editor-items">
                    <button
                      v-if="GARDEN_BRUSH_GROUPS.includes(gardenEditGroup)"
                      type="button"
                      class="garden-editor-item garden-editor-brushbtn"
                      :class="{ 'is-active': gardenBrushOn }"
                      :aria-pressed="gardenBrushOn"
                      :title="t('dashboard.garden.editor.brushHelp')"
                      @click="toggleGardenBrush"
                    >
                      <span class="garden-editor-thumb garden-editor-tool"><NavIcon name="brush" /></span>
                      <span class="garden-editor-name">{{ gardenBrushOn ? t('dashboard.garden.editor.brushOn') : t('dashboard.garden.editor.brushOff') }}</span>
                    </button>
                    <div v-if="isAdmin && ['grow', 'tree', 'bush'].includes(gardenEditGroup)" class="garden-editor-boost">
                      <span>{{ t('dashboard.garden.editor.boostLabel', { n: gardenGrowBoost }) }}</span>
                      <div>
                        <button type="button" @click="gardenSceneRef?.editor.boostGrowth(1)">+1</button>
                        <button type="button" @click="gardenSceneRef?.editor.boostGrowth(5)">+5</button>
                        <button type="button" :disabled="!gardenGrowBoost" @click="gardenSceneRef?.editor.boostGrowth(0)">{{ t('dashboard.garden.editor.boostReset') }}</button>
                      </div>
                    </div>
                    <button
                      v-for="item in gardenEditItems"
                      :key="item.key"
                      type="button"
                      class="garden-editor-item"
                      :class="{ 'is-active': gardenEditTool === item.key }"
                      :aria-pressed="gardenEditTool === item.key"
                      @click="pickGardenTool(item.key)"
                    >
                      <span class="garden-editor-thumb">
                        <img v-if="gardenThumbs[item.key]" :src="gardenThumbs[item.key]" alt="" />
                        <span v-else class="garden-editor-thumb-wait"></span>
                      </span>
                      <span class="garden-editor-name">{{ t(`dashboard.garden.editor.items.${item.key}`) }}</span>
                    </button>
                  </div>
                  <p class="garden-editor-save" :class="`is-${gardenSaveState}`">{{ gardenSaveState === 'idle' ? '' : t(`dashboard.garden.editor.save_${gardenSaveState}`) }}</p>
                </div>
              </template>
              <div v-if="gardenMetrics.length && !gardenEditing" class="garden-full-metrics">
                <div v-for="metric in gardenMetrics" :key="metric.key" class="rp-metric">
                  <NavIcon :name="GARDEN_ICONS[metric.key] || 'mood'" class="rp-metric-icon" :class="`ic-${GARDEN_ICONS[metric.key] || 'mood'}`" />
                  <span class="rp-metric-label">{{ metric.label }}</span>
                  <strong class="rp-metric-value">{{ metric.status_text }}</strong>
                </div>
              </div>
              <div v-if="isAdmin && !gardenEditing" class="garden-preview" role="radiogroup" :aria-label="t('dashboard.rightPanel.gardenPreview')">
                <span class="garden-preview-label">{{ t('dashboard.rightPanel.gardenPreview') }}</span>
                <button
                  v-for="opt in GARDEN_PREVIEW_LEVELS"
                  :key="opt.key"
                  type="button"
                  role="radio"
                  :aria-checked="gardenPreview === opt.value"
                  class="garden-preview-btn"
                  :class="{ 'is-active': gardenPreview === opt.value }"
                  @click="gardenPreview = opt.value"
                >{{ t(opt.label) }}</button>
              </div>
              <div v-if="isAdmin && !gardenEditing" class="garden-preview garden-preview-time" role="radiogroup" :aria-label="t('dashboard.rightPanel.previewTime')">
                <span class="garden-preview-label">{{ t('dashboard.rightPanel.previewTime') }}</span>
                <button
                  v-for="opt in GARDEN_PREVIEW_HOURS"
                  :key="opt.key"
                  type="button"
                  role="radio"
                  :aria-checked="gardenPreviewHour === opt.value"
                  class="garden-preview-btn"
                  :class="{ 'is-active': gardenPreviewHour === opt.value }"
                  @click="gardenPreviewHour = opt.value"
                >{{ t(opt.label) }}</button>
              </div>
              <p v-if="!gardenEditing" class="garden-full-hint">{{ t('dashboard.rightPanel.gardenHint') }}</p>
              <p v-if="gardenCreditOpen" id="garden-credit" class="garden-full-credit">{{ t('dashboard.rightPanel.gardenCreditPrefix') }} Quaternius (CC0) · <a href="https://poly.pizza/m/YUAFe6TOOa" target="_blank" rel="noopener">Low Poly Tree House</a> – Dawid2K · <a href="https://poly.pizza/m/2jffIS8PMjZ" target="_blank" rel="noopener">Vines</a> – Poly by Google · <a href="https://poly.pizza/m/2q-hEEe3Njb" target="_blank" rel="noopener">Ranking plant</a> – Jakob Hippe · <a href="https://poly.pizza/m/2zt43AlwVoI" target="_blank" rel="noopener">grass mix</a> – Steve B · <a href="https://poly.pizza/m/6Tpj_vcWP3f" target="_blank" rel="noopener">Flying seagull</a>, <a href="https://poly.pizza/m/dpl7B31PqWX" target="_blank" rel="noopener">Parrot</a> – Poly by Google · <a href="https://poly.pizza/m/eLVv17bTyB-" target="_blank" rel="noopener">Pastel Plume Flowers</a> – Danni Bittman · <a href="https://poly.pizza/m/dYQFgjU5Eqx" target="_blank" rel="noopener">Desert marigold</a>, <a href="https://poly.pizza/m/eydI4__jXpi" target="_blank" rel="noopener">Flower</a>, <a href="https://poly.pizza/m/birD7XV2A44" target="_blank" rel="noopener">Water lilies</a> – Poly by Google · <a href="https://poly.pizza/m/2zT-C10njmX" target="_blank" rel="noopener">tulip 3</a> – Hugo Gibson · <a href="https://poly.pizza/m/7s3W1Ukbilm" target="_blank" rel="noopener">Nenuphar</a> – Nicolas Comtois (<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC-BY 3.0</a>)</p>
            </div>
          </Transition>
        </Teleport>
        <!-- Panel phải đang thu gọn: thẻ mép phải để mở lại, nằm trên cùng (chuông, tin nhắn, SOS dịch xuống). -->
        <button
          v-if="rightCollapsed"
          type="button"
          class="rail-expand"
          :title="t('dashboard.rightPanel.expand')"
          :aria-label="t('dashboard.rightPanel.expand')"
          @click="setRightCollapsed(false)"
        ><NavIcon name="arrowRight" /><span class="rail-label">{{ t('dashboard.rightPanel.expand') }}</span></button>
        <div class="col-right-stack">
          <!-- Hỗ trợ ưu tiên: card đỏ riêng, tách khỏi panel bên dưới -->
          <!-- Desktop: card thu vào nút SOS nổi cạnh chuông, bấm mới mở popup. Mobile giữ card như cũ
               (nút chuông/tin nhắn nổi bị ẩn trên mobile). -->
          <div v-if="showEmergencyBanner" class="card safety-card safety-card-inline">
            <span class="sb-badge">{{ t('dashboard.emergencyBanner.badge') }}</span>
            <p class="sb-desc">
              {{ t('dashboard.emergencyBanner.desc') }}
              <span v-if="emergencyReasonText" class="sb-reason">{{ t('dashboard.emergencyBanner.reasonPrefix') }} {{ emergencyReasonText }}</span>
            </p>
            <router-link to="/emergency" class="btn pf-btn-danger pf-btn-block">{{ t('dashboard.emergencyBanner.openBtn') }}</router-link>
          </div>


          <aside class="col-right rp">
          <!-- Desktop 2 cột: hàng đầu panel — thu gọn, SOS, chuông, tin nhắn (căn phải). -->
          <div class="rp-head">
            <div class="rp-actions">
              <button type="button" class="rp-collapse" :title="t('dashboard.rightPanel.collapse')" :aria-label="t('dashboard.rightPanel.collapse')" @click="setRightCollapsed(true)"><NavIcon name="arrowRight" /></button>
              <button v-if="showEmergencyBanner" type="button" class="rp-btn rp-sos" :title="t('dashboard.emergencyBanner.badge')" :aria-label="t('dashboard.emergencyBanner.badge')" @click="safetyPopupOpen = true">SOS</button>
              <button type="button" class="rp-btn" :class="{ 'is-open': notif.panelOpen }" data-notif-bell :title="t('notifPanel.title')" :aria-label="t('notifPanel.title')" @click="notif.togglePanel()">
                <NavIcon name="bell" />
                <span v-if="notif.unread > 0" class="rp-badge">{{ Math.min(notif.unread, 9) }}</span>
              </button>
              <button type="button" class="rp-btn" :class="{ 'is-open': chat.dropdownOpen }" data-chat-widget-btn :title="t('nav.messages')" :aria-label="t('nav.messages')" @click="chat.toggleDropdown()">
                <NavIcon name="messages" />
                <span v-if="chat.totalUnread > 0" class="rp-badge">{{ Math.min(chat.totalUnread, 9) }}</span>
              </button>
            </div>
          </div>

          <!-- Cấp độ: chữ bên trái, cảnh vườn phía sau bên phải -->
          <section class="rp-hero">
            <div class="rp-hero-art"></div>
            <div class="rp-hero-body">
              <div class="rp-level">{{ t('dashboard.rightPanel.levelLabel', { n: String(xpInfo.currentLevel).padStart(2, '0') }) }}</div>
              <h2 class="rp-hero-title">{{ xpInfo.title }}</h2>
              <p class="rp-hero-sub">{{ t('dashboard.rightPanel.heroSub') }}</p>
              <div class="rp-xp-track"><div class="rp-xp-fill" :style="{ width: xpInfo.percent + '%' }"></div></div>
              <p class="rp-xp-text"><strong>{{ xpInfo.xp }} / {{ xpInfo.maxXPLabel }}</strong> {{ t('dashboard.rightPanel.growthPoints') }}</p>
            </div>
          </section>

          <!-- Chuỗi thói quen -->
          <section class="rp-card">
            <div class="rp-card-head">
              <h3 class="rp-card-title">{{ t('dashboard.streak.ribbonTitle') }}</h3>
              <router-link to="/achievements" class="rp-card-link">
                <NavIcon name="flame" class="rp-flame" />{{ t('dashboard.streak.daysInRow', { n: stats.streak }) }}<NavIcon name="chevronRight" />
              </router-link>
            </div>
            <div class="rp-days">
              <div v-for="(day, idx) in streakRibbon" :key="idx" class="rp-day" :class="`st-${day.state}`">
                <span class="rp-day-label">{{ day.label }}</span>
                <span class="rp-day-dot"><NavIcon v-if="day.state === 'done' || day.state === 'today-done'" name="check" /></span>
              </div>
            </div>
          </section>

          <!-- Khu vườn tâm hồn -->
          <section class="rp-card rp-garden">
            <button type="button" class="rp-garden-art" :title="t('dashboard.rightPanel.gardenExpand')" :aria-label="t('dashboard.rightPanel.gardenExpand')" @click="gardenExpanded = true">
              <MoodGarden3D v-if="!gardenExpanded" :health="gardenViewHealth" :hour="gardenPreviewHour" :layout="gardenLayout" :memories="gardenSeenMemories" :lanterns="gardenLanterns" :label="`${t('dashboard.garden.title')}: ${gardenStatusText}`" />
              <span class="rp-garden-zoom"><NavIcon name="expand" /></span>
            </button>
            <div class="rp-garden-top">
              <h3 class="rp-card-title">{{ t('dashboard.garden.title') }}</h3>
              <router-link v-if="gardenMetrics.length" to="/report" class="rp-pill">
                <span class="rp-pill-sun"></span>{{ gardenStatusText }}<NavIcon name="chevronRight" />
              </router-link>
            </div>
            <div class="rp-overview">
              <div class="rp-overview-title">{{ t('dashboard.rightPanel.gardenOverview') }}</div>
              <div v-if="gardenMetrics.length" class="rp-overview-grid">
                <div v-for="metric in gardenMetrics" :key="metric.key" class="rp-metric" :class="`tone-${gardenDotClass(metric.status)}`">
                  <NavIcon :name="GARDEN_ICONS[metric.key] || 'mood'" class="rp-metric-icon" :class="`ic-${GARDEN_ICONS[metric.key] || 'mood'}`" />
                  <span class="rp-metric-label">{{ metric.label }}</span>
                  <strong class="rp-metric-value">{{ metric.status_text }}</strong>
                </div>
              </div>
              <p v-else class="rp-muted">{{ t('dashboard.garden.notEnough') }}</p>
            </div>
          </section>

          <!-- Phiên tư vấn sắp tới -->
          <section class="rp-card rp-expert">
            <svg class="rp-expert-art" viewBox="26 10 100 100" aria-hidden="true">
              <path d="M44 62 h44 v18 a22 22 0 0 1 -44 0 z" fill="#F4EBDD" stroke="#B89B7A" stroke-width="2" />
              <path d="M88 66 a9 9 0 0 1 0 16" stroke="#B89B7A" stroke-width="2" fill="none" />
              <ellipse cx="66" cy="104" rx="30" ry="5" fill="#E9DFCF" />
              <path d="M58 54 q-4 -8 0 -16 q4 -8 0 -16 M70 54 q-4 -8 0 -16 q4 -8 0 -16" stroke="#C9B9A4" stroke-width="2" fill="none" stroke-linecap="round" />
              <circle cx="100" cy="98" r="3" fill="#FFFFFF" /><circle cx="106" cy="104" r="2.5" fill="#F4C6C6" />
            </svg>
            <div class="rp-expert-body">
              <div class="rp-expert-eyebrow">{{ t('dashboard.expert.title') }}</div>
              <template v-if="expertSession">
                <h3 class="rp-expert-title">{{ expertSession.expert_name }}</h3>
                <p class="rp-muted">{{ expertTypeLabel }} · {{ expertTimeLabel }}</p>
              </template>
              <template v-else>
                <h3 class="rp-expert-title">{{ t('dashboard.expert.noSchedule') }}</h3>
                <p class="rp-muted">{{ noExpertHelperText }}</p>
              </template>
            </div>
            <router-link to="/experts" class="rp-btn-primary">{{ expertSession ? t('dashboard.expert.viewBtn') : t('dashboard.rightPanel.exploreExperts') }} <NavIcon name="arrowRight" /></router-link>
          </section>

          <!-- Ủng hộ PeaceFlow -->
          <section class="rp-card rp-donate">
            <span class="rp-donate-icon"><NavIcon name="heart" /></span>
            <div class="rp-donate-body">
              <h3 class="rp-card-title">{{ t('dashboard.donate.title') }}</h3>
              <p class="rp-muted">{{ t('dashboard.donate.desc') }}</p>
            </div>
            <button type="button" class="rp-btn-outline" @click="donate.openModal()">{{ t('dashboard.rightPanel.donateBtn') }} <NavIcon name="heart" /></button>
          </section>
          </aside>
        </div>
      </div>

      <div class="dash-quote">
        <p>{{ t('dashboard.quote') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { useDonateStore } from '../stores/donate';
import {
  escapeHtml, getLevelInfo, getLevelProgress, getRiskLabel, getRiskBadgeClass,
  buildStreakDays, renderChartSvg, buildRadarSvg, buildGardenTreesHtml
} from '../lib/dashboardHelpers';
import { MOOD_OPTIONS } from '../lib/moodCheckinOptions';
import { taskCardSrc } from '../lib/taskImages';
import NavIcon from '../components/NavIcon.vue';
import MoodGarden3D from '../components/MoodGarden3D.vue';
import { defineAsyncComponent } from 'vue';
// trang Check-in đầy đủ, nhúng trong Khu vườn tâm hồn (tải khi mở)
const MoodCheckinView = defineAsyncComponent(() => import('./MoodCheckinView.vue'));
import { createNatureSound } from '../lib/natureSound';
import { useNotificationsStore } from '../stores/notifications';
import { useChatWidgetStore } from '../stores/chatWidget';
import { useRightRailStore } from '../stores/rightRail';

// 5 mức cảm xúc đại diện (trong 7 mức thật của trang check-in) để hiện preview dạng hàng
// emoji trên dashboard — mức ở giữa (index 2) phóng to làm điểm nhấn, bấm vào hàng này đi
// thẳng sang trang check-in thật để chọn chính xác.
const CHECKIN_PREVIEW_MOODS = ['comfortable', 'normal', 'veryHappy', 'slightlyStressed', 'angry']
  .map((id) => MOOD_OPTIONS.find((m) => m.id === id));
const CHECKIN_CENTER_INDEX = 2;
// Icon đơn sắc (Material Symbols, đã khai báo sẵn trong icon_names ở index.html) thay emoji màu.
const MOOD_SYMBOLS = {
  comfortable: 'sentiment_calm',
  normal: 'sentiment_neutral',
  veryHappy: 'sentiment_very_satisfied',
  slightlyStressed: 'sentiment_stressed',
  angry: 'sentiment_frustrated'
};

const CHART_TABS = [
  { period: '7d', labelKey: 'dashboard.chart.tab7d' },
  { period: '30d', labelKey: 'dashboard.chart.tab30d' },
  { period: '3m', labelKey: 'dashboard.chart.tab3m' }
];

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const donate = useDonateStore();

const data = ref(null);
const chartPeriod = ref('7d');
const loading = ref(false);
const aiTasks = ref(null);
const insightMode = ref('server'); // 'server' | 'loading' | 'ai'
const insightNote = ref('');
const aiRecommendation = ref('');
const aiExercises = ref([]);
const currentTime = ref(Date.now());
let greetingTimer = null;

// Locale cho Intl.DateTimeFormat — 'vi' -> 'vi-VN', 'en' -> 'en-US'. Trước đây hardcode
// 'vi-VN' nên đổi ngôn ngữ app không đổi được cách hiển thị ngày giờ.
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || t('dashboard.defaultUserLabel'));
const isExpert = computed(() => Boolean(auth.user?.is_expert));
const isAdmin = computed(() => Boolean(auth.user?.role === 'admin' || auth.user?.is_admin));
const checkinPromptTitle = computed(() => {
  const hour = new Date(currentTime.value).getHours();
  const period = hour < 12 ? 'morningTitle' : hour < 18 ? 'afternoonTitle' : 'eveningTitle';
  return t(`dashboard.checkinPrompt.${period}`);
});

const progress = computed(() => data.value?.progress || null);
const summary = computed(() => data.value?.summary || null);
const safetyPopupOpen = ref(false);

// Panel phải thu gọn được (desktop 2 cột). Đang mở thì chuông / tin nhắn / SOS nằm trên đầu panel;
// thu gọn (hoặc màn hẹp) thì trở lại dạng thẻ bám mép phải màn hình.
const notif = useNotificationsStore();
const chat = useChatWidgetStore();
const rail = useRightRailStore();
const RIGHT_COLLAPSED_KEY = 'pf.dashboard.rightCollapsed';
function readRightCollapsed() {
  try { return localStorage.getItem(RIGHT_COLLAPSED_KEY) === '1'; } catch (_err) { return false; }
}
const rightCollapsed = ref(readRightCollapsed());
const gardenExpanded = ref(false);
// Âm thanh thiên nhiên khi xem khu vườn toàn màn hình — mặc định TẮT, nhớ lựa chọn của người dùng
const readSoundPref = () => { try { return localStorage.getItem('pf.garden.sound') === '1'; } catch { return false; } };
const gardenSoundOn = ref(readSoundPref());
// Tương tác với con vật trong vườn: phát tiếng (khi bật âm thanh), gợi ý "gọi con vật", bài cùng hít thở
const BREATH_ROUNDS = 3; const BREATH_IN = 4; const BREATH_HOLD = 2; const BREATH_OUT = 6; // giây — khớp nhịp phồng/xẹp của con vật (MoodGarden3D)
const gardenSelected = ref(null);
const gardenBreath = ref(null); // { animal, phase: 'out'|'in'|'hold', round, done }
let breathTimer = null; let breathStart = 0;
function tickGardenBreath() {
  const b = gardenBreath.value; if (!b) return;
  const el = (performance.now() - breathStart) / 1000 - 0.3; // 0.3s đầu: vòng tròn thu nhỏ để bắt đầu hít vào
  const cyc = BREATH_IN + BREATH_HOLD + BREATH_OUT;
  if (el >= cyc * BREATH_ROUNDS) {
    clearInterval(breathTimer); breathTimer = null;
    gardenBreath.value = { ...b, done: true, phase: 'out' };
    if (gardenSoundOn.value) natureSound?.voice('chime');
    setTimeout(() => { if (gardenBreath.value?.done) gardenBreath.value = null; }, 2600);
    return;
  }
  const s = Math.max(0, el) % cyc;
  b.phase = el < 0 ? 'out' : s < BREATH_IN ? 'in' : s < BREATH_IN + BREATH_HOLD ? 'hold' : 'out';
  b.round = Math.min(BREATH_ROUNDS, Math.floor(Math.max(0, el) / cyc) + 1);
}
function stopGardenBreath() { clearInterval(breathTimer); breathTimer = null; gardenBreath.value = null; }
function onGardenEvent(e) {
  if (e.type === 'editor-boost') { gardenGrowBoost.value = e.days; return; }
  if (e.type === 'ghost') { Object.assign(gardenGhost, { active: e.active, pending: e.pending, ok: e.ok, scale: e.scale }); return; }
  if (['layout-change', 'editor-select', 'editor-state', 'editor-notice'].includes(e.type)) { onGardenEditEvent(e); return; }
  if (['memory', 'lantern', 'wish', 'visitor'].includes(e.type)) { onGardenStoryEvent(e); return; }
  if (e.type === 'reveal') { gardenRevealing.value = e.on; if (e.on) { gardenCard.value = null; gardenCheckinOpen.value = false; } return; }
  if (e.type === 'memory-bloom') {
    showGardenCard({ kind: 'memory', color: MEMORY_COLORS[e.emotion] || '#E9DDBF', title: formatGardenDate(e.day), text: t('dashboard.garden.memory.felt', { emotion: emotionLabel(e.emotion) }) }, 3200);
    return;
  }
  if (e.type === 'voice') { if (gardenSoundOn.value) natureSound?.voice(e.kind); }
  else if (e.type === 'select') gardenSelected.value = e.animal;
  else if (e.type === 'deselect') gardenSelected.value = null;
  else if (e.type === 'breathe-start') {
    gardenSelected.value = null;
    gardenBreath.value = { animal: e.animal, phase: 'out', round: 1, done: false };
    breathStart = performance.now(); clearInterval(breathTimer); breathTimer = setInterval(tickGardenBreath, 150);
  }
}
/* Trang trí đảo: người dùng tự dời / cất đồ có sẵn và thêm đồ từ kho (cây, bụi, hoa, cỏ, đá, con vật).
   Lưu lên server theo tài khoản (chỉ phần khác so với đảo mặc định, vài KB). */
const GARDEN_EDIT_GROUPS = ['tree', 'bush', 'flower', 'grass', 'stone', 'decor', 'path', 'grow', 'animal'];
const GARDEN_BRUSH_GROUPS = ['tree', 'bush', 'flower', 'grass', 'stone']; // nhóm dùng được cọ trồng
const GARDEN_PATH_KINDS = [{ key: 'stone', color: '#DCCFB6' }, { key: 'gravel', color: '#C9BBA0' }];
const gardenBrushOn = ref(false);
const gardenGhost = reactive({ active: false, pending: false, ok: false, scale: 1 }); // bóng mờ ướm vị trí
const gardenTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
const gardenTrimOn = ref(false); // chế độ kéo tỉa: chạm cây nào tỉa cây đó
const gardenEraseOn = ref(false); // cục tẩy: chạm món nào xoá món đó
function toggleGardenErase() {
  gardenEraseOn.value = !gardenEraseOn.value;
  if (gardenEraseOn.value) { gardenTrimOn.value = false; gardenEditTool.value = null; }
  gardenSceneRef.value?.editor.setEraseMode(gardenEraseOn.value);
}
function clearGardenAll() {
  if (!window.confirm(t('dashboard.garden.editor.clearAllConfirm'))) return;
  gardenSceneRef.value?.editor.clearAll();
}
function toggleGardenTrim() {
  gardenTrimOn.value = !gardenTrimOn.value;
  if (gardenTrimOn.value) { gardenEraseOn.value = false; gardenEditTool.value = null; }
  gardenSceneRef.value?.editor.setTrimMode(gardenTrimOn.value);
}
const gardenGrowBoost = ref(0); // admin: số ngày đang tua nhanh (xem thử)
function toggleGardenBrush() { gardenBrushOn.value = !gardenBrushOn.value; gardenSceneRef.value?.editor.setBrush(gardenBrushOn.value); }
const gardenSceneRef = ref(null);
const gardenLayout = ref(null);
const gardenEditing = ref(false);
const gardenEditGroup = ref('tree');
const gardenEditTool = ref(null);
const gardenEditSel = ref(null);
const gardenEditState = reactive({ canUndo: false, edited: false, pathOpen: false });
const gardenEditNotice = ref('');
const gardenThumbs = reactive({});
const gardenSaveState = ref('idle'); // idle | saving | saved | error
const gardenCatalog = ref([]);
let gardenSaveTimer = null; let gardenNoticeTimer = null;
const gardenEditItems = computed(() => gardenCatalog.value.filter((c) => c.group === gardenEditGroup.value));
const gardenEditHint = computed(() => {
  if (gardenEraseOn.value) return t('dashboard.garden.editor.hintErase');
  if (gardenTrimOn.value) return t('dashboard.garden.editor.hintTrim');
  if (gardenEditTool.value?.startsWith('path:')) return t(gardenEditState.pathOpen ? 'dashboard.garden.editor.hintPathMore' : 'dashboard.garden.editor.hintPath');
  if (gardenEditTool.value && gardenBrushOn.value && GARDEN_BRUSH_GROUPS.includes(gardenEditGroup.value)) return t('dashboard.garden.editor.hintBrush', { item: t(`dashboard.garden.editor.items.${gardenEditTool.value}`) });
  if (gardenEditTool.value) return t(gardenTouch ? 'dashboard.garden.editor.hintToolTouch' : 'dashboard.garden.editor.hintTool', { item: t(`dashboard.garden.editor.items.${gardenEditTool.value}`) });
  if (gardenEditSel.value?.grow?.aging) return t(`dashboard.garden.editor.age_${gardenEditSel.value.grow.stage}`, { n: gardenEditSel.value.grow.n });
  if (gardenEditSel.value?.grow) return t(`dashboard.garden.editor.grow_${gardenEditSel.value.grow.stage}`, { n: gardenEditSel.value.grow.n });
  if (gardenEditSel.value) return t('dashboard.garden.editor.hintSelected');
  return t('dashboard.garden.editor.hintIdle');
});
function loadGardenThumbs() {
  if (gardenEditGroup.value === 'path') return;
  gardenEditItems.value.forEach((item) => {
    if (gardenThumbs[item.key]) return;
    gardenSceneRef.value?.editor.thumb(item.key)?.then?.((url) => { if (url) gardenThumbs[item.key] = url; });
  });
}
function setGardenEditGroup(grp) { gardenEditGroup.value = grp; pickGardenTool(null); loadGardenThumbs(); }
function pickGardenTool(key) {
  if (key) { gardenTrimOn.value = false; gardenEraseOn.value = false; }
  gardenEditTool.value = key && gardenEditTool.value !== key ? key : null; // bấm lại món đang chọn → bỏ chọn
  gardenSceneRef.value?.editor.setTool(gardenEditTool.value);
}
function enterGardenEditor() {
  stopGardenBreath(); gardenSelected.value = null; gardenCreditOpen.value = false;
  gardenEditing.value = true; lanternOpen.value = false; gardenCheckinOpen.value = false; gardenCard.value = null;
  gardenSceneRef.value?.editor.enter();
  gardenCatalog.value = gardenSceneRef.value?.editor.catalog() || [];
  loadGardenThumbs();
}
function exitGardenEditor() {
  gardenGrowBoost.value = 0; gardenTrimOn.value = false; gardenEraseOn.value = false; gardenGhost.active = false;
  gardenEditing.value = false; gardenEditTool.value = null; gardenEditSel.value = null;
  gardenSceneRef.value?.editor.exit();
  if (gardenSaveTimer) { clearTimeout(gardenSaveTimer); saveGardenLayout(); } // lưu ngay phần còn chờ
}
function resetGardenLayout() {
  if (!window.confirm(t('dashboard.garden.editor.resetConfirm'))) return;
  gardenSceneRef.value?.editor.reset();
}
async function saveGardenLayout() {
  gardenSaveTimer = null;
  gardenSaveState.value = 'saving';
  try {
    await apiClient.put('/garden/layout', { layout: gardenLayout.value });
    gardenSaveState.value = 'saved';
  } catch (_e) {
    gardenSaveState.value = 'error';
  }
}
async function loadGardenLayout() {
  try {
    const data = await apiClient.get('/garden/layout', { noCache: true });
    if (data?.layout) gardenLayout.value = data.layout;
    if (!gardenLayout.value?.gs) { // lần đầu: mốc bắt đầu tính cây mọc rậm theo ngày check-in
      const d = new Date(); const gs = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      gardenLayout.value = { v: 1, removed: [], moved: {}, added: [], paths: [], trims: {}, ...(gardenLayout.value || {}), gs };
      void saveGardenLayout();
    }
  } catch (_e) { /* chưa có / lỗi mạng → đảo mặc định */ }
}
function onGardenEditEvent(e) {
  if (e.type === 'layout-change') {
    gardenLayout.value = e.layout;
    gardenSaveState.value = 'saving';
    clearTimeout(gardenSaveTimer); gardenSaveTimer = setTimeout(saveGardenLayout, 900); // gộp nhiều thao tác liền nhau thành 1 lần lưu
  } else if (e.type === 'editor-select') {
    gardenEditSel.value = e.id ? e : null;
  } else if (e.type === 'editor-state') {
    gardenEditState.canUndo = e.canUndo; gardenEditState.edited = e.edited; gardenEditState.pathOpen = !!e.pathOpen;
  } else if (e.type === 'editor-notice') {
    gardenEditNotice.value = t(`dashboard.garden.editor.notice_${e.code}`, { max: e.max });
    clearTimeout(gardenNoticeTimer); gardenNoticeTimer = setTimeout(() => { gardenEditNotice.value = ''; }, 2600);
  }
}
/* Vườn ký ức (hoa theo check-in tâm trạng) · Đèn lồng biết ơn · Sao băng · Khách ghé thăm */
const gardenMemories = ref([]);
// Hoa ký ức "đã thấy": hoa mới (check-in ở trang khác) chưa hiện ở thẻ nhỏ — chỉ nở khi mở vườn lên
const memSeenKey = () => `pf.garden.memSeen.${auth.user?.id || 'me'}`;
const readMemSeen = () => { try { return JSON.parse(localStorage.getItem(memSeenKey())) || null; } catch { return null; } };
const gardenMemSeen = ref(readMemSeen());
const gardenRevealReady = ref(false); const gardenRevealing = ref(false);
let gardenRevealTimer = null;
const gardenSeenMemories = computed(() => {
  const seen = gardenMemSeen.value;
  if (!seen) return gardenMemories.value;
  return gardenMemories.value
    .filter((m) => m.day <= seen.day)
    .map((m) => (m.day === seen.day ? { ...m, emotion: seen.emotion, score: seen.score } : m));
});
function markMemoriesSeen() {
  const last = gardenMemories.value[gardenMemories.value.length - 1];
  if (!last) return;
  gardenMemSeen.value = { day: last.day, emotion: last.emotion, score: last.score };
  try { localStorage.setItem(memSeenKey(), JSON.stringify(gardenMemSeen.value)); } catch { /* bỏ qua */ }
}
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const gardenTodayMemory = computed(() => {
  const last = gardenMemories.value[gardenMemories.value.length - 1];
  return last && last.day === todayKey() ? last : null;
});
const gardenLanterns = ref([]);
const gardenCard = ref(null); // { kind, title, text, color }
const gardenLanternBubble = ref(null); // { id, title, text } — lời nhắn bám theo đèn lồng
let lanternBubbleTimer = null;
function showLanternBubble(b, ms = 9000) {
  gardenCard.value = null; gardenLanternBubble.value = b;
  clearTimeout(lanternBubbleTimer); lanternBubbleTimer = setTimeout(() => { gardenLanternBubble.value = null; }, ms);
}
let gardenCardTimer = null;
const lanternOpen = ref(false); const lanternText = ref(''); const lanternSending = ref(false); const lanternError = ref('');
const lanternInput = ref(null);
const MEMORY_COLORS = { 'Rất vui': '#FFD54A', 'Thoải mái': '#86D49B', 'Bình thường': '#E9DDBF', 'Hơi căng': '#F7B98B', 'Rất căng thẳng': '#EE9C9C', 'Buồn bã': '#B7A6EE', 'Tức giận': '#E9806A' };
function showGardenCard(card, ms = 6000) {
  gardenCard.value = card;
  clearTimeout(gardenCardTimer); gardenCardTimer = setTimeout(() => { gardenCard.value = null; }, ms);
}
const formatGardenDate = (d) => {
  const dt = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString(intlLocale.value, { day: 'numeric', month: 'long', year: 'numeric' });
};
function emotionLabel(vi) {
  const opt = MOOD_OPTIONS.find((o) => o.viLabel === vi);
  return opt ? t(opt.labelKey) : (vi || t('dashboard.garden.memory.unknown'));
}
async function loadGardenMemories() {
  try {
    const d = await apiClient.get('/garden/memories', { noCache: true }); gardenMemories.value = d?.memories || [];
    if (!gardenMemSeen.value) markMemoriesSeen(); // lần đầu: coi như đã thấy hết (không cho cả vườn nở lại)
    else if (gardenExpanded.value && gardenRevealReady.value && !gardenCheckinOpen.value) markMemoriesSeen(); // đang mở vườn: hoa mới nở ngay trước mắt
  } catch (_e) { /* giữ nguyên */ }
}
async function loadGardenLanterns() {
  try { const d = await apiClient.get('/garden/lanterns', { noCache: true }); gardenLanterns.value = d?.lanterns || []; } catch (_e) { /* giữ nguyên */ }
}
// Check-in ngay trong vườn: nhúng nguyên trang Check-in (đủ các bước, cùng API) — lưu xong, đóng lại là hoa ký ức nở
const gardenCheckinOpen = ref(false); const gardenCheckinSaved = ref(false);
function openGardenCheckin() {
  gardenCheckinOpen.value = !gardenCheckinOpen.value; gardenCheckinSaved.value = false;
  if (gardenCheckinOpen.value) { lanternOpen.value = false; gardenCard.value = null; }
}
function onGardenCheckinSaved() {
  gardenCheckinSaved.value = true; gardenPreview.value = null; // đang xem thử mức vườn (admin) → về thực tế để thấy thay đổi
  if (gardenSoundOn.value) natureSound?.voice('chime');
}
function closeGardenCheckin() {
  gardenCheckinOpen.value = false;
  if (gardenCheckinSaved.value) { gardenCheckinSaved.value = false; void loadGardenMemories().then(() => markMemoriesSeen()); } // hoa mới nở ngay
}
function openLantern() {
  lanternOpen.value = !lanternOpen.value; lanternError.value = '';
  if (lanternOpen.value) gardenCheckinOpen.value = false;
  if (lanternOpen.value) setTimeout(() => lanternInput.value?.focus(), 50);
}
async function sendLantern() {
  const text = lanternText.value.trim();
  if (!text || lanternSending.value) return;
  lanternSending.value = true; lanternError.value = '';
  try {
    const d = await apiClient.post('/garden/lanterns', { text });
    if (d?.lantern) gardenLanterns.value = [...gardenLanterns.value, d.lantern].slice(-12);
    if (d?.lantern) setTimeout(() => showLanternBubble({ id: d.lantern.id, title: t('dashboard.garden.lantern.sent'), text }, 7000), 400); // đi theo chiếc đèn vừa thả
    lanternText.value = ''; lanternOpen.value = false;
    if (gardenSoundOn.value) natureSound?.voice('lantern');
  } catch (_e) {
    lanternError.value = t('dashboard.garden.lantern.error');
  } finally {
    lanternSending.value = false;
  }
}
function onGardenStoryEvent(e) {
  if (e.type === 'memory') {
    showGardenCard({ kind: 'memory', color: MEMORY_COLORS[e.emotion] || '#E9DDBF', title: formatGardenDate(e.day), text: t('dashboard.garden.memory.felt', { emotion: emotionLabel(e.emotion) }) });
  } else if (e.type === 'lantern') {
    showLanternBubble({ id: e.id, title: t('dashboard.garden.lantern.cardTitle', { date: formatGardenDate(e.date) }), text: e.text });
  } else if (e.type === 'wish') {
    showGardenCard({ kind: 'wish', title: t('dashboard.garden.wish.title'), text: t(`dashboard.garden.wish.w${e.n}`) }, 7000);
  } else if (e.type === 'visitor') {
    if (!gardenEditing.value && !gardenBreath.value) showGardenCard({ kind: 'visitor', title: t('dashboard.garden.visitor', { animal: t(`dashboard.garden.animals.${e.animal}`) }) }, 3500);
  }
}
const gardenCreditOpen = ref(false); // nguồn mô hình 3D: ẩn, bấm nút "i" mới hiện
watch(gardenExpanded, (v) => {
  clearTimeout(gardenRevealTimer); gardenRevealReady.value = false; gardenRevealing.value = false;
  if (v) gardenRevealTimer = setTimeout(() => { gardenRevealReady.value = true; markMemoriesSeen(); }, 1100); // mở vườn xong mới cho hoa mới nở
});
watch(gardenExpanded, (v) => { if (!v) { gardenLanternBubble.value = null; lanternOpen.value = false; gardenCheckinOpen.value = false; gardenCard.value = null; if (gardenEditing.value) exitGardenEditor(); gardenCreditOpen.value = false; gardenSelected.value = null; stopGardenBreath(); } });
let natureSound = null;
const gardenHourNow = () => { const d = new Date(); return gardenPreviewHour.value ?? d.getHours() + d.getMinutes() / 60; };
function syncNatureSound() {
  const want = gardenExpanded.value && gardenSoundOn.value;
  if (want) {
    natureSound = natureSound || createNatureSound();
    natureSound.setMood(gardenViewHealth.value); natureSound.setHour(gardenHourNow());
    natureSound.start();
  } else natureSound?.stop();
}
watch([gardenExpanded, gardenSoundOn], () => {
  try { localStorage.setItem('pf.garden.sound', gardenSoundOn.value ? '1' : '0'); } catch { /* bỏ qua */ }
  syncNatureSound();
});
// Xem thử các mức khu vườn (null = theo dữ liệu thật của người dùng)
const gardenPreview = ref(null);
// xem thử buổi trong ngày (null = giờ thật)
const gardenPreviewHour = ref(null);
const GARDEN_PREVIEW_HOURS = [
  { key: 'real', value: null, label: 'dashboard.rightPanel.previewReal' },
  { key: 'morning', value: 6.8, label: 'dashboard.rightPanel.timeMorning' },
  { key: 'noon', value: 12.5, label: 'dashboard.rightPanel.timeNoon' },
  { key: 'evening', value: 18, label: 'dashboard.rightPanel.timeEvening' },
  { key: 'night', value: 22, label: 'dashboard.rightPanel.timeNight' }
];
const GARDEN_PREVIEW_LEVELS = [
  { key: 'real', value: null, label: 'dashboard.rightPanel.previewReal' },
  { key: 'thriving', value: 0.95, label: 'dashboard.rightPanel.previewThriving' },
  { key: 'stable', value: 0.7, label: 'dashboard.rightPanel.previewStable' },
  { key: 'attention', value: 0.42, label: 'dashboard.rightPanel.previewAttention' },
  { key: 'care', value: 0.12, label: 'dashboard.rightPanel.previewCare' }
];
function onGardenKey(e) {
  if (gardenEditing.value && gardenGhost.active && !/^(INPUT|TEXTAREA)$/.test(e.target?.tagName || '')) {
    const ed = gardenSceneRef.value?.editor;
    if (e.key === 'r' || e.key === 'R') { ed?.ghostRotate(e.shiftKey ? -1 : 1); e.preventDefault(); return; }
    if (e.key === 'f' || e.key === 'F') { ed?.ghostFlip(); e.preventDefault(); return; }
    if (e.key === '+' || e.key === '=') { ed?.ghostScale(1); e.preventDefault(); return; }
    if (e.key === '-' || e.key === '_') { ed?.ghostScale(-1); e.preventDefault(); return; }
    if (e.key === 'Enter') { ed?.placeGhost(); e.preventDefault(); return; }
  }
  if (e.key !== 'Escape') return;
  if (gardenCheckinOpen.value) gardenCheckinOpen.value = false;
  else if (lanternOpen.value) lanternOpen.value = false;
  else if (gardenEditing.value) exitGardenEditor();
  else if (gardenBreath.value) stopGardenBreath(); else gardenExpanded.value = false; // Esc: dừng bài thở trước, lần nữa mới đóng
}
watch(gardenExpanded, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) window.addEventListener('keydown', onGardenKey);
  else window.removeEventListener('keydown', onGardenKey);
});
onBeforeUnmount(() => { window.removeEventListener('keydown', onGardenKey); document.body.style.overflow = ''; });
const wideLayout = ref(false);
let wideQuery = null;
function syncRailDock() {
  rail.docked = wideLayout.value && !rightCollapsed.value;
  document.documentElement.style.setProperty('--rail-shift', wideLayout.value && rightCollapsed.value ? '38px' : '0px');
}
function onWideChange(event) {
  wideLayout.value = event.matches;
  syncRailDock();
}
function setRightCollapsed(value) {
  rightCollapsed.value = value;
  try { localStorage.setItem(RIGHT_COLLAPSED_KEY, value ? '1' : '0'); } catch (_err) { /* bỏ qua */ }
  notif.closePanel?.();
  chat.closeDropdown?.();
  syncRailDock();
}
onMounted(() => {
  wideQuery = window.matchMedia('(min-width: 1101px)');
  wideLayout.value = wideQuery.matches;
  wideQuery.addEventListener('change', onWideChange);
  syncRailDock();
});
onBeforeUnmount(() => {
  wideQuery?.removeEventListener('change', onWideChange);
  rail.docked = false;
  document.documentElement.style.removeProperty('--rail-shift');
});
const showEmergencyBanner = computed(() => Boolean(summary.value?.show_emergency_banner));
const emergencyReasonText = computed(() => {
  const reason = summary.value?.emergency_reason;
  if (!reason?.code) return '';
  return t(`dashboard.emergencyBanner.reasons.${reason.code}`, reason.params || {});
});
const isNewUser = computed(() => Boolean(data.value) && !data.value.latest_mood && (progress.value?.total_xp ?? 0) === 0);

const stats = computed(() => {
  const p = progress.value;
  const mood = data.value?.latest_mood;
  const s = summary.value;

  const hasMood = mood?.mood_score !== undefined && mood?.mood_score !== null;
  const streak = p?.current_streak ?? p?.streak ?? 0;
  const weeklyTasks = p?.weekly_tasks_completed ?? 0;
  const anxietyAverage = s?.anxiety_average_14d;
  const hasAnxiety = anxietyAverage !== null && anxietyAverage !== undefined;

  return {
    mood: hasMood ? mood.mood_score : '--',
    moodTrend: hasMood ? t('dashboard.stats.moodTrendHas') : t('dashboard.stats.moodTrendNone'),
    moodColor: hasMood ? 'var(--mint-dark)' : 'var(--text-light)',
    streak,
    streakTrend: streak > 0 ? t('dashboard.stats.streakTrendHas') : t('dashboard.stats.streakTrendNone'),
    streakColor: streak > 0 ? 'var(--peach-dark)' : 'var(--text-light)',
    tasks: weeklyTasks,
    tasksTrend: weeklyTasks > 0 ? t('dashboard.stats.tasksTrendHas', { n: weeklyTasks }) : t('dashboard.stats.tasksTrendNone'),
    tasksColor: weeklyTasks > 0 ? 'var(--sky)' : 'var(--text-light)',
    anxiety: hasAnxiety ? anxietyAverage : '--',
    anxietyTrend: hasAnxiety ? t('dashboard.stats.anxietyTrendHas') : t('dashboard.stats.anxietyTrendNone'),
    anxietyColor: hasAnxiety ? 'var(--lavender)' : 'var(--text-light)'
  };
});

const chartSvgHtml = computed(() => renderChartSvg(data.value?.mood_chart?.[chartPeriod.value], t('dashboard.chart.noDataToDraw')));
const chartLabels = computed(() => (data.value?.mood_chart?.[chartPeriod.value]?.points || []).map((p) => escapeHtml(p.label || '--')));

const insightTitle = computed(() => {
  if (insightMode.value === 'loading') return t('dashboard.insight.analyzing');
  if (insightMode.value === 'ai') return t('dashboard.insight.adviceFrom');
  // data.value?.insight?.title là NHẬN XÉT DO BACKEND/AI SINH RA (tiếng Việt) — chưa nằm
  // trong phạm vi đợt dịch tĩnh này, chỉ dịch phần fallback khi backend chưa có insight.
  return data.value?.insight?.title || t('dashboard.insight.defaultTitle');
});
const insightBadge = computed(() => (insightMode.value === 'ai' || insightMode.value === 'loading' ? 'AI' : 'DB'));
const insightTags = computed(() => {
  if (insightMode.value !== 'server') return [];
  const tags = data.value?.insight?.tags;
  const classes = ['badge-mint', 'badge-peach', 'badge-lavender'];
  if (tags?.length) return tags.map((tag, i) => ({ text: tag, cls: classes[i % classes.length] }));
  return [{ text: t('dashboard.insight.waitingData'), cls: 'badge-mint' }];
});
const insightBodyHtml = computed(() => {
  if (insightMode.value === 'loading') return t('dashboard.insight.loadingAdvice');
  if (insightMode.value === 'ai') {
    // aiRecommendation là nội dung PeaceCat AI SINH RA (tiếng Việt) — ngoài phạm vi đợt dịch
    // tĩnh này, xem ai.service.js. Danh sách bài tập không nằm ở đây mà hiện một lần duy nhất
    // trong suggestionList (kèm nút thực hiện) để không lặp lại.
    return escapeHtml(aiRecommendation.value);
  }
  return escapeHtml(data.value?.insight?.body || t('dashboard.insight.noAnalysis')).replace(/\n/g, '<br>');
});

function handleInsightClick(event) {
  const link = event.target.closest('[data-task-id]');
  if (!link) return;
  router.push({ path: '/task-detail', query: { id: link.getAttribute('data-task-id') } });
}

// Backend (report.routes.js) trả `label`/`status_text` bằng tiếng Việt cứng — đây là bản
// đồ trạng thái TĨNH (key cố định 'emotion'/'energy'/... và status 'excellent'/'good'/...),
// không phải nội dung AI sinh tự do, nên dịch được. Bỏ qua 2 field đó, tự dịch lại từ
// `metric.key`/`metric.status` (backend đã gửi kèm) để khớp ngôn ngữ đang chọn — nếu không
// tiêu đề card đã dịch nhưng nội dung bên trong vẫn tiếng Việt, nhìn dịch nửa vời.
function translateMetric(metric) {
  return {
    ...metric,
    label: t(`dashboard.garden.metrics.${metric.key}`),
    status_text: t(`dashboard.garden.status.${metric.status}`)
  };
}

const radarMetrics = computed(() => (data.value?.wellness?.radar || []).map(translateMetric));
const radarSvgHtml = computed(() => buildRadarSvg(radarMetrics.value));

const gardenMetrics = computed(() => (data.value?.wellness?.garden || []).map(translateMetric));
const gardenTreesHtml = computed(() => buildGardenTreesHtml(gardenMetrics.value));
const riskLevel = computed(() => summary.value?.risk_level);
const riskLabel = computed(() => getRiskLabel(riskLevel.value, t));
const riskBadgeClass = computed(() => getRiskBadgeClass(riskLevel.value));

const xpInfo = computed(() => {
  const p = progress.value;
  const xp = p?.xp ?? 0;
  const levelInfo = p?.level_info || getLevelInfo(xp);
  const percent = levelInfo?.progress_percent ?? getLevelProgress(xp);
  const currentLevel = p?.level ?? p?.current_level ?? levelInfo.level;
  const maxXP = levelInfo?.maxXP ?? levelInfo.maxXP;
  const minXP = levelInfo?.minXP ?? levelInfo.minXP;
  const xpToNext = levelInfo?.xp_to_next ?? (maxXP === Infinity ? 0 : Math.max(0, maxXP - xp));
  const nextLabel = maxXP === Infinity
    ? t('dashboard.levels.maxLevel')
    : t('dashboard.levels.nextLevel', { xp: xpToNext, level: currentLevel + 1 });
  // levelInfo.title là dữ liệu BACKEND trả về (progress?.level_info, tiếng Việt) khi có;
  // chỉ khi rơi về fallback cục bộ (getLevelInfo) mới dùng labelKey tự dịch được.
  const title = levelInfo.title || (levelInfo.labelKey ? t(levelInfo.labelKey) : t('dashboard.levels.defaultTitle'));
  return { xp, currentLevel, title, minXP, maxXPLabel: maxXP === Infinity ? '∞' : maxXP, percent, nextLabel };
});

const streakDays = computed(() => buildStreakDays(stats.value.streak, locale.value));

const challenge = computed(() => data.value?.challenge || null);

const expertSession = computed(() => data.value?.expert_session || null);
const expertStatus = computed(() => {
  const statusMap = {
    pending: { label: t('dashboard.expert.statusPending'), color: 'var(--color-caution)', bg: 'var(--color-caution-soft)' },
    confirmed: { label: t('dashboard.expert.statusConfirmed'), color: 'var(--color-brand)', bg: 'var(--color-brand-soft)' }
  };
  return statusMap[expertSession.value?.status] || statusMap.confirmed;
});
const expertTypeLabel = computed(() => {
  const typeMap = {
    chat: t('dashboard.expert.typeChat'),
    voice: t('dashboard.expert.typeVoice'),
    video: t('dashboard.expert.typeVideo'),
    inperson: t('dashboard.expert.typeInPerson')
  };
  return typeMap[expertSession.value?.session_type] || expertSession.value?.session_type || t('dashboard.expert.typeDefault');
});
const expertTimeLabel = computed(() => {
  if (!expertSession.value) return '';
  try {
    return new Intl.DateTimeFormat(intlLocale.value, {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
    }).format(new Date(expertSession.value.starts_at));
  } catch (_e) {
    return expertSession.value.starts_at;
  }
});
const noExpertHelperText = computed(() => (
  ['high', 'critical'].includes(summary.value?.risk_level)
    ? t('dashboard.expert.helperHighRisk')
    : t('dashboard.rightPanel.expertHint')
));

const recommendedTasks = computed(() => aiTasks.value || data.value?.tasks || []);

// --- Chỉ phục vụ hiển thị (bố cục mới) ---
const moodButtons = computed(() => CHECKIN_PREVIEW_MOODS.map((mood) => ({
  ...mood,
  label: t(mood.labelKey)
})));
// Thẻ "Bài tập gợi ý" trong card PeaceCat: lấy nhiệm vụ đầu tiên đang được đề xuất.
// Danh sách nhiệm vụ duy nhất của Dashboard: bài AI chọn (kèm lý do) nếu có, nếu không thì các
// nhiệm vụ hệ thống đề xuất. Tối đa 4 thẻ (2 hàng × 2) để không dài trang.
const suggestionList = computed(() => {
  const list = insightMode.value === 'ai' && aiExercises.value.length ? aiExercises.value : recommendedTasks.value;
  return list.slice(0, 4);
});
// Ảnh nhiệm vụ lỗi (thiếu file) thì ẩn ảnh, giữ khung màu nền.
const brokenThumbs = reactive(new Set());
// Mẫu số của KPI "Nhiệm vụ tuần" lấy từ mục tiêu tuần thật (nếu có), không tự đặt cứng.
const weeklyGoal = computed(() => challenge.value?.goal ?? null);

function taskBadge(task) {
  if (String(task.category || '').toLowerCase() === 'emergency') return { text: t('dashboard.tasks.badgePriority'), cls: 'tb-priority' };
  const level = String(task.difficulty || 'easy').toLowerCase();
  if (level === 'hard') return { text: t('dashboard.tasks.badgeHard'), cls: 'tb-hard' };
  if (level === 'medium') return { text: t('dashboard.tasks.badgeMedium'), cls: 'tb-medium' };
  return { text: t('dashboard.tasks.badgeEasy'), cls: 'tb-easy' };
}

// buildStreakDays chỉ đánh dấu ngày đã làm/hôm nay; tách thêm ngày đã qua (bỏ lỡ) và ngày
// sắp tới để vẽ đúng 3 trạng thái của dải chuỗi thói quen.
const streakRibbon = computed(() => {
  const todayIndex = new Date().getDay();
  return streakDays.value.map((day, index) => {
    const isToday = day.className.includes('today');
    const isDone = day.className.includes('done');
    let state = index < todayIndex ? 'missed' : 'upcoming';
    if (isDone) state = 'done';
    if (isToday) state = isDone ? 'today-done' : 'today';
    return { ...day, state };
  });
});

// Icon đơn sắc cho 4 chỉ số khu vườn (key do backend gửi: emotion, sleep, calm, consistency).
const GARDEN_ICONS = { emotion: 'mood', calm: 'lotus', sleep: 'moon', consistency: 'bolt', energy: 'bolt', clarity: 'lotus' };
const gardenStatusText = computed(() => {
  const good = gardenMetrics.value.filter((m) => m.status === 'excellent' || m.status === 'good').length;
  if (good >= 3) return t('dashboard.rightPanel.gardenThriving');
  if (good >= 2) return t('dashboard.rightPanel.gardenGrowing');
  return t('dashboard.rightPanel.gardenNeedsCare');
});
const gardenViewHealth = computed(() => (gardenPreview.value ?? gardenVitality.value));
/* Sức sống của vườn (0..1) — theo XU HƯỚNG tâm trạng 7 ngày, nhẹ nhàng với người dùng:
   - đi qua từng ngày (cũ → mới): có check-in thì tiến dần tới điểm hôm đó; LÊN NHANH (60%), XUỐNG CHẬM (35%,
     tối đa −0.15/ngày) → một ngày buồn không làm cả vườn úa ngay
   - ngày không check-in: trôi nhẹ về mức trung bình 0.55 (không bị trừ)
   - pha 30% các chỉ số hiện tại (giấc ngủ, bình tĩnh, nhịp độ)
   - không bao giờ dưới 0.15: vườn luôn còn sức sống, chỉ "đang chờ được chăm" */
const gardenVitality = computed(() => {
  const pts = data.value?.mood_chart?.['7d']?.points || [];
  let v = 0.55;
  for (const p of pts) {
    if (p.value === null || p.value === undefined) { v += (0.55 - v) * 0.15; continue; }
    const delta = Math.min(1, Math.max(0, Number(p.value) / 10)) - v;
    v += delta > 0 ? delta * 0.6 : Math.max(delta * 0.35, -0.15);
  }
  const blended = gardenMetrics.value.length ? v * 0.7 + gardenHealth.value * 0.3 : v;
  return Math.min(1, Math.max(0.15, blended));
});
// Độ khoẻ khu vườn 0..1 = trung bình các chỉ số (thang 0–10 từ backend); chưa có dữ liệu thì để mức giữa.
const GARDEN_STATUS_SCORE = { excellent: 0.95, good: 0.7, fair: 0.45, 'needs-care': 0.2 };
const gardenHealth = computed(() => {
  const scores = gardenMetrics.value
    .map((m) => (typeof m.value === 'number' ? m.value / 10 : GARDEN_STATUS_SCORE[m.status]))
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!scores.length) return 0.55;
  return Math.min(1, Math.max(0, scores.reduce((a, b) => a + b, 0) / scores.length));
});
// âm thanh thiên nhiên theo sức sống & buổi (đặt sau khi gardenViewHealth, gardenVitality, gardenHealth đã khai báo)
watch(() => [gardenViewHealth.value, gardenPreviewHour.value], () => {
  if (!natureSound) return;
  natureSound.setMood(gardenViewHealth.value); natureSound.setHour(gardenHourNow());
});
onBeforeUnmount(() => { natureSound?.stop(); clearInterval(breathTimer); if (gardenSaveTimer) { clearTimeout(gardenSaveTimer); saveGardenLayout(); } });

function gardenDotClass(status) {
  if (status === 'excellent' || status === 'good') return 'dot-primary';
  if (status === 'fair' || status === 'needs-care') return 'dot-amber';
  return 'dot-muted';
}

function switchChart(period) {
  chartPeriod.value = period;
}

function syncUser(user) {
  const current = auth.user || {};
  const isSameUser = current.id && user.id ? current.id === user.id : true;
  const merged = isSameUser ? { ...current, ...user } : { ...user };
  if (merged.display_name && (!merged.full_name || merged.full_name === current.full_name)) {
    merged.full_name = merged.display_name;
  }
  auth.setSession({ user: merged });
}

// Ghi lại vào localStorage để trang Nhiệm vụ tô sáng đúng các bài AI vừa gợi ý.
function cacheInsightForTasksPage(recommendation, exercises) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const userId = data.value?.user?.id || auth.user?.id || 'guest';
  try {
    localStorage.setItem(
      `peaceflow_ai_insight_${userId}_${today}`,
      JSON.stringify({ recommendation, exercises })
    );
  } catch (_e) { /* hết dung lượng localStorage thì bỏ qua */ }
}

function applyInsight(res) {
  const recommendation = res?.summary || '';
  const exercises = Array.isArray(res?.exercises) ? res.exercises : [];
  if (!recommendation && !exercises.length) return false;

  aiRecommendation.value = recommendation;
  aiExercises.value = exercises;
  insightMode.value = 'ai';
  if (exercises.length) aiTasks.value = exercises;
  cacheInsightForTasksPage(recommendation, exercises);
  return true;
}

// Mở trang: chỉ ĐỌC lời khuyên đã lưu từ lần bấm nút trước — KHÔNG gọi AI, không tốn token.
async function loadStoredInsight() {
  try {
    const res = await apiClient.get('/ai/insight', { noCache: true });
    applyInsight(res);
  } catch (e) {
    console.warn('[AI] không đọc được lời khuyên đã lưu:', e.message);
  }
}

// Người dùng bấm nút. Backend tự so dữ liệu hiện tại với lần chạy gần nhất:
// chưa thay đổi đáng kể -> trả lại đúng lời khuyên cũ (không gọi AI, không tốn token);
// đã thay đổi -> sinh lời khuyên mới.
async function requestAiInsight() {
  if (insightMode.value === 'loading') return;
  insightMode.value = 'loading';
  insightNote.value = '';
  try {
    const res = await apiClient.post('/ai/insight', {});
    const ok = applyInsight(res);
    if (!ok) {
      insightNote.value = t('dashboard.insight.noteNotEnough');
      insightMode.value = data.value?.insight ? 'server' : 'ai';
      return;
    }
    insightNote.value = res?.changed === false
      ? t('dashboard.insight.noteUnchanged')
      : t('dashboard.insight.noteUpdated');
  } catch (e) {
    console.warn('[AI] tạo lời khuyên thất bại:', e.message);
    insightNote.value = t('dashboard.insight.noteFailed');
    insightMode.value = aiRecommendation.value ? 'ai' : (data.value?.insight ? 'server' : 'server');
  }
}

async function refresh(force = false) {
  if (loading.value && !force) return;
  loading.value = true;

  try {
    aiTasks.value = null;
    const forceFresh = force || localStorage.getItem('peaceflow_dashboard_refresh') === '1';
    const result = await apiClient.get('/dashboard', { noCache: forceFresh });
    data.value = result;

    if (result?.user) {
      syncUser(result.user);
    }

    if (result?.progress) {
      window.dispatchEvent(new CustomEvent('peaceflow:progress-updated', {
        detail: {
          xp: result.progress.xp ?? result.progress.total_xp ?? 0,
          level: result.progress.level ?? result.progress.current_level ?? 1
        }
      }));
    }

    localStorage.removeItem('peaceflow_dashboard_refresh');
    // KHONG tu dong goi AI nua: chi doc lai loi khuyen da luu tu lan bam nut truoc.
    loadStoredInsight();
  } finally {
    loading.value = false;
  }
}

function handleSwrUpdate(event) {
  if (event.detail?.endpoint !== '/dashboard' || !data.value) return;
  data.value = event.detail.data;
  if (event.detail.data?.user) syncUser(event.detail.data.user);
}

function handleVisibility() {
  if (document.visibilityState !== 'visible') return;
  if (localStorage.getItem('peaceflow_dashboard_refresh') === '1') refresh(true);
}

function handleMutation() {
  refresh(true).catch(() => {});
  void loadGardenMemories(); // vừa check-in → bông hoa ký ức mới mọc
}

onMounted(async () => {
  void loadGardenLayout(); void loadGardenMemories(); void loadGardenLanterns();
  greetingTimer = window.setInterval(() => {
    currentTime.value = Date.now();
  }, 60 * 1000);
  document.addEventListener('click', handleInsightClick);
  window.addEventListener('pageshow', handleVisibility);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('peaceflow:swr-update', handleSwrUpdate);
  window.addEventListener('peaceflow:mood-saved', handleMutation);
  window.addEventListener('peaceflow:task-completed', handleMutation);
  window.addEventListener('peaceflow:journal-saved', handleMutation);
  window.addEventListener('peaceflow:booking-changed', handleMutation);

  try {
    // Chạy song song thay vì chờ waitForAuth() xong mới bắt đầu refresh() — waitForAuth
    // không quyết định việc có gọi refresh() hay không ở đây, nên chờ nối tiếp chỉ cộng
    // thêm một round-trip vào thời gian hiện đúng dữ liệu mà không có lý do.
    await Promise.all([auth.waitForAuth(), refresh()]);
  } catch (error) {
    console.error('Dashboard init error:', error);
  }
});

onBeforeUnmount(() => {
  if (greetingTimer) window.clearInterval(greetingTimer);
  document.removeEventListener('click', handleInsightClick);
  window.removeEventListener('pageshow', handleVisibility);
  document.removeEventListener('visibilitychange', handleVisibility);
  window.removeEventListener('peaceflow:swr-update', handleSwrUpdate);
  window.removeEventListener('peaceflow:mood-saved', handleMutation);
  window.removeEventListener('peaceflow:task-completed', handleMutation);
  window.removeEventListener('peaceflow:journal-saved', handleMutation);
  window.removeEventListener('peaceflow:booking-changed', handleMutation);
});

</script>

<script>
export default { name: 'DashboardView' };
</script>

<style scoped>
/* Dashboard theo bộ nhận diện PeaceFlow — mọi màu/chữ/bo góc lấy từ assets/brand-tokens.css.
   Font: Nunito cho tiêu đề và số liệu nổi bật, Inter cho nội dung; Playfair chỉ cho câu nhấn
   (lời chào, câu trích dẫn cuối trang).
   Nguyên tắc: khoảng trống tạo phân cấp trước, viền mảnh khi cần, bóng đổ rất nhẹ,
   không gradient trang trí, không viết hoa toàn bộ, ít pill/icon. */
.dash {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-text);
  background: var(--color-canvas);
  -webkit-font-smoothing: antialiased;
  position: relative;
  isolation: isolate;
}
/* Ảnh rừng hòa vào nền ivory: ảnh nét (không làm mờ) nhưng chỉ hiện nhẹ và trộn kiểu
   multiply, nên tổng thể vẫn giữ tông ivory của bộ nhận diện thay vì bị ảnh thay màu.
   Lớp position:fixed → đứng yên khi cuộn (background-attachment:fixed không chạy trên iOS). */
.dash::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9;
  mix-blend-mode: multiply;
  /* Góc trên trái là màu nền ivory trọn vẹn, ảnh hiện dần theo đường chéo và rõ nhất ở góc dưới phải. */
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { margin-left: 0; padding: 20px 20px 32px; min-height: 100vh; }
.dash-inner { width: 100%; display: flex; flex-direction: column; gap: 24px; }

/* ---------- Nền tảng ---------- */
.material-symbols-outlined { font-size: 18px; line-height: 1; vertical-align: middle; font-variation-settings: 'wght' 300; }
.stack-8 > * + * { margin-top: 8px; } .stack-10 > * + * { margin-top: 10px; } .stack-14 > * + * { margin-top: 14px; }
.stack-16 > * + * { margin-top: 16px; } .stack-20 > * + * { margin-top: 20px; }
.empty-text { font-size: 14px; color: var(--color-text-muted); margin: 0; line-height: 1.6; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.dot-primary { background: var(--color-brand); } .dot-amber { background: var(--color-terracotta); } .dot-muted { background: var(--color-olive); }

.card { background: var(--color-surface); border-radius: var(--radius-card); }
.card-pad { padding: 28px; }
.eyebrow { display: block; font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.sec-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.sec-title { font-family: var(--font-heading); font-size: 22px; font-weight: 800; line-height: 1.25; color: var(--color-text); margin: 2px 0 0; }

/* ---------- Buttons: primary / secondary / tertiary / danger ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; padding: 8px 16px;
  border: none; border-radius: var(--radius-control);
  font-family: inherit; font-size: 14px; font-weight: 600; line-height: 1;
  text-decoration: none; white-space: nowrap; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pf-btn-primary { background: var(--color-brand); color: var(--color-on-brand); }
.pf-btn-primary:hover { filter: brightness(0.92); }
.pf-btn-secondary { background: var(--color-surface-muted); color: var(--color-text); }
.pf-btn-secondary:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.pf-btn-tertiary { min-height: 0; padding: 4px 0; background: none; color: var(--color-text-muted); font-weight: 500; }
.pf-btn-tertiary:hover { color: var(--color-brand); }
.pf-btn-tertiary .material-symbols-outlined { font-size: 17px; }
.spinning { animation: pf-spin 1s linear infinite; }
@keyframes pf-spin { to { transform: rotate(360deg); } }
.pf-btn-danger { background: var(--color-danger); color: #fff; }
.pf-btn-danger:hover { filter: brightness(0.92); }
.pf-btn-sm { min-height: 30px; padding: 6px 12px; font-size: 13px; }
.pf-btn-block { width: 100%; }
.link-arrow, .link-sm { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--color-brand); text-decoration: none; }
.link-arrow:hover, .link-sm:hover { text-decoration: underline; text-underline-offset: 3px; }

/* Focus rõ ràng cho bàn phím */
.dash :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; border-radius: var(--radius-control); }

/* ---------- Băng hỗ trợ ưu tiên (an toàn — dùng màu danger, không dùng terracotta) ---------- */
.sb-badge { font-size: 12px; font-weight: 600; color: var(--color-danger); }
.sb-desc { font-size: 14px; color: var(--color-text); line-height: 1.5; margin: 0; }
.sb-reason { font-weight: 600; color: var(--color-danger); }

/* ---------- Bố cục 8/4 ---------- */
.dash-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.col-left { display: flex; flex-direction: column; gap: 52px; min-width: 0; }

/* ---------- 1. Check-in ---------- */
.checkin-card {
  padding: 36px 28px 28px;
  border-radius: var(--radius-panel);
  /* Gradient rất nhẹ, chỉ đủ phảng phất sắc màu (mint/peach/lavender của app) theo đường
     chéo — độ sáng tổng thể phải giữ bằng các card trắng ấm khác, không được tối/đậm hơn.
     Dòng đầu là bản dự phòng (màu đã pha sẵn gần trắng) cho trình duyệt WebView cũ chưa
     hỗ trợ color-mix; dòng sau dùng color-mix cho trình duyệt hiện đại. */
  background: linear-gradient(135deg, #f6faf2 0%, var(--color-surface) 50%, #fff9ef 78%, #faf6f5 100%);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--mint-light) 15%, var(--color-surface)) 0%,
    var(--color-surface) 50%,
    color-mix(in srgb, var(--peach-light) 15%, var(--color-surface)) 78%,
    color-mix(in srgb, var(--lavender-light) 12%, var(--color-surface)) 100%);
}
/* Khối co theo độ rộng tiêu đề để hàng cảm xúc dài đúng bằng dòng chữ phía trên. */
.ci-body { display: flex; flex-direction: column; gap: 24px; width: fit-content; max-width: 100%; margin: 0 auto; }
.ci-titles { text-align: center; }
.ci-hello-row { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
.ci-hello { font-family: var(--font-display); font-style: italic; font-size: 20px; color: var(--color-text-muted); margin: 0; }
.role-tag { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-control); background: var(--color-surface-muted); color: var(--color-text-muted); }
.ci-title { font-family: var(--font-heading); font-size: 34px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); margin: 6px 0 0; }

.mood-picker { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; width: 100%; margin: 0 auto; }
.mood-btn {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 20px 8px 16px; border-radius: var(--radius-card);
  background: transparent;
  text-decoration: none; text-align: center;
  transition: background-color var(--duration-normal) var(--ease-standard), transform var(--duration-normal) var(--ease-standard);
}
.mood-btn:hover { transform: translateY(-2px); }
/* Bê nguyên CSS icon của code cũ (.cp-mood-emoji) sang .mood-icon của layout mới — không chỉnh
   giá trị, chỉ đổi selector cho khớp cấu trúc .mood-btn hiện tại. */
.mood-icon.material-symbols-outlined {
  font-size: 72px;
  width: 80px;
  height: 80px;
  color: var(--color-text-muted);
  font-variation-settings: 'wght' 300;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: mood-icon-pop 5s ease-in-out infinite;
}
.mood-btn.is-active .mood-icon.material-symbols-outlined {
  font-size: 96px;
  width: 104px;
  height: 104px;
  color: var(--color-brand);
  translate: 0 -6px;
}
.mood-btn:hover .mood-icon {
  color: var(--color-brand);
  animation-play-state: paused;
  scale: 1.3;
  translate: 0 -8px;
}
@keyframes mood-icon-pop {
  0%, 100% { scale: 1; rotate: 0deg; }
  5% { scale: 1.3; rotate: -10deg; }
  10% { scale: 1.3; rotate: 10deg; }
  15% { scale: 1.1; rotate: -5deg; }
  20% { scale: 1; rotate: 0deg; }
}
.mood-label { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }
/* Trạng thái chọn nhận biết được không chỉ nhờ màu: dấu tích cạnh icon + chữ đậm (không còn nền
   thẻ màu xanh để tránh ồn, chỉ icon + chữ nổi bật). */
.mood-btn.is-active .mood-label { color: var(--color-brand); font-weight: 700; }
.mood-icon-wrap { position: relative; display: inline-flex; }
.mood-check { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: var(--color-brand); color: var(--color-on-brand); display: flex; align-items: center; justify-content: center; }
.mood-check .material-symbols-outlined { font-size: 16px; font-variation-settings: 'wght' 500; }
.ci-foot { font-size: 13px; color: var(--color-text-muted); text-align: center; margin: 0; }
.new-user-links { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

/* ---------- 2. Bốn chỉ số ---------- */
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.kpi { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
.kpi-label { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.kpi-value { display: flex; align-items: baseline; gap: 4px; }
.kpi-value b { font-family: var(--font-heading); font-size: 34px; font-weight: 800; line-height: 1.1; color: var(--color-text); }
.kpi-value b.is-empty { color: var(--color-text-subtle); }
.kpi-value small { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }

/* ---------- 3. Trợ lý PeaceCat ---------- */
.ai-row { display: flex; align-items: flex-start; gap: 20px; }
.ai-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.ai-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.ai-head-left { display: flex; flex-direction: column; gap: 2px; }
.ai-caption { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.ai-title { font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--color-text); }
.ai-quote { padding: 0; }
.ai-text { font-size: 15px; line-height: 1.7; color: var(--color-text); }
.ai-text.loading { opacity: 0.55; font-style: italic; }
.ai-text :deep(a) { color: var(--color-brand) !important; }
.ai-basis { font-size: 13px; color: var(--color-text-muted); margin: 8px 0 0; }
.ai-note { font-size: 13px; color: var(--color-text-muted); margin: 0; }

/* ---------- Nhiệm vụ hôm nay: thẻ có ảnh, 2 thẻ/hàng ---------- */
.task-section { padding-top: 8px; }
.task-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
.task-section-head .pf-section-title { font-size: 18px; }
.task-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.td-card { display: flex; flex-direction: column; border-radius: var(--radius-card); background: var(--color-canvas); overflow: hidden; text-decoration: none; color: inherit; transition: transform var(--duration-normal) var(--ease-standard), background-color var(--duration-normal) var(--ease-standard); }
.td-card:hover { transform: translateY(-2px); background: var(--color-surface-muted); }
.task-thumb { position: relative; aspect-ratio: 16 / 9; background: var(--color-olive); }
.task-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.task-badge { position: absolute; top: 10px; left: 10px; font-size: 12px; font-weight: 600; color: #fff; background: var(--color-danger); padding: 2px 8px; border-radius: var(--radius-control); }
.td-card-body { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px 16px; flex: 1; }
.task-name { font-size: 15px; font-weight: 600; line-height: 1.4; color: var(--color-text); margin: 0; }
.task-reason { font-size: 13.5px; line-height: 1.55; color: var(--color-text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.td-card-foot { margin-top: auto; padding-top: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.task-time { font-size: 13px; color: var(--color-text-muted); }
.task-xp { font-size: 13px; font-weight: 600; color: var(--color-terracotta); white-space: nowrap; }

/* ---------- 4. Biểu đồ ---------- */
.seg { display: inline-flex; align-items: center; padding: 3px; border-radius: var(--radius-control); background: var(--color-surface-muted); }
.seg-btn { padding: 6px 14px; border-radius: 6px; border: none; background: transparent; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.seg-btn:hover { color: var(--color-text); }
.seg-btn.is-active { background: var(--color-surface); color: var(--color-brand); font-weight: 600; box-shadow: 0 1px 2px rgba(55, 58, 52, 0.08); }
.mood-chart-area { height: 216px; }
.mood-chart-area :deep(.chart-svg) { width: 100%; height: 100%; overflow: visible; }
.chart-labels { display: grid; gap: 4px; padding-top: 12px; margin-top: 4px; text-align: center; }
.chart-labels span { font-size: 12.5px; font-weight: 500; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chart-labels span.is-current { font-weight: 700; color: var(--color-brand); }

/* ---------- 5. Radar ---------- */
.radar-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 24px; align-items: center; }
.radar-svg-wrap { display: flex; justify-content: center; padding: 8px 0; }
/* viewBox rộng hai bên để nhãn trục (tên + điểm) nằm trong khung, co theo bề ngang thẻ — không tràn trên mobile. */
.radar-svg-wrap { min-width: 0; }
.radar-svg-wrap :deep(.radar-svg) { display: block; width: 100%; max-width: 440px; height: auto; overflow: hidden; }
.radar-badges { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 16px; }
.radar-badge { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: var(--radius-control); background: var(--color-canvas); }
.rb-label { font-size: 13px; color: var(--color-text-muted); }
.rb-value { font-size: 18px; font-weight: 600; color: var(--color-text); }
.rb-value.is-empty { color: var(--color-text-subtle); }

/* ---------- Cột phải: một panel liền chia vạch ---------- */
.col-right-stack { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
/* Desktop 2 cột: cột phải là panel dính sát mép trên, dưới, phải màn hình (bù padding 20/20/32 của
   .main-content), đứng yên khi cuộn trang; nội dung dài hơn màn hình thì tự cuộn bên trong. */
@media (min-width: 1101px) {
  .col-right-stack { position: sticky; top: 0; height: 100vh; margin: -20px -20px -32px 0; overflow-y: auto; scrollbar-width: none; border-radius: 0; }
  .col-right-stack > .col-right { flex: 1 0 auto; border-radius: 0; }
  .col-right-stack::-webkit-scrollbar { display: none; }
  /* Đóng / mở: cột phải co về 0 và trượt sang phải + mờ dần; cột trái giãn theo. */
  .dash-grid { transition: grid-template-columns 0.35s ease, column-gap 0.35s ease; }
  .col-right-stack { transition: opacity 0.25s ease, transform 0.35s ease, visibility 0s linear 0s; }
  .dash-grid.right-collapsed { grid-template-columns: minmax(0, 1fr) minmax(0, 0fr); column-gap: 0; }
  .dash-grid.right-collapsed .col-right-stack {
    opacity: 0; transform: translateX(48px); visibility: hidden; pointer-events: none;
    transition: opacity 0.25s ease, transform 0.35s ease, visibility 0s linear 0.35s;
  }
  .rp-head { animation: rp-head-in 0.35s ease both; }
  @keyframes rp-head-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
}

/* ---------- Panel phải (theo mẫu "khu vườn"): nền trời nhạt, thẻ kem bo lớn, tiêu đề serif ---------- */
.rp { --rp-accent: #6F8F5E; background: linear-gradient(180deg, #EEF1EA 0%, #F7F1E6 38%, #FBF6EE 100%); gap: 14px; padding-bottom: 16px; }
.rp-hero { position: relative; min-height: 210px; padding: 6px 20px 8px; }
.rp-hero-art { position: absolute; inset: -60px 0 0 30%; pointer-events: none; background: url("/images/garden-hero.jpg") center / cover no-repeat;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, transparent 32%, rgba(0, 0, 0, 0.35) 55%, #000 85%), linear-gradient(180deg, #000 65%, transparent 100%); -webkit-mask-composite: source-in;
  mask-image: linear-gradient(90deg, transparent 0%, transparent 32%, rgba(0, 0, 0, 0.35) 55%, #000 85%), linear-gradient(180deg, #000 65%, transparent 100%); mask-composite: intersect; }
.rp-hero-body { position: relative; max-width: 62%; }
.rp-level { display: flex; align-items: center; gap: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.rp-hero-title { font-family: var(--font-display); font-style: italic; font-size: 25px; font-weight: 400; line-height: 1.3; color: #46362A; margin: 10px 0 12px; }
.rp-hero-sub { font-family: var(--font-body); font-size: 13px; line-height: 1.6; color: var(--color-text-muted); margin: 0 0 18px; }
.rp-xp-track { height: 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.8); box-shadow: inset 0 0 0 1px rgba(74, 55, 40, 0.06); overflow: hidden; }
.rp-xp-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #7FA866, #9CC57D); }
.rp-xp-text { margin: 12px 0 0; font-size: 14px; color: var(--color-text-muted); }
.rp-xp-text strong { color: var(--color-text); font-weight: 700; }

.rp-card { margin: 0 16px; padding: 16px 18px; border-radius: 22px; background: rgba(255, 253, 247, 0.92); box-shadow: 0 6px 20px rgba(80, 70, 50, 0.07); }
.rp-card-head { display: flex; align-items: center; gap: 10px; }
.rp-card-icon { display: flex; color: var(--rp-accent); }
.rp-card-icon .nav-icon { width: 24px; height: 24px; }
.rp-card-title { flex: 1; min-width: 0; margin: 0; font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: var(--color-text); }
.rp-card-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-text-muted); text-decoration: none; white-space: nowrap; }
.rp-card-link .nav-icon { width: 16px; height: 16px; }
.rp-card-link .rp-flame { color: var(--rp-accent); }
.rp-card-link:hover { color: var(--rp-accent); }

.rp-days { position: relative; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 14px; }
.rp-days::before { content: ''; position: absolute; left: 7%; right: 7%; bottom: 15px; height: 1px; background: rgba(74, 55, 40, 0.12); }
.rp-day { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.rp-day-label { font-size: 12px; color: var(--color-text-muted); }
.rp-day-dot { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #F0EBE1; color: var(--rp-accent); }
.rp-day-dot .nav-icon { width: 16px; height: 16px; stroke-width: 2.4; }
.rp-day.st-done .rp-day-dot { background: #DCE8D2; }
.rp-day.st-today .rp-day-dot, .rp-day.st-today-done .rp-day-dot { width: 36px; height: 36px; margin-top: -3px; background: var(--rp-accent); color: #fff; box-shadow: 0 4px 10px rgba(79, 122, 90, 0.3); }
.rp-day.st-today .rp-day-label, .rp-day.st-today-done .rp-day-label { color: var(--color-text); font-weight: 700; }

/* Cảnh vườn hiện trọn vẹn theo đúng tỉ lệ ảnh (400:220), tràn sát mép trên/trái/phải; tiêu đề + pill nổi trên cảnh.
   Card dài ra, tổng quan nằm hẳn bên dưới cảnh, không che. */
.rp-garden { position: relative; overflow: hidden; padding: 0; }
.rp-garden-art { position: relative; display: block; width: 100%; aspect-ratio: 400 / 250; padding: 0; border: none; background: none; cursor: zoom-in; font: inherit; }
.rp-garden-top { pointer-events: none; }
.rp-garden-top .rp-pill { pointer-events: auto; }
.rp-garden-zoom { position: absolute; right: 10px; bottom: 10px; width: 30px; height: 30px; border-radius: 50%; background: rgba(255, 255, 255, 0.85); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s ease; }
.rp-garden-zoom .nav-icon { width: 16px; height: 16px; }
.rp-garden-art:hover .rp-garden-zoom, .rp-garden-art:focus-visible .rp-garden-zoom { opacity: 1; }
.rp-garden-art:focus-visible { outline: 2px solid var(--rp-accent); outline-offset: -2px; }

/* Khu vườn toàn màn hình */
.garden-full { position: fixed; inset: 0; z-index: 1100; font-family: var(--font-body); }
.garden-full-head { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 24px 28px; pointer-events: none; }
.garden-full-head > * { pointer-events: auto; }
.garden-full-title { margin: 0 0 8px; font-family: var(--font-heading); font-size: 26px; font-weight: 700; color: var(--color-text); }
.garden-full-close { width: 40px; height: 40px; border: none; border-radius: 50%; background: rgba(255, 255, 255, 0.85); color: var(--color-text); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-soft); }
.garden-full-close:hover { background: #fff; }
.garden-full-actions { display: flex; gap: 10px; }
.garden-full-close.is-on { background: #6F8F5E; color: #fff; }
.garden-full-close .nav-icon { width: 20px; height: 20px; }
.garden-full-metrics { --rp-accent: #6F8F5E; position: absolute; left: 50%; bottom: 44px; transform: translateX(-50%); width: min(560px, calc(100% - 32px)); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 14px 8px; border-radius: 18px; background: rgba(255, 253, 247, 0.9); box-shadow: 0 8px 28px rgba(80, 70, 50, 0.12); }
.garden-full-metrics .rp-metric + .rp-metric { border-left: 1px solid rgba(74, 55, 40, 0.1); }
.garden-full .rp-pill { --rp-accent: #6F8F5E; }
.garden-preview { position: absolute; top: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(255, 253, 247, 0.9); box-shadow: 0 6px 20px rgba(80, 70, 50, 0.1); max-width: calc(100% - 32px); overflow-x: auto; scrollbar-width: none; }
.garden-preview-time { top: 70px; }
.garden-preview-label { padding: 0 8px 0 10px; font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }
.garden-preview-btn { border: none; background: none; padding: 6px 12px; border-radius: 999px; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; white-space: nowrap; }
.garden-preview-btn:hover { color: var(--color-text); }
.garden-preview-btn.is-active { background: #6F8F5E; color: #fff; }
.garden-full-credit { position: absolute; z-index: 2; top: 80px; right: 28px; width: min(380px, calc(100% - 32px)); max-height: 50vh; overflow-y: auto; margin: 0; padding: 12px 14px; border-radius: 14px; background: rgba(255, 253, 247, 0.96); box-shadow: 0 8px 28px rgba(80, 70, 50, 0.14); font-size: 11.5px; line-height: 1.6; color: var(--color-text-muted); }
.garden-full-credit a { color: inherit; }
.garden-full-hint { position: absolute; left: 0; right: 0; bottom: 14px; margin: 0; text-align: center; font-size: 12px; color: var(--color-text-muted); pointer-events: none; }
/* Mobile / màn hẹp: xếp các lớp ở đáy thành chồng không đè nhau (từ dưới lên: credit 1 dòng cuộn ngang → gợi ý → chỉ số → 2 thanh xem thử) */
@media (max-width: 900px) {
  .garden-full { --gb: env(safe-area-inset-bottom, 0px); }
  .garden-full-head { padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 14px; }
  .garden-full-title { font-size: 20px; margin-bottom: 6px; }
  .garden-full-close { width: 44px; height: 44px; }
  .garden-full-credit { top: calc(74px + env(safe-area-inset-top, 0px)); right: 12px; width: auto; left: 12px; font-size: 11px; }
  .garden-full-hint { bottom: calc(10px + var(--gb)); padding: 0 20px; font-size: 11px; line-height: 1.4; }
  .garden-full-metrics { bottom: calc(48px + var(--gb)); padding: 10px 4px; border-radius: 16px; width: calc(100% - 24px); }
  .garden-full-metrics .rp-metric-icon { width: 20px; height: 20px; }
  .garden-full-metrics .rp-metric-label { font-size: 11px; }
  .garden-full-metrics .rp-metric-value { font-size: 12px; }
  .garden-preview { top: auto; bottom: calc(152px + var(--gb)); max-width: calc(100% - 24px); }
  .garden-preview-time { bottom: calc(200px + var(--gb)); }
  .garden-preview-btn { min-height: 36px; padding: 6px 11px; font-size: 12px; }
  .garden-preview-label { padding: 0 4px 0 8px; font-size: 11px; }
}
/* Cùng hít thở: vòng tròn phồng khi hít vào, xẹp khi thở ra (chuyển động chậm, êm) */
.garden-breath { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 22px 28px 18px; border-radius: 28px; background: rgba(255, 253, 247, 0.82); box-shadow: 0 12px 36px rgba(80, 70, 50, 0.16); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); min-width: 240px; }
.garden-breath-title { margin: 0; font-family: var(--font-heading); font-size: 17px; font-weight: 700; color: var(--color-text); text-align: center; }
.garden-breath-circle { width: 132px; height: 132px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(159, 197, 125, 0.55) 0%, rgba(111, 143, 94, 0.35) 70%); box-shadow: 0 0 0 10px rgba(159, 197, 125, 0.16); transform: scale(0.6); transition: transform 0.3s ease; }
.garden-breath-circle.is-in { transform: scale(1); transition: transform 4s ease-in-out; }
.garden-breath-circle.is-hold { transform: scale(1); }
.garden-breath-circle.is-out { transform: scale(0.6); transition: transform 6s ease-in-out; }
.garden-breath-circle span { font-size: 15px; font-weight: 600; color: #3F5A33; }
.garden-breath-round { margin: 0; font-size: 12px; color: var(--color-text-muted); }
.garden-breath-stop { min-height: 40px; padding: 8px 22px; border: 1px solid rgba(74, 55, 40, 0.25); border-radius: 999px; background: transparent; font-family: inherit; font-size: 14px; font-weight: 600; color: var(--color-text); cursor: pointer; }
.garden-breath-stop:hover { background: rgba(255, 255, 255, 0.8); }
.garden-breath-stop:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .garden-breath-circle, .garden-breath-circle.is-in, .garden-breath-circle.is-out { transition: none; } }
.garden-call-hint { position: absolute; left: 50%; top: 120px; transform: translateX(-50%); z-index: 2; margin: 0; padding: 8px 16px; border-radius: 999px; background: rgba(255, 253, 247, 0.92); box-shadow: 0 6px 20px rgba(80, 70, 50, 0.12); font-size: 13px; color: var(--color-text); white-space: nowrap; max-width: calc(100% - 32px); overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
@media (max-width: 900px) { .garden-call-hint { top: calc(78px + env(safe-area-inset-top, 0px)); font-size: 12px; white-space: normal; text-align: center; } .garden-breath { min-width: 0; width: calc(100% - 48px); max-width: 300px; } }
/* Trang trí đảo */
.garden-edit-done { display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 18px; border: none; border-radius: 999px; background: #6F8F5E; color: #fff; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: var(--shadow-soft); }
.garden-edit-done .nav-icon { width: 18px; height: 18px; }
.garden-edit-done:hover { filter: brightness(0.95); }
.garden-call-hint.is-notice { background: #FFF1E6; color: #8A4B24; }
.garden-editor { --rp-accent: #6F8F5E; position: absolute; z-index: 2; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(820px, calc(100% - 24px)); padding: 10px 10px 6px; border-radius: 22px; background: rgba(255, 253, 247, 0.95); box-shadow: 0 10px 32px rgba(80, 70, 50, 0.16); }
.garden-editor-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.garden-editor-tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; min-width: 0; }
.garden-editor-tabs::-webkit-scrollbar { display: none; }
.garden-editor-tabs button { flex: none; min-height: 36px; padding: 6px 14px; border: none; border-radius: 999px; background: transparent; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--color-text-muted); cursor: pointer; }
.garden-editor-tabs button:hover { color: var(--color-text); }
.garden-editor-tabs button.is-active { background: #6F8F5E; color: #fff; }
.garden-editor-actions { display: flex; gap: 4px; flex: none; }
.garden-editor-actions button { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 6px 10px; border: none; border-radius: 999px; background: transparent; font-family: inherit; font-size: 13px; color: var(--color-text); cursor: pointer; }
.garden-editor-actions button:hover:not(:disabled) { background: rgba(111, 143, 94, 0.12); }
.garden-editor-actions button:disabled { opacity: 0.4; cursor: default; }
.garden-editor-actions .nav-icon { width: 16px; height: 16px; }
.garden-editor-items { display: flex; gap: 8px; margin-top: 8px; padding-bottom: 4px; overflow-x: auto; scrollbar-width: thin; }
.garden-editor-item { flex: none; width: 84px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 4px; border: 2px solid transparent; border-radius: 16px; background: rgba(111, 143, 94, 0.07); font-family: inherit; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard); }
.garden-editor-item:hover { background: rgba(111, 143, 94, 0.14); }
.garden-editor-item:active { transform: scale(0.97); }
.garden-editor-item.is-active { border-color: #6F8F5E; background: rgba(111, 143, 94, 0.18); }
.garden-editor-thumb { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
.garden-editor-thumb img { width: 100%; height: 100%; object-fit: contain; }
.garden-editor-thumb-wait { width: 28px; height: 28px; border-radius: 50%; background: rgba(111, 143, 94, 0.18); animation: garden-thumb-pulse 1.2s ease-in-out infinite; }
@keyframes garden-thumb-pulse { 50% { opacity: 0.4; } }
.garden-editor-name { font-size: 11.5px; line-height: 1.25; color: var(--color-text); text-align: center; }
.garden-editor-save { margin: 2px 6px 0; font-size: 11px; color: var(--color-text-muted); text-align: right; min-height: 14px; }
.garden-editor-save.is-error { color: #B4532A; }
.garden-editor-tool { border-radius: 14px; background: rgba(111, 143, 94, 0.14); color: #4F6B42; }
.garden-editor-tool .nav-icon { width: 28px; height: 28px; }
.garden-editor-brushbtn.is-active .garden-editor-tool { background: #6F8F5E; color: #fff; }
.garden-path-swatch { border-radius: 14px; background: #A9C98A; position: relative; overflow: hidden; }
.garden-path-swatch.is-stone::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 25% 70%, var(--path-color) 0 7px, transparent 8px), radial-gradient(circle at 50% 50%, var(--path-color) 0 7px, transparent 8px), radial-gradient(circle at 75% 30%, var(--path-color) 0 7px, transparent 8px); }
.garden-path-swatch.is-gravel::after { content: ''; position: absolute; left: -10%; right: -10%; top: 36%; height: 28%; transform: rotate(-30deg); background: radial-gradient(circle, var(--path-color) 0 1.6px, transparent 2px) 0 0 / 6px 6px; }
.garden-editor-pathdone { flex: none; align-self: center; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 6px 16px; border: none; border-radius: 999px; background: #6F8F5E; color: #fff; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.garden-editor-pathdone .nav-icon { width: 16px; height: 16px; }
.garden-editor-trim.is-on { background: #6F8F5E !important; color: #fff !important; }
.garden-editor-boost { flex: none; order: 99; display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 4px 8px 4px 14px; margin-left: 4px; border-left: 1px dashed rgba(74, 55, 40, 0.2); font-size: 12px; color: var(--color-text-muted); }
.garden-editor-boost > div { display: flex; gap: 4px; }
.garden-editor-boost button { min-height: 32px; padding: 4px 12px; border: 1px solid rgba(74, 55, 40, 0.18); border-radius: 999px; background: transparent; font-family: inherit; font-size: 12px; font-weight: 600; color: var(--color-text); cursor: pointer; }
.garden-editor-boost button:hover:not(:disabled) { border-color: #6F8F5E; }
.garden-editor-boost button:disabled { opacity: 0.4; cursor: default; }
.garden-edit-tools-label { align-self: center; padding: 0 8px 0 10px; font-size: 13px; color: var(--color-text-muted); white-space: nowrap; }
.garden-edit-tools button.is-place { background: #6F8F5E; color: #fff; }
.garden-edit-tools button.is-place:hover:not(:disabled) { background: #62804F; }
.garden-edit-tools button.is-trim { color: #4F6B42; }
.garden-edit-tools { position: absolute; z-index: 2; left: 50%; bottom: calc(196px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: flex; gap: 4px; padding: 5px; border-radius: 999px; background: rgba(255, 253, 247, 0.95); box-shadow: 0 8px 24px rgba(80, 70, 50, 0.14); max-width: calc(100% - 24px); overflow-x: auto; scrollbar-width: none; }
.garden-edit-tools button { flex: none; display: inline-flex; align-items: center; gap: 5px; min-height: 40px; padding: 6px 14px; border: none; border-radius: 999px; background: transparent; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--color-text); cursor: pointer; }
.garden-edit-tools button:hover:not(:disabled) { background: rgba(111, 143, 94, 0.12); }
.garden-edit-tools button:disabled { opacity: 0.4; cursor: default; }
.garden-edit-tools button.is-danger { color: #B4532A; }
.garden-edit-tools .nav-icon { width: 16px; height: 16px; }
@media (prefers-reduced-motion: reduce) { .garden-editor-thumb-wait { animation: none; } }
@media (max-width: 900px) {
  .garden-editor-actions button { padding: 6px 8px; font-size: 12px; }
  .garden-editor-item { width: 74px; }
  .garden-editor-thumb { width: 52px; height: 52px; }
  .garden-edit-tools { bottom: calc(184px + env(safe-area-inset-bottom, 0px)); }
  .garden-edit-tools button { padding: 6px 10px; font-size: 12px; }
  .garden-edit-done { padding: 0 14px; }
}
/* Thẻ hoa ký ức / đèn lồng / lời chúc / khách ghé */
.garden-lantern-bubble { position: relative; width: max-content; max-width: min(260px, 70vw); padding: 10px 34px 10px 14px; border-radius: 16px; background: rgba(255, 250, 240, 0.96); box-shadow: 0 8px 24px rgba(80, 60, 30, 0.2); animation: garden-card-in 0.3s ease both; }
.garden-lantern-bubble::after { content: ''; position: absolute; left: 50%; bottom: -7px; width: 14px; height: 14px; transform: translateX(-50%) rotate(45deg); background: rgba(255, 250, 240, 0.96); border-radius: 2px; }
.garden-lantern-bubble-date { margin: 0; font-size: 11px; font-weight: 600; color: #B7773A; }
.garden-lantern-bubble-text { margin: 3px 0 0; font-family: var(--font-display); font-style: italic; font-size: 16px; line-height: 1.4; color: var(--color-text); overflow-wrap: anywhere; }
.garden-lantern-bubble-close { position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; border: none; border-radius: 50%; background: transparent; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.garden-lantern-bubble-close:hover { background: rgba(74, 55, 40, 0.06); }
.garden-lantern-bubble-close .nav-icon { width: 14px; height: 14px; }
.garden-card { position: absolute; z-index: 3; left: 50%; top: 120px; transform: translateX(-50%); display: flex; align-items: flex-start; gap: 12px; width: min(420px, calc(100% - 32px)); padding: 14px 12px 14px 16px; border-radius: 18px; background: rgba(255, 253, 247, 0.96); box-shadow: 0 10px 30px rgba(80, 70, 50, 0.16); animation: garden-card-in 0.35s ease both; }
@keyframes garden-card-in { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
.garden-card-dot { flex: none; width: 14px; height: 14px; margin-top: 4px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.04); }
.garden-card-body { flex: 1; min-width: 0; }
.garden-card-title { margin: 0; font-size: 14px; font-weight: 700; color: var(--color-text); }
.garden-card-text { margin: 4px 0 0; font-size: 14px; line-height: 1.5; color: var(--color-text-muted); overflow-wrap: anywhere; }
.garden-card.is-wish .garden-card-text, .garden-card.is-lantern .garden-card-text { font-family: var(--font-display); font-style: italic; font-size: 16px; color: var(--color-text); }
.garden-card-close { flex: none; width: 32px; height: 32px; margin: -4px -2px 0 0; border: none; border-radius: 50%; background: transparent; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.garden-card-close:hover { background: rgba(74, 55, 40, 0.06); }
.garden-card-close .nav-icon { width: 16px; height: 16px; }
/* Viết câu biết ơn để thả đèn lồng */
.garden-checkin-sheet { position: absolute; z-index: 5; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(980px, calc(100% - 24px)); max-height: calc(100% - 24px); display: flex; flex-direction: column; border-radius: 24px; background: var(--color-canvas, #FBF7F0); box-shadow: 0 18px 50px rgba(60, 50, 35, 0.25); overflow: hidden; }
.garden-checkin-sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px 0 16px; }
.garden-checkin-sheet-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0 8px 8px; overscroll-behavior: contain; }
.garden-checkin-dot { display: inline-block; border-radius: 50%; }
.garden-checkin-today { display: flex; align-items: center; gap: 8px; margin: 0; padding: 8px 12px; border-radius: 12px; background: rgba(111, 143, 94, 0.1); font-size: 13px; color: var(--color-text); }
.garden-checkin-dot.is-small { width: 12px; height: 12px; flex: none; }
@media (max-width: 900px) { .garden-checkin-sheet { top: auto; bottom: 0; transform: translateX(-50%); width: 100%; max-height: 92%; border-radius: 24px 24px 0 0; padding-bottom: env(safe-area-inset-bottom, 0px); } }
.garden-lantern-compose { position: absolute; z-index: 4; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(400px, calc(100% - 32px)); padding: 18px; border-radius: 22px; background: rgba(255, 253, 247, 0.97); box-shadow: 0 14px 40px rgba(80, 70, 50, 0.2); }
.garden-lantern-title { margin: 0 0 10px; font-family: var(--font-heading); font-size: 17px; font-weight: 700; color: var(--color-text); }
.garden-lantern-compose textarea { width: 100%; box-sizing: border-box; resize: none; padding: 10px 12px; border: 1px solid rgba(74, 55, 40, 0.18); border-radius: 14px; background: #fff; font-family: inherit; font-size: 15px; line-height: 1.5; color: var(--color-text); }
.garden-lantern-compose textarea:focus { outline: none; border-color: #6F8F5E; box-shadow: 0 0 0 3px rgba(111, 143, 94, 0.18); }
.garden-lantern-error { margin: 6px 0 0; font-size: 13px; color: #B4532A; }
.garden-lantern-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.garden-lantern-count { flex: 1; font-size: 12px; color: var(--color-text-muted); }
.garden-lantern-cancel { min-height: 40px; padding: 8px 16px; border: none; border-radius: 999px; background: transparent; font-family: inherit; font-size: 14px; color: var(--color-text); cursor: pointer; }
.garden-lantern-cancel:hover { background: rgba(74, 55, 40, 0.06); }
.garden-lantern-send { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 8px 18px; border: none; border-radius: 999px; background: #E59A4F; color: #fff; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.garden-lantern-send:hover:not(:disabled) { filter: brightness(0.95); }
.garden-lantern-send:disabled { opacity: 0.5; cursor: default; }
.garden-lantern-send .nav-icon { width: 16px; height: 16px; }
@media (max-width: 900px) { .garden-card { top: calc(78px + env(safe-area-inset-top, 0px)); } }
@media (prefers-reduced-motion: reduce) { .garden-card { animation: none; } }
.garden-full-enter-active, .garden-full-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.garden-full-enter-from, .garden-full-leave-to { opacity: 0; transform: scale(0.97); }
.rp-garden-top { position: absolute; top: 0; left: 0; right: 0; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; padding: 16px 18px 0; }
.rp-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 6px; border-radius: 999px; background: rgba(255, 255, 255, 0.85); font-size: 12px; color: var(--color-text-muted); text-decoration: none; white-space: nowrap; }
.rp-pill .nav-icon { width: 14px; height: 14px; }
.rp-pill-sun { width: 10px; height: 10px; border-radius: 50%; background: var(--rp-accent); }
.rp-overview { padding: 14px 12px 14px; }
.rp-overview-title { display: flex; align-items: center; gap: 6px; font-family: var(--font-body); font-size: 14px; color: var(--color-text); margin-bottom: 8px; }
.rp-overview-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.rp-metric { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 0 4px; text-align: center; }
.rp-metric + .rp-metric { border-left: 1px solid rgba(74, 55, 40, 0.1); }
.rp-metric-icon { width: 24px; height: 24px; color: var(--rp-accent); overflow: visible; }
/* các icon vẽ to nhỏ khác nhau trong khung 24×24 → phóng bù để nhìn cùng cỡ (giữ nét bằng nhau) */
.rp-metric-icon.ic-lotus { transform: scale(1.3); stroke-width: 1.4; }
.rp-metric-icon.ic-moon { transform: scale(1.1); stroke-width: 1.65; }
.rp-metric-label { font-size: 12px; color: var(--color-text-muted); }
.rp-metric-value { font-size: 13px; font-weight: 700; color: var(--color-text); line-height: 1.3; }

/* 2 thẻ Chuyên gia & Ủng hộ dùng chung khung: cột hình 56px, khoảng cách 14px, tiêu đề 17px */
.rp-expert { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; column-gap: 14px; row-gap: 14px; }
.rp-expert-art { width: 56px; height: 56px; }
.rp-expert-eyebrow { display: flex; align-items: center; gap: 6px; font-family: var(--font-body); font-size: 13px; color: var(--color-text-muted); }
.rp-expert-eyebrow .nav-icon { width: 16px; height: 16px; color: var(--rp-accent); }
.rp-expert-title { margin: 2px 0 4px; font-family: var(--font-heading); font-size: 17px; font-weight: 700; color: var(--color-text); }
.rp-muted { margin: 0; font-size: 13px; line-height: 1.5; color: var(--color-text-muted); }
.rp-btn-primary { grid-column: 1 / -1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 18px; min-height: 44px; box-sizing: border-box; border-radius: 999px; background: #6F8F5E; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; transition: filter var(--duration-fast) var(--ease-standard); }
.rp-btn-primary .nav-icon { width: 16px; height: 16px; }
.rp-btn-primary:hover { filter: brightness(0.94); }

.rp-donate { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; column-gap: 14px; row-gap: 14px; }
.rp-donate-icon { width: 52px; height: 52px; justify-self: center; border-radius: 50%; background: #E4ECDD; color: var(--rp-accent); display: flex; align-items: center; justify-content: center; }
.rp-donate-icon .nav-icon { width: 22px; height: 22px; }
.rp-donate .rp-card-title { font-size: 17px; margin-bottom: 4px; }
.rp-btn-outline { grid-column: 1 / -1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 18px; min-height: 44px; box-sizing: border-box; border-radius: 999px; border: 1px solid rgba(74, 55, 40, 0.25); background: transparent; color: var(--color-text); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.rp-btn-outline .nav-icon { width: 16px; height: 16px; }
.rp-btn-outline:hover { background: rgba(255, 255, 255, 0.7); }
/* Hàng nút đầu panel: nút tròn trắng như mẫu */
.rp .rp-btn { width: 44px; height: 44px; background: rgba(255, 255, 255, 0.85); box-shadow: 0 2px 8px rgba(80, 70, 50, 0.08); }
.rp .rp-sos { background: #E0574F; color: #fff; font-size: 13px; }
/* Hàng nút đầu panel phải — chỉ có ở desktop 2 cột. */
.rp-head { display: none; }
@media (min-width: 1101px) {
  .rp-head { position: relative; z-index: 2; display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 16px 0 20px; }
  /* Hàng nút chỉ chiếm bên phải — kéo khối cấp độ lên cạnh nó cho bớt trống phía trên. */
  .rp-hero { margin-top: -40px; }
}
.rp-actions { display: flex; align-items: center; gap: 8px; }
.rp-collapse, .rp-btn {
  position: relative; width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-canvas); color: var(--color-text-muted);
  transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard);
}
.rp-collapse { background: transparent; }
.rp-collapse:hover, .rp-btn:hover, .rp-btn.is-open { color: var(--rp-accent); background: #E4ECDD; }
.rp-collapse .nav-icon, .rp-btn .nav-icon { width: 20px; height: 20px; }
.rp-sos { background: var(--color-danger); color: #fff; font-family: var(--font-heading); font-size: 11px; font-weight: 800; }
.rp-sos:hover { background: var(--color-danger); color: #fff; filter: brightness(0.94); }
.rp-badge { position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--color-danger); color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
/* Thẻ mép phải để mở lại panel khi đã thu gọn (cùng kiểu thẻ chuông / tin nhắn). */
.rail-expand { display: none; }
@media (min-width: 1101px) {
  .rail-expand {
    position: fixed; top: 24px; right: 0; z-index: 250;
    height: 34px; padding: 0 9px; border: none; border-radius: 10px 0 0 10px; cursor: pointer;
    background: var(--color-surface); color: var(--color-text-muted); box-shadow: var(--shadow-soft);
    animation: rail-tab-in 0.3s ease both;
    display: flex; align-items: center; gap: 0;
    transition: color 0.2s ease, background-color 0.2s ease, gap 0.2s ease;
  }
  .rail-expand .nav-icon { width: 16px; height: 16px; transform: rotate(180deg); }
  .rail-expand .rail-label { max-width: 0; overflow: hidden; white-space: nowrap; opacity: 0; font-size: 12px; font-weight: 600; transition: max-width 0.25s ease, opacity 0.2s ease; }
  .rail-expand:hover, .rail-expand:focus-visible { color: var(--color-brand); background: var(--color-brand-soft); gap: 8px; }
  .rail-expand:hover .rail-label, .rail-expand:focus-visible .rail-label { max-width: 160px; opacity: 1; }
}
.col-right { display: flex; flex-direction: column; border-radius: var(--radius-panel); background: var(--color-surface); overflow: hidden; }
/* Hỗ trợ ưu tiên: thẻ đỏ đứng riêng, không chung nền với panel bên dưới */
.safety-card { padding: 18px 20px; background: var(--color-danger-soft); display: flex; flex-direction: column; gap: 8px; }
/* Thanh phải: thẻ SOS nằm dưới thẻ chuông (top 24px) và tin nhắn (top 62px). */
.safety-fab {
  position: fixed; top: calc(100px + var(--rail-shift, 0px)); right: 0; z-index: 250;
  height: 34px; padding: 0 7px; border: none; border-radius: 10px 0 0 10px; cursor: pointer;
  background: var(--color-danger); color: #fff;
  box-shadow: var(--shadow-soft);
  display: flex; align-items: center; gap: 0;
  transition: gap 0.2s ease, filter 0.2s ease;
  animation: rail-tab-in 0.3s ease both;
}
@keyframes rail-tab-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.safety-fab-sos { font-family: var(--font-heading); font-size: 10px; font-weight: 800; letter-spacing: 0; width: 20px; flex-shrink: 0; text-align: center; }
.safety-fab .rail-label { max-width: 0; overflow: hidden; white-space: nowrap; opacity: 0; font-size: 12px; font-weight: 600; transition: max-width 0.25s ease, opacity 0.2s ease; }
.safety-fab:hover, .safety-fab:focus-visible { gap: 8px; filter: brightness(0.96); }
.safety-fab:hover .rail-label, .safety-fab:focus-visible .rail-label { max-width: 160px; opacity: 1; }
.safety-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(40, 30, 22, 0.35); display: flex; align-items: center; justify-content: center; padding: 16px; }
.safety-dialog { position: relative; width: 100%; max-width: 420px; padding: 22px 22px 20px; border-radius: var(--radius-card); background: var(--color-surface); box-shadow: 0 12px 40px rgba(40, 30, 22, 0.2); display: flex; flex-direction: column; gap: 10px; font-family: var(--font-body); }
.safety-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border: none; border-radius: 50%; background: transparent; color: var(--color-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.safety-close:hover { background: var(--color-canvas); }
/* Popup: chữ cùng một tông màu, đỏ chỉ còn ở nút hành động. */
.safety-dialog .sb-badge { font-family: var(--font-heading); font-size: 16px; font-weight: 800; color: var(--color-text); }
.safety-dialog .sb-reason { color: var(--color-text); }
@media (min-width: 901px) and (hover: hover) {
  .safety-card-inline { display: none; }
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .safety-fab { display: none; }
}
.side-sec { padding: 24px; }
.side-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.side-title { font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--color-text); margin: 0; }
.side-title-sm { font-size: 15px; font-weight: 600; color: var(--color-text); }
.side-meta { font-size: 13px; color: var(--color-text-muted); }

.level-row { display: flex; flex-direction: row; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.level-title { font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--color-text); }
.level-sub { font-size: 13px; color: var(--color-text-muted); }
.xp-block > * + * { margin-top: 8px; }
.xp-track { width: 100%; height: 6px; border-radius: 999px; background: var(--color-surface-muted); overflow: hidden; }
.xp-meter { height: 100%; border-radius: 999px; background: var(--color-brand); transition: width 600ms var(--ease-standard); }
.xp-labels { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12.5px; color: var(--color-text-muted); }
.xp-next { color: var(--color-text); font-weight: 600; }
.ribbon-block { padding-top: 4px; }
.ribbon-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; }
.ribbon-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
.ribbon-count { font-size: 13px; color: var(--color-text-muted); }
.ribbon { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; text-align: center; }
.rb-day { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.rb-day-label { font-size: 12px; color: var(--color-text-muted); }
.rb-day-label.is-today { color: var(--color-text); font-weight: 700; }
.rb-day-dot { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.rb-day-dot .material-symbols-outlined { font-size: 16px; font-variation-settings: 'wght' 500; }
.rb-day-dot.st-missed { background: var(--color-surface-muted); }
.rb-day-dot.st-upcoming { background: var(--color-canvas); }
.rb-day-dot.st-done { background: var(--color-sage); color: var(--color-text); }
.rb-day-dot.st-today { background: var(--color-brand-soft); box-shadow: inset 0 0 0 2px var(--color-brand); }
.rb-day-dot.st-today-done { background: var(--color-brand); color: var(--color-on-brand); }


.risk-badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: var(--radius-control); white-space: nowrap; }
.risk-badge-coral { background: var(--color-danger-soft); color: var(--color-danger); }
.risk-badge-peach { background: var(--color-terracotta-soft); color: var(--color-terracotta); }
.risk-badge-mint { background: var(--color-brand-soft); color: var(--color-brand); }
.garden-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
.garden-chip { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-muted); }
.garden-chip strong { color: var(--color-text); font-weight: 600; }

/* Cảnh vườn minh họa tạm (sẽ thay bằng Soul Garden 3D): tông dịu, không hiệu ứng game hóa. */
.garden-scene { position: relative; height: 144px; border-radius: var(--radius-card); overflow: hidden; background: linear-gradient(180deg, #ece8df 0%, #ece8df 55%, #c9d1bd 55%, #a8b49a 100%); }
.garden-sky { position: absolute; top: 0; left: 0; right: 0; height: 55%; }
.g-sun { position: absolute; top: 14px; right: 20px; width: 30px; height: 30px; background: #e7c9a5; border-radius: 50%; }
.g-cloud { position: absolute; background: var(--color-surface); border-radius: 50px; opacity: 0.85; }
.g-cloud-1 { top: 16px; left: 20px; width: 56px; height: 18px; animation: g-drift 12s var(--ease-standard) infinite alternate; }
.g-cloud-2 { top: 30px; left: 92px; width: 38px; height: 12px; animation: g-drift 16s var(--ease-standard) infinite alternate-reverse; }
.garden-scene :deep(.garden-tree) { position: absolute; bottom: 0; display: flex; flex-direction: column; align-items: center; }
.garden-scene :deep(.gt-trunk) { background: #7a6a55; border-radius: 3px; }
.garden-scene :deep(.gt-top) { border-left: solid transparent; border-right: solid transparent; border-bottom: solid; }
.garden-scene :deep(.gt-flower) { display: none; }
@keyframes g-drift { from { transform: translateX(0); } to { transform: translateX(14px); } }

.side-muted { background: var(--color-canvas); }
.divided { padding-top: 16px; }
.mini-card { padding: 0; }
.row-between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.grow { flex: 1; min-width: 0; }
.mini-strong { display: block; font-size: 15px; font-weight: 600; color: var(--color-text); }
.mini-mid { display: block; font-size: 14px; font-weight: 600; color: var(--color-text); }
.mini-sub { display: block; font-size: 13px; color: var(--color-text-muted); line-height: 1.6; margin: 0; }
.challenge-track { height: 6px; margin-top: 8px; border-radius: 999px; background: var(--color-surface-muted); overflow: hidden; }
.challenge-fill { height: 100%; border-radius: 999px; background: var(--color-terracotta); }
.status-pill { padding: 2px 8px; border-radius: var(--radius-control); font-size: 12px; font-weight: 600; }
.donate-head { display: flex; align-items: center; gap: 8px; }

/* ---------- Trích dẫn cuối trang ---------- */
.dash-quote { padding: 24px 0 8px; text-align: center; }
.dash-quote p { font-family: var(--font-display); font-style: italic; font-size: 22px; color: var(--color-text-muted); max-width: 560px; margin: 0 auto; }

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .dash-grid { grid-template-columns: 1fr; }
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .main-content { padding: 16px 16px 24px; }
  .card-pad { padding: 22px; }
  .checkin-card { padding: 28px 18px 22px; }
  .ci-title { font-size: 26px; }
  .ci-hello { font-size: 18px; }
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .radar-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .mood-picker { gap: 8px; }
  .mood-icon.material-symbols-outlined { font-size: 48px; width: 52px; height: 52px; }
  .mood-btn.is-active .mood-icon.material-symbols-outlined { font-size: 60px; width: 64px; height: 64px; }
  .mood-label { font-size: 12px; }
  .ai-row { flex-direction: column; gap: 14px; }
  .task-grid { grid-template-columns: 1fr; }
  /* Mobile: mỗi nhiệm vụ gợi ý là một thanh ngang gọn — ảnh vuông nhỏ bên trái, tên + thời lượng/XP
     bên phải, ẩn đoạn lý do dài (vào chi tiết mới cần đọc). */
  .task-grid { gap: 10px; }
  .td-card { flex-direction: row; align-items: center; gap: 12px; padding: 8px; }
  .td-card:hover { transform: none; }
  .task-thumb { flex: 0 0 72px; width: 72px; height: 72px; aspect-ratio: auto; border-radius: var(--radius-control); overflow: hidden; }
  .task-badge { top: 4px; left: 4px; font-size: 10px; padding: 1px 5px; }
  .td-card-body { padding: 0 4px 0 0; gap: 4px; min-width: 0; }
  .task-name { font-size: 14.5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .task-reason { display: none; }
  .td-card-foot { padding-top: 0; }
  .kpi-value b { font-size: 30px; }
  .dash-quote p { font-size: 19px; }
}

/* Các tiêu đề section vừa đưa ra ngoài card (PeaceCat, Nhiệm vụ hôm nay, Xu hướng tâm trạng,
   Sức khỏe tổng thể) dùng chung 1 size để đồng bộ, thay vì mỗi nơi 1 size như trước. Đặt sau
   .ai-title/.side-title/.sec-title để thắng được font-size riêng của từng class đó. */
.pf-section-title { font-size: 26px; }

/* Tôn trọng người dùng giảm chuyển động */
@media (prefers-reduced-motion: reduce) {
  .dash *, .dash *::before, .dash *::after { animation: none !important; transition: none !important; }
  .mood-btn:hover { transform: none; }
}
</style>
