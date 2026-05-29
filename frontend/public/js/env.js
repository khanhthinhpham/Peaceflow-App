// Frontend runtime config.
// Change API_BASE_URL here when you switch tunnel/server.
(function initPeaceflowEnv() {
    const runtimeConfig = Object.freeze({
        API_BASE_URL: 'https://affected-forgot-safe-reveals.trycloudflare.com/api/v1'
    });

    window.__PEACEFLOW_ENV__ = runtimeConfig;

    if (!window.__PEACEFLOW_API_BASE_URL__) {
        window.__PEACEFLOW_API_BASE_URL__ = runtimeConfig.API_BASE_URL;
    }
})();
