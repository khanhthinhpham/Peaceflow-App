// Cổng logic "chế độ khách khẩn cấp" — port từ public/js/guest-emergency.js.
// Không port applyGuestEmergencyLinkGuards()/guardGuestEmergencyPage() nguyên bản vì chúng viết lại
// href của các <a> tĩnh (sidebar cũ) — Sidebar.vue + vue-router đã điều hướng đúng theo trạng thái
// đăng nhập nên không cần "sửa link" theo kiểu DOM nữa.
const GUEST_EMERGENCY_KEY = 'peaceflow_guest_emergency';

export function isGuestEmergencyRequested(search = window.location.search) {
  const params = new URLSearchParams(search);
  const requested = params.get('guest_emergency') === '1';

  if (requested) {
    sessionStorage.setItem(GUEST_EMERGENCY_KEY, '1');
    return true;
  }

  return sessionStorage.getItem(GUEST_EMERGENCY_KEY) === '1';
}

export function clearGuestEmergencyMode() {
  sessionStorage.removeItem(GUEST_EMERGENCY_KEY);
}

export function isGuestEmergencyModeActive(isAuthenticated, search = window.location.search) {
  if (isAuthenticated) {
    clearGuestEmergencyMode();
    return false;
  }

  return isGuestEmergencyRequested(search);
}
