(function () {
  'use strict';

  const config = window.THK_APP_CONFIG || { apiBase: '/api', dataMode: 'real', preferBackend: true, preserveDemoFallback: false };
  let csrfToken = sessionStorage.getItem('thkCsrfToken') || '';
  let online = null;

  class ApiError extends Error {
    constructor(message, status = 0, code = 'NETWORK_ERROR') {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.offline = status === 0;
    }
  }

  async function request(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (!['GET', 'HEAD'].includes(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;
    let response;
    try {
      response = await fetch(config.apiBase + path, {
        method,
        headers,
        credentials: 'same-origin',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal
      });
      online = true;
    } catch (error) {
      online = false;
      throw new ApiError(config.preserveDemoFallback
        ? 'The secure server is not available. The protected demo fallback is still available.'
        : 'The secure server is not available. Please reconnect and try again.', 0, 'NETWORK_ERROR');
    }
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) throw new ApiError(payload.message || 'The server could not complete this request.', response.status, payload.error || 'REQUEST_FAILED');
    if (payload.csrfToken) {
      csrfToken = payload.csrfToken;
      sessionStorage.setItem('thkCsrfToken', csrfToken);
    }
    return payload;
  }

  async function health(timeoutMs = 2500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try { return await request('/health', { signal: controller.signal }); }
    finally { clearTimeout(timer); }
  }

  const api = {
    enabled: config.preferBackend !== false,
    dataMode: config.dataMode || 'real',
    preserveDemoFallback: config.preserveDemoFallback !== false,
    ApiError,
    get online() { return online; },
    get csrfToken() { return csrfToken; },
    request,
    health,
    staffLogin(role, password) { return request('/auth/staff/login', { method: 'POST', body: { role, password } }); },
    customerLogin(phone, password) { return request('/auth/customer/login', { method: 'POST', body: { phone, password } }); },
    sendOtp(phone, purpose) { return request('/auth/otp/send', { method: 'POST', body: { phone, purpose } }); },
    verifyOtp(phone, purpose, code) { return request('/auth/otp/verify', { method: 'POST', body: { phone, purpose, code } }); },
    resetPassword(phone, verificationToken, password) { return request('/auth/password-reset', { method: 'POST', body: { phone, verificationToken, password } }); },
    async logout() {
      try { return await request('/auth/logout', { method: 'POST', body: {} }); }
      finally { csrfToken = ''; sessionStorage.removeItem('thkCsrfToken'); }
    },
    session() { return request('/auth/session'); },
    createRegistration(registration) { return request('/registrations', { method: 'POST', body: registration }); },
    pendingRegistrations() { return request('/registrations?status=pending'); },
    approveRegistration(registrationId, data) { return request(`/registrations/${encodeURIComponent(registrationId)}/approve`, { method: 'POST', body: data || {} }); },
    customers() { return request('/customers'); },
    me() { return request('/customers/me'); },
    updatePayment(customerId, data) { return request(`/customers/${encodeURIComponent(customerId)}/payment`, { method: 'POST', body: data }); },
    updateCustomer(customerId, data) { return request(`/customers/${encodeURIComponent(customerId)}`, { method: 'PATCH', body: data }); },
    addDays(customerId, days, reason) { return request(`/customers/${encodeURIComponent(customerId)}/add-days`, { method: 'POST', body: { days, reason } }); },
    pause(customerId, date, reason) { return request(`/customers/${encodeURIComponent(customerId)}/pause`, { method: 'POST', body: { date, reason } }); },
    resume(customerId, date, reason) { return request(`/customers/${encodeURIComponent(customerId)}/resume`, { method: 'POST', body: { date, reason } }); },
    kitchenJobs() { return request('/kitchen/jobs'); },
    deliveryJobs() { return request('/delivery/jobs'); },
    auditLogs() { return request('/audit-logs'); }
  };

  window.THK_API = Object.freeze(api);
})();
