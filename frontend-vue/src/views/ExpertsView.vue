<template>
  <div class="experts-page">
    <!-- Emergency Overlay -->
    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-icon">❤️</div>
        <div class="ep-title">Bạn không đơn độc</div>
        <p class="ep-text">Nếu bạn đang cảm thấy rất khó khăn, hãy để ai đó giúp bạn ngay bây giờ.</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">Đường dây nóng sức khỏe tâm thần — Miễn phí, 24/7</div>
        </div>
        <div class="ep-actions">
          <a href="tel:1800599920" class="ep-btn ep-btn-red">📞 Gọi ngay hotline</a>
          <button class="ep-btn ep-btn-green" @click="emergencyOpen = false">💬 Kết nối chuyên gia ngay</button>
          <button class="ep-btn ep-btn-ghost" @click="emergencyOpen = false">Tôi ổn, đóng lại</button>
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
            <div class="bm-name">Đặt lịch với {{ currentExpert.name }}</div>
            <div class="bm-degree">{{ currentExpert.degree }}</div>
          </div>
        </div>
        <div class="bm-body">
          <div v-if="bookingPhase === 'form'" class="bm-step-indicator">
            <div class="bm-step" :class="{ active: bookingStep === 1 }">1. Hình thức</div>
            <div class="bm-step" :class="{ active: bookingStep === 2 }">2. Lịch hẹn</div>
            <div class="bm-step" :class="{ active: bookingStep === 3 }">3. Mô tả</div>
            <div class="bm-step" :class="{ active: bookingStep === 4 }">4. Xác nhận</div>
          </div>

          <!-- Step 1 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 1">
            <div class="bm-client-type-banner" :class="currentExpert.is_returning_client ? 'returning-client' : 'new-client'">
              {{ currentExpert.is_returning_client ? '🔁 Tái khám — bạn đã từng hoàn thành 1 buổi với chuyên gia này, áp dụng giá tái khám.' : '🆕 Khám mới — đây là lần đầu bạn đặt lịch với chuyên gia này.' }}
            </div>
            <div class="bm-section">
              <div class="bm-section-title">💬 Chọn hình thức tư vấn</div>
              <div class="session-types">
                <div
                  v-for="opt in sessionOptions"
                  :key="opt.key"
                  class="session-type-card"
                  :class="{ selected: bookingData.sessionType === opt.key }"
                  @click="bookingData.sessionType = opt.key"
                >
                  <div class="stc-icon">{{ opt.icon }}</div>
                  <div class="stc-name">{{ opt.label }}</div>
                </div>
              </div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">⏱️ Chọn thời lượng</div>
              <div class="session-types">
                <div
                  v-for="opt in durationTierOptions"
                  :key="opt.key"
                  class="session-type-card"
                  :class="{ selected: bookingData.durationTier === opt.key }"
                  @click="selectDurationTier(opt)"
                >
                  <div class="stc-icon">{{ opt.icon }}</div>
                  <div class="stc-name">{{ opt.label }}</div>
                  <div class="stc-price">{{ opt.priceLabel }}</div>
                  <div class="stc-duration">{{ opt.durationLabel }}</div>
                </div>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;">
              <button class="btn-primary" @click="goBookingStep(2)">Tiếp theo →</button>
            </div>
          </div>

          <!-- Step 2 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 2">
            <div class="bm-section">
              <div class="bm-section-title">📅 Chọn ngày</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <button class="btn-outline" style="padding:5px 12px;font-size:0.75rem;" :disabled="bookingMonthOffset <= 0" :style="{ opacity: bookingMonthOffset <= 0 ? 0.4 : 1, cursor: bookingMonthOffset <= 0 ? 'default' : 'pointer' }" @click="changeMonth(-1)">← Tháng trước</button>
                <span style="font-size:0.85rem;font-weight:700;">{{ calMonthLabel }}</span>
                <button class="btn-outline" style="padding:5px 12px;font-size:0.75rem;" @click="changeMonth(1)">Tháng sau →</button>
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
              <div class="bm-section-title">⏰ Chọn giờ</div>
              <div class="time-slots">
                <div v-if="!bookingData.date || !currentExpertId" class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary);font-size:0.85rem;padding:6px 2px;">Hãy chọn ngày để xem giờ trống.</div>
                <div v-else-if="timeSlotsLoading" class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary);font-size:0.85rem;padding:6px 2px;">Đang tải khung giờ trống...</div>
                <div v-else-if="!timeSlots.length" class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary);font-size:0.85rem;padding:6px 2px;">Chuyên gia không còn giờ trống trong ngày này. Hãy chọn ngày khác.</div>
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
              <button class="btn-outline" @click="goBookingStep(1)">← Quay lại</button>
              <button class="btn-primary" @click="goBookingStep(3)">Tiếp theo →</button>
            </div>
          </div>

          <!-- Step 3 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 3">
            <div class="bm-section">
              <div class="bm-section-title">🧭 Bạn muốn được hỗ trợ về điều gì?</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <button
                  v-for="t in TOPIC_OPTIONS"
                  :key="t"
                  type="button"
                  :style="bookingChipStyle(bookingData.topic === t)"
                  @click="bookingData.topic = bookingData.topic === t ? '' : t"
                >{{ t }}</button>
              </div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">📊 Mức độ ảnh hưởng tới cuộc sống</div>
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
              <div class="bm-section-title">📝 Mô tả tình trạng của bạn</div>
              <textarea
                class="problem-textarea"
                rows="5"
                v-model="notesFreeText"
                placeholder="Chia sẻ ngắn gọn tình trạng &amp; điều bạn muốn được hỗ trợ. Thông tin này giúp chuyên gia hiểu và quyết định nhận lịch.

Ví dụ: Tôi đang gặp khó khăn với lo âu công việc và mất ngủ trong 2 tuần gần đây..."
              ></textarea>
              <div style="font-size:0.72rem;color:var(--text-light);margin-top:4px;">🔒 Thông tin được mã hóa AES-256 và chỉ chuyên gia được chọn mới có thể xem</div>
            </div>
            <div class="bm-section">
              <div class="bm-section-title">📎 Hồ sơ khám cũ <span style="color:var(--coral);">*</span></div>
              <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;margin:0 0 10px;">Bệnh án, đơn thuốc, chỉ số thăm khám từ nơi khác — giúp chuyên gia hiểu tình trạng của bạn hơn. <strong>Bắt buộc:</strong> đính kèm ảnh/PDF, hoặc ghi chú cụ thể bên dưới — nếu chưa từng khám ở đâu khác, hãy ghi rõ "Không có". Dữ liệu được mã hoá, chỉ chuyên gia buổi hẹn này xem được.</p>
              <label style="display:inline-flex;align-items:center;padding:7px 14px;border:1.5px solid var(--mint-dark);border-radius:999px;background:var(--mint-light);color:var(--text-primary);font-weight:700;font-size:0.82rem;cursor:pointer;">
                <input ref="medicalFileInput" type="file" multiple accept="image/*,application/pdf" style="display:none;" @change="onPickMedicalFiles">
                <span>+ Thêm ảnh/PDF</span>
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
                placeholder="Ghi chú cụ thể về hồ sơ khám cũ (ví dụ: đơn thuốc từ BV X, kê ngày ...). Nếu chưa từng khám ở đâu khác, hãy ghi &quot;Không có&quot;."
                style="width:100%;box-sizing:border-box;margin-top:10px;border:1.5px solid var(--kraft-light);border-radius:12px;padding:8px 10px;font-family:inherit;font-size:0.85rem;resize:vertical;"
              ></textarea>
              <div v-if="medicalRecordError" style="font-size:0.78rem;color:var(--coral);margin-top:6px;">{{ medicalRecordError }}</div>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button class="btn-outline" @click="goBookingStep(2)">← Quay lại</button>
              <button class="btn-primary" @click="goBookingStep(4)">Xem tóm tắt →</button>
            </div>
          </div>

          <!-- Step 4 -->
          <div v-if="bookingPhase === 'form' && bookingStep === 4">
            <div class="bm-section">
              <div class="bm-section-title">✅ Xác nhận đặt lịch</div>
              <div class="booking-summary">
                <div class="bs-row"><span>Chuyên gia</span><span>{{ currentExpert.name }}</span></div>
                <div class="bs-row"><span>Hình thức</span><span>{{ bookingSummaryTypeLabel }}</span></div>
                <div class="bs-row"><span>Ngày &amp; giờ</span><span>{{ bookingData.startsAt ? formatDateTime(bookingData.startsAt) : 'Chưa chọn' }}</span></div>
                <div class="bs-row"><span>Thời lượng</span><span>{{ bookingData.duration }} phút</span></div>
                <div class="bs-row"><span>Tổng thanh toán</span><span>{{ formatCurrency(bookingData.price) }}</span></div>
              </div>
              <div style="margin-top:10px;padding:10px 12px;background:var(--peach-light);border:1.5px solid var(--peach);border-radius:var(--radius-sm);font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">
                ⚠️ Bạn sẽ nhận được nhắc nhở 1 giờ trước buổi tư vấn. Hủy lịch miễn phí trước 24 giờ.
              </div>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button class="btn-outline" @click="goBookingStep(3)">← Quay lại</button>
              <button class="btn-primary" @click="confirmBooking">✓ Xác nhận đặt lịch</button>
            </div>
          </div>

          <!-- Payment -->
          <div v-if="bookingPhase === 'payment'">
            <template v-if="!paymentPaid">
              <div class="bm-section">
                <div class="bm-section-title">💳 Thanh toán giữ chỗ</div>
                <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:14px;line-height:1.5;" v-html="paymentIntro"></p>
                <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:center;">
                  <img :src="paymentInfo.qr_image" alt="QR thanh toán" style="width:200px;height:200px;border:1.5px solid var(--kraft-light);border-radius:12px;background:#fff;">
                  <div style="font-size:0.86rem;line-height:1.95;min-width:200px;">
                    <div><span style="color:var(--text-secondary);">Ngân hàng:</span> <strong>{{ paymentInfo.bank?.bankId || '' }}</strong></div>
                    <div><span style="color:var(--text-secondary);">Số TK:</span> <strong>{{ paymentInfo.bank?.accountNo || '' }}</strong></div>
                    <div><span style="color:var(--text-secondary);">Chủ TK:</span> <strong>{{ paymentInfo.bank?.accountName || '' }}</strong></div>
                    <div><span style="color:var(--text-secondary);">Số tiền:</span> <strong style="color:var(--coral);">{{ formatCurrency(paymentInfo.amount) }}</strong></div>
                    <div><span style="color:var(--text-secondary);">Nội dung:</span> <strong>{{ paymentInfo.content || '' }}</strong></div>
                  </div>
                </div>
                <div v-if="paymentInfo.auto" style="text-align:center;margin-top:10px;font-size:0.82rem;color:var(--mint-dark);font-weight:700;">⏳ Đang chờ thanh toán… (tự xác nhận)</div>
                <div style="text-align:center;margin-top:8px;font-size:0.82rem;color:var(--text-secondary);">{{ paymentCountdownText }}</div>
              </div>
              <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button class="btn-outline" @click="closeBookingModal">Thanh toán sau</button>
                <button v-if="canPayWallet" class="btn-primary" @click="payWallet">👛 Trả bằng ví ({{ formatCurrency(walletBalance) }})</button>
                <template v-if="!paymentInfo.auto">
                  <button class="btn-primary" @click="claimPayment">✓ Tôi đã chuyển khoản</button>
                </template>
                <a v-else-if="paymentInfo.checkout_url" class="btn-primary" :href="paymentInfo.checkout_url" target="_blank" rel="noopener">Mở trang thanh toán</a>
              </div>
            </template>
            <template v-else>
              <div style="text-align:center;padding:20px 0;">
                <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
                <div style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">{{ paymentPaidTitle }}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">{{ paymentPaidText }}</div>
                <button class="btn-primary" @click="closeBookingModal">Đóng</button>
              </div>
            </template>
          </div>

          <!-- Success -->
          <div v-if="bookingPhase === 'success'" style="text-align:center;padding:20px 0;">
            <div style="font-size:3rem;margin-bottom:12px;animation:bounce-s 1s ease-in-out infinite;">🎉</div>
            <div style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">Đặt lịch thành công!</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">Bạn sẽ nhận thông báo xác nhận qua email. Chúng tôi mong chờ được gặp bạn!</div>
            <div style="padding:14px;background:var(--mint-light);border:1.5px solid var(--mint);border-radius:var(--radius-sm);margin-bottom:14px;font-size:0.82rem;color:var(--text-secondary);">
              📅 <strong>{{ formatDateTime(bookingData.startsAt) }}</strong><br>
              💬 <span>{{ SESSION_CONFIG[bookingData.sessionType]?.label }}</span> với <strong>{{ currentExpert.name }}</strong>
            </div>
            <button class="btn-primary" @click="closeBookingModal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div class="modal-overlay" :class="{ show: reviewOpen }" @click="closeReviewIfOutside">
      <div v-if="reviewOpen" style="background:var(--warm-white);border-radius:18px;max-width:420px;width:calc(100% - 32px);padding:24px;box-shadow:0 24px 60px rgba(74,55,40,.2);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <h3 style="margin:0;font-size:1.2rem;">Đánh giá buổi tư vấn</h3>
          <button style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--text-secondary);" @click="closeReviewModal">✕</button>
        </div>
        <p style="margin:0 0 16px;color:var(--text-secondary);">{{ reviewState.expertName ? `Buổi tư vấn với ${reviewState.expertName}` : '' }}</p>
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
        <textarea v-model="reviewState.comment" rows="3" placeholder="Cảm nhận của bạn (không bắt buộc)" style="width:100%;border:1.5px solid var(--kraft-light);border-radius:12px;padding:10px 12px;font-family:inherit;font-size:0.9rem;resize:vertical;box-sizing:border-box;margin-bottom:16px;"></textarea>
        <button class="btn-primary" style="width:100%;" @click="submitReview">Gửi đánh giá</button>
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
            <div class="stat-card"><div class="sc-num">{{ currentExpert.rating }}⭐</div><div class="sc-label">Đánh giá</div></div>
            <div class="stat-card"><div class="sc-num">{{ currentExpert.sessions }}</div><div class="sc-label">Phiên tư vấn</div></div>
            <div class="stat-card"><div class="sc-num">{{ currentExpert.experience }}</div><div class="sc-label">Năm KN</div></div>
          </div>
          <div style="margin-top:16px;"></div>
          <div class="pm-section">
            <div class="pm-section-title">👤 Giới thiệu</div>
            <div class="pm-bio">{{ currentExpert.bio }}</div>
          </div>
          <div class="pm-section">
            <div class="pm-section-title">🎓 Bằng cấp &amp; Chứng chỉ</div>
            <div>
              <div v-for="(c, idx) in currentExpert.credentials" :key="idx" style="font-size:0.8rem;margin-bottom:4px;">{{ c }}</div>
            </div>
          </div>
          <div class="pm-section">
            <div class="pm-section-title">🧠 Phương pháp trị liệu</div>
            <div>
              <span v-for="(a, idx) in currentExpert.approaches" :key="idx" class="badge-pill badge-sky" style="margin-right:6px;margin-bottom:6px;">{{ a }}</span>
            </div>
          </div>
          <div class="pm-section">
            <div class="pm-section-title">⭐ Đánh giá từ người dùng</div>
            <div class="pm-reviews"></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <button class="btn-primary" style="flex:1;justify-content:center;" @click="closeProfileModal(); openBookingModal(currentExpertId)">📅 Đặt lịch ngay</button>
            <button class="btn-outline" @click="closeProfileModal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <span>🩺 Chuyên gia tâm lý</span>
      </div>

      <div class="page-header">
        <div>
          <div class="page-title">🩺 Kết Nối Chuyên Gia Tâm Lý</div>
          <div class="page-subtitle">{{ subtitleText }}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span v-if="walletBalance > 0" style="font-size:0.85rem;font-weight:800;color:var(--mint-dark);background:var(--mint-light);padding:8px 14px;border-radius:999px;border:1.5px solid var(--mint);">👛 Ví: {{ formatCurrency(walletBalance) }}</span>
          <button class="btn-primary" @click="emergencyOpen = true">🆘 Hỗ trợ khẩn cấp</button>
        </div>
      </div>

      <div class="hotline-banner">
        <span class="hb-icon">📞</span>
        <div class="hb-text"><strong>Đường dây nóng sức khỏe tâm thần:</strong> 0931773637 — Miễn phí, hoạt động 24/7. Nếu bạn đang trong tình trạng khủng hoảng, hãy gọi ngay.</div>
        <a href="tel:1800599920" class="hb-btn">Gọi ngay</a>
      </div>

      <div class="paper-card ai-match-banner">
        <div class="amb-mascot">🐱</div>
        <div class="amb-text">
          <div class="at-title">🤖 {{ aiMatch?.title || 'PeaceCat đang phân tích tín hiệu của bạn' }}</div>
          <div class="at-sub">{{ aiMatch?.subtitle || 'Bạn có thể xem toàn bộ danh sách chuyên gia bên dưới.' }}</div>
        </div>
        <div class="amb-action">
          <button class="btn-primary" @click="filterExperts('matched')">Xem gợi ý →</button>
        </div>
      </div>

      <section v-if="myBookings.items.length" class="paper-card" style="padding:18px 20px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;">
          <div class="page-title" style="font-size:1.15rem;margin:0;">📅 Lịch hẹn của tôi</div>
        </div>
        <div>
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <button
              type="button"
              style="padding:7px 14px;border-radius:999px;font:inherit;font-weight:700;font-size:0.82rem;cursor:pointer;"
              :style="{ border: `1.5px solid ${myBookings.tab === 'upcoming' ? 'var(--mint-dark)' : 'var(--kraft-light)'}`, background: myBookings.tab === 'upcoming' ? 'var(--mint-light)' : 'transparent', color: 'var(--text-primary)' }"
              @click="myBookings.tab = 'upcoming'"
            >Sắp tới ({{ upcomingBookingsList.length }})</button>
            <button
              type="button"
              style="padding:7px 14px;border-radius:999px;font:inherit;font-weight:700;font-size:0.82rem;cursor:pointer;"
              :style="{ border: `1.5px solid ${myBookings.tab === 'all' ? 'var(--mint-dark)' : 'var(--kraft-light)'}`, background: myBookings.tab === 'all' ? 'var(--mint-light)' : 'transparent', color: 'var(--text-primary)' }"
              @click="myBookings.tab = 'all'"
            >Tất cả ({{ myBookings.items.length }})</button>
          </div>
          <div style="max-height:360px;overflow-y:auto;">
            <div v-if="!visibleBookings.length" style="padding:16px 2px;color:var(--text-secondary);font-size:0.88rem;">Không có lịch trong mục này.</div>
            <div v-for="b in visibleBookings" :key="b.id" style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--kraft-light);">
              <div style="font-size:1.6rem;flex:0 0 auto;">{{ b.expert_avatar || '👩‍⚕️' }}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;">{{ b.expert_name || 'Chuyên gia' }}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary);">{{ SESSION_CONFIG[b.session_type]?.label || b.session_type }} · {{ formatDateTime(b.starts_at) }} · {{ b.duration_minutes }} phút</div>
              </div>
              <span style="padding:4px 10px;border-radius:999px;font-size:0.72rem;font-weight:800;white-space:nowrap;" :style="{ color: bookingStatusBadge(b).color, background: bookingStatusBadge(b).bg }">{{ bookingStatusBadge(b).label }}</span>
              <div style="flex:0 0 auto;">
                <div v-if="b.status === 'completed'">
                  <div v-if="b.review_rating" style="color:#f5a623;font-weight:800;white-space:nowrap;">{{ '★'.repeat(b.review_rating) }}</div>
                  <button v-else class="btn-primary" style="padding:6px 14px;font-size:0.82rem;" @click="openReviewModal(b.id, b.expert_name)">Đánh giá</button>
                </div>
                <div v-else-if="b.status === 'pending_payment'" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
                  <button class="btn-primary" style="padding:6px 12px;font-size:0.8rem;" @click="reopenPayment(b.id, b.expert_id)">Thanh toán</button>
                  <button class="btn-outline" style="padding:6px 12px;font-size:0.8rem;" @click="cancelMyBooking(b.id)">Huỷ</button>
                </div>
                <div v-else-if="['pending', 'awaiting_expert', 'confirmed'].includes(b.status)" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
                  <a v-if="b.status === 'confirmed' && b.zoom_join_url" :href="b.zoom_join_url" target="_blank" rel="noopener" class="btn-primary" style="padding:6px 12px;font-size:0.8rem;text-decoration:none;">🎥 Vào Zoom</a>
                  <button class="btn-outline" style="padding:6px 12px;font-size:0.8rem;" @click="cancelMyBooking(b.id)">Huỷ</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="stats-bar">
        <div class="paper-card stat-card"><div class="sc-num">{{ summary?.active_experts || 0 }}</div><div class="sc-label">Chuyên gia đang hoạt động</div></div>
        <div class="paper-card stat-card"><div class="sc-num">{{ summary?.avg_rating || 0 }}⭐</div><div class="sc-label">Đánh giá trung bình</div></div>
        <div class="paper-card stat-card"><div class="sc-num">{{ Number(summary?.total_sessions || 0).toLocaleString('vi-VN') }}</div><div class="sc-label">Phiên tư vấn hoàn thành</div></div>
        <div class="paper-card stat-card"><div class="sc-num">{{ summary?.satisfaction_rate || 0 }}%</div><div class="sc-label">Người dùng hài lòng</div></div>
      </div>

      <section class="paper-card session-structure-section">
        <p class="sss-intro">Tại PeaceFlow, chúng tôi hiểu rằng việc tìm kiếm sự hỗ trợ tinh thần cần một không gian an toàn, riêng tư và thấu cảm. Đội ngũ <strong>hơn 10 chuyên gia tâm lý được chứng nhận</strong> của chúng tôi luôn sẵn sàng lắng nghe và đồng hành cùng bạn.</p>
        <h3 class="sss-title">🕐 Cấu trúc một phiên khám tiêu chuẩn (30–60 phút)</h3>
        <p class="sss-sub">Mỗi phiên tư vấn thường kéo dài từ 45 đến 60 phút, được thiết kế bài bản qua 4 phần để đảm bảo hiệu quả tối đa:</p>
        <div class="sss-steps">
          <div class="sss-step sss-step-mint">
            <div class="sss-step-badge"><span class="sss-step-icon">🤝</span><span class="sss-step-num">1</span></div>
            <div class="sss-step-title">Lắng nghe &amp; Kết nối</div>
            <div class="sss-step-en">Rapport Building</div>
            <p class="sss-step-desc">Chuyên gia sẽ dành thời gian đầu để làm quen, xây dựng sự tin tưởng và nắm bắt tổng quan về tiền sử của bạn. Mục tiêu là tạo ra một không gian trò chuyện an toàn, giúp bạn hoàn toàn thoải mái mở lòng.</p>
          </div>
          <div class="sss-step sss-step-sky">
            <div class="sss-step-badge"><span class="sss-step-icon">🔍</span><span class="sss-step-num">2</span></div>
            <div class="sss-step-title">Nhận diện vấn đề</div>
            <div class="sss-step-en">Identifying Concerns</div>
            <p class="sss-step-desc">Chuyên gia sẽ đặt các câu hỏi gợi mở để tìm hiểu sâu về lý do bạn tìm đến sự hỗ trợ, những lo âu hiện tại hoặc các sự kiện gần đây ảnh hưởng đến tâm trí và hành vi của bạn.</p>
          </div>
          <div class="sss-step sss-step-lavender">
            <div class="sss-step-badge"><span class="sss-step-icon">📋</span><span class="sss-step-num">3</span></div>
            <div class="sss-step-title">Đánh giá chuyên sâu</div>
            <div class="sss-step-en">Clinical Assessment</div>
            <p class="sss-step-desc">Thông qua phỏng vấn lâm sàng và quan sát chi tiết, chuyên gia sẽ áp dụng các bài kiểm tra chuẩn hóa y khoa như DASS-21, GAD-7, PHQ-9 hoặc PSQI. Việc đánh giá có hệ thống này giúp đo lường chính xác mức độ triệu chứng.</p>
          </div>
          <div class="sss-step sss-step-peach">
            <div class="sss-step-badge"><span class="sss-step-icon">🧭</span><span class="sss-step-num">4</span></div>
            <div class="sss-step-title">Thảo luận &amp; Hướng điều trị</div>
            <div class="sss-step-en">Treatment Planning</div>
            <p class="sss-step-desc">Chuyên gia sẽ tổng hợp kết quả, cùng bạn thảo luận để thống nhất các mục tiêu trị liệu. Từ đó, một lộ trình can thiệp cá nhân hóa sẽ được đưa ra để giúp bạn từng bước vượt qua khó khăn.</p>
          </div>
        </div>
      </section>

      <div class="filter-section">
        <div class="filter-row">
          <button v-for="f in FILTER_BUTTONS" :key="f.id" class="filter-btn" :class="{ active: currentFilter === f.id }" @click="filterExperts(f.id)">{{ f.label }}</button>
        </div>
        <div class="filter-row">
          <div class="search-wrap">
            <input type="text" class="search-input" placeholder="🔍 Tìm chuyên gia..." :value="search" @input="search = $event.target.value">
          </div>
          <select class="sort-select" :value="currentSort" @change="currentSort = $event.target.value">
            <option value="rating">Sắp xếp: Đánh giá cao nhất</option>
            <option value="sessions">Nhiều phiên nhất</option>
            <option value="price_asc">Giá thấp nhất</option>
            <option value="price_desc">Giá cao nhất</option>
            <option value="available">Đang trực tuyến</option>
          </select>
        </div>
      </div>

      <div class="expert-grid">
        <div v-if="!filteredExperts.length" class="paper-card" style="padding:24px;text-align:center;color:var(--text-secondary);grid-column:1 / -1;">
          Chưa có chuyên gia phù hợp với bộ lọc hiện tại.
        </div>
        <div v-for="expert in filteredExperts" :key="expert.id" class="paper-card expert-card" @click="openProfileModal(expert.id)">
          <div class="ec-top-banner" :class="expert.status"></div>
          <div class="ec-body">
            <div v-if="expert.matched" class="ec-match-badge">✨ PeaceCat khuyên dùng</div>
            <div class="ec-header">
              <div class="ec-avatar">
                <img v-if="avatarUrls[expert.id]" :src="avatarUrls[expert.id]" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">
                <template v-else>{{ expert.avatar }}</template>
                <div class="ec-status-dot" :class="expert.status"></div>
              </div>
              <div class="ec-info">
                <div class="ec-name">{{ expert.name }}</div>
                <div class="ec-degree">{{ expert.degree }}</div>
                <div class="ec-rating">
                  <span class="ec-stars">{{ '⭐'.repeat(Math.max(1, Math.round(expert.rating || 0))) }}</span>
                  <span class="ec-rating-num">{{ expert.rating }}</span>
                  <span class="ec-sessions">({{ expert.sessions }} phiên)</span>
                </div>
              </div>
            </div>
            <div class="ec-specialties">
              <span v-for="s in expert.specialties" :key="s" class="ec-specialty">{{ s }}</span>
            </div>
            <p class="ec-bio">{{ expert.bio }}</p>
            <div class="ec-meta">
              <div class="ec-meta-item">📍 {{ expert.location }}</div>
              <div class="ec-meta-item">📅 {{ expert.experience }} năm kinh nghiệm</div>
            </div>
            <div class="ec-price-row">
              <div>
                <div class="ec-price">Khám mới: {{ getSessionPriceLabel(expert).newClient }}</div>
                <div class="ec-price-label">Tái khám: {{ getSessionPriceLabel(expert).returningClient }}</div>
              </div>
              <div class="ec-next">⏰ {{ expert.nextSlot || 'Chưa có lịch' }}</div>
            </div>
            <div class="ec-actions">
              <button class="ec-btn-book" @click.stop="openBookingModal(expert.id)">Đặt lịch ngay</button>
              <button class="ec-btn-msg" @click.stop="openProfileModal(expert.id)">Xem hồ sơ</button>
            </div>
          </div>
        </div>
      </div>

      <div style="padding:14px 16px;background:rgba(255,203,164,0.15);border:1.5px solid var(--peach);border-radius:var(--radius-sm);font-size:0.75rem;color:var(--text-secondary);line-height:1.6;margin-bottom:20px;">
        ⚠️ <strong>Tuyên bố miễn trách:</strong> PeaceFlow kết nối người dùng với các chuyên gia tâm lý độc lập. Chúng tôi không cung cấp dịch vụ y tế trực tiếp. Nếu bạn đang trong tình trạng khẩn cấp, hãy gọi <strong>0931773637</strong> hoặc đến cơ sở y tế gần nhất.
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { apiClient } from '../lib/apiClient';

const SESSION_CONFIG = {
  voice: { label: 'Gọi thoại', icon: '📞' },
  video: { label: 'Video call', icon: '📹' }
};
const DURATION_TIERS = {
  quick: { label: 'Nhanh', icon: '⚡', durationLabel: 'Dưới 30 phút', minutes: 25 },
  standard: { label: 'Tiêu chuẩn', icon: '🕐', durationLabel: '30 - 60 phút', minutes: 45 }
};
const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const TOPIC_OPTIONS = ['Lo âu', 'Trầm cảm', 'Stress công việc', 'Mất ngủ', 'Mối quan hệ', 'Sang chấn', 'Khác'];
const SEVERITY_OPTIONS = ['Nhẹ', 'Vừa', 'Nặng'];
const FILTER_BUTTONS = [
  { id: 'all', label: '🌿 Tất cả' },
  { id: 'available', label: '🟢 Đang trực tuyến' },
  { id: 'anxiety', label: '😰 Lo âu' },
  { id: 'depression', label: '🌧️ Trầm cảm' },
  { id: 'stress', label: '💼 Stress công việc' },
  { id: 'sleep', label: '😴 Mất ngủ' },
  { id: 'relationship', label: '💑 Mối quan hệ' },
  { id: 'trauma', label: '🛡️ Trauma' }
];
const BOOKING_STATUS_BADGE = {
  pending_payment: { label: 'Chờ thanh toán', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
  pending: { label: 'Chờ xác nhận thanh toán', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
  awaiting_expert: { label: 'Chờ chuyên gia nhận lịch', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
  confirmed: { label: 'Đã xác nhận', color: '#2f8f5b', bg: 'rgba(47,143,91,.14)' },
  completed: { label: 'Đã hoàn thành', color: '#5a6b5c', bg: 'rgba(120,140,120,.16)' },
  cancelled: { label: 'Đã hủy', color: '#a23b3b', bg: 'rgba(200,80,80,.14)' },
  expired: { label: 'Hết hạn', color: '#a23b3b', bg: 'rgba(200,80,80,.10)' }
};

const experts = ref([]);
const summary = ref(null);
const aiMatch = ref(null);
const upcomingBooking = ref(null);
const currentFilter = ref('all');
const currentSort = ref('rating');
const search = ref('');
const currentExpertId = ref(null);
const bookingMonthOffset = ref(0);
const walletBalance = ref(0);
const avatarUrls = reactive({});
const avatarUrlCache = new Map();

const bookingData = reactive({
  expertId: null, sessionType: 'voice', durationTier: 'quick', price: 0,
  duration: DURATION_TIERS.quick.minutes, date: '', time: '10:00', startsAt: '',
  topic: '', severity: '', notes: ''
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
  if (!value) return 'Chưa chọn';
  return new Intl.DateTimeFormat('vi-VN', {
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

const sessionOptions = computed(() => Object.entries(SESSION_CONFIG).map(([key, c]) => ({ key, label: c.label, icon: c.icon })));
const durationTierOptions = computed(() => {
  const pricing = currentExpert.value?.session_pricing || { quick: 0, standard: 0 };
  return Object.entries(DURATION_TIERS).map(([key, config]) => ({
    key, label: config.label, icon: config.icon, minutes: config.minutes, durationLabel: config.durationLabel,
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

const subtitleText = computed(() => {
  const base = `Bạn đang có ${summary.value?.active_experts || 0} chuyên gia khả dụng trong hệ thống`;
  return upcomingBooking.value
    ? `${base} • Lịch sắp tới với ${upcomingBooking.value.expert_name} vào ${formatDateTime(upcomingBooking.value.starts_at)}`
    : `${base} và thư viện tư vấn đang hoạt động`;
});

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
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(monthBase);
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
    duration: defaultTier.minutes, date: new Date().toISOString().slice(0, 10), time: '10:00', startsAt: '', topic: '', severity: '', notes: ''
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
    alert('Chọn ngày và giờ trước khi tiếp tục.');
    return;
  }
  if (step === 4) {
    if (!medicalRecordFiles.value.length && !medicalRecordNote.value.trim()) {
      medicalRecordError.value = 'Vui lòng đính kèm hồ sơ khám cũ, hoặc ghi chú cụ thể — nếu chưa từng khám ở đâu khác, hãy ghi rõ "Không có".';
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
  medicalRecordError.value = tooBig.length ? `File "${tooBig[0].name}" vượt quá 5MB, vui lòng chọn file nhỏ hơn.` : '';
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
    console.error('Gửi hồ sơ khám cũ thất bại:', error);
  } finally {
    medicalRecordFiles.value = [];
    medicalRecordNote.value = '';
  }
}

const bookingSummaryTypeLabel = computed(() => {
  const session = SESSION_CONFIG[bookingData.sessionType] || SESSION_CONFIG.voice;
  const tier = DURATION_TIERS[bookingData.durationTier] || DURATION_TIERS.quick;
  return `${session.label} · ${currentExpert.value?.is_returning_client ? 'Tái khám' : 'Khám mới'} (${tier.label})`;
});

async function confirmBooking() {
  const startsAt = bookingData.date && bookingData.time ? `${bookingData.date}T${bookingData.time}:00+07:00` : '';
  bookingData.startsAt = startsAt;

  try {
    const booking = await apiClient.post(`/experts/${currentExpertId.value}/bookings`, {
      session_type: bookingData.sessionType,
      duration_tier: bookingData.durationTier,
      starts_at: bookingData.startsAt,
      notes: bookingData.notes
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
    alert(error.message || 'Không đặt được lịch tư vấn.');
  }
}

const paymentIntro = computed(() => (
  paymentInfo.value?.auto
    ? 'Quét mã bằng app ngân hàng (đã điền sẵn số tiền &amp; nội dung). Hệ thống <strong>tự động xác nhận</strong> ngay khi nhận được tiền — bạn không cần làm gì thêm.'
    : 'Quét mã VietQR bằng app ngân hàng (đã điền sẵn số tiền &amp; nội dung). Chuyển xong, bấm <strong>"Tôi đã chuyển khoản"</strong> — quản trị sẽ đối chiếu &amp; xác nhận.'
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
  paymentPaidTitle.value = 'Đã nhận thanh toán!';
  paymentPaidText.value = 'Đang chờ chuyên gia nhận lịch. Bạn sẽ nhận thông báo khi được xác nhận.';
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
    paymentPaidTitle.value = 'Đã ghi nhận chuyển khoản!';
    paymentPaidText.value = 'Quản trị sẽ đối chiếu thanh toán và xác nhận lịch. Bạn sẽ nhận thông báo khi được duyệt.';
    paymentPaid.value = true;
    loadMyBookings();
  } catch (error) {
    alert(error.message || 'Không gửi được xác nhận.');
  }
}

async function payWallet() {
  const bookingId = currentBookingId.value;
  try {
    await apiClient.post(`/bookings/${bookingId}/pay-wallet`, {});
    paymentPaidSuccess();
    loadWallet();
  } catch (error) {
    alert(error.message || 'Không thanh toán được bằng ví.');
  }
}

function startPaymentCountdown(expiresAt) {
  stopPaymentCountdown();
  if (!expiresAt) return;
  const end = new Date(expiresAt).getTime();
  const tick = () => {
    const ms = end - Date.now();
    if (ms <= 0) { paymentCountdownText.value = '⌛ Đơn giữ chỗ đã hết hạn — hãy đặt lại.'; stopPaymentCountdown(); return; }
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    paymentCountdownText.value = `⌛ Đơn giữ chỗ hết hạn sau ${m}:${String(s).padStart(2, '0')}`;
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
      alert('Đơn giữ chỗ này đã hết hạn, vui lòng đặt lịch lại.');
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
    alert('Không mở được thanh toán.');
  }
}

async function cancelMyBooking(bookingId) {
  if (!window.confirm('Bạn chắc chắn muốn huỷ lịch hẹn này?')) return;
  try {
    const r = await apiClient.post(`/expert-bookings/${bookingId}/cancel`, {});
    alert(r?.refunded ? `Đã huỷ. Hoàn ${formatCurrency(r.refunded)} vào ví.` : 'Đã huỷ lịch hẹn.');
    loadMyBookings();
    loadWallet();
  } catch (error) {
    alert(error.message || 'Không huỷ được lịch.');
  }
}

// ============================================================
// PROFILE MODAL
// ============================================================
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
    alert(error.message || 'Không gửi được đánh giá.');
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

async function init() {
  try {
    const payload = await apiClient.get('/experts');
    experts.value = payload.experts || [];
    summary.value = payload.summary || {};
    aiMatch.value = payload.ai_match || null;
    upcomingBooking.value = payload.upcoming_booking || null;

    preloadAvatars(experts.value);
    loadMyBookings();
    loadWallet();
  } catch (error) {
    console.error('Experts init failed:', error);
  }
}

function handleBookingChanged() {
  loadMyBookings();
  loadWallet();
}

onMounted(() => {
  init();
  window.addEventListener('peaceflow:booking-changed', handleBookingChanged);
});
onBeforeUnmount(() => {
  window.removeEventListener('peaceflow:booking-changed', handleBookingChanged);
  stopPaymentCountdown();
  stopPaymentPoll();
  // Lưới an toàn: nếu người dùng điều hướng sang trang khác trong lúc modal (đặt lịch/hồ sơ/
  // đánh giá) còn mở, Vue unmount component mà không chạy các hàm close* — nếu không reset ở
  // đây, body sẽ bị kẹt overflow:hidden vĩnh viễn (phải F5 mới vuốt/scroll được lại).
  document.body.style.overflow = '';
});
</script>

<style scoped src="../assets/experts.css"></style>
