import { createI18n } from 'vue-i18n';

// ===== Nguồn dịch trung tâm =====
// Mỗi ngôn ngữ được chia theo file/namespace (common, auth, ...) thay vì 1 file khổng lồ —
// dễ tìm, dễ sửa, và merge conflict ít hơn khi nhiều người cùng sửa. Thêm 1 khu vực mới
// (vd "tasks") thì thêm 1 cặp file vi/en.json rồi khai báo ở NAMESPACES bên dưới, KHÔNG
// cần đụng gì tới phần còn lại của app.
import viCommon from './vi/common.json';
import enCommon from './en/common.json';
import viAuth from './vi/auth.json';
import enAuth from './en/auth.json';
import viLanding from './vi/landing.json';
import enLanding from './en/landing.json';
import viDashboard from './vi/dashboard.json';
import enDashboard from './en/dashboard.json';
import viMoodCheckin from './vi/moodCheckin.json';
import enMoodCheckin from './en/moodCheckin.json';
import viTasksPage from './vi/tasksPage.json';
import enTasksPage from './en/tasksPage.json';
import viJournal from './vi/journal.json';
import enJournal from './en/journal.json';
import viProfile from './vi/profile.json';
import enProfile from './en/profile.json';
import viSettingsPage from './vi/settingsPage.json';
import enSettingsPage from './en/settingsPage.json';
import viOnboarding from './vi/onboarding.json';
import enOnboarding from './en/onboarding.json';
import viEmergency from './vi/emergency.json';
import enEmergency from './en/emergency.json';
import viMoodChat from './vi/moodChat.json';
import enMoodChat from './en/moodChat.json';
import viMoodAssessment from './vi/moodAssessment.json';
import enMoodAssessment from './en/moodAssessment.json';
import viCommunity from './vi/community.json';
import enCommunity from './en/community.json';
import viExperts from './vi/experts.json';
import enExperts from './en/experts.json';
import viReport from './vi/report.json';
import enReport from './en/report.json';
import viTaskDetail from './vi/taskDetail.json';
import enTaskDetail from './en/taskDetail.json';
import viAchievements from './vi/achievements.json';
import enAchievements from './en/achievements.json';
import viApplyExpert from './vi/applyExpert.json';
import enApplyExpert from './en/applyExpert.json';
import viRavenTest from './vi/ravenTest.json';
import enRavenTest from './en/ravenTest.json';
import viTaskBreathing from './vi/taskBreathing.json';
import enTaskBreathing from './en/taskBreathing.json';
import viVerifyEmail from './vi/verifyEmail.json';
import enVerifyEmail from './en/verifyEmail.json';
import viResetPassword from './vi/resetPassword.json';
import enResetPassword from './en/resetPassword.json';
import viTaskMeditation from './vi/taskMeditation.json';
import enTaskMeditation from './en/taskMeditation.json';
import viForgotPassword from './vi/forgotPassword.json';
import enForgotPassword from './en/forgotPassword.json';
import viDonate from './vi/donate.json';
import enDonate from './en/donate.json';
import viPushPrompt from './vi/pushPrompt.json';
import enPushPrompt from './en/pushPrompt.json';
import viGuestEmergencyTasks from './vi/guestEmergencyTasks.json';
import enGuestEmergencyTasks from './en/guestEmergencyTasks.json';

const messages = {
  vi: { ...viCommon, ...viAuth, ...viLanding, ...viDashboard, ...viMoodCheckin, ...viTasksPage, ...viJournal, ...viProfile, ...viSettingsPage, ...viOnboarding, ...viEmergency, ...viMoodChat, ...viMoodAssessment, ...viCommunity, ...viExperts, ...viReport, ...viTaskDetail, ...viAchievements, ...viApplyExpert, ...viRavenTest, ...viTaskBreathing, ...viVerifyEmail, ...viResetPassword, ...viTaskMeditation, ...viForgotPassword, ...viDonate, ...viPushPrompt, ...viGuestEmergencyTasks },
  en: { ...enCommon, ...enAuth, ...enLanding, ...enDashboard, ...enMoodCheckin, ...enTasksPage, ...enJournal, ...enProfile, ...enSettingsPage, ...enOnboarding, ...enEmergency, ...enMoodChat, ...enMoodAssessment, ...enCommunity, ...enExperts, ...enReport, ...enTaskDetail, ...enAchievements, ...enApplyExpert, ...enRavenTest, ...enTaskBreathing, ...enVerifyEmail, ...enResetPassword, ...enTaskMeditation, ...enForgotPassword, ...enDonate, ...enPushPrompt, ...enGuestEmergencyTasks }
};

// ===== Chọn ngôn ngữ mặc định =====
// Thứ tự ưu tiên, cao xuống thấp:
//   1. Người dùng đã TỰ CHỌN ngôn ngữ trước đó (bấm nút đổi ngôn ngữ) — luôn thắng mọi
//      suy đoán, kể cả khi họ đăng nhập từ một nước khác lần sau (đi công tác, dùng VPN...).
//   2. Suy đoán theo NƠI ĐĂNG NHẬP/ĐĂNG KÝ gần nhất — backend trả kèm `locale` trong response
//      của /login, /register, /google (dựa vào header 'x-vercel-ip-country', xem
//      auth.controller.js). authStore gọi setSuggestedLocale() ngay sau khi đăng nhập/đăng
//      ký thành công.
//   3. Mặc định 'vi' cho tới khi có 1 trong 2 cái trên — vd khách chưa đăng nhập xem trang
//      chủ. Thị trường gốc của app là Việt Nam nên chọn 'vi' làm nền an toàn hơn là đoán
//      theo trình duyệt (locale trình duyệt không phải tiêu chí bạn chọn).
const EXPLICIT_KEY = 'peaceflow_locale_explicit';
const SUGGESTED_KEY = 'peaceflow_locale_suggested';
const SUPPORTED = ['vi', 'en'];

function normalize(value) {
  return SUPPORTED.includes(value) ? value : null;
}

function getInitialLocale() {
  try {
    return (
      normalize(localStorage.getItem(EXPLICIT_KEY)) ||
      normalize(localStorage.getItem(SUGGESTED_KEY)) ||
      'vi'
    );
  } catch {
    // Safari riêng tư / localStorage bị chặn -> không có gì để đọc, dùng mặc định.
    return 'vi';
  }
}

export const i18n = createI18n({
  legacy: false, // bắt buộc để dùng useI18n() trong <script setup> (Composition API)
  locale: getInitialLocale(),
  fallbackLocale: 'vi',
  messages
});

// Gọi sau khi ĐĂNG NHẬP/ĐĂNG KÝ THÀNH CÔNG, với `locale` backend trả về. CHỈ áp dụng khi
// người dùng chưa từng tự chọn ngôn ngữ — không được ghi đè lựa chọn thủ công của họ.
export function setSuggestedLocale(locale) {
  const value = normalize(locale);
  if (!value) return;
  try {
    localStorage.setItem(SUGGESTED_KEY, value);
    if (!localStorage.getItem(EXPLICIT_KEY)) {
      i18n.global.locale.value = value;
    }
  } catch {
    // localStorage bị chặn -> vẫn đổi cho phiên hiện tại, chỉ là không nhớ được cho lần sau.
    if (!hasExplicitChoice()) i18n.global.locale.value = value;
  }
}

function hasExplicitChoice() {
  try {
    return Boolean(localStorage.getItem(EXPLICIT_KEY));
  } catch {
    return false;
  }
}

// Gọi từ UI đổi ngôn ngữ (nút chuyển cờ/chọn ngôn ngữ) — lựa chọn thủ công, thắng mọi suy
// đoán sau này.
export function setExplicitLocale(locale) {
  const value = normalize(locale);
  if (!value) return;
  i18n.global.locale.value = value;
  try {
    localStorage.setItem(EXPLICIT_KEY, value);
  } catch {
    // Không lưu được thì đổi vẫn có tác dụng cho phiên hiện tại.
  }
}

export function getCurrentLocale() {
  return i18n.global.locale.value;
}
