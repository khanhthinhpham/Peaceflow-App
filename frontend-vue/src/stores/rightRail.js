import { defineStore } from 'pinia';

// docked = true khi trang Tổng quan (desktop 2 cột) đang mở panel phải: nút chuông / tin nhắn
// nằm trong đầu panel, nên các thẻ nổi ở mép phải màn hình ẩn đi và popup mở ngay dưới panel.
export const useRightRailStore = defineStore('rightRail', {
  state: () => ({ docked: false })
});
