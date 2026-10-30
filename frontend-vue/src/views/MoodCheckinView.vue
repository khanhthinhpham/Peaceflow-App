<template> 
  <main class="main-content mc-page" style="margin-left: 0;" >
    <div class="page-header">
      <div class="mc-share-row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <label class="badge-pill" :title="t('moodCheckin.shareWithExperts.desc')" style="cursor:pointer;gap:6px;background:var(--color-surface-muted);color:var(--color-text);white-space:nowrap;flex-shrink:0;">
          <span style="font-size:0.72rem;font-weight:700;white-space:nowrap;">{{ t('moodCheckin.shareWithExperts.title') }}</span>
          <label class="toggle-switch" style="transform:scale(0.72);margin:-4px -6px;">
            <input type="checkbox" v-model="shareMoodWithExperts" :disabled="shareMoodSaving" @change="toggleShareMoodWithExperts">
            <span class="toggle-slider"></span>
          </label>
        </label>
      </div>
    </div>

    <div class="panel active">
      <div class="checkin-card" :class="{ 'is-wide': step === 4 }">
        <div v-if="step !== 5" class="step-indicator">
          <div class="si-dot" :class="dotClass(1)">1</div>
          <div class="si-line" :class="{ done: step >= 2 }"></div>
          <div class="si-dot" :class="dotClass(2)">2</div>
          <div class="si-line" :class="{ done: step >= 3 }"></div>
          <div class="si-dot" :class="dotClass(3)">3</div>
          <div class="si-line" :class="{ done: step >= 4 }"></div>
          <div class="si-dot" :class="dotClass(4)">4</div>
          <div class="si-line" :class="{ done: step >= 5 }"></div>
          <div class="si-dot" :class="dotClass(5)">✓</div>
        </div>

        <!-- Step 1: Mood -->
        <div class="checkin-step" :class="{ active: step === 1 }">
          <div class="emo">
            <div class="emo-head">
              <p class="emo-hello">{{ t('moodCheckin.step1.emotion.hello', { name: displayName }) }}</p>
              <h2 class="emo-title">{{ t('moodCheckin.step1.emotion.title') }}</h2>
              <p class="emo-sub">{{ t('moodCheckin.step1.emotion.sub') }}</p>
            </div>

            <EmotionFigure v-if="step === 1" class="emo-figure" :value="emotionValue" />

            <div class="emo-control">
              <input
                v-model.number="emotionValue"
                type="range" min="0" max="100" step="1"
                class="emo-range"
                :style="{ '--pct': emotionValue + '%' }"
                :aria-label="t('moodCheckin.step1.emotion.ariaLabel')"
                :aria-valuetext="emotionLabel"
              >
              <div class="emo-ends" aria-hidden="true">
                <span>{{ t('moodCheckin.step1.emotion.low') }}</span>
                <span>{{ t('moodCheckin.step1.emotion.high') }}</span>
              </div>
            </div>

            <Transition name="emo-label" mode="out-in">
              <p :key="emotionZone.key" class="emo-state">{{ emotionLabel }}</p>
            </Transition>

            <button class="btn-primary emo-next" @click="confirmEmotion">{{ t('moodCheckin.step1.continueBtn') }}</button>
          </div>
        </div>

        <!-- Step 2: Intensity -->
        <div class="checkin-step" :class="{ active: step === 2 }">
          <div class="emo">
            <div class="emo-head">
              <h2 class="emo-title">{{ t('moodCheckin.step2.title') }}</h2>
              <p class="emo-sub">{{ mascotMoodText }}</p>
            </div>

            <EmotionFigure v-if="step === 2" class="emo-figure" :value="emotionValue" :intensity="(checkinData.score - 1) / 9" :scene="emotionZone.key" />

            <div class="emo-control">
              <input
                v-model.number="checkinData.score"
                type="range" min="1" max="10" step="1"
                class="emo-range"
                :class="{ 'is-unset': !intensityPicked }"
                :aria-label="t('moodCheckin.step2.title')"
                @input="intensityPicked = true"
              >
              <div class="emo-ends" aria-hidden="true">
                <span>{{ t('moodCheckin.step2.sliderLow') }}</span>
                <span>{{ t('moodCheckin.step2.sliderHigh') }}</span>
              </div>
            </div>

            <p v-if="intensityPicked" class="emo-state">{{ checkinData.score }}<span class="emo-state-max">/10</span></p>
            <p v-else class="emo-state emo-state-hint">{{ t('moodCheckin.step2.pickHint') }}</p>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button class="btn-outline" @click="goStep(1)">{{ t('moodCheckin.step2.backBtn') }}</button>
            <button class="btn-primary" :disabled="!intensityPicked" @click="goStep(3)">{{ t('moodCheckin.step2.continueBtn') }}</button>
          </div>
        </div>

        <!-- Step 3: Tags -->
        <div class="checkin-step" :class="{ active: step === 3 }">
          <div class="gw-head">
            <h2 class="emo-title">{{ t('moodCheckin.step3.garden.title') }}</h2>
            <p class="emo-sub">{{ t('moodCheckin.step3.garden.sub') }}</p>
          </div>

          <div class="gw">
            <figure class="gw-garden">
              <svg viewBox="0 0 260 260" class="gw-svg" :class="['w-' + gardenWeather, 'w-lv-' + weatherLevel]" role="img" :aria-label="t('moodCheckin.step3.garden.caption')">
                <path d="M-10,60 C30,52 60,66 100,58" class="gw-wind gw-wind-1" :style="windStreakStyle" />
                <path d="M150,40 C190,32 220,46 270,38" class="gw-wind gw-wind-2" :style="windStreakStyle" />
                <ellipse cx="130" cy="240" rx="112" ry="16" class="gw-ground" />
                <path d="M70,238 l-4,-11 M77,238 l0,-14 M84,238 l5,-10 M176,238 l-5,-10 M183,238 l0,-14 M190,238 l4,-11 M110,242 l-2,-7 M150,242 l2,-7" class="gw-grass" />
                <circle cx="96" cy="244" r="2.5" class="gw-pebble" /><circle cx="168" cy="245" r="2" class="gw-pebble" />

                <!-- Trời nắng (cảm xúc tốt): mặt trời với tia nắng xoay chậm -->
                <g v-if="gardenWeather === 'sunny' || gardenWeather === 'bloom'" transform="translate(226 18)">
                  <g class="gw-sun-rays"><path :d="SUN_RAYS" /></g>
                  <circle r="13" class="gw-sun" />
                </g>

                <g class="gw-tree" :class="{ 'is-gusty': weatherLevel > 0 }" :style="treeWindStyle">
                  <g class="gw-canopy" :style="{ transform: `scale(${1 + checkinData.tags.length * 0.04})` }">
                    <circle v-for="(c, i) in CANOPY_BASE" :key="'cb' + i" :cx="c.x" :cy="c.y" :r="c.r" class="gw-canopy-blob" />
                    <circle
                      v-for="(c, i) in CANOPY_CLUMPS" :key="'clump' + i"
                      :cx="c.x" :cy="c.y" :r="c.r" :fill="c.color"
                      class="gw-clump" :class="{ on: i < checkinData.tags.length }"
                    />
                    <!-- Lá phủ kín từng khối tán; khối của khóm mới chỉ hiện khi khóm đó mọc. -->
                    <g v-for="(blob, b) in CANOPY_LEAF_BLOBS" :key="'blob' + b" :transform="`translate(${blob.x} ${blob.y})`">
                      <g class="gw-sway-soft" :style="{ animationDelay: (b * -0.8) + 's', animationDuration: (3.2 + (b % 4) * 0.5) + 's' }">
                        <g v-for="(lf, i) in blob.leaves" :key="i" :transform="`translate(${lf.x} ${lf.y}) rotate(${lf.a}) scale(${lf.s})`">
                          <path
                            :d="LEAF_D" :fill="lf.color" class="gw-leaf gw-grow"
                            :class="{ on: blob.clump < 0 || blob.clump < checkinData.tags.length }"
                            :style="{ transitionDelay: (blob.clump < 0 ? 0 : i * 22) + 'ms' }"
                          />
                        </g>
                      </g>
                    </g>
                    <!-- Vui: mỗi lựa chọn làm nở thêm hoa trên tán (rất vui nở gấp đôi). -->
                    <g v-for="(bl, i) in BLOSSOMS" :key="'bl' + i" :transform="`translate(${bl.x} ${bl.y})`">
                      <g class="gw-grow" :class="{ on: i < blossomCount }" :style="{ transitionDelay: (i % 2) * 120 + 'ms' }">
                        <circle v-for="(pt, j) in BLOSSOM_PETALS" :key="j" :cx="pt[0]" :cy="pt[1]" r="3.4" :fill="bl.color" class="gw-petal" />
                        <circle r="2.2" class="gw-bud-core" />
                      </g>
                    </g>
                  </g>
                  <path d="M122,240 C124,208 127,178 126,148 C125,124 127,102 127,80 L133,80 C133,102 135,124 134,148 C133,178 136,208 138,240 Z" class="gw-trunk" />
                  <path d="M131,232 C132,206 132,180 131,150" class="gw-bark" />
                  <path :d="GARDEN_BRANCHES" class="gw-branch" />

                  <g v-for="(leaf, n) in GARDEN_BASE_LEAVES" :key="'base' + n" :transform="`translate(${leaf.x} ${leaf.y}) rotate(${leaf.a}) scale(${leaf.s})`">
                    <g class="gw-sway" :style="{ animationDelay: (n * -0.7) + 's', animationDuration: (2.2 + (n % 3) * 0.5) + 's' }">
                      <path :d="LEAF_D" class="gw-leaf" :fill="leaf.color" /><path d="M0,-2 L0,-20" class="gw-rib" />
                    </g>
                  </g>

                  <g v-for="(slot, n) in gardenSlots" :key="slot.id" :transform="`translate(${slot.x} ${slot.y}) rotate(${slot.a}) scale(1.15)`">
                    <circle v-if="hoveredTag === slot.id && !slot.on" cx="0" cy="-14" r="18" class="gw-ghost" />
                    <g class="gw-sway" :style="{ animationDelay: (n * -0.6) + 's', animationDuration: (2 + (n % 4) * 0.4) + 's' }">
                      <g v-for="(part, i) in GARDEN_CLUSTERS[slot.kind]" :key="i" :transform="`translate(${part.dx} ${part.dy}) rotate(${part.a}) scale(${part.s})`">
                        <g class="gw-grow" :class="{ on: slot.on }" :style="{ transitionDelay: slot.on ? (i * 110) + 'ms' : '0ms' }">
                          <template v-if="part.type === 'bud' && !gloomy">
                            <path d="M0,0 L0,-10" class="gw-stem" />
                            <circle v-for="(pt, j) in BUD_PETALS" :key="j" :cx="pt[0]" :cy="pt[1]" r="5" :fill="slot.color" />
                            <circle cx="0" cy="-15" r="3.5" class="gw-bud-core" />
                          </template>
                          <template v-else>
                            <path :d="LEAF_D" class="gw-leaf" :fill="slotLeafColor(slot, part, i)" /><path d="M0,-2 L0,-20" class="gw-rib" />
                          </template>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>

                <!-- Rất vui: bướm bay quanh cây -->
                <template v-if="gardenWeather === 'bloom'">
                  <g v-for="n in 2" :key="'fly' + n" class="gw-fly" :class="'gw-fly-' + n">
                    <g class="gw-wings" :fill="n === 1 ? '#FF9EC4' : '#FFC46B'">
                      <ellipse cx="-5" cy="-2" rx="5" ry="4" /><ellipse cx="5" cy="-2" rx="5" ry="4" />
                      <ellipse cx="-3.5" cy="4" rx="3.2" ry="2.8" /><ellipse cx="3.5" cy="4" rx="3.2" ry="2.8" />
                    </g>
                  </g>
                </template>

                <!-- Không ổn / rất tệ: mây (đen dần khi tệ), mưa nặng dần theo số lựa chọn -->
                <template v-if="gardenWeather === 'storm' || gardenWeather === 'drizzle'">
                  <g v-for="(c, i) in visibleClouds" :key="'cl' + i" :transform="`translate(${c.x} ${c.y}) scale(${c.s})`">
                    <g class="gw-cloud" :style="{ fill: c.color, animationDelay: (i * -2.3) + 's' }">
                      <circle cx="-18" cy="2" r="12" /><circle cx="0" cy="-6" r="16" /><circle cx="18" cy="2" r="12" />
                      <rect x="-30" y="0" width="60" height="14" rx="7" />
                    </g>
                  </g>
                  <line
                    v-for="(d, i) in rainDrops" :key="'rain' + i"
                    :x1="d.x" :y1="d.y" :x2="d.x - (gardenWeather === 'storm' ? 3 : 1)" :y2="d.y + 9"
                    class="gw-drop"
                    :style="{ animationDelay: d.delay + 's', animationDuration: (gardenWeather === 'storm' ? d.dur : d.dur * 1.7) + 's' }"
                  />
                </template>
                <template v-if="gardenWeather === 'storm'">
                  <path v-for="(lf, i) in blownLeaves" :key="'blow' + i" :d="LEAF_D" :fill="lf.color" class="gw-blown" :transform="`translate(0 ${lf.y})`" :style="{ animationDelay: lf.delay + 's' }" />
                  <template v-if="lightning">
                    <path d="M214,30 L204,56 L213,56 L200,86" class="gw-bolt" :style="{ animationDuration: lightning.dur }" />
                    <path v-if="lightning.twin" d="M58,34 L50,56 L58,56 L46,84" class="gw-bolt" :style="{ animationDuration: lightning.dur, animationDelay: '-1.7s' }" />
                    <rect x="-20" y="-30" width="300" height="290" class="gw-flash" :style="{ animationDuration: lightning.dur }" />
                  </template>
                </template>
              </svg>
              <figcaption class="gw-caption">{{ t('moodCheckin.step3.garden.caption') }}</figcaption>
            </figure>

            <div class="gw-list">
              <p class="gw-list-title">{{ t('moodCheckin.step3.garden.listTitle') }}</p>
              <div class="gw-chips">
                <button
                  v-for="tag in TAGS"
                  :key="tag.id"
                  type="button"
                  class="gw-chip"
                  :class="{ on: checkinData.tags.includes(tag) }"
                  :aria-pressed="checkinData.tags.includes(tag)"
                  @click="toggleTag(tag)"
                  @mouseenter="hoveredTag = tag.id"
                  @mouseleave="hoveredTag = null"
                  @focus="hoveredTag = tag.id"
                  @blur="hoveredTag = null"
                >
                  {{ plainLabel(tag.labelKey) }}
                </button>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button class="btn-outline" @click="goStep(2)">{{ t('moodCheckin.step3.backBtn') }}</button>
            <button class="btn-primary" @click="goStep(4)">{{ t('moodCheckin.step3.continueBtn') }}</button>
          </div>
        </div>

        <!-- Step 4: Lắng nghe cơ thể — khung rộng 3 cột, vừa một màn hình, không cần cuộn -->
        <div class="checkin-step" :class="{ active: step === 4 }">
          <div class="bs-head">
            <h2 class="emo-title">{{ t('moodCheckin.stepBody.title') }}</h2>
            <p class="emo-sub">{{ t('moodCheckin.stepBody.signals.sub') }}</p>
          </div>

          <div class="bs">
            <figure class="bs-body">
              <div class="bs-battery" :class="'is-' + energyTone" role="img" :aria-label="t('moodCheckin.stepBody.signals.energyAria', { pct: energyPct })">
                <span class="bs-battery-label">{{ t('moodCheckin.stepBody.signals.energy') }}</span>
                <span class="bs-battery-cell"><span class="bs-battery-fill" :style="{ width: energyPct + '%' }"></span></span>
                <span class="bs-battery-pct">{{ energyPct }}%</span>
              </div>
              <svg viewBox="0 0 200 300" class="bs-svg" role="group" :aria-label="t('moodCheckin.stepBody.signals.figureLabel')">
                <defs>
                  <clipPath id="bs-sil"><path :d="BODY_SILHOUETTE" /></clipPath>
                  <clipPath v-for="zone in BODY_FIGURE_ZONES" :id="'bs-clip-' + zone.key" :key="'clip' + zone.key"><path :d="zone.region" /></clipPath>
                </defs>
                <ellipse cx="100" cy="291" rx="34" ry="4" class="bs-shadow" />
                <g class="bs-figure" :class="{ 'is-whole': activeZone && !activeZone.onBody, 'has-active': activeZone && activeZone.onBody }">
                  <!-- Một silhouette liền nét; mỗi vùng = phần silhouette nằm trong khung vùng đó. -->
                  <g clip-path="url(#bs-sil)">
                    <path :d="BODY_SILHOUETTE" class="bs-base" />
                    <g
                      v-for="zone in BODY_FIGURE_ZONES" :key="zone.key"
                      class="bs-zone" :class="['bs-' + zone.key, { on: activeBodyZone === zone.key }]"
                      role="button" tabindex="0"
                      :aria-label="t('moodCheckin.stepBody.signals.zones.' + zone.key + '.name')"
                      :aria-pressed="activeBodyZone === zone.key"
                      @click="selectBodyZone(zone.key)"
                      @keydown.enter.prevent="selectBodyZone(zone.key)"
                      @keydown.space.prevent="selectBodyZone(zone.key)"
                    >
                      <path :d="zone.region" />
                    </g>
                    <!-- Tụt pin: vùng có biểu hiện bị "rút năng lượng" từ trên xuống, mép sóng chạy nhẹ. -->
                    <g v-for="zone in BODY_FIGURE_ZONES" :key="'drain' + zone.key" :clip-path="`url(#bs-clip-${zone.key})`" class="bs-drain-clip">
                      <g class="bs-drain" :style="{ transform: `translateY(${zoneDrainY(zone)}px)` }">
                        <rect x="-40" y="-400" width="320" height="400" />
                        <path :d="DRAIN_WAVE" class="bs-wave" />
                      </g>
                    </g>
                  </g>
                  <path :d="BODY_SILHOUETTE" class="bs-outline" />
                </g>
                <g v-for="zone in BODY_FIGURE_ZONES" :key="'dot' + zone.key" class="bs-dot" :class="{ on: bodyZoneCount(zone) > 0 }" :transform="`translate(${zone.dot[0]} ${zone.dot[1]})`">
                  <circle r="10" />
                  <text y="4">{{ bodyZoneCount(zone) }}</text>
                </g>
              </svg>
              <figcaption class="bs-hint">{{ t('moodCheckin.stepBody.signals.tapHint') }}</figcaption>
            </figure>

            <div class="bs-zones">
              <template v-for="section in BODY_SECTIONS" :key="section.key">
                <p class="bs-section">{{ t('moodCheckin.stepBody.signals.' + section.key) }}</p>
                <template v-for="zone in section.zones" :key="zone.key">
                  <button
                    type="button" class="bs-zone-btn" :class="{ on: activeBodyZone === zone.key }"
                    :aria-pressed="activeBodyZone === zone.key"
                    @click="selectBodyZone(zone.key)"
                  >
                    <span class="bs-zone-text">
                      <span class="bs-zone-name">{{ t('moodCheckin.stepBody.signals.zones.' + zone.key + '.name') }}</span>
                      <span class="bs-zone-hint">{{ t('moodCheckin.stepBody.signals.zones.' + zone.key + '.hint') }}</span>
                    </span>
                    <span v-if="bodyZoneCount(zone)" class="bs-count">{{ bodyZoneCount(zone) }}</span>
                  </button>
                </template>
              </template>
            </div>

            <div class="bs-detail">
              <p class="bs-detail-label">{{ t('moodCheckin.stepBody.signals.listTitle') }}</p>
              <template v-if="activeZone">
                <p class="bs-detail-title">{{ t('moodCheckin.stepBody.signals.zones.' + activeZone.key + '.name') }}</p>
                <div :key="activeZone.key" class="bs-options">
                  <button
                    v-for="tag in activeZone.tags" :key="tag.id"
                    type="button" class="bs-option"
                    :class="{ on: checkinData.bodySymptoms.includes(tag) }"
                    :aria-pressed="checkinData.bodySymptoms.includes(tag)"
                    @click="toggleBodySymptom(tag)"
                  >
                    <span class="bs-check" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4,8.5 L7,11 L12,5.5" /></svg></span>
                    {{ plainLabel(tag.labelKey) }}
                  </button>
                </div>
              </template>
              <p v-else class="bs-empty">{{ t('moodCheckin.stepBody.signals.pickZone') }}</p>

              <div class="bs-picked">
                <p class="bs-picked-title">{{ t('moodCheckin.stepBody.signals.selectedTitle') }}</p>
                <TransitionGroup v-if="checkinData.bodySymptoms.length" name="bs-tag" tag="div" class="bs-tags">
                  <button
                    v-for="tag in checkinData.bodySymptoms" :key="tag.id"
                    type="button" class="bs-tag"
                    :aria-label="t('moodCheckin.stepBody.signals.remove', { label: plainLabel(tag.labelKey) })"
                    @click="toggleBodySymptom(tag)"
                  >{{ plainLabel(tag.labelKey) }}<span aria-hidden="true" class="bs-tag-x">×</span></button>
                </TransitionGroup>
                <p v-else class="bs-none">{{ t('moodCheckin.stepBody.signals.none') }}</p>
              </div>
            </div>
          </div>

          <!-- Mobile: bấm một vùng thì mở popup (bottom sheet) chọn biểu hiện; desktop dùng cột chi tiết. -->
          <Teleport to="body">
            <Transition name="bs-sheet">
              <div v-if="step === 4 && activeZone && isMobileStack" class="bs-sheet-overlay" @click.self="activeBodyZone = null">
                <div class="bs-sheet" role="dialog" aria-modal="true" :aria-label="t('moodCheckin.stepBody.signals.zones.' + activeZone.key + '.name')">
                  <div class="bs-sheet-grip" aria-hidden="true"></div>
                  <p class="bs-detail-label">{{ t('moodCheckin.stepBody.signals.listTitle') }}</p>
                  <p class="bs-detail-title">{{ t('moodCheckin.stepBody.signals.zones.' + activeZone.key + '.name') }}</p>
                  <div class="bs-sheet-options">
                    <button
                      v-for="tag in activeZone.tags" :key="tag.id"
                      type="button" class="bs-option"
                      :class="{ on: checkinData.bodySymptoms.includes(tag) }"
                      :aria-pressed="checkinData.bodySymptoms.includes(tag)"
                      @click="toggleBodySymptom(tag)"
                    >
                      <span class="bs-check" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4,8.5 L7,11 L12,5.5" /></svg></span>
                      {{ plainLabel(tag.labelKey) }}
                    </button>
                  </div>
                  <button type="button" class="btn-primary bs-sheet-done" @click="activeBodyZone = null">{{ t('moodCheckin.stepBody.signals.done') }}</button>
                </div>
              </div>
            </Transition>
          </Teleport>

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button class="btn-outline" @click="goStep(3)">{{ t('moodCheckin.stepBody.backBtn') }}</button>
            <button class="btn-primary" :disabled="submitting" @click="submitCheckin">{{ submitting ? t('moodCheckin.stepBody.saving') : t('moodCheckin.stepBody.saveBtn') }}</button>
          </div>
        </div>

        <!-- Step 5: Result — gọn trong một màn hình, không còn thanh các bước -->
        <div class="checkin-step rs" :class="{ active: step === 5 }">
          <div class="rs-head">
            <EmotionFigure v-if="step === 5" class="rs-figure" :value="emotionValue" :intensity="(checkinData.score - 1) / 9" :scene="emotionZone.key" />
            <div class="rs-title">{{ resultTitle }}</div>
            <div class="rs-msg">{{ resultMsg }}</div>
            <div class="rs-badges">
              <span class="badge-pill badge-mint">{{ selectedMoodLabel || t('moodCheckin.step4.defaultMoodLabel') }}</span>
              <span class="badge-pill badge-peach">{{ t('moodCheckin.step4.levelBadge', { score: checkinData.score }) }}</span>
              <span class="badge-pill" style="background:var(--sky-light);color:#5090aa;">{{ statusBadgeText }}</span>
            </div>
          </div>
          <div class="rs-tasks">
            <div class="rs-tasks-heading">{{ plainLabel('moodCheckin.step4.tasksHeading') }}</div>
            <div v-if="!suggestedTasks.length" class="rs-empty">{{ t('moodCheckin.step4.noTasks') }}</div>
            <div
              v-for="task in suggestedTasks.slice(0, 3)"
              :key="task.id"
              class="rt-item"
              @click="router.push({ path: '/task-detail', query: { id: task.id } })"
            >
              <div class="rt-icon">
                <img v-if="taskThumbSrc(task) && !brokenTaskImages.has(task.id)" :src="taskThumbSrc(task)" :alt="task.title" loading="lazy" @error="brokenTaskImages.add(task.id)">
                <template v-else>{{ getTaskEmoji(task.category) }}</template>
              </div>
              <div class="rt-info">
                <div class="rt-name">{{ task.title }}</div>
                <div class="rt-meta">{{ task.category || 'general' }} • {{ task.duration_minutes || 0 }} {{ t('moodCheckin.step4.minutesUnit') }}</div>
              </div>
              <div class="rt-xp">+{{ task.xp_reward || 0 }} XP</div>
            </div>
          </div>
          <!-- MODE SELECTOR -->
          <div class="mode-selector rs-modes">
            <div class="mode-card active">
              <div class="mode-title">{{ t('moodCheckin.modes.quickTitle') }}</div>
              <div class="mode-time">{{ plainLabel('moodCheckin.modes.quickTime') }}</div>
            </div>
            <div class="mode-card" @click="$router.push('/mood-chat')">
              <div class="mode-title">{{ t('moodCheckin.modes.chatTitle') }}</div>
              <div class="mode-time">{{ plainLabel('moodCheckin.modes.chatTime') }}</div>
            </div>
            <div class="mode-card" @click="$router.push('/mood-assessment')">
              <div class="mode-title">{{ t('moodCheckin.modes.testTitle') }}</div>
              <div class="mode-time">{{ plainLabel('moodCheckin.modes.testTime') }}</div>
            </div>
          </div>
          <div class="rs-actions">
            <router-link to="/tasks" class="btn-primary">{{ plainLabel('moodCheckin.step4.viewAllTasksBtn') }}</router-link>
            <button class="btn-outline" @click="resetCheckin">{{ plainLabel('moodCheckin.step4.checkinAgainBtn') }}</button>
            <router-link to="/dashboard" class="btn-outline">{{ plainLabel('moodCheckin.step4.dashboardBtn') }}</router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEmergencyPopup" class="emergency-overlay show">
      <div class="emergency-popup">
        <div class="ep-header">
          <div class="ep-icon">❤️</div>
          <div class="ep-title">{{ t('moodCheckin.emergency.title') }}</div>
        </div>
        <p class="ep-text">{{ t('moodCheckin.emergency.text') }}</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">{{ t('moodCheckin.emergency.hotlineLabel') }}</div>
        </div>
        <div class="ep-actions">
          <a href="tel:0931773637" class="ep-btn ep-btn-primary">{{ t('moodCheckin.emergency.callBtn') }}</a>
          <router-link to="/experts" class="ep-btn ep-btn-secondary">{{ t('moodCheckin.emergency.chatExpertBtn') }}</router-link>
          <a href="tel:115" class="ep-btn ep-btn-secondary" style="background:var(--color-danger-soft);color:var(--color-danger);">{{ t('moodCheckin.emergency.emergencyCallBtn') }}</a>
          <button class="ep-btn ep-btn-close" @click="showEmergencyPopup = false">{{ t('moodCheckin.emergency.closeBtn') }}</button>
        </div>
        <p style="text-align:center;font-size:0.72rem;color:var(--color-text-subtle);margin-top:10px;font-style:italic;">{{ t('moodCheckin.emergency.footer') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { getTaskEmoji } from '../lib/dashboardHelpers';
import { taskThumbSrc } from '../lib/taskImages';
import EmotionFigure from '../components/EmotionFigure.vue';
import { MOOD_OPTIONS, TAGS, BODY_SYMPTOM_GROUPS, deriveMoodPayload as buildMoodPayload } from '../lib/moodCheckinOptions';

const { t } = useI18n();

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

const auth = useAuthStore();
const router = useRouter();
const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || t('dashboard.defaultUserLabel'));

const step = ref(1);
const submitting = ref(false);
const showEmergencyPopup = ref(false);
const suggestedTasks = ref([]);
// Nhiệm vụ gợi ý hiện ảnh thumb của nhiệm vụ; ảnh lỗi thì quay về emoji theo nhóm.
const brokenTaskImages = reactive(new Set());
const todayDone = ref(false);
// Nguyên văn tiếng Việt do BACKEND trả về (latest_mood.dominant_emotion — luôn tiếng Việt,
// xem giải thích ở MOOD_OPTIONS). Dịch lại để hiển thị qua computed todayLabelDisplay bên
// dưới, thay vì hiện thẳng ra đây.
const todayLabel = ref('');

// Trạng thái thay vì chuỗi tĩnh: gán ref.value = t('...') một lần lúc submit thì đổi ngôn
// ngữ giữa chừng (trước khi bấm nút, hoặc sau khi đã lưu) sẽ không tự cập nhật — cùng lỗi
// đã gặp và sửa ở demoSaveLabel bên IndexView.vue.
const resultPhase = ref('pending'); // 'pending' | 'saving' | 'saved' | 'failed'
const resultTitle = computed(() => t(`moodCheckin.step4.${resultPhase.value === 'pending' ? 'savedTitle' : resultPhase.value + 'Title'}`));
const resultMsg = computed(() => t(`moodCheckin.step4.${resultPhase.value === 'pending' ? 'savedMsg' : resultPhase.value + 'Msg'}`));
const statusBadgeText = computed(() => t(`moodCheckin.step4.${resultPhase.value}Badge`));

const checkinData = reactive({ score: 5, mood: null, moodId: null, tags: [], bodySymptoms: [] });

const selectedMoodOption = computed(() => MOOD_OPTIONS.find((o) => o.id === checkinData.moodId) || null);
const selectedMoodLabel = computed(() => {
  if (confirmedZone.value) return t(`moodCheckin.step1.emotion.zones.${confirmedZone.value}`);
  return selectedMoodOption.value ? t(selectedMoodOption.value.labelKey) : '';
});

// --- Bước 1: thanh trượt cảm xúc 0–100 + nhân vật SVG biến đổi theo giá trị ---
// Mỗi vùng ánh xạ về một MOOD_OPTIONS để payload gửi backend giữ nguyên định dạng cũ
// (viLabel làm dominant_emotion — "Buồn bã" vẫn bật cờ trầm cảm ở expert.routes.js).
const EMOTION_ZONES = [
  { key: 'veryBad', min: 0, moodId: 'sad' },
  { key: 'notGood', min: 20, moodId: 'slightlyStressed' },
  { key: 'neutral', min: 40, moodId: 'normal' },
  { key: 'good', min: 60, moodId: 'comfortable' },
  { key: 'veryGood', min: 80, moodId: 'veryHappy' }
];
const emotionValue = ref(50);
const confirmedZone = ref(null);
const emotionZone = computed(() => [...EMOTION_ZONES].reverse().find((z) => emotionValue.value >= z.min));
const emotionLabel = computed(() => t(`moodCheckin.step1.emotion.zones.${emotionZone.value.key}`));

function confirmEmotion() {
  const zone = emotionZone.value;
  const option = MOOD_OPTIONS.find((o) => o.id === zone.moodId);
  checkinData.moodId = option.id;
  checkinData.mood = option.emoji;
  // Mức độ để người dùng tự chọn ở bước 2: thanh trượt về giữa và ở trạng thái "chưa chọn".
  checkinData.score = 5;
  intensityPicked.value = false;
  confirmedZone.value = zone.key;
  goStep(2);
}
const intensityPicked = ref(false);
const mascotMoodText = computed(() => (
  selectedMoodLabel.value
    ? t('moodCheckin.step2.mascotWithMood', { mood: selectedMoodLabel.value })
    : t('moodCheckin.step2.mascotDefault')
));

function dotClass(dot) {
  if (dot < step.value) return 'done';
  if (dot === step.value) return 'active';
  return '';
}

// --- Bước 3: "Khu vườn bên trong bạn" ---
// Mỗi yếu tố có MỘT chỗ cố định trên cây: chọn thì lá/nụ ở đó mọc ra, bỏ chọn thì thu lại.
// Cây chỉ phản ánh những điều đang hiện diện — không xanh hơn/héo đi theo yếu tố "tốt/xấu",
// nên màu lá/nụ chỉ để phân biệt, không mang nghĩa đánh giá.
const LEAF_D = 'M0,0 C-8,-6 -8,-17 0,-25 C8,-17 8,-6 0,0Z';
const BUD_PETALS = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
  return [(Math.cos(a) * 5.5).toFixed(1), (-15 + Math.sin(a) * 5.5).toFixed(1)];
});
const GARDEN_BRANCHES = [
  'M130,192 C112,184 98,172 86,158',
  'M131,178 C150,170 166,158 178,144',
  'M130,152 C112,142 100,126 94,110',
  'M130,138 C148,128 160,114 166,98',
  'M130,112 C121,101 115,89 112,76',
  'M130,104 C140,93 146,81 150,68'
].join(' ');
const GARDEN_BASE_LEAVES = [
  { x: 124, y: 212, a: -70, s: 0.85, color: '#9FD1AE' },
  { x: 137, y: 200, a: 68, s: 0.85, color: '#B6DDBF' },
  { x: 140, y: 124, a: 62, s: 0.8, color: '#9FD1AE' },
  { x: 121, y: 94, a: -58, s: 0.8, color: '#B6DDBF' },
  { x: 128, y: 82, a: -12, s: 0.85, color: '#8CCB9E' },
  { x: 100, y: 120, a: 150, s: 0.7, color: '#B6DDBF' },
  { x: 160, y: 108, a: -150, s: 0.7, color: '#9FD1AE' }
];
// Tán dày dần: mỗi yếu tố được chọn thêm 1 khóm tán (kèm lá phủ kín), nên chọn càng nhiều
// cây càng xum xuê (tối đa 10 khóm).
const CANOPY_CLUMPS = [
  [96, 92, 26], [164, 90, 26], [112, 56, 24], [150, 58, 22], [78, 128, 22],
  [184, 120, 22], [100, 160, 20], [162, 156, 20], [130, 38, 22], [130, 136, 24]
].map(([x, y, r], i) => ({ x, y, r, color: ['#BFE3C9', '#B3DDBF', '#C9E9D2'][i % 3] }));
// Lá phủ kín tán: rải lá dày (phân bố hướng dương) trong từng khối tròn của tán — 4 khối
// nền luôn có lá, mỗi khóm mới (CANOPY_CLUMPS) có lá riêng mọc cùng khóm. Lá hướng ra ngoài
// theo vị trí trong khối nhưng không cắm thẳng xuống; lõi đậm, rìa nhạt để tán có khối.
const CANOPY_BASE = [[130, 104, 64], [90, 140, 40], [172, 132, 42], [128, 62, 40]].map(([x, y, r]) => ({ x, y, r }));
const LEAF_SHADES = { core: ['#6FB58A', '#7BBF95'], mid: ['#8CCB9E', '#9FD1AE'], rim: ['#A8D5BA', '#B6DDBF'] };
function leavesIn(r, seed) {
  const n = Math.round((Math.PI * r * r) / 190);
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const rr = r * 0.9 * Math.sqrt(t);
    const ang = i * 2.39996 + seed;
    let a = ((ang * 180) / Math.PI + 90) % 360;
    if (a > 180) a -= 360;
    if (rr < r * 0.25) a = ((i * 37) % 80) - 40;
    a = Math.max(-115, Math.min(115, a));
    const tone = t > 0.7 ? 'rim' : t > 0.35 ? 'mid' : 'core';
    return {
      x: (Math.cos(ang) * rr).toFixed(1),
      y: (Math.sin(ang) * rr).toFixed(1),
      a: a.toFixed(0),
      s: (0.85 + (i % 3) * 0.12).toFixed(2),
      color: LEAF_SHADES[tone][i % 2]
    };
  });
}
const CANOPY_LEAF_BLOBS = [
  ...CANOPY_BASE.map((c, i) => ({ x: c.x, y: c.y, clump: -1, leaves: leavesIn(c.r, i * 0.7) })),
  ...CANOPY_CLUMPS.map((c, i) => ({ x: c.x, y: c.y, clump: i, leaves: leavesIn(c.r, 3 + i * 0.9) }))
];
// Mỗi lựa chọn mọc cả một cụm (mọc lần lượt), không chỉ một chiếc lá.
const GARDEN_CLUSTERS = {
  leaf: [
    { type: 'leaf', a: 0, s: 1, dx: 0, dy: 0 },
    { type: 'leaf', a: -40, s: 0.72, dx: -2, dy: -8 },
    { type: 'leaf', a: 38, s: 0.68, dx: 2, dy: -13 }
  ],
  bud: [
    { type: 'leaf', a: -50, s: 0.72, dx: -1, dy: -3 },
    { type: 'leaf', a: 48, s: 0.66, dx: 1, dy: -5 },
    { type: 'bud', a: 0, s: 1.05, dx: 0, dy: 0 }
  ]
};
const GARDEN_SLOT_MAP = {
  work: { x: 86, y: 158, a: -62, kind: 'leaf', color: '#7BBF95' },
  family: { x: 178, y: 144, a: 52, kind: 'bud', color: '#FFB7C9' },
  relationship: { x: 94, y: 110, a: -38, kind: 'bud', color: '#FF9E9E' },
  finance: { x: 166, y: 98, a: 40, kind: 'leaf', color: '#A8D5BA' },
  health: { x: 112, y: 76, a: -20, kind: 'leaf', color: '#8CCB9E' },
  lonely: { x: 150, y: 68, a: 24, kind: 'leaf', color: '#B9D9C2' },
  sleep_loss: { x: 106, y: 178, a: -112, kind: 'leaf', color: '#9CC9B0' },
  social_media: { x: 156, y: 164, a: 112, kind: 'leaf', color: '#A8D5BA' },
  study: { x: 130, y: 84, a: 0, kind: 'bud', color: '#FFD27A' },
  unknown: { x: 108, y: 132, a: -100, kind: 'leaf', color: '#C2DFC9' }
};
// Thời tiết quanh cây theo cảm xúc ở bước 1: rất tệ → giông (mây đen, mưa nặng dần theo số
// lựa chọn, sấm chớp, gió to làm cây lắc mạnh + lá bay), không ổn → mưa phùn, bình thường →
// lặng gió, khá ổn → nắng + hoa nở, rất vui → nắng + hoa nở dày + bướm.
const GARDEN_WEATHER = { veryBad: 'storm', notGood: 'drizzle', neutral: 'calm', good: 'sunny', veryGood: 'bloom' };
const gardenWeather = computed(() => GARDEN_WEATHER[confirmedZone.value || emotionZone.value.key]);
const RAIN_DROPS = Array.from({ length: 28 }, (_, i) => ({
  x: 14 + ((i * 53) % 232),
  y: 22 + (i % 4) * 6,
  delay: ((i * 0.37) % 1.2).toFixed(2),
  dur: 0.75 + (i % 5) * 0.07
}));
// Buồn/không ổn: chưa chọn gì thì trời còn yên; mỗi lựa chọn làm thời tiết xấu thêm — mây
// đông và đen dần, mưa dày, gió lắc cây mạnh hơn; rất tệ thì từ lựa chọn thứ 3 có sấm chớp
// (chớp dày dần, từ lựa chọn thứ 6 thêm tia thứ hai) và lá bị gió thổi bay.
const gloomy = computed(() => gardenWeather.value === 'storm' || gardenWeather.value === 'drizzle');
const weatherLevel = computed(() => {
  const n = checkinData.tags.length;
  if (!gloomy.value || n === 0) return 0;
  return n <= 3 ? 1 : n <= 6 ? 2 : 3;
});
const rainDrops = computed(() => {
  const n = checkinData.tags.length;
  if (gardenWeather.value === 'storm') return RAIN_DROPS.slice(0, Math.min(28, n * 3));
  if (gardenWeather.value === 'drizzle') return RAIN_DROPS.slice(0, Math.min(14, Math.round(n * 1.4)));
  return [];
});
const CLOUD_SLOTS = [{ x: 150, y: 2, s: 1.3 }, { x: 72, y: 10, s: 1.05 }, { x: 214, y: 14, s: 0.95 }, { x: 28, y: 26, s: 0.85 }, { x: 108, y: -10, s: 0.9 }];
const visibleClouds = computed(() => {
  const n = checkinData.tags.length;
  if (!gloomy.value || n === 0) return [];
  const storm = gardenWeather.value === 'storm';
  const count = storm ? Math.min(5, 1 + Math.floor(n / 2)) : Math.min(3, 1 + Math.floor(n / 3));
  const k = Math.min(1, n / 10);
  const shade = Math.round(storm ? 190 - 85 * k : 214 - 24 * k);
  return CLOUD_SLOTS.slice(0, count).map((c) => ({ ...c, color: `rgb(${shade},${shade + 8},${Math.min(255, shade + 24)})` }));
});
const lightning = computed(() => {
  const n = checkinData.tags.length;
  if (gardenWeather.value !== 'storm' || n < 3) return null;
  return { dur: (7 - (n - 3) * 0.6).toFixed(1) + 's', twin: n >= 6 };
});
const treeWindStyle = computed(() => {
  const n = checkinData.tags.length;
  if (weatherLevel.value === 0) return {};
  const storm = gardenWeather.value === 'storm';
  return { '--amp': storm ? 1 + n * 0.35 : 1 + n * 0.12, animationDuration: (storm ? 7 - n * 0.44 : 7 - n * 0.2).toFixed(2) + 's' };
});
const windStreakStyle = computed(() => (weatherLevel.value === 0 ? {} : { animationDuration: Math.max(2, 7 - checkinData.tags.length * 0.5) + 's' }));
const BLOWN_LEAVES = Array.from({ length: 6 }, (_, i) => ({ y: 56 + i * 26, delay: (i * 0.65).toFixed(2), color: ['#9FD1AE', '#B6DDBF', '#7BBF95'][i % 3] }));
const blownLeaves = computed(() => BLOWN_LEAVES.slice(0, Math.max(0, Math.min(6, checkinData.tags.length - 2))));
// Lá ở chỗ riêng của từng yếu tố; khi buồn thì nụ hoa thành lá (không nở hoa).
function slotLeafColor(slot, part, i) {
  if (slot.kind === 'bud') return part.type === 'bud' ? '#8CCB9E' : slot.leafColor;
  return i === 0 ? slot.color : slot.leafColor;
}
const SUN_RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return `M${(Math.cos(a) * 18).toFixed(1)},${(Math.sin(a) * 18).toFixed(1)} L${(Math.cos(a) * 25).toFixed(1)},${(Math.sin(a) * 25).toFixed(1)}`;
}).join(' ');
const BLOSSOM_PETALS = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
  return [(Math.cos(a) * 3.6).toFixed(1), (Math.sin(a) * 3.6).toFixed(1)];
});
const BLOSSOMS = Array.from({ length: 20 }, (_, i) => {
  const ang = i * 2.39996 + 0.5;
  const r = 46 + (i % 4) * 11;
  return {
    x: (130 + Math.cos(ang) * r * 1.05).toFixed(1),
    y: (100 + Math.sin(ang) * r * 0.82).toFixed(1),
    color: ['#FFB7C9', '#FFFFFF', '#FFD27A', '#FF9EC4', '#FFE6EE'][i % 5]
  };
});
const blossomCount = computed(() => {
  const n = checkinData.tags.length;
  if (gardenWeather.value === 'bloom') return Math.min(20, n * 2);
  if (gardenWeather.value === 'sunny') return n;
  return 0;
});
const hoveredTag = ref(null);
// Nhãn tag trong i18n có emoji đứng đầu (widget demo ở trang chủ vẫn dùng); ở khu vườn bỏ đi.
const plainLabel = (key) => t(key).replace(/^[^\p{L}\p{N}]+/u, '');
const gardenSlots = computed(() => TAGS
  .filter((tag) => GARDEN_SLOT_MAP[tag.id])
  .map((tag) => ({ id: tag.id, leafColor: '#A8D5BA', ...GARDEN_SLOT_MAP[tag.id], on: checkinData.tags.includes(tag) })));

function toggleTag(tag) {
  const idx = checkinData.tags.indexOf(tag);
  if (idx === -1) checkinData.tags.push(tag);
  else checkinData.tags.splice(idx, 1);
}

function toggleBodySymptom(tag) {
  const idx = checkinData.bodySymptoms.indexOf(tag);
  if (idx === -1) checkinData.bodySymptoms.push(tag);
  else checkinData.bodySymptoms.splice(idx, 1);
}

// --- Bước 4: "Lắng nghe cơ thể" ---
// Sắp lại các triệu chứng sẵn có (BODY_SYMPTOM_GROUPS, vẫn dùng nguyên object nên notes gửi
// backend không đổi) theo vùng: 4 vùng có chỗ trên hình cơ thể, 3 nhóm không gắn với một
// điểm giải phẫu (giấc ngủ, năng lượng, tâm trí) chỉ nằm ở danh sách.
const BODY_TAG_BY_ID = Object.fromEntries(BODY_SYMPTOM_GROUPS.flatMap((g) => [g, ...g.children]).map((tag) => [tag.id, tag]));
// Silhouette người đứng thẳng: dò viền từ ảnh mẫu "human-silhouette-medical-grid-background"
// (bản JPG trong file zip, EPS bị nén nên không lấy path trực tiếp được), làm mượt rồi co về
// khung 200×300 — đỉnh đầu y=8, gót y=289, cằm/cổ y≈40, nách y≈84, đáy chậu y≈152.
const BODY_SILHOUETTE = [
  'M98.8,8 L96.9,8.4 L95,9 L93.3,9.9 L91.8,11 L90.5,12.5 L89.3,14.2 L88.5,16.2 L88.1,18 L87.7,21.3 L87.8,25.2 L86.6,26.1 L86.4,27.8 L86.6,29.6',
  'L87.2,31.5 L88.1,33.1 L89.6,34.3 L91.1,39.5 L91.5,41.8 L91.6,43.8 L91.4,46.2 L90.8,47.6 L90.2,48.4 L89.2,49.1 L83.9,51.7 L78.1,54.2 L71.2,56.6 L68.3,58',
  'L66.8,59.1 L65.4,60.4 L64.2,62 L63.2,64.1 L62.5,66.6 L62,69.5 L61.9,80.4 L59.9,91.8 L59.6,96 L59.5,99.9 L57.2,105 L55.8,110.3 L53.4,129.2 L51.6,139.9',
  'L50.8,142.3 L49.1,143.8 L47.8,145.2 L44.3,150.2 L40.6,157.2 L40.3,158.2 L40.5,158.7 L41,158.9 L42.5,158.2 L44.1,156.8 L46.2,154.1 L46.7,153.9 L45.1,167 L45.1,168.6',
  'L45.7,169.3 L46.1,169.4 L46.6,169.2 L47.3,168.3 L49.2,159.6 L49.6,158.1 L50,157.6 L50.3,158 L50,161.5 L49.1,168.2 L49.2,169.6 L49.6,170.2 L50.1,170.5 L50.7,170.2',
  'L51.5,168.6 L52.2,165.3 L53,158.9 L53.3,158.3 L53.6,158.5 L53.6,159.8 L52.8,167.5 L52.8,169.2 L53.1,170 L53.6,170.4 L54.1,170.3 L54.6,169.9 L55,169 L56.1,159.7',
  'L56.4,158.6 L56.7,158.8 L56.8,159.3 L56.5,163.5 L56.7,166.4 L57,167 L57.5,167.3 L58,167.1 L58.4,166.6 L58.8,165.4 L59.1,163 L59.7,151.7 L59.6,146.9 L59,143.2',
  'L61.3,135.2 L66.6,122.8 L69.3,115.1 L70.1,111 L70.4,106.1 L71.4,100.1 L74.9,85.3 L75.1,85 L78.1,101.2 L78.6,105.2 L78.7,108.4 L77.5,122.8 L75.2,134.4 L73.9,143.1',
  'L73.4,150.5 L73.5,158.1 L74.1,168.6 L75,178.6 L75.9,185.9 L77.2,192.3 L77.5,195.9 L76.9,204.7 L77,209.9 L76.4,214.4 L76,219.3 L75.9,223.4 L76.1,227.8 L77.6,238.9',
  'L81.4,259.7 L81.6,261.7 L80.9,265.7 L80.8,270 L80.6,271.3 L78.7,274.5 L73.2,281.5 L72.5,282.8 L72.3,283.9 L73.8,286.3 L75.9,287.6 L77.3,287.6 L78.1,288.2 L79,288.4',
  'L80,288.1 L81.3,287.1 L81.6,288.1 L82.4,288.7 L83.5,288.9 L84.7,288.7 L86.5,287.5 L87.7,285.7 L88.5,283.3 L89.5,278.5 L90.5,277 L90.9,275.7 L91.1,272.8 L90,265.7',
  'L89.5,258.3 L90.3,250.2 L92.8,235.1 L93.5,228.9 L93.6,224.8 L93.2,218.9 L93.2,212.6 L93.8,200.4 L94.4,194.9 L96.5,181.2 L98.2,167.2 L99,157.4 L98.9,151.9 L99.3,151.5',
  'L100.5,151.5 L100.9,151.6 L101,152 L101.1,159.3 L102,169.8 L103.7,182.9 L105.5,194.9 L106.1,200.4 L106.7,212.6 L106.7,218.9 L106.3,224.8 L106.5,230.2 L107.3,236.2 L109.6,250.2',
  'L110.4,257.9 L110.1,264.2 L108.9,271.9 L108.9,274.8 L109.3,276.7 L110.4,278.5 L111.4,283.3 L112.4,286 L113.2,287.1 L114.1,288 L115.5,288.7 L116.7,288.9 L118,288.4 L118.4,288',
  'L118.7,287.1 L120,288.1 L120.9,288.4 L121.8,288.2 L122.7,287.6 L124.2,287.5 L126.1,286.3 L126.7,285.1 L127.5,284.3 L127.6,283.7 L127.4,282.6 L126.6,281.3 L121.3,274.5 L119.4,271.4',
  'L119.1,270 L119.1,265.7 L118.3,261.7 L118.6,259.7 L122.3,238.9 L123.8,227.8 L124,223.4 L124,219.3 L123.6,214.4 L122.9,209.9 L123.1,204.7 L122.5,195.9 L122.7,192.3 L124,185.9',
  'L125,178.6 L125.9,168.6 L126.4,158.1 L126.5,150.5 L126,143.1 L124.8,134.4 L122.4,122.8 L121.2,108.5 L121.3,105.1 L121.8,101.2 L124.8,85.1 L124.9,85 L126,88.8 L128.5,100.1',
  'L129.5,106.1 L129.8,111 L130.8,115.5 L133.3,122.8 L138.6,135.2 L141,143.2 L140.4,146.9 L140.2,151.7 L140.9,163 L141.2,165.4 L141.5,166.6 L141.9,167.1 L142.5,167.3 L143,167',
  'L143.2,166.4 L143.4,163.5 L143.2,159.3 L143.2,158.8 L143.5,158.6 L143.8,159.7 L144.9,169 L145.3,169.9 L145.8,170.3 L146.4,170.4 L146.9,170 L147.1,169.2 L147.2,167.5 L146.4,159.8',
  'L146.4,158.5 L146.7,158.3 L147,158.9 L147.7,165.3 L148.4,168.6 L149.2,170.2 L149.8,170.5 L150.4,170.2 L150.7,169.6 L150.8,168.2 L149.7,158.1 L149.9,157.6 L150.3,158.1 L150.7,159.6',
  'L152.7,168.3 L153.3,169.2 L153.9,169.4 L154.3,169.3 L154.8,168.6 L154.8,167 L153.3,153.9 L153.7,154.1 L155.8,156.8 L157.5,158.3 L159,158.9 L159.5,158.6 L159.6,158 L159.4,157.2',
  'L155.6,150.2 L152.1,145.2 L150.9,143.8 L149.1,142.3 L148.3,139.8 L146.5,129.2 L144.2,110.3 L142.8,105 L140.4,99.9 L140.4,96 L140,91.8 L138,80.4 L137.9,69.5 L137.4,66.3',
  'L136.7,63.9 L135.7,62 L134.5,60.4 L133.1,59.1 L131.6,58 L128.8,56.6 L121.8,54.2 L116,51.7 L110.8,49.1 L109.8,48.4 L109.1,47.6 L108.6,46.2 L108.4,43.8 L108.4,41.8',
  'L108.8,39.5 L110.3,34.3 L111.8,33.1 L112.7,31.5 L113.3,29.6 L113.6,27.8 L113.4,26.1 L112.2,25.2 L112.2,20.6 L111.7,17.1 L110.9,14.9 L110,13.3 L108.6,11.5 L107.1,10.2',
  'L105.5,9.3 L103.4,8.4 L101.1,8'
].join(' ') + 'Z';
// Khung của từng vùng (cắt theo silhouette): đầu; ngực gồm cổ + vai; bụng; tay (dưới vai) + chân.
const BODY_ZONES = [
  { key: 'head', onBody: true, dot: [117, 16], ids: ['severe_headache', 'migraine', 'dizzy', 'fainting'], region: 'M0,0 L200,0 L200,40 L0,40Z' },
  { key: 'chest', onBody: true, dot: [100, 70], ids: ['rapid_heartbeat', 'nervous', 'breathless', 'short_of_breath', 'chest_tightness', 'throat_lump'], region: 'M0,40 L200,40 L200,84 L125.2,84 L125.8,104 L74.2,104 L74.8,84 L0,84Z' },
  { key: 'belly', onBody: true, dot: [100, 128], ids: ['indigestion', 'abdominal_discomfort', 'diarrhea_constipation', 'dry_mouth'], region: 'M74.2,104 L125.8,104 L127.5,152 L72.5,152Z' },
  { key: 'limbs', onBody: true, dot: [86, 210], ids: ['muscle_tension', 'back_pain', 'numb_limbs', 'sweaty_hands', 'unclear_ache'], region: 'M0,84 L74.8,84 L74.2,104 L72.5,152 L127.5,152 L125.8,104 L125.2,84 L200,84 L200,300 L0,300Z' },
  { key: 'sleep', onBody: false, ids: ['insomnia', 'sleep_disturbance'] },
  { key: 'energy', onBody: false, ids: ['easily_sick', 'fever', 'chills', 'rapid_weight_gain', 'skin_issues'] },
  { key: 'mind', onBody: false, ids: ['restless', 'hypervigilance', 'poor_concentration', 'fear_of_losing_control'] }
].map((zone) => ({ ...zone, tags: zone.ids.map((id) => BODY_TAG_BY_ID[id]).filter(Boolean) }));
const BODY_FIGURE_ZONES = ['limbs', 'belly', 'chest', 'head'].map((key) => BODY_ZONES.find((z) => z.key === key));
const BODY_SECTIONS = [
  { key: 'onBody', zones: BODY_ZONES.filter((z) => z.onBody) },
  { key: 'whole', zones: BODY_ZONES.filter((z) => !z.onBody) }
];
const activeBodyZone = ref(null);
// Bấm lại vùng đang mở thì đóng (bỏ chọn).
function selectBodyZone(key) {
  activeBodyZone.value = activeBodyZone.value === key ? null : key;
}
// Mobile (khung xếp dọc, ≤860px): biểu hiện mở trong popup thay vì cột chi tiết.
const mobileStackQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 860px)') : null;
const isMobileStack = ref(Boolean(mobileStackQuery?.matches));
const onMobileStackChange = (e) => { isMobileStack.value = e.matches; };
onMounted(() => mobileStackQuery?.addEventListener('change', onMobileStackChange));
onBeforeUnmount(() => mobileStackQuery?.removeEventListener('change', onMobileStackChange));
const activeZone = computed(() => BODY_ZONES.find((z) => z.key === activeBodyZone.value) || null);
const bodyZoneCount = (zone) => zone.tags.filter((tag) => checkinData.bodySymptoms.includes(tag)).length;
// Pin năng lượng: mỗi biểu hiện chọn ở vùng nào thì vùng đó tụt pin (chọn hết thì cạn hẳn);
// pin tổng phía trên tụt theo tổng số biểu hiện, kể cả giấc ngủ/năng lượng/tâm trí.
const BODY_ZONE_SPAN = { head: [8, 40], chest: [40, 104], belly: [104, 152], limbs: [84, 290] };
function zoneDrainY(zone) {
  const [top, bottom] = BODY_ZONE_SPAN[zone.key];
  const used = bodyZoneCount(zone) / zone.tags.length;
  return used === 0 ? top - 6 : top + used * (bottom - top);
}
const DRAIN_WAVE = 'M-40,0' + ' q10,5 20,0'.repeat(16) + ' Z';
const energyPct = computed(() => Math.round(Math.max(0.05, 1 - checkinData.bodySymptoms.length / 10) * 100));
const energyTone = computed(() => (energyPct.value > 60 ? 'high' : energyPct.value > 30 ? 'mid' : 'low'));

function goStep(target) {
  if (target === 2 && !checkinData.mood) {
    alert(t('moodCheckin.alerts.pickMoodFirst'));
    return;
  }
  step.value = target;
}

function deriveMoodPayload() {
  // `tag.id` CHÍNH LÀ token gửi backend — không cần dò/chuẩn hoá chuỗi hiển thị nữa (xem
  // giải thích ở khai báo TAGS).
  const triggerIds = checkinData.tags.map((tag) => tag.id);
  // Ghép cả nguyên nhân (bước 3) lẫn triệu chứng cơ thể (bước 4) vào notes — chưa có cột
  // riêng cho triệu chứng cơ thể ở backend nên tận dụng notes như đang làm với tags,
  // không cần thêm migration.
  const notes = [
    checkinData.tags.map((tag) => t(tag.labelKey)).join(', '),
    checkinData.bodySymptoms.length
      ? `${t('moodCheckin.stepBody.notesPrefix')}: ${checkinData.bodySymptoms.map((tag) => t(tag.labelKey)).join(', ')}`
      : ''
  ].filter(Boolean).join(' | ') || null;

  return buildMoodPayload({
    score: checkinData.score,
    // LUÔN gửi nhãn tiếng Việt (viLabel), bất kể ngôn ngữ UI đang chọn — xem giải thích ở
    // khai báo MOOD_OPTIONS.
    moodViLabel: selectedMoodOption.value?.viLabel || null,
    triggerIds,
    notes
  });
}

async function loadRemoteProgress() {
  try {
    const progress = await apiClient.get('/progress');
    const xp = progress?.xp ?? 0;
    const level = progress?.level ?? progress?.current_level ?? 1;
    window.dispatchEvent(new CustomEvent('peaceflow:progress-updated', { detail: { xp, level } }));
  } catch (error) {
    console.error('Could not load progress from API:', error);
  }
}

async function syncTodayCheckinBadge() {
  try {
    const report = await apiClient.get('/reports/detail');
    const latestMood = report?.latest_mood || null;
    todayDone.value = isToday(latestMood?.created_at);
    todayLabel.value = latestMood?.dominant_emotion || '';
  } catch (error) {
    console.error('Could not load today check-in badge:', error);
    todayDone.value = false;
  }
}

async function fetchRecommendedTasks() {
  try {
    const data = await apiClient.get('/tasks/recommended');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Could not fetch recommended tasks:', error);
    return [];
  }
}

async function submitCheckin() {
  if (submitting.value) return;
  submitting.value = true;
  resultPhase.value = 'saving';

  try {
    await apiClient.post('/moods', deriveMoodPayload());
    window.dispatchEvent(new CustomEvent('peaceflow:mood-saved'));

    suggestedTasks.value = await fetchRecommendedTasks();
    await loadRemoteProgress();
    await syncTodayCheckinBadge();

    resultPhase.value = 'saved';
    todayDone.value = true;
    // Lưu nguyên văn tiếng Việt (viLabel) — khớp đúng định dạng backend trả về ở lần đọc
    // sau, để todayLabelDisplay ánh xạ ngược đúng ngôn ngữ đang hiển thị.
    todayLabel.value = selectedMoodOption.value?.viLabel || '';
    step.value = 5;
  } catch (error) {
    console.error('Could not save mood to API:', error);
    resultPhase.value = 'failed';
    alert(t('moodCheckin.alerts.saveFailed'));
  } finally {
    submitting.value = false;
  }
}

function resetCheckin() {
  emotionValue.value = 50;
  intensityPicked.value = false;
  confirmedZone.value = null;
  checkinData.score = 5;
  checkinData.mood = null;
  checkinData.moodId = null;
  checkinData.tags = [];
  checkinData.bodySymptoms = [];
  activeBodyZone.value = null;
  suggestedTasks.value = [];
  resultPhase.value = 'pending';
  step.value = 1;
}

// Công tắc "Chia sẻ check-in hàng ngày với chuyên gia" — đồng bộ với đúng cột
// user_profiles.share_mood_with_experts mà SettingsView.vue dùng (2 nơi cùng đọc/ghi 1
// trạng thái, không phải 2 cài đặt khác nhau).
const shareMoodWithExperts = ref(false);
const shareMoodSaving = ref(false);
async function toggleShareMoodWithExperts() {
  shareMoodSaving.value = true;
  try {
    await apiClient.put('/profile', { share_mood_with_experts: shareMoodWithExperts.value });
  } catch (_e) {
    // Lỗi lưu thì rollback lại UI để không hiện sai trạng thái thật trên server.
    shareMoodWithExperts.value = !shareMoodWithExperts.value;
  } finally {
    shareMoodSaving.value = false;
  }
}

onMounted(async () => {
  if (!auth.isAuthenticated) {
    alert(t('moodCheckin.alerts.pleaseLogin'));
    router.replace('/login');
    return;
  }
  await loadRemoteProgress();
  await syncTodayCheckinBadge();
  try {
    const profileData = await apiClient.get('/profile');
    shareMoodWithExperts.value = profileData?.share_mood_with_experts ?? false;
  } catch (_e) {
    // Không tải được thì giữ mặc định false, không chặn luồng check-in chính.
  }
});
</script>

<style scoped>
/* Trang này theo đúng style đã dựng ở Dashboard (DashboardView.vue): token trong
   assets/brand-tokens.css, thẻ mềm bo tròn không viền/bóng cứng, chữ nội dung dùng
   --font-body (Inter) thay vì Nunito everywhere như style.css cũ. Chỉ sửa template/CSS,
   không đụng <script setup>. */
.main-content { margin-left: var(--sidebar-width, 240px); padding: 20px 20px 32px; min-height: 100vh; }
/* Nền trang giống hệt .dash của DashboardView: nền ivory + ảnh lá hòa nhẹ (multiply, mask chéo). */
.mc-page {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55; color: var(--color-text);
  background: var(--color-canvas); -webkit-font-smoothing: antialiased; position: relative; isolation: isolate;
}
.mc-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.page-header { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; flex-wrap: wrap; gap: 12px; }
.mc-share-row { width: 100%; max-width: 680px; }
.badge-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-mint { background: var(--color-brand-soft); color: var(--color-brand); }
.badge-peach { background: var(--color-terracotta-soft); color: var(--color-terracotta); }

.mode-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
.mode-card { padding: 20px 16px; text-align: center; cursor: pointer; border-radius: var(--radius-card); background: var(--color-surface); transition: background-color var(--duration-normal) var(--ease-standard), transform var(--duration-normal) var(--ease-standard); }
.mode-card:hover { background: var(--color-surface-muted); transform: translateY(-2px); }
.mode-card.active { background: var(--color-brand-soft); }
.mode-icon { font-size: 2rem; margin-bottom: 8px; }
.mode-title { font-family: var(--font-heading); font-size: 15px; font-weight: 800; color: var(--color-text); margin-bottom: 4px; }
.mode-desc { font-size: 12.5px; color: var(--color-text-muted); }
.mode-time { font-size: 12px; color: var(--color-text-subtle); font-weight: 600; margin-top: 4px; }

.panel { display: none; }
.panel.active { display: block; animation: panel-enter 0.4s var(--ease-standard); }
@keyframes panel-enter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.checkin-card {
  padding: 36px 28px 28px; max-width: 680px; margin: 0 auto; border-radius: var(--radius-panel);
  /* Cùng gradient rất nhẹ với thẻ check-in ở Dashboard; dòng đầu là dự phòng khi thiếu color-mix. */
  background: linear-gradient(135deg, #f6faf2 0%, var(--color-surface) 50%, #fff9ef 78%, #faf6f5 100%);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--mint-light) 15%, var(--color-surface)) 0%,
    var(--color-surface) 50%,
    color-mix(in srgb, var(--peach-light) 15%, var(--color-surface)) 78%,
    color-mix(in srgb, var(--lavender-light) 12%, var(--color-surface)) 100%);
}

.rt-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-card); background: var(--color-canvas); margin-bottom: 8px; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.rt-item:hover { background: var(--color-surface-muted); }
.rt-icon { font-size: 1.2rem; width: 36px; height: 36px; border-radius: var(--radius-control); display: flex; align-items: center; justify-content: center; background: var(--color-brand-soft); flex-shrink: 0; }
.rt-info { flex: 1; }
.rt-name { font-size: 14px; font-weight: 700; color: var(--color-text); }
.rt-meta { font-size: 12px; color: var(--color-text-subtle); }
.rt-xp { font-size: 12.5px; font-weight: 700; color: var(--color-terracotta); background: var(--color-terracotta-soft); padding: 2px 8px; border-radius: 999px; }

@keyframes bounce-r { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

.emergency-overlay { position: fixed; inset: 0; background: rgba(74, 55, 40, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.emergency-popup { background: var(--color-surface); border-radius: var(--radius-panel); padding: 32px; max-width: 420px; width: 100%; box-shadow: var(--shadow-soft); animation: pop-in 0.3s var(--ease-standard); }
@keyframes pop-in { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.ep-header { text-align: center; margin-bottom: 16px; }
.ep-icon { font-size: 2.5rem; margin-bottom: 8px; }
.ep-title { font-family: var(--font-heading); font-size: 19px; font-weight: 800; color: var(--color-danger); }
.ep-text { font-size: 14px; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 16px; text-align: center; }
.ep-hotline { padding: 14px; background: var(--color-danger-soft); border-radius: var(--radius-card); text-align: center; margin-bottom: 10px; }
.ep-hotline .eph-num { font-size: 1.3rem; font-weight: 800; color: var(--color-danger); }
.ep-hotline .eph-label { font-size: 13px; color: var(--color-text-muted); }
.ep-actions { display: flex; flex-direction: column; gap: 8px; }
.ep-btn { padding: 12px; border-radius: var(--radius-control); font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; transition: filter var(--duration-fast) var(--ease-standard); text-decoration: none; display: block; }
.ep-btn-primary { background: var(--color-danger); color: #fff; }
.ep-btn-primary:hover { filter: brightness(0.92); }
.ep-btn-secondary { background: var(--color-brand-soft); color: var(--color-brand); }
.ep-btn-close { background: var(--color-surface-muted); color: var(--color-text-muted); font-size: 13px; }

/* .btn-primary/.btn-outline là class dùng chung toàn app (assets/style.css, kiểu bo cứng
   có viền) — override riêng trong trang này theo style Dashboard (.btn/.pf-btn-*), không
   đụng file style.css nên các trang khác (Tasks, Journal…) vẫn giữ nguyên kiểu cũ. */
.btn-primary, .btn-outline {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; padding: 8px 18px; border: none; border-radius: var(--radius-control);
  font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none;
  transition: background-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--color-brand); color: var(--color-on-brand); }
.btn-primary:hover { filter: brightness(0.92); }
.btn-outline { background: var(--color-surface-muted); color: var(--color-text); }
.btn-outline:hover { background: var(--color-brand-soft); color: var(--color-brand); }

@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .main-content { margin-left: 0; padding: 16px 16px 20px; }
}
@media (max-width: 600px) {
  /* Đổi từng thẻ từ bố cục dọc (icon-title-desc-time xếp chồng, cao gần hết màn hình) sang
     bố cục ngang (icon bên trái, chữ bên phải) -> gọn hẳn theo chiều cao, cả 3 thẻ vừa
     trong 1 màn hình thay vì phải cuộn qua từng thẻ lớn. */
  .mode-selector { grid-template-columns: 1fr; gap: 10px; }
  .mode-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; text-align: left; }
  .mode-icon { font-size: 1.5rem; margin-bottom: 0; flex-shrink: 0; }
  .mode-title { font-size: 0.85rem; margin-bottom: 2px; }
  .mode-desc { font-size: 0.68rem; }
  .mode-time { margin-top: 2px; }
}
</style>
<style scoped src="../assets/moodCheckinWidget.css"></style>
<style scoped>
/* Override riêng cho trang /mood-checkin theo style Dashboard. Đặt SAU block src
   moodCheckinWidget.css (dùng chung với widget demo ở IndexView.vue) để thắng về thứ tự
   nguồn; IndexView.vue không import block này nên widget demo ở trang chủ không đổi. */
.step-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
.si-dot { width: 28px; height: 28px; border-radius: 50%; background: var(--color-surface-muted); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: var(--color-text-subtle); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.si-dot.active, .si-dot.done { background: var(--color-brand); color: var(--color-on-brand); }
.si-line { flex: 1; height: 2px; background: var(--color-surface-muted); border-radius: 1px; }
.si-line.done { background: var(--color-brand); }

.checkin-title { font-family: var(--font-heading); font-size: 26px; font-weight: 800; line-height: 1.25; color: var(--color-text); margin-bottom: 6px; }
.checkin-sub { font-size: 14px; color: var(--color-text-muted); margin-bottom: 22px; }

.mascot-speech-box { background: var(--color-brand-soft); border-radius: var(--radius-card); }
.msb-text { color: var(--color-text-muted); }

/* ---------- Bước 1: thanh trượt cảm xúc + nhân vật ---------- */
.emo { --emo-ink: var(--color-brand); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 4px 0 8px; }
.emo-hello { font-family: var(--font-display); font-style: italic; font-size: 19px; color: var(--color-text-muted); margin: 0; }
.emo-title { font-family: var(--font-heading); font-size: 30px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); margin: 4px 0 0; }
.emo-sub { font-size: 14.5px; line-height: 1.6; color: var(--color-text-muted); max-width: 420px; margin: 6px auto 0; }

.emo-figure { width: 220px; height: 220px; margin: 8px 0 4px; }

.emo-control { width: 100%; max-width: 440px; }
/* Track trung tính (không tô phần "đã đầy") vì đây là thang hai cực xấu ↔ tốt, không phải số lượng. */
.emo-range {
  -webkit-appearance: none; appearance: none; width: 100%; height: 44px; margin: 0;
  background: transparent; cursor: pointer; touch-action: pan-y;
}
.emo-range::-webkit-slider-runnable-track { height: 8px; border-radius: 999px; background: var(--color-surface-muted); }
.emo-range::-moz-range-track { height: 8px; border-radius: 999px; background: var(--color-surface-muted); }
.emo-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 30px; height: 30px; margin-top: -11px; border-radius: 50%;
  background: var(--color-surface); border: 3px solid var(--emo-ink); box-shadow: var(--shadow-soft);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.emo-range::-moz-range-thumb {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--color-surface); border: 3px solid var(--emo-ink); box-shadow: var(--shadow-soft);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.emo-range:hover::-webkit-slider-thumb { transform: scale(1.08); }
.emo-range:hover::-moz-range-thumb { transform: scale(1.08); }
.emo-range:active { cursor: grabbing; }
.emo-range:active::-webkit-slider-thumb { transform: scale(1.14); }
.emo-range:active::-moz-range-thumb { transform: scale(1.14); }
.emo-range:focus { outline: none; }
.emo-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px var(--color-brand-soft), var(--shadow-soft); }
.emo-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 4px var(--color-brand-soft), var(--shadow-soft); }
.emo-ends { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-subtle); margin-top: -4px; }

.emo-state { font-family: var(--font-heading); font-size: 21px; font-weight: 800; color: var(--emo-ink); margin: 10px 0 4px; min-height: 1.4em; }
.emo-label-enter-active, .emo-label-leave-active { transition: opacity 160ms var(--ease-standard), transform 160ms var(--ease-standard); }
.emo-label-enter-from { opacity: 0; transform: translateY(4px); }
.emo-label-leave-to { opacity: 0; transform: translateY(-4px); }
.emo-next { margin-top: 12px; min-width: 160px; }
.emo-state-max { font-size: 15px; font-weight: 600; color: var(--color-text-subtle); margin-left: 2px; }
.emo-state-hint { font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--color-text-subtle); }
/* Chưa chọn mức độ: nút kéo viền nhạt, nét đứt — kéo/bấm phím là thành màu chính. */
.emo-range.is-unset::-webkit-slider-thumb { border-color: var(--color-text-subtle); border-style: dashed; }
.emo-range.is-unset::-moz-range-thumb { border-color: var(--color-text-subtle); border-style: dashed; }

/* ---------- Bước 3: Khu vườn bên trong bạn ---------- */
.gw-head { text-align: center; margin-bottom: 12px; }
.gw-head .emo-title { font-size: 24px; }
.gw-head .emo-sub { max-width: none; }
.gw { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 24px; }
.gw-garden { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.gw-svg { width: 100%; max-width: 340px; height: auto; overflow: visible; }
.gw-caption { font-family: var(--font-display); font-style: italic; font-size: 13.5px; color: var(--color-text-muted); text-align: center; }
.gw-ground { fill: #EADFC8; }
.gw-pebble { fill: #D6C7A8; }
.gw-grass { fill: none; stroke: #8CCB9E; stroke-width: 2.5; stroke-linecap: round; }
.gw-trunk { fill: #8B6B4E; }
.gw-bark { fill: none; stroke: #A88563; stroke-width: 1.6; stroke-linecap: round; opacity: 0.7; }
/* Tán nền mờ cho cây trông đầy đặn; nở dần theo số yếu tố đã chọn. */
.gw-canopy { transform-box: view-box; transform-origin: 130px 120px; transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.gw-canopy-blob { fill: #CFEBD6; fill-opacity: 0.6; }
.gw-clump { fill-opacity: 0.6; transform-box: fill-box; transform-origin: center; transform: scale(0); opacity: 0; transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms var(--ease-standard); }
.gw-clump.on { transform: scale(1); opacity: 1; }
/* Cả cây đung đưa theo gió quanh gốc, nhịp không đều để có cảm giác gió giật. */
.gw-tree { transform-box: view-box; transform-origin: 130px 240px; animation: gw-wind 7s ease-in-out infinite; }
@keyframes gw-wind {
  0%, 100% { transform: rotate(-1deg); }
  25% { transform: rotate(1.6deg); }
  38% { transform: rotate(0.4deg); }
  55% { transform: rotate(2.4deg); }
  75% { transform: rotate(-0.4deg); }
}
.gw-wind { fill: none; stroke: #BFD9C7; stroke-width: 2; stroke-linecap: round; opacity: 0; animation: gw-gust 7s ease-in-out infinite; }
.gw-wind-2 { animation-delay: -3.2s; }
@keyframes gw-gust {
  0%, 15% { opacity: 0; transform: translateX(-30px); }
  30% { opacity: 0.8; }
  50%, 100% { opacity: 0; transform: translateX(40px); }
}
.gw-branch { fill: none; stroke: #8B6B4E; stroke-width: 4; stroke-linecap: round; }
.gw-leaf { stroke: rgba(74, 55, 40, 0.12); stroke-width: 1; }
.gw-rib { fill: none; stroke: rgba(255, 255, 255, 0.55); stroke-width: 1.4; stroke-linecap: round; }
.gw-stem { fill: none; stroke: #7BBF95; stroke-width: 2.2; stroke-linecap: round; }
.gw-bud-core { fill: #FFF3C4; }
.gw-ghost { fill: none; stroke: var(--color-brand); stroke-width: 1.5; stroke-dasharray: 3 4; opacity: 0.7; }
/* Mọc/thu: phóng từ gốc lá (gốc toạ độ của nhóm) với chút nảy; bỏ chọn thì thu lại mềm. */
.gw-grow { transform: scale(0); opacity: 0; transition: transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 260ms var(--ease-standard); }
.gw-grow.on { transform: scale(1); opacity: 1; }
/* Lá/cụm rung nhẹ riêng, nhanh hơn nhịp cả cây, mỗi cụm lệch pha. */
.gw-sway { animation: gw-sway 2.4s ease-in-out infinite alternate; }
@keyframes gw-sway { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
/* Cả khối lá của một mảng tán lay rất nhẹ (khối lớn nên biên độ nhỏ). */
.gw-sway-soft { animation: gw-sway-soft 3.4s ease-in-out infinite alternate; }
@keyframes gw-sway-soft { from { transform: rotate(-1.6deg); } to { transform: rotate(1.6deg); } }

/* ---- Thời tiết theo cảm xúc ---- */
.gw-sun { fill: #FFD45C; }
.gw-sun-rays { stroke: #FFD45C; stroke-width: 3; stroke-linecap: round; transform-box: fill-box; transform-origin: center; animation: gw-spin 24s linear infinite; }
@keyframes gw-spin { to { transform: rotate(360deg); } }
.gw-petal { stroke: rgba(74, 55, 40, 0.1); stroke-width: 0.6; }

.gw-fly { animation: gw-fly-path 13s ease-in-out infinite; }
.gw-fly-2 { animation-duration: 16s; animation-delay: -7s; }
@keyframes gw-fly-path {
  0%, 100% { transform: translate(36px, 96px); }
  25% { transform: translate(120px, 30px); }
  50% { transform: translate(222px, 92px); }
  75% { transform: translate(176px, 176px); }
}
.gw-wings { transform-box: fill-box; transform-origin: center; animation: gw-flap 0.32s ease-in-out infinite alternate; }
@keyframes gw-flap { from { transform: scaleX(1); } to { transform: scaleX(0.3); } }

.gw-cloud { fill: #C5CDD6; animation: gw-cloud-drift 9s ease-in-out infinite alternate; }
.w-storm .gw-cloud { animation-duration: 4s; }
@keyframes gw-cloud-drift { from { transform: translateX(-6px); } to { transform: translateX(9px); } }
.gw-drop { stroke: #8FB2D6; stroke-width: 2; stroke-linecap: round; opacity: 0; animation: gw-rain linear infinite; }
.w-drizzle .gw-drop { stroke: #AFC7DE; stroke-width: 1.6; animation-name: gw-drizzle; }
@keyframes gw-rain { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: 0.9; } 88% { opacity: 0.7; } 100% { transform: translate(-18px, 205px); opacity: 0; } }
@keyframes gw-drizzle { 0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 0.75; } 85% { opacity: 0.5; } 100% { transform: translate(-4px, 205px); opacity: 0; } }
/* Sấm chớp: chớp đôi ngắn, cách nhau vài giây; lớp sáng nền rất nhẹ (không nháy gắt). */
.gw-bolt { fill: none; stroke: #FFD45C; stroke-width: 3.5; stroke-linejoin: round; stroke-linecap: round; opacity: 0; animation: gw-bolt 4.6s infinite; }
.gw-flash { fill: #FFF8DC; opacity: 0; pointer-events: none; animation: gw-flash-bg 4.6s infinite; }
@keyframes gw-bolt { 0%, 86%, 100% { opacity: 0; } 87% { opacity: 1; } 89% { opacity: 0.2; } 90.5% { opacity: 1; } 93% { opacity: 0; } }
@keyframes gw-flash-bg { 0%, 86%, 100% { opacity: 0; } 87% { opacity: 0.26; } 89% { opacity: 0.05; } 90.5% { opacity: 0.18; } 93% { opacity: 0; } }
/* Gió mạnh dần theo số lựa chọn: biên độ (--amp) và nhịp do script tính, lá rung nhanh dần
   theo bậc, vệt gió đậm hơn khi giông. */
.gw-tree.is-gusty { animation-name: gw-wind-gusty; }
@keyframes gw-wind-gusty {
  0%, 100% { transform: rotate(calc(var(--amp, 1) * -0.5deg)); }
  20% { transform: rotate(calc(var(--amp, 1) * 1.1deg)); }
  32% { transform: rotate(calc(var(--amp, 1) * 0.45deg)); }
  50% { transform: rotate(calc(var(--amp, 1) * 1.3deg)); }
  70% { transform: rotate(0deg); }
}
.w-lv-1 .gw-sway { animation-duration: 1.8s !important; }
.w-lv-2 .gw-sway { animation-duration: 1.2s !important; }
.w-lv-3 .gw-sway { animation-duration: 0.75s !important; }
.w-lv-1 .gw-sway-soft { animation-duration: 2.6s !important; }
.w-lv-2 .gw-sway-soft { animation-duration: 1.9s !important; }
.w-lv-3 .gw-sway-soft { animation-duration: 1.3s !important; }
.w-storm .gw-wind { stroke: #A9B3BF; }
.gw-blown { opacity: 0; transform-box: fill-box; transform-origin: center; animation: gw-blow 3.8s linear infinite; }
@keyframes gw-blow {
  0% { transform: translate(-30px, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  85% { opacity: 0.9; }
  100% { transform: translate(300px, 55px) rotate(620deg); opacity: 0; }
}

.gw-list { width: 100%; }
.gw-list-title { font-size: 13px; font-weight: 600; color: var(--color-text-muted); text-align: center; margin: 0 0 10px; }
.gw-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.gw-chip {
  min-height: 38px; padding: 8px 16px;
  border: none; border-radius: 999px; background: var(--color-canvas);
  font-family: inherit; font-size: 14px; font-weight: 500; color: var(--color-text); cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.gw-chip:hover { background: var(--color-surface-muted); }
.gw-chip:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.gw-chip.on { background: var(--color-brand-soft); color: var(--color-brand); font-weight: 600; }

/* ---------- Bước 4: Lắng nghe cơ thể ---------- */
/* Bước 4 mở rộng khung ngang để 3 cột (hình · vùng · biểu hiện) nằm gọn, không phải cuộn. */
.checkin-card { transition: max-width 320ms var(--ease-standard); }
.checkin-card.is-wide { max-width: 1040px; }
.bs-head { text-align: center; margin-bottom: 18px; }
.bs-head .emo-title { font-size: 24px; }
.bs-head .emo-sub { max-width: none; margin-top: 4px; }
.bs { display: grid; grid-template-columns: 230px 250px 1fr; gap: 22px; align-items: stretch; margin-bottom: 20px; }

.bs-body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 10px 6px; border-radius: var(--radius-card); background: radial-gradient(circle at 50% 40%, #FFFFFF 0%, var(--color-canvas) 75%); }
.bs-svg { width: 100%; max-width: 210px; height: auto; overflow: visible; }
.bs-shadow { fill: #E6DCC8; opacity: 0.8; }
/* Cơ thể thở nhẹ: phồng/xẹp rất ít quanh chân. */
.bs-figure { transform-box: view-box; transform-origin: 100px 280px; animation: bs-breathe 5s ease-in-out infinite; }
@keyframes bs-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.016, 1.01); } }
.bs-zone { cursor: pointer; outline: none; }
/* Hình người trung tính tông sage–kem: không quần áo/mặt để từng vùng đọc rõ là chỗ chạm được;
   vùng đang chọn sáng xanh, các vùng còn lại dịu xuống. */
.bs-base { fill: #EEF1E6; pointer-events: none; transition: fill var(--duration-fast) var(--ease-standard); }
.bs-outline { fill: none; stroke: #7F9171; stroke-width: 2; stroke-linejoin: round; pointer-events: none; }
.bs-zone path { fill: #EEF1E6; fill-opacity: 0; stroke: none; stroke-linejoin: round; transition: fill var(--duration-fast) var(--ease-standard), stroke var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
.bs-zone:hover path { fill: #E0E7D4; fill-opacity: 1; }
.bs-zone.on path { fill: #B5DABE; fill-opacity: 1; stroke: #6FA984; stroke-width: 1.4; stroke-dasharray: 4 3; }
.bs-figure.has-active .bs-base { fill: #F5F7F0; }
.bs-zone:focus-visible path { stroke: var(--color-focus); stroke-width: 2.5; }
/* Chọn nhóm toàn thân (giấc ngủ/năng lượng/tâm trí): cả cơ thể ửng xanh nhẹ. */
.bs-figure.is-whole .bs-base { fill: #D8ECDC; }
.bs-drain-clip { pointer-events: none; }
.bs-drain { fill: rgba(96, 90, 80, 0.3); transition: transform 650ms cubic-bezier(0.34, 1.25, 0.64, 1); }
.bs-wave { animation: bs-wave 1.6s linear infinite; }
@keyframes bs-wave { to { transform: translateX(20px); } }
/* Pin tổng: xanh → vàng → đỏ khi tụt, dưới 30% thì nhấp nháy nhẹ. */
.bs-battery { --bat: #6FB58A; display: flex; align-items: center; gap: 8px; flex-shrink: 0; font-size: 12px; font-weight: 700; color: var(--color-text-muted); }
.bs-battery.is-mid { --bat: #EBAE3F; }
.bs-battery.is-low { --bat: #E2745C; }
.bs-battery-cell { position: relative; width: 48px; height: 20px; padding: 3px; border-radius: 6px; box-shadow: inset 0 0 0 2px #CDBFB1; }
.bs-battery-cell::after { content: ''; position: absolute; right: -5px; top: 6px; width: 3px; height: 8px; border-radius: 0 2px 2px 0; background: #CDBFB1; }
.bs-battery-fill { display: block; height: 100%; border-radius: 3px; background: var(--bat); transition: width 600ms var(--ease-standard), background-color 300ms var(--ease-standard); }
.bs-battery.is-low .bs-battery-fill { animation: bs-blink 1.2s ease-in-out infinite; }
@keyframes bs-blink { 50% { opacity: 0.45; } }
.bs-battery-pct { min-width: 34px; color: var(--bat); font-variant-numeric: tabular-nums; transition: color 300ms var(--ease-standard); }
.bs-dot { pointer-events: none; opacity: 0; transition: opacity var(--duration-fast) var(--ease-standard); }
.bs-dot.on { opacity: 1; }
.bs-dot circle { fill: var(--color-terracotta); stroke: #fff; stroke-width: 2; }
.bs-dot text { fill: #fff; font-family: var(--font-heading); font-size: 11px; font-weight: 800; text-anchor: middle; }
.bs-hint { font-size: 12.5px; color: var(--color-text-subtle); text-align: center; }

.bs-zones { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.bs-section { font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-text-subtle); margin: 6px 0 1px; }
.bs-section:first-child { margin-top: 0; }
.bs-zone-btn {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px;
  border: none; border-radius: var(--radius-card); background: var(--color-canvas);
  font-family: inherit; text-align: left; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard);
}
.bs-zone-btn:hover { background: var(--color-surface-muted); }
.bs-zone-btn.on { background: var(--color-brand-soft); }
.bs-zone-btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.bs-zone-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.bs-zone-name { font-size: 14px; font-weight: 700; color: var(--color-text); }
.bs-zone-btn.on .bs-zone-name { color: var(--color-brand); }
.bs-zone-hint { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bs-count { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: var(--color-terracotta); color: #fff; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; }

.bs-detail { display: flex; flex-direction: column; min-width: 0; padding: 16px 18px; border-radius: var(--radius-card); background: var(--color-canvas); }
.bs-detail-label { font-size: 12.5px; font-weight: 600; color: var(--color-text-muted); margin: 0; }
.bs-detail-title { font-family: var(--font-heading); font-size: 19px; font-weight: 800; color: var(--color-text); margin: 2px 0 8px; }
.bs-empty { font-size: 14px; color: var(--color-text-subtle); margin: 10px 0 0; }
.bs-options { display: flex; flex-direction: column; gap: 2px; animation: bs-open 220ms var(--ease-standard); }
@keyframes bs-open { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.bs-option {
  display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 6px 8px;
  border: none; border-radius: var(--radius-control); background: none;
  font-family: inherit; font-size: 14px; color: var(--color-text); text-align: left; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard);
}
.bs-option:hover { background: var(--color-surface); }
.bs-option:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 1px; }
.bs-check { width: 20px; height: 20px; flex-shrink: 0; border-radius: 50%; background: var(--color-surface); box-shadow: inset 0 0 0 1.5px var(--color-text-subtle); display: inline-flex; align-items: center; justify-content: center; transition: background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.bs-check svg { width: 14px; height: 14px; fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
.bs-option.on { font-weight: 600; }
.bs-option.on .bs-check { background: var(--color-brand); box-shadow: none; }
.bs-option.on .bs-check svg { opacity: 1; }

.bs-picked { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--color-surface-muted); }
.bs-picked-title { font-size: 12.5px; font-weight: 600; color: var(--color-text-muted); margin: 0 0 6px; }
.bs-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.bs-tag {
  display: inline-flex; align-items: center; gap: 6px; padding: 3px 5px 3px 11px; border: none; border-radius: 999px;
  background: var(--color-terracotta-soft); color: var(--color-terracotta); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
}
.bs-tag:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.bs-tag-x { width: 17px; height: 17px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1; background: rgba(255, 255, 255, 0.6); }
.bs-tag:hover .bs-tag-x { background: #fff; }
.bs-tag-enter-active, .bs-tag-leave-active { transition: opacity 180ms var(--ease-standard), transform 180ms var(--ease-standard); }
.bs-tag-enter-from, .bs-tag-leave-to { opacity: 0; transform: scale(0.85); }
.bs-none { font-size: 13px; color: var(--color-text-subtle); margin: 0; }

/* Luôn nằm gọn trong màn hình: khung 3 cột cao theo chiều cao cửa sổ (trừ header trang,
   thanh bước, tiêu đề, nút); hình người co theo chiều cao, cột nào dài thì tự cuộn bên trong. */
.checkin-card.is-wide { padding: 24px 28px 20px; }
.checkin-card.is-wide .step-indicator { margin-bottom: 16px; }
.bs { height: max(280px, calc(100dvh - 330px)); }
.bs-body { min-height: 0; overflow: hidden; }
.bs-svg { flex: 1; min-height: 0; height: 100%; width: auto; max-width: 100%; }
.bs-zones { min-height: 0; overflow-y: auto; scrollbar-width: thin; }
.bs-detail { min-height: 0; overflow: hidden; }
.bs-options { flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-width: thin; }
.bs-picked { flex-shrink: 0; max-height: 40%; overflow-y: auto; scrollbar-width: thin; }
.bs-picked { margin-top: 10px; }
.bs-detail > .bs-empty { flex: 1; }
@media (max-height: 780px) {
  .bs-head .emo-sub { display: none; }
  .bs-zone-hint { display: none; }
  .bs-zone-btn { padding: 7px 12px; }
  .bs-hint { display: none; }
  .bs { height: max(260px, calc(100dvh - 290px)); }
}
/* Mọi bước đều nằm gọn trong một màn hình: thẻ gọn lề, hình minh hoạ co theo chiều cao cửa
   sổ (100dvh trừ phần chữ/nút cố định của từng bước). */
.checkin-card, .checkin-card.is-wide { padding: 24px 28px 20px; }
.step-indicator, .checkin-card.is-wide .step-indicator { margin-bottom: 16px; }
/* Bước 1–2: nhân vật cảm xúc. */
.emo-figure { width: clamp(120px, calc(100dvh - 500px), 220px); height: clamp(120px, calc(100dvh - 500px), 220px); margin: 4px 0 0; }
/* Bước 3: giữ bố cục cây trên — yếu tố dưới, cây co theo chiều cao cửa sổ. */
.gw { gap: 12px; margin-bottom: 18px; }
.gw-svg { width: auto; max-width: 100%; height: clamp(160px, calc(100dvh - 520px), 340px); }
@media (max-height: 760px) {
  .emo-head .emo-sub, .gw-head .emo-sub { display: none; }
  .emo-hello { font-size: 16px; }
}
/* Bước 5 (kết quả): bỏ thanh bước, thu gọn để nằm trong một màn hình. */
.rs-head { text-align: center; padding: 0 0 12px; }
/* Nhân vật cảm xúc giống bước 2 (cùng cảm xúc + mức độ), thay emoji. */
.rs-figure { display: block; width: clamp(64px, calc(100dvh - 660px), 120px); height: clamp(64px, calc(100dvh - 660px), 120px); margin: 0 auto 2px; }
.rs-title { font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--color-text); margin-bottom: 4px; }
.rs-msg { font-size: 13.5px; color: var(--color-text-muted); margin-bottom: 12px; }
.rs-badges { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
.rs-tasks { padding: 14px 16px; margin-bottom: 12px; border-radius: var(--radius-card); background: linear-gradient(135deg, var(--color-terracotta-soft), var(--color-brand-soft)); }
.rs-tasks-heading { font-size: 12px; font-weight: 700; color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.rs-empty { font-size: 13.5px; color: var(--color-text-muted); }
.rs-tasks .rt-item { padding: 8px 12px; margin-bottom: 6px; }
.rs-tasks .rt-item:last-child { margin-bottom: 0; }
.rs-tasks .rt-icon { width: 40px; height: 40px; font-size: 1.05rem; overflow: hidden; }
.rs-tasks .rt-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rs-modes { gap: 10px; margin-bottom: 14px; }
.rs-modes .mode-card { display: flex; flex-direction: column; justify-content: center; padding: 10px 14px; text-align: left; }
.rs-modes .mode-title { font-size: 13.5px; margin-bottom: 1px; }
.rs-modes .mode-time { margin-top: 0; }
.rs-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
/* Màn thấp: bỏ câu mô tả, thu khoảng cách để kết quả không phải cuộn. */
@media (max-height: 800px) {
  .rs-msg { display: none; }
  .rs-title { margin-bottom: 8px; }
  .rs-tasks { padding: 10px 14px; margin-bottom: 10px; }
  .rs-tasks .rt-item { padding: 6px 10px; }
  .rs-tasks .rt-icon { width: 34px; height: 34px; }
  .rs-modes { margin-bottom: 10px; }
  .rs-modes .mode-card { padding: 8px 12px; }
}
@media (max-width: 1100px) {
  .bs { grid-template-columns: 200px 220px 1fr; gap: 16px; }
}
/* Popup chọn biểu hiện trên mobile: nền mờ + khung trượt từ đáy lên. */
.bs-sheet-overlay { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: flex-end; justify-content: center; background: rgba(74, 55, 40, 0.38); }
.bs-sheet {
  width: 100%; max-width: 520px; max-height: 78dvh; display: flex; flex-direction: column;
  padding: 10px 18px calc(16px + env(safe-area-inset-bottom)); border-radius: var(--radius-panel) var(--radius-panel) 0 0;
  background: var(--color-surface); box-shadow: var(--shadow-soft); font-family: var(--font-body); color: var(--color-text);
}
.bs-sheet-grip { width: 40px; height: 4px; margin: 0 auto 12px; border-radius: 999px; background: var(--color-surface-muted); }
.bs-sheet-options { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; min-height: 0; margin: 0 -6px 14px; }
.bs-sheet .bs-option { min-height: 44px; }
.bs-sheet .bs-option:hover { background: var(--color-canvas); }
.bs-sheet-done { width: 100%; min-height: 44px; flex-shrink: 0; }
.bs-sheet-enter-active, .bs-sheet-leave-active { transition: opacity 220ms var(--ease-standard); }
.bs-sheet-enter-active .bs-sheet, .bs-sheet-leave-active .bs-sheet { transition: transform 260ms var(--ease-standard); }
.bs-sheet-enter-from, .bs-sheet-leave-to { opacity: 0; }
.bs-sheet-enter-from .bs-sheet, .bs-sheet-leave-to .bs-sheet { transform: translateY(100%); }
@media (max-width: 860px) {
  /* Cột chi tiết chỉ còn phần "đã ghi nhận" — chọn biểu hiện nằm trong popup. */
  .bs-detail > .bs-detail-label, .bs-detail > .bs-detail-title, .bs-detail > .bs-options, .bs-detail > .bs-empty { display: none; }
  .bs-detail .bs-picked { margin-top: 0; padding-top: 0; border-top: none; }
  .bs { grid-template-columns: 1fr 1fr; height: auto; }
  .bs-svg { height: auto; width: 100%; }
  .bs-zones, .bs-options, .bs-picked { overflow: visible; max-height: none; }
  .bs-body { grid-column: 1 / -1; }
  .bs-svg { max-width: 170px; }
}
@media (max-width: 600px) {
  .bs { grid-template-columns: 1fr; }
  /* Mobile: danh sách vùng xếp 2 cột, nhãn nhóm chiếm cả hàng. */
  .bs-zones { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .bs-zones > .bs-section { grid-column: 1 / -1; }
  .bs-zone-btn { padding: 9px 10px; min-height: 44px; }
  .bs-zone-name { font-size: 13.5px; }
  .bs-zone-hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .bs-figure, .bs-options, .bs-wave, .bs-battery-fill { animation: none; }
  .checkin-card { transition: none; }
}

@media (max-width: 600px) {
  .gw-head .emo-title { font-size: 21px; }
  .gw-svg { max-width: 260px; }
}
@media (prefers-reduced-motion: reduce) {
  .gw-sway, .gw-sway-soft, .gw-tree, .gw-wind, .gw-sun-rays, .gw-fly, .gw-wings, .gw-cloud, .gw-drop, .gw-bolt, .gw-flash, .gw-blown { animation: none !important; }
  .gw-drop { opacity: 0.6; }
  .gw-bolt, .gw-flash, .gw-blown, .gw-fly { opacity: 0; }
  .gw-wind { opacity: 0; }
  .gw-grow { transition: opacity 200ms linear; }
}

.mood-slider::-webkit-slider-thumb { box-shadow: var(--shadow-soft); }
.slider-labels { color: var(--color-text-subtle); }
.slider-val { color: var(--color-brand); }

.tag-btn { border: none; border-radius: 999px; background: var(--color-canvas); box-shadow: none; color: var(--color-text-muted); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.tag-btn:hover, .tag-btn.selected { background: var(--color-brand-soft); border-color: transparent; color: var(--color-brand); box-shadow: none; }

@media (max-width: 600px) {
  .emo-title { font-size: 24px; }
  .emo-figure { width: 172px; height: 172px; }
}
</style>
