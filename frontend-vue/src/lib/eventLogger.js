export const EventLogger = {
  log(category, action) {
    const ts = new Date().toISOString();
    console.info(`[FE_EVENT] ts=${ts} category=${category} action=${action}`);
  },

  error(category, action, err) {
    const ts = new Date().toISOString();
    console.error(`[FE_EVENT_ERR] ts=${ts} category=${category} action=${action} error="${err?.message || String(err)}"`);
  }
};
