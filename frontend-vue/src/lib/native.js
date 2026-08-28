// Polish riêng cho app mobile đóng gói bằng Capacitor (status bar, splash screen, nút
// back cứng của Android). Trên web thường, Capacitor.isNativePlatform() = false nên mọi
// hàm ở đây không làm gì cả — file này an toàn khi import ở cả web và mobile.
import { Capacitor } from '@capacitor/core';

export const isNativeApp = Capacitor.isNativePlatform();

export async function initNativeApp(router) {
  if (!isNativeApp) return;

  const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app')
  ]);

  try {
    // Nền app là màu cream sáng (--cream: #FFF8F0) nên chữ/icon status bar phải tối —
    // đúng theo enum của plugin thì đó là Style.Light (xem definitions.js), không phải Dark.
    await StatusBar.setBackgroundColor({ color: '#FFF8F0' });
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // Một số thiết bị/bản Android không hỗ trợ đổi màu status bar — bỏ qua, không chặn app.
  }

  // Nút back cứng Android: quay lại trang trước trong router nếu còn, hết thì mới thoát
  // app. Không xử lý thì Android sẽ thoát app ngay ở mọi trang, rất khó dùng.
  App.addListener('backButton', () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      App.exitApp();
    }
  });

  // Trì hoãn nhẹ để splash không tắt đột ngột trước khi Vue kịp render xong màn đầu.
  setTimeout(() => {
    SplashScreen.hide().catch(() => {});
  }, 250);
}
