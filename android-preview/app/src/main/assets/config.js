// Android inspection build. The production web application remains in strict
// real-data mode; this isolated asset copy intentionally uses preserved preview
// data until the public HTTPS backend is deployed.
window.THK_GOOGLE_MAPS_API_KEY = '';
window.THK_APP_CONFIG = Object.freeze({
  apiBase: '/api',
  publicOrigin: 'https://trianglehk.com',
  dataMode: 'demo',
  preferBackend: false,
  preserveDemoFallback: true
});
