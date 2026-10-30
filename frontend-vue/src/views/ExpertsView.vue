<template>
  <div class="experts-page">
    <!-- Emergency Overlay -->
    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-title">{{ t('experts.emergency.title') }}</div>
        <p class="ep-text">{{ t('experts.emergency.text') }}</p>
        <div class="ep-hotline">
          <div class="eph-num">0931773637</div>
          <div class="eph-label">{{ t('experts.emergency.hotlineLabel') }}</div>
        </div>
        <div class="ep-actions">
          <a href="tel:0931773637" class="ep-btn ep-btn-red">{{ t('experts.emergency.callHotline') }}</a>
          <button class="ep-btn ep-btn-green" @click="emergencyOpen = false">{{ t('experts.emergency.connectNow') }}</button>
          <button class="ep-btn ep-btn-ghost" @click="emergencyOpen = false">{{ t('experts.emergency.imOk') }}</button>
        </div>
      </div>
    </div>

    <!-- Booking Modal -->
    <div class="modal-overlay" :class="{ show: bookingOpen }" @click="closeBookingIfOutside">
      <div class="booking-modal" v-if="bookingOpen && currentExpert">
        <div class="bm-header">
          <button class="bm-close" @click="closeBookingModal">✕</button>
          <div class="bm-avatar">
            <img v-if="avatarUrls[currentExpert.id]" :src="avatarUrls[currentExpert.id]" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">
            <template v-else>{{ currentExpert.avatar }}</template>
          </div>
          <div>
            <div class="bm-name">{{ t('experts.booking.titleWithName', { name: currentExpert.name }) }}</div>
            <div class="bm-degree">{{ currentExpert.degree }}</div>
          </div>
        </div>
        <div class="bm-body">
          <div v-if="bookingPhase === 'form'" class="bm-step-indicator">
            <div class="bm-step" :class="{ active: bookingStep === 1 }">{{ t('experts.booking.steps.step1') }}</div>
            <div class="bm-step" :class="{ active: bookingStep === 2 }">{{ t('experts.booking.steps.step2') }}</div>
            <div class="bm-step" :class="{ active: bookingStep === 3 }">{{ t('experts.booking.steps.step3') }}</div>
            <div class="bm-step" :class="{ active: bookingStep === 4 }">{{ t('experts.booking.steps.step4') }}</div>
          </div>

          <!-- Step 1 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 1">
            <div class="bm-client-type-banner" :class="currentExpert.is_returning_client ? 'returning-client' : 'new-client'">
              {{ currentExpert.is_returning_client ? t('experts.booking.returningBanner') : t('experts.booking.newBanner') }}
            </div>
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.sessionTypeTitle') }}</div>
              <div class="session-types">
                <div
                  v-for="opt in sessionOptions"
                  :key="opt.key"
                  class="session-type-card"
                  :class="{ selected: bookingData.sessionType === opt.key }"
                  @click="bookingData.sessionType = opt.key"
                >
                  <div class="stc-name">{{ t(opt.labelKey) }}</div>
                </div>
              </div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.durationTitle') }}</div>
              <div class="session-types">
                <div
                  v-for="opt in durationTierOptions"
                  :key="opt.key"
                  class="session-type-card"
                  :class="{ selected: bookingData.durationTier === opt.key }"
                  @click="selectDurationTier(opt)"
                >
                  <div class="stc-name">{{ t(opt.labelKey) }}</div>
                  <div class="stc-price">{{ opt.priceLabel }}</div>
                  <div class="stc-duration">{{ t(opt.durationLabelKey) }}</div>
                </div>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;">
              <button class="btn-primary" @click="goBookingStep(2)">{{ t('experts.booking.nextBtn') }}</button>
            </div>
          </div>

          <!-- Step 2 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 2">
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.dateTitle') }}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <button class="btn-outline" style="padding:5px 12px;font-size:0.75rem;" :disabled="bookingMonthOffset <= 0" :style="{ opacity: bookingMonthOffset <= 0 ? 0.4 : 1, cursor: bookingMonthOffset <= 0 ? 'default' : 'pointer' }" @click="changeMonth(-1)">{{ t('experts.booking.prevMonth') }}</button>
                <span style="font-size:0.85rem;font-weight:700;">{{ calMonthLabel }}</span>
                <button class="btn-outline" style="padding:5px 12px;font-size:0.75rem;" @click="changeMonth(1)">{{ t('experts.booking.nextMonth') }}</button>
              </div>
              <div class="calendar-grid">
                <div v-for="wd in WEEKDAY_LABELS" :key="wd" class="cal-header">{{ wd }}</div>
                <template v-for="(day, idx) in calendarDays" :key="day ? day.iso : `blank-${idx}`">
                  <div v-if="!day" class="cal-day disabled"></div>
                  <div
                    v-else
                    class="cal-day"
                    :class="{ selected: bookingData.date === day.iso, today: day.isToday, disabled: day.past }"
                    @click="!day.past && selectBookingDate(day.iso)"
                  >{{ day.day }}</div>
                </template>
              </div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.timeTitle') }}</div>
              <div class="time-slots">
                <div v-if="!bookingData.date || !currentExpertId" class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary);font-size:0.85rem;padding:6px 2px;">{{ t('experts.booking.chooseDateFirst') }}</div>
                <div v-else-if="timeSlotsLoading" class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary);font-size:0.85rem;padding:6px 2px;">{{ t('experts.booking.loadingSlots') }}</div>
                <div v-else-if="!timeSlots.length" class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary);font-size:0.85rem;padding:6px 2px;">{{ t('experts.booking.noSlots') }}</div>
                <div
                  v-else
                  v-for="time in timeSlots"
                  :key="time"
                  class="time-slot"
                  :class="{ selected: bookingData.time === time }"
                  @click="bookingData.time = time"
                >{{ time }}</div>
              </div>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button class="btn-outline" @click="goBookingStep(1)">{{ t('experts.booking.backBtn') }}</button>
              <button class="btn-primary" @click="goBookingStep(3)">{{ t('experts.booking.nextBtn') }}</button>
            </div>
          </div>

          <!-- Step 3 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 3">
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.topicTitle') }}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <button
                  v-for="topicOpt in TOPIC_OPTIONS"
                  :key="topicOpt"
                  type="button"
                  :style="bookingChipStyle(bookingData.topic === topicOpt)"
                  @click="bookingData.topic = bookingData.topic === topicOpt ? '' : topicOpt"
                >{{ topicOpt }}</button>
              </div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.severityTitle') }}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <button
                  v-for="s in SEVERITY_OPTIONS"
                  :key="s"
                  type="button"
                  :style="bookingChipStyle(bookingData.severity === s)"
                  @click="bookingData.severity = bookingData.severity === s ? '' : s"
                >{{ s }}</button>
              </div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.descTitle') }}</div>
              <textarea
                class="problem-textarea"
                rows="5"
                v-model="notesFreeText"
                :placeholder="t('experts.booking.descPlaceholder')"
              ></textarea>
              <div style="font-size:0.72rem;color:var(--text-light);margin-top:4px;">{{ t('experts.booking.encryptNote') }}</div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.contactTitle') }} <span style="color:var(--coral);">*</span></div>
              <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;margin:0 0 10px;">{{ t('experts.booking.contactSub') }}</p>
              <input
                type="tel"
                v-model="bookingData.contactPhone"
                :placeholder="t('experts.booking.phonePlaceholder')"
                style="width:100%;box-sizing:border-box;border:1px solid transparent;border-radius:var(--radius-control);background:var(--color-canvas);padding:9px 12px;font:inherit;font-size:0.85rem;"
              >
              <div style="font-size:0.72rem;color:var(--text-light);margin-top:4px;">{{ t('experts.booking.phoneAccuracyNote') }}</div>
              <input
                type="text"
                v-model="bookingData.contactSocial"
                :placeholder="t('experts.booking.socialPlaceholder')"
                style="width:100%;box-sizing:border-box;margin-top:8px;border:1px solid transparent;border-radius:var(--radius-control);background:var(--color-canvas);padding:9px 12px;font:inherit;font-size:0.85rem;"
              >
            </div>
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.oldRecordsTitle') }} <span style="color:var(--coral);">*</span></div>
              <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;margin:0 0 10px;" v-html="t('experts.booking.oldRecordsDesc')"></p>
              <label style="display:inline-flex;align-items:center;padding:7px 14px;border:1.5px solid var(--mint-dark);border-radius:999px;background:var(--mint-light);color:var(--text-primary);font-weight:700;font-size:0.82rem;cursor:pointer;">
                <input ref="medicalFileInput" type="file" multiple accept="image/*,application/pdf" style="display:none;" @change="onPickMedicalFiles">
                <span>{{ t('experts.booking.addFileBtn') }}</span>
              </label>
              <div v-if="medicalRecordFiles.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
                <span
                  v-for="(f, i) in medicalRecordFiles"
                  :key="i"
                  style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:var(--cream);font-size:0.78rem;border:1px solid var(--kraft-light);"
                >{{ f.name }} <button type="button" style="border:none;background:none;cursor:pointer;color:var(--coral);font-size:0.8rem;padding:0;" @click="medicalRecordFiles.splice(i, 1)">✕</button></span>
              </div>
              <textarea
                v-model="medicalRecordNote"
                rows="2"
                maxlength="2000"
                :placeholder="t('experts.booking.recordNotePlaceholder')"
                style="width:100%;box-sizing:border-box;margin-top:10px;border:1.5px solid var(--kraft-light);border-radius:12px;padding:8px 10px;font-family:inherit;font-size:0.85rem;resize:vertical;"
              ></textarea>
              <div v-if="medicalRecordError" style="font-size:0.78rem;color:var(--coral);margin-top:6px;">{{ medicalRecordError }}</div>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button class="btn-outline" @click="goBookingStep(2)">{{ t('experts.booking.backBtn') }}</button>
              <button class="btn-primary" @click="goBookingStep(4)">{{ t('experts.booking.summaryBtn') }}</button>
            </div>
          </div>

          <!-- Step 4 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 4">
            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.booking.confirmTitle') }}</div>
              <div class="booking-summary">
                <div class="bs-row"><span>{{ t('experts.booking.expertLabel') }}</span><span>{{ currentExpert.name }}</span></div>
                <div class="bs-row"><span>{{ t('experts.booking.typeLabel') }}</span><span>{{ bookingSummaryTypeLabel }}</span></div>
                <div class="bs-row"><span>{{ t('experts.booking.dateTimeLabel') }}</span><span>{{ bookingData.startsAt ? formatDateTime(bookingData.startsAt) : t('experts.booking.notSelected') }}</span></div>
                <div class="bs-row"><span>{{ t('experts.booking.durationLabel') }}</span><span>{{ t('experts.booking.minutesUnit', { n: bookingData.duration }) }}</span></div>
                <div class="bs-row"><span>{{ t('experts.booking.totalLabel') }}</span><span>{{ formatCurrency(bookingData.price) }}</span></div>
                <div class="bs-row"><span>{{ t('experts.booking.contactLabel') }}</span><span>{{ bookingData.contactPhone }}{{ bookingData.contactSocial ? ` · ${bookingData.contactSocial}` : '' }}</span></div>
              </div>
              <div style="margin-top:10px;padding:10px 12px;background:var(--peach-light);border:1.5px solid var(--peach);border-radius:var(--radius-sm);font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">
                {{ t('experts.booking.reminderNote') }}
              </div>
              <div class="booking-process-guide">
                <div class="bpg-title">{{ t('experts.booking.processGuide.title') }}</div>
                <ol class="bpg-steps">
                  <li>{{ t('experts.booking.processGuide.step1') }}</li>
                  <li>{{ t('experts.booking.processGuide.step2') }}</li>
                  <li>{{ t('experts.booking.processGuide.step3') }}</li>
                  <li>{{ t('experts.booking.processGuide.step4') }}</li>
                </ol>
              </div>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button class="btn-outline" @click="goBookingStep(3)">{{ t('experts.booking.backBtn') }}</button>
              <button class="btn-primary" @click="confirmBooking">{{ t('experts.booking.confirmBtn') }}</button>
            </div>
          </div>

          <!-- Payment -->
          <div v-if="bookingPhase === 'payment'">
            <template v-if="!paymentPaid">
              <div class="bm-section">
                <div class="bm-section-title">{{ t('experts.booking.payment.title') }}</div>
                <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:14px;line-height:1.5;" v-html="paymentIntro"></p>
                <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:center;">
                  <img :src="paymentInfo.qr_image" alt="QR" style="width:200px;height:200px;border:1.5px solid var(--kraft-light);border-radius:12px;background:#fff;">
                  <div style="font-size:0.86rem;line-height:1.95;min-width:200px;">
                    <div><span style="color:var(--text-secondary);">{{ t('experts.booking.payment.bankLabel') }}</span> <strong>{{ paymentInfo.bank?.bankId || '' }}</strong></div>
                    <div><span style="color:var(--text-secondary);">{{ t('experts.booking.payment.accountLabel') }}</span> <strong>{{ paymentInfo.bank?.accountNo || '' }}</strong></div>
                    <div><span style="color:var(--text-secondary);">{{ t('experts.booking.payment.accountNameLabel') }}</span> <strong>{{ paymentInfo.bank?.accountName || '' }}</strong></div>
                    <div><span style="color:var(--text-secondary);">{{ t('experts.booking.payment.amountLabel') }}</span> <strong style="color:var(--coral);">{{ formatCurrency(paymentInfo.amount) }}</strong></div>
                    <div><span style="color:var(--text-secondary);">{{ t('experts.booking.payment.contentLabel') }}</span> <strong>{{ paymentInfo.content || '' }}</strong></div>
                  </div>
                </div>
                <div v-if="paymentInfo.auto" style="text-align:center;margin-top:10px;font-size:0.82rem;color:var(--mint-dark);font-weight:700;">{{ t('experts.booking.payment.waitingAuto') }}</div>
                <div style="text-align:center;margin-top:8px;font-size:0.82rem;color:var(--text-secondary);">{{ paymentCountdownText }}</div>
              </div>
              <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button class="btn-outline" @click="closeBookingModal">{{ t('experts.booking.payment.payLaterBtn') }}</button>
                <button v-if="canPayWallet" class="btn-primary" @click="payWallet">{{ t('experts.booking.payment.payWalletBtn', { amount: formatCurrency(walletBalance) }) }}</button>
                <template v-if="!paymentInfo.auto">
                  <button class="btn-primary" @click="claimPayment">{{ t('experts.booking.payment.claimBtn') }}</button>
                </template>
                <a v-else-if="paymentInfo.checkout_url" class="btn-primary" :href="paymentInfo.checkout_url" target="_blank" rel="noopener">{{ t('experts.booking.payment.openCheckoutBtn') }}</a>
              </div>
            </template>
            <template v-else>
              <div style="text-align:center;padding:20px 0;">
                <div style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">{{ paymentPaidTitle }}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">{{ paymentPaidText }}</div>
                <button class="btn-primary" @click="closeBookingModal">{{ t('experts.booking.payment.closeBtn') }}</button>
              </div>
            </template>
          </div>

          <!-- Success -->
          <div v-if="bookingPhase === 'success'" style="text-align:center;padding:20px 0;">
            <div style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">{{ t('experts.booking.success.title') }}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">{{ t('experts.booking.success.desc') }}</div>
            <div style="padding:14px;background:var(--mint-light);border:1.5px solid var(--mint);border-radius:var(--radius-sm);margin-bottom:14px;font-size:0.82rem;color:var(--text-secondary);">
              <strong>{{ formatDateTime(bookingData.startsAt) }}</strong><br>
              <span>{{ t(SESSION_CONFIG[bookingData.sessionType]?.labelKey) }}</span> {{ t('experts.booking.success.withExpert') }} <strong>{{ currentExpert.name }}</strong>
            </div>
            <button class="btn-primary" @click="closeBookingModal">{{ t('experts.booking.success.closeBtn') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div class="modal-overlay" :class="{ show: reviewOpen }" @click="closeReviewIfOutside">
      <div v-if="reviewOpen" style="background:var(--warm-white);border-radius:18px;max-width:420px;width:calc(100% - 32px);padding:24px;box-shadow:0 24px 60px rgba(74,55,40,.2);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <h3 style="margin:0;font-size:1.2rem;">{{ t('experts.review.title') }}</h3>
          <button style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--text-secondary);" @click="closeReviewModal">✕</button>
        </div>
        <p style="margin:0 0 16px;color:var(--text-secondary);">{{ reviewState.expertName ? t('experts.review.subtitle', { name: reviewState.expertName }) : '' }}</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            style="background:none;border:none;cursor:pointer;font-size:2rem;line-height:1;padding:0;"
            :style="{ color: n <= reviewState.rating ? '#f5a623' : '#d8cfc2' }"
            @click="reviewState.rating = n"
          >★</button>
        </div>
        <textarea v-model="reviewState.comment" rows="3" :placeholder="t('experts.review.commentPlaceholder')" style="width:100%;border:1.5px solid var(--kraft-light);border-radius:12px;padding:10px 12px;font-family:inherit;font-size:0.9rem;resize:vertical;box-sizing:border-box;margin-bottom:16px;"></textarea>
        <button class="btn-primary" style="width:100%;" @click="submitReview">{{ t('experts.review.submitBtn') }}</button>
      </div>
    </div>

    <!-- Profile Modal -->
    <div class="modal-overlay" :class="{ show: profileOpen }" @click="closeProfileIfOutside">
      <div class="profile-modal" v-if="profileOpen && currentExpert">
        <div class="pm-hero">
          <button class="pm-close" @click="closeProfileModal">✕</button>
          <div class="pm-avatar">
            <img v-if="avatarUrls[currentExpert.id]" :src="avatarUrls[currentExpert.id]" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">
            <template v-else>{{ currentExpert.avatar }}</template>
          </div>
          <div class="pm-name">{{ currentExpert.name }}</div>
          <div class="pm-degree">{{ currentExpert.degree }}</div>
          <div class="pm-tags">
            <span v-for="s in currentExpert.specialties" :key="s" class="badge-pill badge-mint">{{ s }}</span>
          </div>
        </div>
        <div class="pm-body">
          <div class="pm-stats-grid">
            <div class="stat-card"><div class="sc-num">{{ currentExpert.rating }}</div><div class="sc-label">{{ t('experts.profile.ratingLabel') }}</div></div>
            <div class="stat-card"><div class="sc-num">{{ currentExpert.sessions }}</div><div class="sc-label">{{ t('experts.profile.sessionsLabel') }}</div></div>
            <div class="stat-card"><div class="sc-num">{{ currentExpert.experience }}</div><div class="sc-label">{{ t('experts.profile.experienceLabel') }}</div></div>
          </div>
          <div style="margin-top:16px;"></div>
          <div class="pm-section">
            <div class="pm-section-title">{{ t('experts.profile.bioTitle') }}</div>
            <div class="pm-bio">{{ currentExpert.bio }}</div>
          </div>
          <div class="pm-section">
            <div class="pm-section-title">{{ t('experts.profile.credentialsTitle') }}</div>
            <div>
              <div v-for="(c, idx) in currentExpert.credentials" :key="idx" style="font-size:0.8rem;margin-bottom:4px;">{{ c }}</div>
            </div>
          </div>
          <div class="pm-section">
            <div class="pm-section-title">{{ t('experts.profile.approachesTitle') }}</div>
            <div>
              <span v-for="(a, idx) in currentExpert.approaches" :key="idx" class="badge-pill badge-sky" style="margin-right:6px;margin-bottom:6px;">{{ a }}</span>
            </div>
          </div>
          <div class="pm-section">
            <div class="pm-section-title">{{ t('experts.profile.reviewsTitle') }}</div>
            <div class="pm-reviews"></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
            <button class="btn-primary" style="flex:1;justify-content:center;" @click="closeProfileModal(); openBookingModal(currentExpertId)">{{ t('experts.profile.bookNowBtn') }}</button>
            <button class="btn-outline" @click="closeProfileModal(); openShareRecordModal(currentExpert)">{{ t('experts.expertCard.shareRecordBtn') }}</button>
            <button class="btn-outline" @click="closeProfileModal">{{ t('experts.profile.closeBtn') }}</button>
          </div>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <!-- Hàng đầu: gợi ý AI bên trái, số dư ví + khẩn cấp bên phải. -->
      <div class="page-header">
        <div class="paper-card ai-match-banner">
          <div class="amb-text">
            <div class="at-title">{{ aiMatch?.title || t('experts.aiMatch.defaultTitle') }}</div>
            <div class="at-sub">{{ aiMatch?.subtitle || t('experts.aiMatch.defaultSubtitle') }}</div>
          </div>
          <div class="amb-action">
            <button class="btn-primary btn-icon" :title="t('experts.aiMatch.viewSuggestions')" :aria-label="t('experts.aiMatch.viewSuggestions')" @click="filterExperts('matched')"><NavIcon name="arrowRight" /></button>
          </div>
        </div>
        <div class="experts-header-actions">
          <span v-if="walletBalance > 0" class="experts-wallet" :title="t('experts.walletLabel', { amount: formatCurrency(walletBalance) })"><NavIcon name="wallet" />{{ formatCurrency(walletBalance) }}</span>
          <button class="btn-icon btn-icon-danger btn-sos" :title="t('experts.emergencyBtn')" :aria-label="t('experts.emergencyBtn')" @click="emergencyOpen = true">SOS</button>
        </div>
      </div>

      <section v-if="myBookings.items.length" class="paper-card" style="padding:18px 20px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;">
          <div class="page-title" style="font-size:1.15rem;margin:0;">{{ t('experts.myBookings.title') }}</div>
        </div>
        <div>
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <button
              type="button"
              style="padding:7px 14px;border-radius:999px;font:inherit;font-weight:700;font-size:0.82rem;cursor:pointer;"
              :style="{ border: `1.5px solid ${myBookings.tab === 'upcoming' ? 'var(--mint-dark)' : 'var(--kraft-light)'}`, background: myBookings.tab === 'upcoming' ? 'var(--mint-light)' : 'transparent', color: 'var(--text-primary)' }"
              @click="myBookings.tab = 'upcoming'"
            >{{ t('experts.myBookings.upcomingTab', { n: upcomingBookingsList.length }) }}</button>
            <button
              type="button"
              style="padding:7px 14px;border-radius:999px;font:inherit;font-weight:700;font-size:0.82rem;cursor:pointer;"
              :style="{ border: `1.5px solid ${myBookings.tab === 'all' ? 'var(--mint-dark)' : 'var(--kraft-light)'}`, background: myBookings.tab === 'all' ? 'var(--mint-light)' : 'transparent', color: 'var(--text-primary)' }"
              @click="myBookings.tab = 'all'"
            >{{ t('experts.myBookings.allTab', { n: myBookings.items.length }) }}</button>
          </div>
          <div style="max-height:360px;overflow-y:auto;">
            <div v-if="!visibleBookings.length" style="padding:16px 2px;color:var(--text-secondary);font-size:0.88rem;">{{ t('experts.myBookings.empty') }}</div>
            <div v-for="b in visibleBookings" :key="b.id" class="mb-item">
              <div class="mb-avatar">
                <img v-if="avatarUrls[b.expert_id]" :src="avatarUrls[b.expert_id]" alt="">
                <template v-else>{{ b.expert_avatar || '👩‍⚕️' }}</template>
              </div>
              <div class="mb-info">
                <div class="mb-name">{{ b.expert_name || t('experts.myBookings.defaultExpertName') }}</div>
                <div class="mb-meta">{{ SESSION_CONFIG[b.session_type] ? t(SESSION_CONFIG[b.session_type].labelKey) : b.session_type }} · {{ formatDateTime(b.starts_at) }} · {{ t('experts.myBookings.minutesUnit', { n: b.duration_minutes }) }}</div>
              </div>
              <span class="mb-badge" :style="{ color: bookingStatusBadge(b).color, background: bookingStatusBadge(b).bg }">{{ t(bookingStatusBadge(b).labelKey) }}</span>
              <button
                v-if="bookingActions(b).length"
                type="button" class="mb-more-btn"
                :aria-label="t('experts.myBookings.moreActions')" :title="t('experts.myBookings.moreActions')"
                @click="actionSheetBooking = b"
              ><NavIcon name="more" /></button>
              <div class="mb-actions">
                <div v-if="b.status === 'completed'" class="mb-action-row">
                  <router-link class="btn-outline mb-icon-btn" :title="plainText(t('messages.chatBtn'))" :aria-label="plainText(t('messages.chatBtn'))" :to="{ name: 'messages', query: { expert: b.expert_id } }"><NavIcon name="messages" /></router-link>
                  <div v-if="b.review_rating" style="color:#f5a623;font-weight:800;white-space:nowrap;">{{ '★'.repeat(b.review_rating) }}</div>
                  <button v-else class="btn-primary" style="padding:6px 14px;font-size:0.82rem;" @click="openReviewModal(b.id, b.expert_name)">{{ t('experts.myBookings.reviewBtn') }}</button>
                </div>
                <div v-else-if="b.status === 'pending_payment'" class="mb-action-row">
                  <button class="btn-primary" style="padding:6px 12px;font-size:0.8rem;" @click="reopenPayment(b.id, b.expert_id)">{{ t('experts.myBookings.payBtn') }}</button>
                  <button class="btn-outline mb-icon-btn mb-icon-danger" :title="t('experts.myBookings.cancelBtn')" :aria-label="t('experts.myBookings.cancelBtn')" @click="cancelMyBooking(b.id)"><NavIcon name="close" /></button>
                </div>
                <div v-else-if="['pending', 'awaiting_expert', 'confirmed'].includes(b.status)" class="mb-action-row">
                  <button v-if="b.status === 'confirmed' && b.zoom_join_url" type="button" class="btn-primary mb-icon-btn" :title="t('experts.myBookings.zoomBtn')" :aria-label="t('experts.myBookings.zoomBtn')" @click="openZoomRoom(b.id)"><NavIcon name="video" /></button>
                  <router-link v-if="b.status === 'confirmed'" class="btn-outline mb-icon-btn" :title="plainText(t('messages.chatBtn'))" :aria-label="plainText(t('messages.chatBtn'))" :to="{ name: 'messages', query: { expert: b.expert_id } }"><NavIcon name="messages" /></router-link>
                  <button class="btn-outline mb-icon-btn mb-icon-danger" :title="t('experts.myBookings.cancelBtn')" :aria-label="t('experts.myBookings.cancelBtn')" @click="cancelMyBooking(b.id)"><NavIcon name="close" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Mobile: thao tác của một lịch hẹn mở trong popup trượt từ đáy lên. -->
      <Teleport to="body">
        <Transition name="mb-sheet">
          <div v-if="actionSheetBooking" class="mb-sheet-overlay" @click.self="actionSheetBooking = null">
            <div class="mb-sheet" role="dialog" aria-modal="true" :aria-label="actionSheetBooking.expert_name || t('experts.myBookings.defaultExpertName')">
              <div class="mb-sheet-grip" aria-hidden="true"></div>
              <div class="mb-sheet-head">
                <div class="mb-avatar">
                  <img v-if="avatarUrls[actionSheetBooking.expert_id]" :src="avatarUrls[actionSheetBooking.expert_id]" alt="">
                  <template v-else>{{ actionSheetBooking.expert_avatar || '👩‍⚕️' }}</template>
                </div>
                <div class="mb-info">
                  <div class="mb-name">{{ actionSheetBooking.expert_name || t('experts.myBookings.defaultExpertName') }}</div>
                  <div class="mb-meta">{{ formatDateTime(actionSheetBooking.starts_at) }} · {{ t('experts.myBookings.minutesUnit', { n: actionSheetBooking.duration_minutes }) }}</div>
                </div>
              </div>
              <button
                v-for="act in bookingActions(actionSheetBooking)" :key="act.key"
                type="button" class="mb-sheet-action" :class="{ 'is-primary': act.primary, 'is-danger': act.danger }"
                @click="runBookingAction(act)"
              ><NavIcon :name="act.icon" />{{ act.label }}</button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <ShareRecordModal
        v-if="shareRecordExpert"
        :expert-id="shareRecordExpert.id"
        :expert-name="shareRecordExpert.name || t('experts.myBookings.defaultExpertName')"
        @close="shareRecordExpert = null"
      />

      <div class="stats-bar">
        <div class="paper-card stat-card"><div class="sc-num">{{ summary?.active_experts || 0 }}</div><div class="sc-label">{{ t('experts.stats.activeExperts') }}</div></div>
        <div class="paper-card stat-card"><div class="sc-num">{{ summary?.avg_rating || 0 }}</div><div class="sc-label">{{ t('experts.stats.avgRating') }}</div></div>
        <div class="paper-card stat-card"><div class="sc-num">{{ Number(summary?.total_sessions || 0).toLocaleString(intlLocale) }}</div><div class="sc-label">{{ t('experts.stats.completedSessions') }}</div></div>
        <div class="paper-card stat-card"><div class="sc-num">{{ summary?.satisfaction_rate || 0 }}%</div><div class="sc-label">{{ t('experts.stats.satisfaction') }}</div></div>
      </div>

      <section class="paper-card session-structure-section">
        <p class="sss-intro" v-html="t('experts.sessionStructure.intro')"></p>
        <h3 class="sss-title">{{ t('experts.sessionStructure.title') }}</h3>
        <p class="sss-sub">{{ t('experts.sessionStructure.subtitle') }}</p>
        <div class="sss-steps">
          <div class="sss-step sss-step-mint">
            <div class="sss-step-badge"><NavIcon name="messages" class="sss-step-icon" /><span class="sss-step-num">1</span></div>
            <div class="sss-step-title">{{ t('experts.sessionStructure.step1Title') }}</div>
            <div class="sss-step-en">{{ t('experts.sessionStructure.step1En') }}</div>
            <p class="sss-step-desc">{{ t('experts.sessionStructure.step1Desc') }}</p>
          </div>
          <div class="sss-step sss-step-sky">
            <div class="sss-step-badge"><NavIcon name="search" class="sss-step-icon" /><span class="sss-step-num">2</span></div>
            <div class="sss-step-title">{{ t('experts.sessionStructure.step2Title') }}</div>
            <div class="sss-step-en">{{ t('experts.sessionStructure.step2En') }}</div>
            <p class="sss-step-desc">{{ t('experts.sessionStructure.step2Desc') }}</p>
          </div>
          <div class="sss-step sss-step-lavender">
            <div class="sss-step-badge"><NavIcon name="tests" class="sss-step-icon" /><span class="sss-step-num">3</span></div>
            <div class="sss-step-title">{{ t('experts.sessionStructure.step3Title') }}</div>
            <div class="sss-step-en">{{ t('experts.sessionStructure.step3En') }}</div>
            <p class="sss-step-desc">{{ t('experts.sessionStructure.step3Desc') }}</p>
          </div>
          <div class="sss-step sss-step-peach">
            <div class="sss-step-badge"><NavIcon name="compass" class="sss-step-icon" /><span class="sss-step-num">4</span></div>
            <div class="sss-step-title">{{ t('experts.sessionStructure.step4Title') }}</div>
            <div class="sss-step-en">{{ t('experts.sessionStructure.step4En') }}</div>
            <p class="sss-step-desc">{{ t('experts.sessionStructure.step4Desc') }}</p>
          </div>
        </div>
      </section>

      <div class="filter-section">
        <div class="filter-row filter-row-buttons">
          <button v-for="f in FILTER_BUTTONS" :key="f.id" class="filter-btn" :class="{ active: currentFilter === f.id }" @click="filterExperts(f.id)">{{ t(f.labelKey) }}</button>
        </div>
        <div class="filter-row">
          <div class="search-wrap">
            <!-- Mobile: thay hàng nút filter (chiếm nhiều dòng) bằng 1 nút lọc gọn cạnh ô
                 tìm kiếm, bấm vào mở dropdown chọn tag — desktop vẫn giữ hàng nút cũ. -->
            <button
              type="button"
              class="filter-toggle-btn"
              :class="{ active: currentFilter !== 'all' }"
              @click.stop="showFilterMenu = !showFilterMenu"
              :aria-expanded="showFilterMenu"
              :aria-label="t('experts.filterMenuLabel')"
            ><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg></button>
            <input type="text" class="search-input" :placeholder="t('experts.searchPlaceholder')" :value="search" @input="search = $event.target.value">
            <div v-if="showFilterMenu" class="filter-dropdown" @click.stop>
              <button
                v-for="f in FILTER_BUTTONS"
                :key="f.id"
                class="filter-dropdown-item"
                :class="{ active: currentFilter === f.id }"
                @click="filterExperts(f.id); showFilterMenu = false"
              >{{ t(f.labelKey) }}</button>
            </div>
          </div>
          <select class="sort-select" :value="currentSort" @change="currentSort = $event.target.value">
            <option value="rating">{{ t('experts.sort.rating') }}</option>
            <option value="sessions">{{ t('experts.sort.sessions') }}</option>
            <option value="price_asc">{{ t('experts.sort.priceAsc') }}</option>
            <option value="price_desc">{{ t('experts.sort.priceDesc') }}</option>
            <option value="available">{{ t('experts.sort.available') }}</option>
          </select>
        </div>
      </div>

      <div class="expert-grid">
        <div v-if="expertsLoading" class="paper-card experts-state">{{ t('experts.shareRecord.loading') }}</div>
        <div v-else-if="expertsLoadError" class="paper-card experts-state">
          {{ t('experts.shareRecord.loadError') }}
          <button type="button" class="btn-outline" @click="init">{{ t('experts.retryBtn') }}</button>
        </div>
        <div v-else-if="!filteredExperts.length" class="paper-card" style="padding:24px;text-align:center;color:var(--text-secondary);grid-column:1 / -1;">
          {{ t('experts.noExpertsMatch') }}
        </div>
        <div v-for="expert in filteredExperts" :key="expert.id" class="paper-card expert-card" @click="handleExpertCardClick(expert.id)">
          <div class="ec-top-banner" :class="expert.status"></div>
          <!-- Mobile: nút 3 chấm mở hồ sơ (card ấn vào thẳng để đặt lịch trên mobile, xem
               hồ sơ chi tiết phải qua nút riêng này) — CSS ẩn nút này ở desktop. -->
          <button type="button" class="ec-menu-btn" @click.stop="openProfileModal(expert.id)" :aria-label="t('experts.expertCard.viewProfileBtn')">⋮</button>
          <div class="ec-body">
            <div v-if="expert.matched" class="ec-match-badge">{{ t('experts.expertCard.matchedBadge') }}</div>
            <div class="ec-header">
              <div class="ec-avatar">
                <img v-if="avatarUrls[expert.id]" :src="avatarUrls[expert.id]" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">
                <template v-else>{{ expert.avatar }}</template>
                <div class="ec-status-dot" :class="expert.status" :title="statusDotLabel(expert.status)"></div>
              </div>
              <div class="ec-info">
                <div class="ec-name">{{ expert.name }}</div>
                <div class="ec-degree">{{ expert.degree }}</div>
                <div v-if="expert.rating" class="ec-rating">
                  <span class="ec-stars">{{ '★'.repeat(Math.max(1, Math.round(expert.rating || 0))) }}</span>
                  <span class="ec-rating-num">{{ expert.rating }}</span>
                  <span class="ec-sessions">{{ t('experts.expertCard.sessionsUnit', { n: expert.sessions }) }}</span>
                </div>
                <div v-else class="ec-rating ec-rating-empty">
                  {{ t('experts.expertCard.noRatingYet') }}
                  <span v-if="expert.sessions" class="ec-sessions">{{ t('experts.expertCard.sessionsUnit', { n: expert.sessions }) }}</span>
                </div>
              </div>
            </div>
            <div class="ec-specialties">
              <span v-for="s in expert.specialties.slice(0, 3)" :key="s" class="ec-specialty">{{ s }}</span>
              <span
                v-if="expert.specialties.length > 3"
                class="ec-specialty ec-specialty-more"
                :title="expert.specialties.slice(3).join(', ')"
                @click.stop="openProfileModal(expert.id)"
              >+{{ expert.specialties.length - 3 }}</span>
            </div>
            <p class="ec-bio">{{ expert.bio }}</p>
            <div class="ec-meta">
              <div class="ec-meta-item">{{ expert.location }}</div>
              <div class="ec-meta-item">{{ t('experts.expertCard.yearsExp', { n: expert.experience }) }}</div>
            </div>
            <div class="ec-price-row">
              <div>
                <div class="ec-price">{{ t('experts.expertCard.newClientLabel', { price: getSessionPriceLabel(expert).newClient }) }}</div>
                <div class="ec-price-label">{{ t('experts.expertCard.returningClientLabel', { price: getSessionPriceLabel(expert).returningClient }) }}</div>
              </div>
              <div class="ec-next">{{ expert.nextSlot || t('experts.expertCard.noSlot') }}</div>
            </div>
            <div class="ec-actions">
              <button class="ec-btn-book" @click.stop="openBookingModal(expert.id)">{{ t('experts.expertCard.bookBtn') }}</button>
              <button class="ec-btn-msg ec-btn-icon" :title="t('experts.expertCard.viewProfileBtn')" :aria-label="t('experts.expertCard.viewProfileBtn')" @click.stop="openProfileModal(expert.id)"><NavIcon name="profile" /></button>
              <button class="ec-btn-msg ec-btn-icon" :title="t('experts.expertCard.shareRecordBtn')" :aria-label="t('experts.expertCard.shareRecordBtn')" @click.stop="openShareRecordModal(expert)"><NavIcon name="send" /></button>
            </div>
          </div>
        </div>
      </div>

      <div class="experts-disclaimer" v-html="t('experts.disclaimer')"></div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import ShareRecordModal from '../components/ShareRecordModal.vue';
import NavIcon from '../components/NavIcon.vue';
// Chuỗi i18n dùng chung (vd. messages.chatBtn) có emoji đứng đầu — bỏ đi khi hiển thị, thay bằng icon nét đơn sắc.
const plainText = (str) => String(str).replace(/^[^\p{L}\p{N}]+/u, '');

const route = useRoute();
const router = useRouter();

// Thao tác của một lịch hẹn theo trạng thái — cùng logic với các nút icon ở desktop, dùng cho
// popup trên mobile.
const actionSheetBooking = ref(null);
function bookingActions(b) {
  if (!b) return [];
  const chat = { key: 'chat', icon: 'messages', label: plainText(t('messages.chatBtn')), run: () => router.push({ name: 'messages', query: { expert: b.expert_id } }) };
  const cancel = { key: 'cancel', icon: 'close', label: t('experts.myBookings.cancelBtn'), danger: true, run: () => cancelMyBooking(b.id) };
  if (b.status === 'completed') {
    return b.review_rating ? [chat] : [{ key: 'review', icon: 'star', label: t('experts.myBookings.reviewBtn'), primary: true, run: () => openReviewModal(b.id, b.expert_name) }, chat];
  }
  if (b.status === 'pending_payment') {
    return [{ key: 'pay', icon: 'card', label: t('experts.myBookings.payBtn'), primary: true, run: () => reopenPayment(b.id, b.expert_id) }, cancel];
  }
  if (['pending', 'awaiting_expert', 'confirmed'].includes(b.status)) {
    const list = [];
    if (b.status === 'confirmed' && b.zoom_join_url) list.push({ key: 'zoom', icon: 'video', label: t('experts.myBookings.zoomBtn'), primary: true, run: () => openZoomRoom(b.id) });
    if (b.status === 'confirmed') list.push(chat);
    list.push(cancel);
    return list;
  }
  return [];
}
function runBookingAction(act) {
  actionSheetBooking.value = null;
  act.run();
}
const authStore = useAuthStore();
const { t, tm, locale } = useI18n();
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

const shareRecordExpert = ref(null);
function openShareRecordModal(expert) {
  shareRecordExpert.value = expert;
}

// Số di động VN: 10 số, bắt đầu 0, đầu số hợp lệ — khớp với regex ở backend
// (expert.routes.js, bookingCreateSchema) để báo lỗi sớm ngay trên form, không cần chờ submit.
const VN_PHONE_REGEX = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/;

const SESSION_CONFIG = {
  voice: { labelKey: 'experts.sessionConfig.voice', icon: '📞' },
  video: { labelKey: 'experts.sessionConfig.video', icon: '📹' }
};
const DURATION_TIERS = {
  quick: { labelKey: 'experts.durationTiers.quick', icon: '⚡', durationLabelKey: 'experts.durationTiers.quickDuration', minutes: 25 },
  standard: { labelKey: 'experts.durationTiers.standard', icon: '🕐', durationLabelKey: 'experts.durationTiers.standardDuration', minutes: 45 }
};
const WEEKDAY_LABELS = computed(() => tm('experts.weekdayLabels'));
// Chủ đề/mức độ ảnh hưởng được gộp vào `bookingData.notes` (text tự do) gửi thẳng cho CHUYÊN
// GIA (con người, nói tiếng Việt) đọc để quyết định nhận lịch — không phải text hiển thị UI
// thuần túy, nên CỐ Ý giữ nguyên tiếng Việt bất kể ngôn ngữ giao diện, để chuyên gia luôn đọc
// được nội dung đặt lịch một cách nhất quán.
const TOPIC_OPTIONS = ['Lo âu', 'Trầm cảm', 'Stress công việc', 'Mất ngủ', 'Mối quan hệ', 'Sang chấn', 'Khác'];
const SEVERITY_OPTIONS = ['Nhẹ', 'Vừa', 'Nặng'];
const FILTER_BUTTONS = [
  { id: 'all', labelKey: 'experts.filters.all' },
  { id: 'available', labelKey: 'experts.filters.available' },
  { id: 'anxiety', labelKey: 'experts.filters.anxiety' },
  { id: 'depression', labelKey: 'experts.filters.depression' },
  { id: 'stress', labelKey: 'experts.filters.stress' },
  { id: 'sleep', labelKey: 'experts.filters.sleep' },
  { id: 'relationship', labelKey: 'experts.filters.relationship' },
  { id: 'trauma', labelKey: 'experts.filters.trauma' }
];
const BOOKING_STATUS_BADGE = {
  pending_payment: { labelKey: 'experts.bookingStatus.pending_payment', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
  pending: { labelKey: 'experts.bookingStatus.pending', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
  awaiting_expert: { labelKey: 'experts.bookingStatus.awaiting_expert', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
  confirmed: { labelKey: 'experts.bookingStatus.confirmed', color: '#2f8f5b', bg: 'rgba(47,143,91,.14)' },
  completed: { labelKey: 'experts.bookingStatus.completed', color: '#5a6b5c', bg: 'rgba(120,140,120,.16)' },
  cancelled: { labelKey: 'experts.bookingStatus.cancelled', color: '#a23b3b', bg: 'rgba(200,80,80,.14)' },
  expired: { labelKey: 'experts.bookingStatus.expired', color: '#a23b3b', bg: 'rgba(200,80,80,.10)' }
};

const experts = ref([]);
const summary = ref(null);
const aiMatch = ref(null);
const upcomingBooking = ref(null);
const currentFilter = ref('all');
const currentSort = ref('rating');
const showFilterMenu = ref(false);
function closeFilterMenu() {
  showFilterMenu.value = false;
}
const search = ref('');
const currentExpertId = ref(null);
const bookingMonthOffset = ref(0);
const walletBalance = ref(0);
const avatarUrls = reactive({});
const avatarUrlCache = new Map();

const bookingData = reactive({
  expertId: null, sessionType: 'voice', durationTier: 'quick', price: 0,
  duration: DURATION_TIERS.quick.minutes, date: '', time: '10:00', startsAt: '',
  topic: '', severity: '', notes: '', contactPhone: '', contactSocial: ''
});
const notesFreeText = ref('');
const medicalFileInput = ref(null);
const medicalRecordFiles = ref([]);
const medicalRecordNote = ref('');
const medicalRecordError = ref('');

const bookingOpen = ref(false);
const profileOpen = ref(false);
const reviewOpen = ref(false);
const emergencyOpen = ref(false);
const bookingStep = ref(1);
const bookingPhase = ref('form');
const timeSlots = ref([]);
const timeSlotsLoading = ref(false);
const paymentInfo = ref(null);
const paymentPaid = ref(false);
const paymentPaidTitle = ref('');
const paymentPaidText = ref('');
const paymentCountdownText = ref('');
const currentBookingId = ref(null);

const myBookings = reactive({ items: [], tab: 'upcoming' });
const reviewState = reactive({ bookingId: null, expertName: '', rating: 5, comment: '' });

let paymentTimer = null;
let paymentPoll = null;

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}
function formatDateTime(value) {
  if (!value) return t('experts.notFormatted');
  return new Intl.DateTimeFormat(intlLocale.value, {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}
function getExpertById(id) {
  return experts.value.find((e) => e.id === id) || null;
}
const currentExpert = computed(() => getExpertById(currentExpertId.value));

function getSessionPriceLabel(expert) {
  const allPricing = expert?.session_pricing_all || {
    new_client: { quick: 300000, standard: 500000 },
    returning_client: { quick: 150000, standard: 200000 }
  };
  const formatRange = (pricing) => {
    const quick = Number(pricing?.quick || 0);
    const standard = Number(pricing?.standard || 0);
    return quick === standard ? formatCurrency(quick) : `${formatCurrency(quick)} - ${formatCurrency(standard)}`;
  };
  return { newClient: formatRange(allPricing.new_client), returningClient: formatRange(allPricing.returning_client) };
}

const sessionOptions = computed(() => Object.entries(SESSION_CONFIG).map(([key, c]) => ({ key, labelKey: c.labelKey, icon: c.icon })));
const durationTierOptions = computed(() => {
  const pricing = currentExpert.value?.session_pricing || { quick: 0, standard: 0 };
  return Object.entries(DURATION_TIERS).map(([key, config]) => ({
    key, labelKey: config.labelKey, icon: config.icon, minutes: config.minutes, durationLabelKey: config.durationLabelKey,
    price: pricing[key] || 0, priceLabel: formatCurrency(pricing[key] || 0)
  }));
});

async function getAvatarObjectUrl(id) {
  if (avatarUrlCache.has(id)) return avatarUrlCache.get(id);
  const blob = await apiClient.getBlob(`/experts/${id}/avatar`);
  const url = URL.createObjectURL(blob);
  avatarUrlCache.set(id, url);
  return url;
}
async function preloadAvatars(list) {
  await Promise.all(list.filter((e) => e.has_avatar_photo).map(async (e) => {
    try {
      avatarUrls[e.id] = await getAvatarObjectUrl(e.id);
    } catch (_err) { /* giữ nguyên emoji mặc định */ }
  }));
}


const filteredExperts = computed(() => {
  const query = search.value.trim().toLowerCase();
  let data = [...experts.value];

  if (currentFilter.value === 'available') {
    data = data.filter((e) => e.status === 'online');
  } else if (currentFilter.value === 'matched') {
    data = data.filter((e) => e.matched);
  } else if (currentFilter.value !== 'all') {
    data = data.filter((e) => e.tags.includes(currentFilter.value));
  }

  if (query) {
    data = data.filter((e) =>
      e.name.toLowerCase().includes(query) ||
      e.specialties.some((s) => s.toLowerCase().includes(query)) ||
      e.bio.toLowerCase().includes(query));
  }

  const sorted = [...data];
  switch (currentSort.value) {
    case 'sessions': sorted.sort((a, b) => b.sessions - a.sessions); break;
    case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
    case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
    case 'available': {
      const priority = { online: 0, busy: 1, offline: 2 };
      sorted.sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9));
      break;
    }
    case 'rating':
    default: sorted.sort((a, b) => b.rating - a.rating); break;
  }
  return sorted;
});

function filterExperts(criteria) {
  currentFilter.value = criteria;
}

// ============================================================
// BOOKING MODAL
// ============================================================
function bookingChipStyle(active) {
  return {
    padding: '7px 13px',
    borderRadius: '999px',
    border: `1.5px solid ${active ? 'var(--mint-dark)' : 'var(--kraft-light)'}`,
    background: active ? 'var(--mint-light)' : 'transparent',
    font: 'inherit',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    color: 'var(--text-primary)'
  };
}

function selectDurationTier(opt) {
  bookingData.durationTier = opt.key;
  bookingData.price = opt.price;
  bookingData.duration = opt.minutes;
}

const calMonthLabel = computed(() => {
  const today = new Date();
  const monthBase = new Date(today.getFullYear(), today.getMonth() + bookingMonthOffset.value, 1);
  return new Intl.DateTimeFormat(intlLocale.value, { month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(monthBase);
});
function toIsoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const calendarDays = computed(() => {
  const today = new Date();
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const monthBase = new Date(today.getFullYear(), today.getMonth() + bookingMonthOffset.value, 1);
  const daysInMonth = new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 0).getDate();
  // Chủ nhật = 0 — số ô trống đầu bảng để ngày 1 rơi đúng cột thứ trong tuần.
  const leadingBlanks = monthBase.getDay();

  const cells = Array.from({ length: leadingBlanks }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = toIsoDate(monthBase.getFullYear(), monthBase.getMonth(), d);
    cells.push({ iso, day: d, past: iso < todayIso, isToday: iso === todayIso });
  }
  return cells;
});

async function loadTimeSlots() {
  const expertId = currentExpertId.value;
  const date = bookingData.date;
  if (!expertId || !date) {
    timeSlots.value = [];
    return;
  }
  timeSlotsLoading.value = true;
  try {
    const slots = await apiClient.get(`/experts/${expertId}/slots?date=${date}`, { noCache: true });
    timeSlots.value = Array.isArray(slots) ? slots : [];
  } catch (_error) {
    timeSlots.value = [];
  } finally {
    timeSlotsLoading.value = false;
    if (!timeSlots.value.length) {
      bookingData.time = '';
    } else if (!timeSlots.value.includes(bookingData.time)) {
      bookingData.time = timeSlots.value[0];
    }
  }
}
function selectBookingDate(iso) {
  bookingData.date = iso;
  loadTimeSlots();
}
function changeMonth(offset) {
  bookingMonthOffset.value += offset;
}

function openBookingModal(id) {
  const expert = getExpertById(id);
  if (!expert) return;

  currentExpertId.value = id;
  bookingMonthOffset.value = 0;
  const defaultTier = durationTierOptionsFor(expert)[0];
  Object.assign(bookingData, {
    expertId: id, sessionType: 'voice', durationTier: defaultTier.key, price: defaultTier.price,
    // Bản gốc (renderCalendar()) tự chọn ngày hôm nay làm mặc định khi mở modal — giữ đúng hành vi đó.
    duration: defaultTier.minutes, date: new Date().toISOString().slice(0, 10), time: '10:00', startsAt: '', topic: '', severity: '', notes: '',
    contactPhone: authStore.user?.phone || '', contactSocial: ''
  });
  notesFreeText.value = '';
  medicalRecordFiles.value = [];
  medicalRecordNote.value = '';
  medicalRecordError.value = '';
  bookingStep.value = 1;
  bookingPhase.value = 'form';
  paymentPaid.value = false;
  currentBookingId.value = null;
  loadTimeSlots();
  bookingOpen.value = true;
  document.body.style.overflow = 'hidden';
}
function durationTierOptionsFor(expert) {
  const pricing = expert?.session_pricing || { quick: 0, standard: 0 };
  return Object.entries(DURATION_TIERS).map(([key, config]) => ({
    key, price: pricing[key] || 0, minutes: config.minutes
  }));
}

function closeBookingModal() {
  bookingOpen.value = false;
  document.body.style.overflow = '';
  stopPaymentCountdown();
  stopPaymentPoll();
}
function closeBookingIfOutside(event) {
  if (event.target.classList.contains('modal-overlay')) closeBookingModal();
}

function goBookingStep(step) {
  if (step === 3 && (!bookingData.date || !bookingData.time)) {
    alert(t('experts.alerts.chooseDateTimeFirst'));
    return;
  }
  if (step === 4) {
    if (!bookingData.contactPhone.trim()) {
      alert(t('experts.alerts.enterContactPhone'));
      return;
    }
    if (!VN_PHONE_REGEX.test(bookingData.contactPhone.trim())) {
      alert(t('experts.alerts.invalidContactPhone'));
      return;
    }
    if (!medicalRecordFiles.value.length && !medicalRecordNote.value.trim()) {
      medicalRecordError.value = t('experts.alerts.medicalRecordRequired');
      alert(medicalRecordError.value);
      return;
    }
    medicalRecordError.value = '';
    const startsAt = bookingData.date && bookingData.time ? `${bookingData.date}T${bookingData.time}:00+07:00` : '';
    bookingData.startsAt = startsAt;
    const headerParts = [];
    if (bookingData.topic) headerParts.push(`Chủ đề: ${bookingData.topic}`);
    if (bookingData.severity) headerParts.push(`Mức độ: ${bookingData.severity}`);
    bookingData.notes = [headerParts.join(' · '), notesFreeText.value.trim()].filter(Boolean).join('\n');
  }
  bookingStep.value = step;
}

function onPickMedicalFiles(e) {
  const picked = Array.from(e.target.files || []);
  const tooBig = picked.filter((f) => f.size > 5 * 1024 * 1024);
  medicalRecordError.value = tooBig.length ? t('experts.alerts.fileTooBig', { name: tooBig[0].name }) : '';
  medicalRecordFiles.value = medicalRecordFiles.value.concat(picked.filter((f) => f.size <= 5 * 1024 * 1024)).slice(0, 5);
  if (medicalFileInput.value) medicalFileInput.value.value = '';
}

async function uploadPendingMedicalRecords(bookingId) {
  if (!medicalRecordFiles.value.length && !medicalRecordNote.value.trim()) return;
  try {
    const formData = new FormData();
    medicalRecordFiles.value.forEach((f) => formData.append('files', f));
    if (medicalRecordNote.value.trim()) formData.set('note', medicalRecordNote.value.trim());
    await apiClient.postForm(`/bookings/${bookingId}/medical-records`, formData);
  } catch (error) {
    console.error('Gửi hồ sơ tham vấn cũ thất bại:', error);
  } finally {
    medicalRecordFiles.value = [];
    medicalRecordNote.value = '';
  }
}

const bookingSummaryTypeLabel = computed(() => {
  const session = SESSION_CONFIG[bookingData.sessionType] || SESSION_CONFIG.voice;
  const tier = DURATION_TIERS[bookingData.durationTier] || DURATION_TIERS.quick;
  const clientType = currentExpert.value?.is_returning_client ? t('experts.returningClient') : t('experts.newClient');
  return t('experts.bookingSummaryType', { session: t(session.labelKey), clientType, tier: t(tier.labelKey) });
});

async function confirmBooking() {
  const startsAt = bookingData.date && bookingData.time ? `${bookingData.date}T${bookingData.time}:00+07:00` : '';
  bookingData.startsAt = startsAt;

  try {
    const booking = await apiClient.post(`/experts/${currentExpertId.value}/bookings`, {
      session_type: bookingData.sessionType,
      duration_tier: bookingData.durationTier,
      starts_at: bookingData.startsAt,
      notes: bookingData.notes,
      contact_phone: bookingData.contactPhone.trim(),
      contact_social: bookingData.contactSocial.trim() || null
    });

    localStorage.setItem('peaceflow_dashboard_refresh', '1');
    loadMyBookings();
    currentBookingId.value = booking.id;
    await uploadPendingMedicalRecords(booking.id);
    if (booking.payment) {
      showPaymentStep(booking.id, booking.payment);
    } else {
      bookingPhase.value = 'success';
    }
  } catch (error) {
    console.error('Booking failed:', error);
    alert(error.message || t('experts.alerts.bookingFailed'));
  }
}

const paymentIntro = computed(() => (
  paymentInfo.value?.auto
    ? t('experts.booking.payment.introAuto')
    : t('experts.booking.payment.introManual')
));
const canPayWallet = computed(() => Number(paymentInfo.value?.amount) > 0 && walletBalance.value >= Number(paymentInfo.value?.amount));

function showPaymentStep(bookingId, payment) {
  currentBookingId.value = bookingId;
  paymentInfo.value = payment;
  paymentPaid.value = false;
  bookingPhase.value = 'payment';
  if (payment.auto) {
    startPaymentPoll(bookingId);
  }
  startPaymentCountdown(payment.expires_at);
}

function paymentPaidSuccess() {
  stopPaymentCountdown();
  stopPaymentPoll();
  paymentPaidTitle.value = t('experts.alerts.paidTitle');
  paymentPaidText.value = t('experts.alerts.paidText');
  paymentPaid.value = true;
  loadMyBookings();
}

function startPaymentPoll(bookingId) {
  stopPaymentPoll();
  paymentPoll = setInterval(async () => {
    try {
      const p = await apiClient.get(`/bookings/${bookingId}/payment`, { noCache: true });
      // Chỉ coi là "đã thanh toán" khi chuyển sang đúng các trạng thái sau thanh toán —
      // tránh nhận nhầm khi status chuyển thành 'expired' (đơn giữ chỗ hết hạn giữa lúc đang poll).
      if (['pending', 'awaiting_expert', 'confirmed'].includes(p.booking_status)) {
        paymentPaidSuccess();
      } else if (p.booking_status === 'expired') {
        stopPaymentPoll();
      }
    } catch (_e) { /* bỏ qua, thử lại lượt sau */ }
  }, 4000);
}
function stopPaymentPoll() {
  if (paymentPoll) { clearInterval(paymentPoll); paymentPoll = null; }
}

async function claimPayment() {
  const bookingId = currentBookingId.value;
  try {
    await apiClient.post(`/bookings/${bookingId}/claim-payment`, {});
    stopPaymentCountdown();
    paymentPaidTitle.value = t('experts.alerts.claimedTitle');
    paymentPaidText.value = t('experts.alerts.claimedText');
    paymentPaid.value = true;
    loadMyBookings();
  } catch (error) {
    alert(error.message || t('experts.alerts.claimFailed'));
  }
}

async function payWallet() {
  const bookingId = currentBookingId.value;
  try {
    await apiClient.post(`/bookings/${bookingId}/pay-wallet`, {});
    paymentPaidSuccess();
    loadWallet();
  } catch (error) {
    alert(error.message || t('experts.alerts.walletPayFailed'));
  }
}

function startPaymentCountdown(expiresAt) {
  stopPaymentCountdown();
  if (!expiresAt) return;
  const end = new Date(expiresAt).getTime();
  const tick = () => {
    const ms = end - Date.now();
    if (ms <= 0) { paymentCountdownText.value = t('experts.alerts.expiredCountdown'); stopPaymentCountdown(); return; }
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    paymentCountdownText.value = t('experts.alerts.countdown', { time: `${m}:${String(s).padStart(2, '0')}` });
  };
  tick();
  paymentTimer = setInterval(tick, 1000);
}
function stopPaymentCountdown() {
  if (paymentTimer) { clearInterval(paymentTimer); paymentTimer = null; }
}

async function reopenPayment(bookingId, expertId) {
  try {
    const p = await apiClient.get(`/bookings/${bookingId}/payment`, { noCache: true });
    if (p.booking_status === 'expired') {
      alert(t('experts.alerts.bookingExpiredReopen'));
      loadMyBookings();
      return;
    }
    if (p.booking_status !== 'pending_payment') {
      loadMyBookings();
      return;
    }
    currentExpertId.value = expertId;
    bookingOpen.value = true;
    document.body.style.overflow = 'hidden';
    showPaymentStep(bookingId, {
      amount: p.amount, qr_image: p.qr_image, content: p.content, bank: p.bank,
      expires_at: p.expires_at, auto: p.auto, checkout_url: p.checkout_url
    });
  } catch (_error) {
    alert(t('experts.alerts.cannotOpenPayment'));
  }
}

async function cancelMyBooking(bookingId) {
  if (!window.confirm(t('experts.alerts.confirmCancelBooking'))) return;
  try {
    const r = await apiClient.post(`/expert-bookings/${bookingId}/cancel`, {});
    alert(r?.refunded ? t('experts.alerts.cancelledWithRefund', { amount: formatCurrency(r.refunded) }) : t('experts.alerts.cancelledPlain'));
    loadMyBookings();
    loadWallet();
  } catch (error) {
    alert(error.message || t('experts.alerts.cancelFailed'));
  }
}

async function openZoomRoom(bookingId) {
  try {
    const res = await apiClient.get(`/bookings/${bookingId}/zoom-access`, { noCache: true });
    window.open(res.url, '_blank', 'noopener');
  } catch (error) {
    alert(error.message || t('experts.alerts.zoomOpenFailed'));
  }
}

// ============================================================
// PROFILE MODAL
// ============================================================
// Mobile: ấn thẳng vào card = đặt lịch ngay (xem hồ sơ chi tiết phải qua nút ⋮ riêng).
// Desktop/tablet giữ hành vi cũ: ấn card = xem hồ sơ. Dùng matchMedia thay vì lưu cố định
// lúc mount để vẫn đúng khi người dùng resize/xoay ngang màn hình.
function handleExpertCardClick(id) {
  if (window.matchMedia('(max-width: 600px)').matches) {
    openBookingModal(id);
  } else {
    openProfileModal(id);
  }
}

function openProfileModal(id) {
  currentExpertId.value = id;
  profileOpen.value = true;
  document.body.style.overflow = 'hidden';
}
function closeProfileModal() {
  profileOpen.value = false;
  document.body.style.overflow = '';
}
function closeProfileIfOutside(event) {
  if (event.target.classList.contains('modal-overlay')) closeProfileModal();
}

// ============================================================
// MY BOOKINGS
// ============================================================
function isUpcomingBooking(b) {
  return ['pending_payment', 'pending', 'awaiting_expert', 'confirmed'].includes(b.status) && new Date(b.starts_at).getTime() >= Date.now();
}
const upcomingBookingsList = computed(() => myBookings.items.filter(isUpcomingBooking));
const visibleBookings = computed(() => (myBookings.tab === 'upcoming' ? upcomingBookingsList.value : myBookings.items));
function bookingStatusBadge(b) {
  return BOOKING_STATUS_BADGE[b.status] || BOOKING_STATUS_BADGE.pending;
}

// Chú thích ý nghĩa chấm màu trạng thái hoạt động trên avatar — hiện qua tooltip vì màu sắc
// đơn thuần (xanh/cam/xám) không đủ tự giải thích, người dùng dễ phải đoán ý nghĩa.
const STATUS_DOT_LABEL_KEYS = {
  online: 'experts.expertCard.statusOnline',
  busy: 'experts.expertCard.statusBusy',
  offline: 'experts.expertCard.statusOffline'
};
function statusDotLabel(status) {
  return t(STATUS_DOT_LABEL_KEYS[status] || STATUS_DOT_LABEL_KEYS.offline);
}

async function loadMyBookings() {
  let bookings = [];
  try {
    bookings = await apiClient.get('/expert-bookings', { noCache: true });
  } catch (_error) {
    bookings = [];
  }
  if (!Array.isArray(bookings) || !bookings.length) {
    myBookings.items = [];
    return;
  }
  myBookings.items = bookings;
  myBookings.tab = bookings.some(isUpcomingBooking) ? 'upcoming' : 'all';
  preloadBookingAvatars(bookings);
}
// Ảnh đại diện chuyên gia trong "Lịch hẹn của tôi": dùng chung cache với thẻ chuyên gia; chuyên
// gia chưa có ảnh (API lỗi/404) thì giữ emoji mặc định.
function preloadBookingAvatars(bookings) {
  const ids = [...new Set(bookings.map((b) => b.expert_id).filter(Boolean))];
  ids.forEach(async (id) => {
    if (avatarUrls[id]) return;
    // Đã biết chuyên gia này chưa có ảnh (từ danh sách) thì khỏi gọi API.
    const known = experts.value.find((e) => e.id === id);
    if (known && !known.has_avatar_photo) return;
    try { avatarUrls[id] = await getAvatarObjectUrl(id); } catch (_err) { /* giữ emoji mặc định */ }
  });
}

// ============================================================
// REVIEW MODAL
// ============================================================
function openReviewModal(bookingId, expertName) {
  reviewState.bookingId = bookingId;
  reviewState.expertName = expertName || '';
  reviewState.rating = 5;
  reviewState.comment = '';
  reviewOpen.value = true;
  document.body.style.overflow = 'hidden';
}
function closeReviewModal() {
  reviewOpen.value = false;
  document.body.style.overflow = '';
}
function closeReviewIfOutside(event) {
  if (event.target.classList.contains('modal-overlay')) closeReviewModal();
}
async function submitReview() {
  if (!reviewState.bookingId) return;
  try {
    await apiClient.post(`/expert-bookings/${reviewState.bookingId}/review`, {
      rating: reviewState.rating,
      comment: reviewState.comment.trim()
    });
    closeReviewModal();
    loadMyBookings();
  } catch (error) {
    alert(error.message || t('experts.alerts.reviewFailed'));
  }
}

// ============================================================
// WALLET & INIT
// ============================================================
async function loadWallet() {
  try {
    const w = await apiClient.get('/wallet', { noCache: true });
    walletBalance.value = Number(w.balance) || 0;
  } catch (_error) {
    walletBalance.value = 0;
  }
}

// Trạng thái tải danh sách: trước đây lúc đang tải/lỗi chỉ hiện "chưa có chuyên gia phù hợp",
// không phân biệt được API chậm, lỗi hay thật sự không có ai.
const expertsLoading = ref(true);
const expertsLoadError = ref(false);
async function init() {
  expertsLoading.value = true;
  expertsLoadError.value = false;
  try {
    const payload = await apiClient.get('/experts');
    experts.value = payload.experts || [];
    summary.value = payload.summary || {};
    aiMatch.value = payload.ai_match || null;
    upcomingBooking.value = payload.upcoming_booking || null;

    preloadAvatars(experts.value);
    loadMyBookings();
    loadWallet();

    // Đến từ trang khác (vd. kết quả bài test) với gợi ý 1 chuyên gia cụ thể — mở thẳng
    // modal đặt lịch luôn, khỏi bắt người dùng tìm lại trong danh sách.
    const bookExpertId = route.query.book;
    if (bookExpertId && getExpertById(bookExpertId)) {
      openBookingModal(bookExpertId);
    }
  } catch (error) {
    console.error('Experts init failed:', error);
    expertsLoadError.value = true;
  } finally {
    expertsLoading.value = false;
  }
}

function handleBookingChanged() {
  loadMyBookings();
  loadWallet();
}

onMounted(() => {
  init();
  window.addEventListener('peaceflow:booking-changed', handleBookingChanged);
  document.addEventListener('click', closeFilterMenu);
});
onBeforeUnmount(() => {
  window.removeEventListener('peaceflow:booking-changed', handleBookingChanged);
  document.removeEventListener('click', closeFilterMenu);
  stopPaymentCountdown();
  stopPaymentPoll();
  // Lưới an toàn: nếu người dùng điều hướng sang trang khác trong lúc modal (đặt lịch/hồ sơ/
  // đánh giá) còn mở, Vue unmount component mà không chạy các hàm close* — nếu không reset ở
  // đây, body sẽ bị kẹt overflow:hidden vĩnh viễn (phải F5 mới vuốt/scroll được lại).
  document.body.style.overflow = '';
});
</script>

<style scoped src="../assets/experts.css"></style>
<style scoped>
/* Đồng bộ với trang tổng quan (DashboardView.vue): nền ivory + ảnh lá, thẻ trắng bo mềm không
   viền/bóng giấy, chữ Inter + tiêu đề --font-heading, nút/bộ lọc phẳng, đường kẻ mảnh liền nét
   thay nét gạch kraft. Đặt SAU experts.css để thắng thứ tự nguồn (experts.css còn được
   ShareRecordModal.vue import riêng — không sửa file gốc). */
.experts-page {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55; color: var(--color-text);
  background: var(--color-canvas); -webkit-font-smoothing: antialiased; position: relative; isolation: isolate; min-height: 100vh;
}
.experts-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { padding: 20px 20px 32px; }
.experts-page :is(input, textarea, select, button) { font-family: inherit; }
.experts-page :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.breadcrumb, .breadcrumb a { color: var(--color-text-subtle); font-size: 13px; }
.breadcrumb a:hover { color: var(--color-brand); }
.page-title { font-family: var(--font-heading); font-size: 26px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); }
.page-subtitle { font-size: 14px; color: var(--color-text-muted); margin-top: 2px; }
/* Hàng đầu chỉ còn số dư ví + nút khẩn cấp, dồn bên phải (chừa chỗ chuông/SOS nổi góc phải). */
.page-header { flex-wrap: nowrap; align-items: center; gap: 16px; margin-bottom: 18px; }
.page-header > .ai-match-banner { flex: 1 1 auto; min-width: 0; margin: 0; }
.experts-header-actions { display: flex; align-items: center; gap: 10px; margin-right: 120px; flex-shrink: 0; }
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .page-header { flex-wrap: wrap; }
  .page-header > .ai-match-banner { flex-basis: 100%; }
  /* Mobile: ví nổi lên hàng trên cùng (cạnh nút ☰, ngang chuông/SOS của MobileTopbar — cũng
     nổi trên nội dung nhưng dưới sidebar z-index 200), bỏ nút SOS vì thanh trên cùng đã có SOS. */
  .experts-header-actions { position: fixed; z-index: 150; top: calc(env(safe-area-inset-top, 0px) + 4px); left: 52px; margin: 0; }
  .experts-wallet { height: 36px; padding: 0 12px; font-size: 13.5px; box-shadow: var(--shadow-soft); }
  .experts-header-actions .btn-sos { display: none; }
  .experts-header-actions:not(:has(.experts-wallet)) { display: none; }
}

/* Nút phẳng như .pf-btn-* của Dashboard. */
.btn-primary, .btn-outline, .ec-btn-book, .ec-btn-msg {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; border: none; border-radius: var(--radius-control); box-shadow: none; transform: none;
  font-family: inherit; font-weight: 600; text-decoration: none; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn-primary, .btn-outline { padding: 8px 16px; font-size: 14px; }
.btn-primary, .ec-btn-book { background: var(--color-brand); color: var(--color-on-brand); }
.btn-primary:hover, .ec-btn-book:hover { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); box-shadow: none; transform: none; }
.btn-outline, .ec-btn-msg { background: var(--color-surface-muted); color: var(--color-text); }
.btn-outline:hover, .ec-btn-msg:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.btn-primary:disabled, .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

/* Nhãn: nền nhạt, không viền. */
.badge-pill { border: none !important; font-size: 12px; }
.badge-mint { background: var(--color-brand-soft); color: var(--color-brand); }
.badge-peach { background: var(--color-terracotta-soft); color: var(--color-terracotta); }

/* Thẻ: nền trắng, bo --radius-card, không viền/bóng giấy. */
.paper-card, .expert-card, .sss-step {
  background: var(--color-surface); border: none; border-radius: var(--radius-card); box-shadow: none;
}
.ai-match-banner { background: var(--color-surface); border: none; }
.amb-text .at-title { font-family: var(--font-heading); font-size: 16px; font-weight: 800; color: var(--color-text); }
.amb-text .at-sub { font-size: 14px; color: var(--color-text-muted); }
.mb-item { border-bottom-color: var(--color-surface-muted); }
.mb-name { font-weight: 600; color: var(--color-text); }
.mb-meta { color: var(--color-text-muted); }
.stat-card .sc-num { font-family: var(--font-heading); color: var(--color-brand); }
.stat-card .sc-label { color: var(--color-text-muted); }

/* Cấu trúc buổi tư vấn. */
.sss-title { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.sss-intro, .sss-sub, .sss-step-desc { color: var(--color-text-muted); }
.sss-step { background: var(--color-canvas); }
.sss-step:hover { box-shadow: none; }
.sss-step-badge { box-shadow: none; }
.sss-step-num { border-color: var(--color-surface); }
.sss-step-title { font-family: var(--font-heading); color: var(--color-text); }

/* Bộ lọc, tìm kiếm, sắp xếp. */
.filter-btn { border: none; border-radius: 999px; background: var(--color-surface); color: var(--color-text-muted); font-family: inherit; font-weight: 600; box-shadow: none; }
.filter-btn:hover { background: var(--color-surface-muted); color: var(--color-text); }
.filter-btn.active { background: var(--color-brand-soft); color: var(--color-brand); border: none; box-shadow: none; }
.search-input, .sort-select { border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-text); font-family: inherit; font-size: 14px; min-height: 40px; }
.search-input:focus, .sort-select:focus { outline: none; border-color: var(--color-brand); }
.filter-toggle-btn { border: none; border-radius: var(--radius-control); background: var(--color-surface); }
.filter-toggle-btn.active { background: var(--color-brand-soft); border: none; }
.filter-dropdown { border: none; border-radius: var(--radius-card); background: var(--color-surface); box-shadow: var(--shadow-soft); }
.filter-dropdown-item { font-family: inherit; border-radius: var(--radius-control); }
.filter-dropdown-item.active { background: var(--color-brand-soft); color: var(--color-brand); }

/* Thẻ chuyên gia: giữ dải trạng thái trên đầu + chấm trạng thái, bỏ viền/bóng giấy. */
.expert-card { transition: transform var(--duration-normal) var(--ease-standard), background-color var(--duration-normal) var(--ease-standard); }
.expert-card:hover { box-shadow: none; transform: translateY(-2px); background: color-mix(in srgb, var(--color-brand-soft) 30%, var(--color-surface)); }
.ec-top-banner.available { background: var(--color-brand); }
.ec-top-banner.busy { background: var(--color-terracotta); }
.ec-top-banner.offline { background: var(--color-surface-muted); }
.ec-avatar { border: none; background: var(--color-brand-soft); }
.ec-name { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.ec-degree, .ec-bio, .ec-meta-item { color: var(--color-text-muted); }
.ec-sessions, .ec-price-label { color: var(--color-text-subtle); }
.ec-specialty { border: none; background: var(--color-brand-soft); color: var(--color-brand); }
.ec-specialty-more { background: var(--color-surface-muted); color: var(--color-text-muted); }
.ec-price-row { border: none; border-radius: var(--radius-control); background: var(--color-canvas); }
.ec-price { color: var(--color-text); }
.ec-btn-book, .ec-btn-msg { padding: 7px 12px; font-size: 13px; }
.ec-match-badge { border: none; background: var(--color-terracotta-soft); color: var(--color-terracotta); }
.ec-menu-btn { box-shadow: none; background: var(--color-surface-muted); }

/* Cửa sổ đặt lịch / hồ sơ / đánh giá. */
.booking-modal, .profile-modal { border: none; border-radius: var(--radius-panel); background: var(--color-surface); box-shadow: var(--shadow-soft); font-family: var(--font-body); color: var(--color-text); }
.bm-header, .bm-actions { border-color: var(--color-surface-muted); border-style: solid; border-width: 0; }
.bm-header { border-bottom-width: 1px; }
.bm-actions { border-top-width: 1px; }
.bm-close, .pm-close { border: none; background: var(--color-surface-muted); }
.bm-close:hover, .pm-close:hover { background: var(--color-brand-soft); }
.bm-avatar, .pm-avatar { border: none; box-shadow: none; background: var(--color-brand-soft); }
.bm-name, .pm-name { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.bm-degree, .pm-degree { color: var(--color-text-muted); }
.bm-section-title, .pm-section-title { font-family: var(--font-heading); color: var(--color-text); }
.pm-section-title { border-bottom: 1px solid var(--color-surface-muted); }
.pm-hero { background: linear-gradient(135deg, var(--color-brand-soft), var(--color-surface)); }
.pm-cred-item { border-bottom: 1px solid var(--color-surface-muted); }
.pm-approach-item, .pm-review, .pm-stat { border: none; background: var(--color-canvas); border-radius: var(--radius-control); }
.bm-step { border: none; background: var(--color-surface-muted); color: var(--color-text-muted); }
.bm-step.active { background: var(--color-brand-soft); color: var(--color-brand); }
.bm-step.done { background: var(--color-brand); color: var(--color-on-brand); }
.bm-client-type-banner { border: none !important; border-radius: var(--radius-control); }
.session-type-card { border: 1.5px solid transparent; border-radius: var(--radius-card); background: var(--color-canvas); box-shadow: none; }
.session-type-card:hover { border-color: transparent; background: var(--color-brand-soft); }
.session-type-card.selected { border-color: var(--color-brand); background: var(--color-brand-soft); box-shadow: none; }
.cal-day { border-radius: var(--radius-control); }
.cal-day:hover { background: var(--color-brand-soft); border-color: transparent; }
.cal-day.today { border-color: var(--color-brand); }
.cal-day.selected { background: var(--color-brand); border-color: var(--color-brand); color: var(--color-on-brand); }
.time-slot { border: 1.5px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas); }
.time-slot:hover { border-color: transparent; background: var(--color-brand-soft); }
.time-slot.selected { background: var(--color-brand); border-color: var(--color-brand); color: var(--color-on-brand); }
.problem-textarea { border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas); font-family: inherit; color: var(--color-text); }
.problem-textarea:focus { outline: none; border-color: var(--color-brand); }
.booking-summary { border: none; border-radius: var(--radius-card); background: var(--color-brand-soft); }
.bs-row { border-bottom: 1px solid color-mix(in srgb, var(--color-brand) 20%, transparent); }
.booking-process-guide { border: none; border-radius: var(--radius-card); background: var(--color-canvas); }

/* Popup khẩn cấp giống bản ở trang check-in. */
.emergency-popup { border: none; border-radius: var(--radius-panel); box-shadow: var(--shadow-soft); }
.ep-hotline { border: none; border-radius: var(--radius-card); background: var(--color-danger-soft); }
.ep-btn { border: none; border-radius: var(--radius-control); box-shadow: none; font-family: inherit; }
.ep-btn-red { background: var(--color-danger); color: #fff; }
.ep-btn-green { background: var(--color-brand-soft); color: var(--color-brand); }
.ep-btn-ghost { background: var(--color-surface-muted); color: var(--color-text-muted); }

/* Lưu ý cuối trang (đang viết inline) — bỏ viền, nền cam đất nhạt. */
.ec-stars { color: #E8A93C; letter-spacing: 1px; }
/* Icon nét đơn sắc trong vòng tròn từng bước, cùng tông màu với số thứ tự của bước. */
.sss-step-badge .sss-step-icon { width: 32px; height: 32px; stroke-width: 1.6; }
.sss-step-mint .sss-step-icon { color: var(--mint-dark); }
.sss-step-sky .sss-step-icon { color: var(--sky-dark); }
.sss-step-lavender .sss-step-icon { color: var(--lavender-dark); }
.sss-step-peach .sss-step-icon { color: var(--peach-dark); }
@media (max-width: 600px) { .sss-step-badge .sss-step-icon { width: 24px; height: 24px; } }
/* Nút chỉ có icon nét đơn sắc (chữ chuyển vào title/aria-label). */
.btn-icon { width: 40px; min-width: 40px; height: 40px; padding: 0; }
.btn-icon-danger { display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: var(--radius-control); background: var(--color-danger); color: #fff; cursor: pointer; transition: filter var(--duration-fast) var(--ease-standard); }
.btn-icon-danger:hover { filter: brightness(0.92); }
.btn-icon .nav-icon, .ec-btn-icon .nav-icon { width: 20px; height: 20px; }
.experts-wallet { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 14px; border-radius: var(--radius-control); background: var(--color-brand-soft); color: var(--color-brand); font-size: 14px; font-weight: 700; white-space: nowrap; }
.experts-wallet .nav-icon { width: 18px; height: 18px; }
.ec-btn-icon { flex: 0 0 auto; width: 40px; padding: 0; }
.experts-state { grid-column: 1 / -1; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; color: var(--color-text-muted); }
.btn-sos { font-size: 12.5px; font-weight: 800; letter-spacing: 0.04em; }
/* Lịch hẹn: nút ⋮ chỉ dùng ở mobile. */
.mb-more-btn { display: none; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: none; color: var(--color-text-muted); cursor: pointer; border-radius: var(--radius-control); flex-shrink: 0; }
.mb-more-btn .nav-icon { width: 24px; height: 24px; stroke-width: 2.6; }
/* Popup thao tác lịch hẹn (mobile). */
.mb-sheet-overlay { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: flex-end; justify-content: center; background: rgba(74, 55, 40, 0.38); }
.mb-sheet {
  width: 100%; max-width: 520px; display: flex; flex-direction: column; gap: 4px;
  padding: 10px 16px calc(16px + env(safe-area-inset-bottom)); border-radius: var(--radius-panel) var(--radius-panel) 0 0;
  background: var(--color-surface); box-shadow: var(--shadow-soft); font-family: var(--font-body); color: var(--color-text);
}
.mb-sheet-grip { width: 40px; height: 4px; margin: 0 auto 10px; border-radius: 999px; background: var(--color-surface-muted); }
.mb-sheet-head { display: flex; align-items: center; gap: 12px; padding: 0 4px 12px; margin-bottom: 4px; border-bottom: 1px solid var(--color-surface-muted); }
.mb-sheet-action {
  display: flex; align-items: center; gap: 14px; width: 100%; min-height: 50px; padding: 0 12px;
  border: none; border-radius: var(--radius-control); background: none; font-family: inherit; font-size: 15px; font-weight: 600;
  color: var(--color-text); text-align: left; cursor: pointer;
}
.mb-sheet-action .nav-icon { width: 22px; height: 22px; color: var(--color-text-muted); }
.mb-sheet-action:active, .mb-sheet-action:hover { background: var(--color-canvas); }
.mb-sheet-action.is-primary, .mb-sheet-action.is-primary .nav-icon { color: var(--color-brand); }
.mb-sheet-action.is-danger, .mb-sheet-action.is-danger .nav-icon { color: var(--color-danger); }
.mb-sheet-enter-active, .mb-sheet-leave-active { transition: opacity 220ms var(--ease-standard); }
.mb-sheet-enter-active .mb-sheet, .mb-sheet-leave-active .mb-sheet { transition: transform 260ms var(--ease-standard); }
.mb-sheet-enter-from, .mb-sheet-leave-to { opacity: 0; }
.mb-sheet-enter-from .mb-sheet, .mb-sheet-leave-to .mb-sheet { transform: translateY(100%); }
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  /* Mobile: avatar | tên + giờ + trạng thái | nút ⋮ — các nút thao tác dời vào popup. */
  .mb-item { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; grid-template-areas: "av info more" "av badge more"; column-gap: 12px; row-gap: 4px; align-items: center; padding: 12px 0; }
  .mb-item > .mb-avatar { grid-area: av; align-self: start; width: 44px; height: 44px; }
  .mb-item > .mb-info { grid-area: info; }
  .mb-item > .mb-badge { grid-area: badge; justify-self: start; }
  .mb-item > .mb-more-btn { grid-area: more; display: inline-flex; }
  .mb-item > .mb-actions { display: none; }
  .mb-item .mb-meta { font-size: 12.5px; line-height: 1.4; }
}
/* Ảnh đại diện chuyên gia trong danh sách lịch hẹn. */
.mb-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--color-brand-soft); font-size: 1.3rem; }
.mb-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
/* Nút thao tác lịch hẹn chỉ có icon (chữ chuyển vào title/aria-label). */
.mb-icon-btn { width: 36px; min-width: 36px; height: 36px; min-height: 36px; padding: 0; }
.mb-icon-btn .nav-icon { width: 18px; height: 18px; }
.mb-icon-danger:hover { background: var(--color-danger-soft); color: var(--color-danger); }
/* Chỉ để icon, bỏ khung nền: nền trong suốt, hover chỉ đổi màu icon. */
.mb-icon-btn, .mb-icon-btn:hover, .ec-btn-icon, .ec-btn-icon:hover { background: transparent; box-shadow: none; filter: none; }
.mb-icon-btn, .ec-btn-icon { color: var(--color-text-muted); }
.mb-icon-btn .nav-icon, .ec-btn-icon .nav-icon { width: 26px; height: 26px; }
.mb-icon-btn, .ec-btn-icon { width: 42px; min-width: 42px; height: 42px; min-height: 42px; }
.mb-icon-btn.btn-primary { color: var(--color-brand); }
.mb-icon-btn:hover, .ec-btn-icon:hover { color: var(--color-brand); }
.mb-icon-danger:hover { color: var(--color-danger); }
/* Nút phễu chỉ hiện trên mobile (experts.css ẩn sẵn ở desktop) — ở đây chỉ chỉnh căn icon + màu. */
.filter-toggle-btn { align-items: center; justify-content: center; color: var(--color-text-muted); }
/* Desktop dùng hàng nút lọc; menu thả xuống chỉ dành cho mobile (≤600px) nên ẩn hẳn ở màn lớn. */
@media (min-width: 601px) { .filter-dropdown { display: none; } }
.filter-toggle-btn.active { color: var(--color-brand); }
.experts-disclaimer { padding: 14px 16px; border-radius: var(--radius-card); background: var(--color-terracotta-soft); font-size: 13px; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 20px; }
</style>
