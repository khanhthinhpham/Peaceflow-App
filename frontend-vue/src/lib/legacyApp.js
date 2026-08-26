// Các trang chưa được chuyển sang Vue vẫn sống ở frontend/ (bản cũ).
// Trong lúc migrate dần, mọi điều hướng tới trang chưa có bản Vue sẽ trỏ sang đây.
// Đổi VITE_LEGACY_APP_URL trong .env nếu bạn chạy frontend cũ ở origin/port khác.
const LEGACY_APP_URL = (import.meta.env.VITE_LEGACY_APP_URL || 'http://localhost:5500/frontend/pages').replace(/\/+$/, '');

export function goToLegacyPage(page) {
  window.location.href = `${LEGACY_APP_URL}/${page.replace(/^\/+/, '')}`;
}

// Trang .html nào đã có bản Vue tương đương thì điều hướng nội bộ (router) thay vì
// bật ra bản cũ — cập nhật danh sách này mỗi khi migrate xong một trang mới.
const MIGRATED_PAGES = {
  'dashboard.html': '/dashboard',
  'mood-checkin.html': '/mood-checkin',
  'mood-assessment.html': '/mood-assessment',
  'raven-test.html': '/raven-test',
  'tasks.html': '/tasks',
  'journal.html': '/journal',
  'experts.html': '/experts',
  'community.html': '/community',
  'report.html': '/report',
  'achievements.html': '/achievements',
  'profile.html': '/profile',
  'settings.html': '/settings',
  'mood-chat.html': '/mood-chat',
  'forgot-password.html': '/forgot-password',
  'reset-password.html': '/reset-password',
  'verify-email.html': '/verify-email',
  'onboarding.html': '/onboarding',
  'task-breathing.html': '/task-breathing',
  'task-meditation.html': '/task-meditation',
  'emergency.html': '/emergency',
  'index.html': '/',
  'expert-application.html': '/expert/application',
  // Backend (notification.routes.js) vẫn gửi action theo path kiểu cũ của khu chuyên gia —
  // dịch sang route Vue tương ứng thay vì bật ra app cũ.
  'expert/app.html': '/expert/dashboard',
  'expert/apply.html': '/expert-apply'
};

// Dùng cho các luồng redirect nhận vào tên trang kiểu cũ (ví dụ sau khi login/signup).
// Trả về { internal: true, path } nếu trang đã migrate, ngược lại { internal: false, page }.
export function resolveAppRedirect(pageSpec) {
  const pageName = String(pageSpec || '').split('?')[0].split('#')[0];
  if (MIGRATED_PAGES[pageName]) {
    return { internal: true, path: MIGRATED_PAGES[pageName] };
  }
  return { internal: false, page: pageSpec };
}
