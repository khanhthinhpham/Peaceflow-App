/**
 * PeaceFlow — Frontend Event Logger
 * Ghi log tất cả sự kiện người dùng theo định dạng chuẩn [FE_EVENT].
 *
 * Mỗi log gồm: timestamp, category, action, và data (nếu có).
 * Ví dụ: [FE_EVENT] ts=2026-05-29T10:00:00.000Z category=mood action=select data={"emoji":"😊","label":"Rất vui","score":9}
 */

export const EventLogger = {
  log(category, action, data = {}) {
    const ts = new Date().toISOString();
    console.info(`[FE_EVENT] ts=${ts} category=${category} action=${action}`);
  },

  error(category, action, err, data = {}) {
    const ts = new Date().toISOString();
    console.error(`[FE_EVENT_ERR] ts=${ts} category=${category} action=${action} error="${err?.message || String(err)}"`);
  }
};
