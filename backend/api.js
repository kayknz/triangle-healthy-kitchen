const { production, sessionTtlMs, customerSessionTtlMs, maxJsonBytes, twilio, developmentOtpCode } = require('./config');
const { database, transaction, now, id, json } = require('./database');
const { normalizePhone, hashPassword, verifyPassword, randomToken, digest, parseCookies } = require('./security');

const rateBuckets = new Map();
const STAFF_ROLES = ['ceo', 'admin', 'transport', 'kitchen', 'driver'];
const MANAGEMENT_ROLES = ['ceo', 'admin'];

class HttpError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function clientIp(req) {
  return String(req.socket?.remoteAddress || '').slice(0, 80);
}

function checkRateLimit(req, name, limit, windowMs) {
  const key = `${name}:${clientIp(req)}`;
  const timestamp = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || timestamp >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: timestamp + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw new HttpError(429, 'Too many attempts. Please wait and try again.', 'RATE_LIMITED');
}

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://maps.googleapis.com https://maps.google.com; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    ...(production ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' } : {})
  };
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    ...securityHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const type = String(req.headers['content-type'] || '').split(';')[0].trim();
    if (type !== 'application/json') return reject(new HttpError(415, 'Content-Type must be application/json.', 'INVALID_CONTENT_TYPE'));
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxJsonBytes) {
        reject(new HttpError(413, 'Request is too large.', 'PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new HttpError(400, 'Invalid JSON request.', 'INVALID_JSON')); }
    });
    req.on('error', reject);
  });
}

function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  let originHost = '';
  try { originHost = new URL(origin).host; } catch {}
  if (!originHost || originHost !== req.headers.host) throw new HttpError(403, 'Request origin is not allowed.', 'ORIGIN_REJECTED');
}

function cleanPayload(input) {
  const value = input && typeof input === 'object' ? JSON.parse(JSON.stringify(input)) : {};
  delete value.password;
  delete value.passwordHash;
  delete value.passwordSalt;
  delete value.verificationToken;
  if (value.payment?.proofData) value.payment.proofData = '';
  if (value.health?.bmiReport?.data) value.health.bmiReport.data = '';
  if (value.health?.bmiReport?.previewData) value.health.bmiReport.previewData = '';
  return value;
}

function normalizeOtpPurpose(value) {
  const purpose = safeText(value, 30).toLowerCase();
  if (!['registration', 'password-reset'].includes(purpose)) throw new HttpError(400, 'Verification purpose is invalid.', 'INVALID_OTP_PURPOSE');
  return purpose;
}

async function twilioVerifyRequest(resource, values) {
  const authorization = Buffer.from(`${twilio.apiKey}:${twilio.apiSecret}`).toString('base64');
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(twilio.verifyServiceSid)}/${resource}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${authorization}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values)
  });
  let payload = {};
  try { payload = await response.json(); } catch {}
  if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502, response.status === 429 ? 'Too many verification attempts. Please wait and try again.' : 'SMS verification service is temporarily unavailable.', 'SMS_PROVIDER_ERROR');
  return payload;
}

function findVerification(phone, purpose, token) {
  if (!token) return null;
  const row = database().prepare(`SELECT * FROM phone_verifications
    WHERE phone = ? AND purpose = ? AND token_hash = ? AND consumed_at IS NULL
    ORDER BY created_at DESC LIMIT 1`).get(phone, purpose, digest(token));
  if (!row || new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row;
}

async function sendOtp(req, res) {
  checkRateLimit(req, 'otp-send', 8, 15 * 60 * 1000);
  const body = await readJson(req);
  const phone = normalizePhone(body.phone);
  const purpose = normalizeOtpPurpose(body.purpose);
  if (!phone) throw new HttpError(400, 'Enter a valid 8-digit Qatar mobile number.', 'INVALID_PHONE');
  checkRateLimit(req, `otp-send-${digest(phone).slice(0, 16)}`, 5, 60 * 60 * 1000);
  if (purpose === 'registration') {
    if (database().prepare('SELECT id FROM customers WHERE phone = ? LIMIT 1').get(phone)) throw new HttpError(409, 'This mobile number already has a customer account.', 'CUSTOMER_EXISTS');
  } else if (!database().prepare("SELECT id FROM users WHERE role = 'customer' AND phone = ? AND status = 'active' LIMIT 1").get(phone)) {
    sendJson(res, 200, { ok: true, message: 'If an active account exists, a verification code has been sent.' });
    return;
  }
  if (production) await twilioVerifyRequest('Verifications', { To: phone, Channel: 'sms' });
  const timestamp = now();
  const requestId = id('otp');
  database().prepare(`INSERT INTO otp_requests
    (id, phone, purpose, status, attempts, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)`)
    .run(requestId, phone, purpose, new Date(Date.now() + 10 * 60 * 1000).toISOString(), timestamp, timestamp);
  audit(null, 'OTP_SENT', 'otp_request', requestId, { phone, purpose }, req);
  sendJson(res, 200, { ok: true, message: 'Verification code sent.', ...(production ? {} : { devCode: developmentOtpCode }) });
}

async function verifyOtp(req, res) {
  checkRateLimit(req, 'otp-verify', 18, 15 * 60 * 1000);
  const body = await readJson(req);
  const phone = normalizePhone(body.phone);
  const purpose = normalizeOtpPurpose(body.purpose);
  const code = safeText(body.code, 10);
  if (!phone || !/^\d{6}$/.test(code)) throw new HttpError(400, 'Enter the complete 6-digit verification code.', 'INVALID_OTP');
  const request = database().prepare(`SELECT * FROM otp_requests
    WHERE phone = ? AND purpose = ? AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1`).get(phone, purpose);
  if (!request) throw new HttpError(400, 'Request a new verification code.', 'OTP_NOT_REQUESTED');
  if (new Date(request.expires_at).getTime() <= Date.now()) {
    database().prepare("UPDATE otp_requests SET status = 'expired', updated_at = ? WHERE id = ?").run(now(), request.id);
    throw new HttpError(410, 'This code has expired. Please request a new code.', 'OTP_EXPIRED');
  }
  if (request.attempts >= 5) throw new HttpError(429, 'Too many attempts. Please request a new code later.', 'OTP_BLOCKED');
  let approved = false;
  if (production) {
    const check = await twilioVerifyRequest('VerificationCheck', { To: phone, Code: code });
    approved = check.status === 'approved';
  } else approved = code === developmentOtpCode;
  if (!approved) {
    const attempts = request.attempts + 1;
    database().prepare('UPDATE otp_requests SET attempts = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(attempts, attempts >= 5 ? 'blocked' : 'pending', now(), request.id);
    throw new HttpError(attempts >= 5 ? 429 : 400, attempts >= 5 ? 'Too many attempts. Please request a new code later.' : 'Invalid verification code.', attempts >= 5 ? 'OTP_BLOCKED' : 'OTP_INVALID');
  }
  const token = randomToken(48);
  const timestamp = now();
  database().prepare("UPDATE otp_requests SET status = 'approved', updated_at = ? WHERE id = ?").run(timestamp, request.id);
  database().prepare(`INSERT INTO phone_verifications
    (id, phone, purpose, token_hash, expires_at, consumed_at, created_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?)`)
    .run(id('ver'), phone, purpose, digest(token), new Date(Date.now() + 15 * 60 * 1000).toISOString(), timestamp);
  audit(null, 'OTP_VERIFIED', 'otp_request', request.id, { phone, purpose }, req);
  sendJson(res, 200, { ok: true, verified: true, verificationToken: token, verifiedAt: timestamp });
}

async function resetCustomerPassword(req, res) {
  checkRateLimit(req, 'password-reset', 8, 60 * 60 * 1000);
  const body = await readJson(req);
  const phone = normalizePhone(body.phone);
  const password = String(body.password || '');
  if (!phone) throw new HttpError(400, 'Enter a valid Qatar mobile number.', 'INVALID_PHONE');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Password must contain at least 8 characters.', 'WEAK_PASSWORD');
  const verification = findVerification(phone, 'password-reset', body.verificationToken);
  if (!verification) throw new HttpError(403, 'Phone verification is missing or expired.', 'VERIFICATION_REQUIRED');
  const user = database().prepare("SELECT * FROM users WHERE role = 'customer' AND phone = ? AND status = 'active' LIMIT 1").get(phone);
  if (!user) throw new HttpError(404, 'Customer account was not found.', 'NOT_FOUND');
  const credentials = await hashPassword(password);
  transaction(() => {
    database().prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?').run(credentials.hash, credentials.salt, now(), user.id);
    database().prepare('UPDATE phone_verifications SET consumed_at = ? WHERE id = ?').run(now(), verification.id);
    database().prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(now(), user.id);
  });
  audit(user.id, 'PASSWORD_RESET', 'user', user.id, {}, req);
  sendJson(res, 200, { ok: true, message: 'Password updated successfully.' });
}

function safeText(value, max = 180) {
  return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function normalizeRole(value) {
  const key = safeText(value, 40).toLowerCase().replace(/[\s-]+/g, '_');
  return { boss: 'ceo', ceo: 'ceo', admin: 'admin', transport: 'transport', transportation_manager: 'transport', kitchen: 'kitchen', kitchen_team: 'kitchen', driver: 'driver', drivers_team: 'driver' }[key] || key;
}

function publicUser(user) {
  return { id: user.id, role: user.role, name: user.name, phone: user.phone || '', status: user.status };
}

function audit(actorUserId, action, entityType, entityId, details, req) {
  database().prepare(`INSERT INTO audit_logs
    (id, actor_user_id, action, entity_type, entity_id, details_json, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id('aud'), actorUserId || null, action, entityType, entityId || null, JSON.stringify(details || {}), clientIp(req), now());
}

function createSession(user, req) {
  const token = randomToken(48);
  const csrfToken = randomToken(32);
  const timestamp = now();
  const ttl = user.role === 'customer' ? customerSessionTtlMs : sessionTtlMs;
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  const sessionId = id('ses');
  database().prepare(`INSERT INTO sessions
    (id, user_id, token_hash, csrf_hash, expires_at, created_at, last_seen_at, revoked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`)
    .run(sessionId, user.id, digest(token), digest(csrfToken), expiresAt, timestamp, timestamp);
  const secure = production ? '; Secure' : '';
  const cookie = `thk_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(ttl / 1000)}${secure}`;
  audit(user.id, 'AUTH_LOGIN', 'session', sessionId, { role: user.role }, req);
  return { cookie, csrfToken, expiresAt };
}

function authenticate(req, { roles = null, csrf = false } = {}) {
  const token = parseCookies(req.headers.cookie).thk_session;
  if (!token) throw new HttpError(401, 'Please sign in.', 'AUTH_REQUIRED');
  const row = database().prepare(`SELECT s.*, u.role, u.name, u.phone, u.status AS user_status
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL LIMIT 1`).get(digest(token));
  if (!row || new Date(row.expires_at).getTime() <= Date.now() || row.user_status !== 'active') {
    throw new HttpError(401, 'Your session has expired. Please sign in again.', 'SESSION_EXPIRED');
  }
  if (roles && !roles.includes(row.role)) throw new HttpError(403, 'This account does not have permission for this action.', 'FORBIDDEN');
  if (csrf) {
    const supplied = String(req.headers['x-csrf-token'] || '');
    if (!supplied || digest(supplied) !== row.csrf_hash) throw new HttpError(403, 'Security token is missing or expired. Please sign in again.', 'CSRF_REJECTED');
  }
  database().prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(now(), row.id);
  return { id: row.user_id, role: row.role, name: row.name, phone: row.phone || '', sessionId: row.id };
}

function registrationView(row) {
  const payload = json(row.payload_json);
  return { ...payload, backendId: row.id, name: row.name, phone: row.phone, status: row.status, createdAt: payload.createdAt || row.created_at, updatedAt: row.updated_at };
}

function customerView(row) {
  const payload = json(row.payload_json);
  return {
    ...payload,
    backendId: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    status: row.status,
    cat: row.category || payload.cat || '',
    mealPackageId: row.meal_package_id || payload.mealPackageId || '',
    plan: row.plan || payload.plan || '',
    paymentStatus: row.payment_status,
    subscriptionStatus: row.subscription_status,
    remainingDays: row.remaining_days,
    updatedAt: row.updated_at
  };
}

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function createOperationalJobs(customerId, payload, paymentStatus) {
  const timestamp = now();
  const serviceDate = safeText(payload.subscriptionStart, 10) || tomorrowIso();
  const status = /^paid$/i.test(paymentStatus) ? 'queued' : 'held_payment';
  database().prepare(`INSERT OR IGNORE INTO kitchen_jobs
    (id, customer_id, service_date, status, payload_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id('kit'), customerId, serviceDate, status, JSON.stringify({ menu: payload.weeks || [], selections: payload.registrationMenuSelections || [], package: payload.mealPackageId || '', notes: payload.notes || '', allergies: payload.allergies || [] }), timestamp, timestamp);
  database().prepare(`INSERT OR IGNORE INTO delivery_jobs
    (id, customer_id, service_date, zone, area, assigned_driver_user_id, status, payload_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`)
    .run(id('del'), customerId, serviceDate, safeText(payload.zone, 160), safeText(payload.area, 160), status, JSON.stringify({ address: payload.deliveryAddress || payload.address || '', map: payload.googleLocation || '', time: payload.deliveryTime || '', preference: payload.deliveryPreference || '', note: payload.deliveryNote || '' }), timestamp, timestamp);
}

async function staffLogin(req, res) {
  checkRateLimit(req, 'staff-login', 10, 15 * 60 * 1000);
  const body = await readJson(req);
  const role = normalizeRole(body.role);
  if (!STAFF_ROLES.includes(role)) throw new HttpError(400, 'Please choose a valid team account.', 'INVALID_ROLE');
  const user = database().prepare("SELECT * FROM users WHERE role = ? AND status = 'active' LIMIT 1").get(role);
  const valid = user && await verifyPassword(String(body.password || ''), user.password_salt, user.password_hash);
  if (!valid) {
    audit(user?.id || null, 'AUTH_LOGIN_FAILED', 'user', user?.id || null, { role }, req);
    throw new HttpError(401, 'Wrong password for this account.', 'INVALID_CREDENTIALS');
  }
  database().prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), user.id);
  const session = createSession(user, req);
  sendJson(res, 200, { ok: true, user: publicUser(user), csrfToken: session.csrfToken, expiresAt: session.expiresAt }, { 'Set-Cookie': session.cookie });
}

async function customerLogin(req, res) {
  checkRateLimit(req, 'customer-login', 12, 15 * 60 * 1000);
  const body = await readJson(req);
  const phone = normalizePhone(body.phone);
  if (!phone) throw new HttpError(400, 'Enter a valid 8-digit Qatar mobile number.', 'INVALID_PHONE');
  const user = database().prepare("SELECT * FROM users WHERE role = 'customer' AND phone = ? AND status = 'active' LIMIT 1").get(phone);
  const valid = user && await verifyPassword(String(body.password || ''), user.password_salt, user.password_hash);
  if (!valid) {
    audit(user?.id || null, 'AUTH_LOGIN_FAILED', 'user', user?.id || null, { phone }, req);
    throw new HttpError(401, 'Customer not found or password wrong.', 'INVALID_CREDENTIALS');
  }
  const customer = database().prepare('SELECT * FROM customers WHERE user_id = ? LIMIT 1').get(user.id);
  if (!customer) throw new HttpError(403, 'Your account is not approved yet.', 'CUSTOMER_NOT_APPROVED');
  database().prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), user.id);
  const session = createSession(user, req);
  sendJson(res, 200, { ok: true, user: publicUser(user), customer: customerView(customer), csrfToken: session.csrfToken, expiresAt: session.expiresAt }, { 'Set-Cookie': session.cookie });
}

async function createRegistration(req, res) {
  checkRateLimit(req, 'registration', 6, 60 * 60 * 1000);
  const body = await readJson(req);
  const phone = normalizePhone(body.phone);
  const name = safeText(body.name, 120);
  const password = String(body.password || '');
  if (!phone) throw new HttpError(400, 'Enter a valid 8-digit Qatar mobile number.', 'INVALID_PHONE');
  if (!name || name.length < 2) throw new HttpError(400, 'Enter the customer name.', 'INVALID_NAME');
  const verification = findVerification(phone, 'registration', body.verificationToken);
  if (!verification) throw new HttpError(403, 'Mobile verification is missing or expired.', 'PHONE_NOT_VERIFIED');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Password must contain at least 8 characters.', 'WEAK_PASSWORD');
  const existingCustomer = database().prepare('SELECT id FROM customers WHERE phone = ? LIMIT 1').get(phone);
  if (existingCustomer) throw new HttpError(409, 'This mobile number already has a customer account.', 'CUSTOMER_EXISTS');
  const credentials = await hashPassword(password);
  const submittedPayment = cleanPayload(body.payment || {});
  const publicPaymentStatus = ['Cash Pending', 'Payment Uploaded', 'Awaiting Payment', 'Waiting Admin Approval'].includes(String(submittedPayment.status || body.paymentStatus || ''))
    ? String(submittedPayment.status || body.paymentStatus)
    : 'Awaiting Payment';
  const payload = cleanPayload({ ...body, phone, name, phoneVerified: true, status: 'Pending', paymentStatus: publicPaymentStatus, payment: { ...submittedPayment, status: publicPaymentStatus } });
  const registrationId = id('reg');
  const timestamp = now();
  try {
    transaction(() => {
      database().prepare(`INSERT INTO registrations
        (id, phone, name, status, password_hash, password_salt, payload_json, reviewed_by, approved_at, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, NULL, NULL, ?, ?)`)
        .run(registrationId, phone, name, credentials.hash, credentials.salt, JSON.stringify(payload), timestamp, timestamp);
      const payment = payload.payment || {};
      database().prepare(`INSERT INTO payments
        (id, customer_id, registration_id, status, method, amount, order_id, payment_id, proof_name, payload_json, approved_by, approved_at, created_at, updated_at)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`)
        .run(id('pay'), registrationId, publicPaymentStatus, safeText(payment.method, 80), Math.max(0, Number(payment.amount || 0)), safeText(payment.orderId, 100), safeText(payment.paymentId, 100), safeText(payment.proofName, 180), JSON.stringify(cleanPayload(payment)), timestamp, timestamp);
      database().prepare('UPDATE phone_verifications SET consumed_at = ? WHERE id = ?').run(timestamp, verification.id);
    });
  } catch (error) {
    if (/UNIQUE/i.test(error.message)) throw new HttpError(409, 'A registration for this mobile number is already waiting for review.', 'REGISTRATION_EXISTS');
    throw error;
  }
  audit(null, 'REGISTRATION_CREATED', 'registration', registrationId, { phone, name }, req);
  sendJson(res, 201, { ok: true, registration: registrationView(database().prepare('SELECT * FROM registrations WHERE id = ?').get(registrationId)) });
}

async function approveRegistration(req, res, registrationId) {
  const actor = authenticate(req, { roles: MANAGEMENT_ROLES, csrf: true });
  const body = await readJson(req);
  const row = database().prepare('SELECT * FROM registrations WHERE id = ? LIMIT 1').get(registrationId);
  if (!row) throw new HttpError(404, 'Registration was not found.', 'NOT_FOUND');
  if (row.status !== 'pending') throw new HttpError(409, 'This registration has already been reviewed.', 'ALREADY_REVIEWED');
  const payload = { ...json(row.payload_json), ...cleanPayload(body.customer || {}) };
  const payment = { ...(payload.payment || {}), ...(body.payment || {}) };
  const paymentStatus = safeText(payment.status || payload.paymentStatus || 'Awaiting Payment', 60);
  const activeSubscription = /^paid$/i.test(paymentStatus);
  const customerStatus = activeSubscription ? 'Active' : 'Pending Payment';
  const timestamp = now();
  const userId = id('usr');
  const customerId = id('cus');
  const totalDays = Math.max(0, Math.min(366, Number(payload.deliveryDays || payload.registrationPlanPayment?.deliveryDays || payload.trialDays || 0)));

  transaction(() => {
    const existingUser = database().prepare("SELECT id FROM users WHERE phone = ? AND role = 'customer' LIMIT 1").get(row.phone);
    const finalUserId = existingUser?.id || userId;
    if (existingUser) {
      database().prepare(`UPDATE users SET name = ?, password_hash = ?, password_salt = ?, status = 'active', updated_at = ? WHERE id = ?`)
        .run(row.name, row.password_hash, row.password_salt, timestamp, finalUserId);
    } else {
      database().prepare(`INSERT INTO users
        (id, role, phone, name, password_hash, password_salt, status, created_at, updated_at)
        VALUES (?, 'customer', ?, ?, ?, ?, 'active', ?, ?)`)
        .run(finalUserId, row.phone, row.name, row.password_hash, row.password_salt, timestamp, timestamp);
    }
    const approvedPayload = cleanPayload({ ...payload, backendId: customerId, status: customerStatus, paymentStatus, approvedAt: timestamp, approvedBy: actor.name, subscriptionStatus: activeSubscription ? 'Active' : 'Pending', remainingDays: totalDays });
    const existingCustomer = database().prepare('SELECT id FROM customers WHERE phone = ? LIMIT 1').get(row.phone);
    const finalCustomerId = existingCustomer?.id || customerId;
    if (existingCustomer) {
      database().prepare(`UPDATE customers SET user_id = ?, registration_id = ?, name = ?, status = ?, category = ?, meal_package_id = ?, plan = ?, payment_status = ?, subscription_status = ?, remaining_days = ?, payload_json = ?, updated_at = ? WHERE id = ?`)
        .run(finalUserId, row.id, row.name, customerStatus, safeText(approvedPayload.cat, 12), safeText(approvedPayload.mealPackageId, 60), safeText(approvedPayload.plan, 160), paymentStatus, activeSubscription ? 'Active' : 'Pending', totalDays, JSON.stringify(approvedPayload), timestamp, finalCustomerId);
    } else {
      database().prepare(`INSERT INTO customers
        (id, user_id, registration_id, phone, name, status, category, meal_package_id, plan, payment_status, subscription_status, remaining_days, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(finalCustomerId, finalUserId, row.id, row.phone, row.name, customerStatus, safeText(approvedPayload.cat, 12), safeText(approvedPayload.mealPackageId, 60), safeText(approvedPayload.plan, 160), paymentStatus, activeSubscription ? 'Active' : 'Pending', totalDays, JSON.stringify(approvedPayload), timestamp, timestamp);
    }
    database().prepare("UPDATE registrations SET status = 'approved', reviewed_by = ?, approved_at = ?, updated_at = ? WHERE id = ?")
      .run(actor.id, timestamp, timestamp, row.id);
    database().prepare(`UPDATE payments SET customer_id = ?, status = ?, method = ?, amount = ?, approved_by = ?, approved_at = ?, payload_json = ?, updated_at = ? WHERE registration_id = ?`)
      .run(finalCustomerId, paymentStatus, safeText(payment.method, 80), Math.max(0, Number(payment.amount || 0)), activeSubscription ? actor.id : null, activeSubscription ? timestamp : null, JSON.stringify(cleanPayload(payment)), timestamp, row.id);
    createOperationalJobs(finalCustomerId, approvedPayload, paymentStatus);
  });
  audit(actor.id, 'REGISTRATION_APPROVED', 'registration', row.id, { customerStatus, paymentStatus }, req);
  const approved = database().prepare('SELECT * FROM customers WHERE registration_id = ? LIMIT 1').get(row.id);
  sendJson(res, 200, { ok: true, customer: customerView(approved) });
}

async function updatePayment(req, res, customerId) {
  const actor = authenticate(req, { roles: MANAGEMENT_ROLES, csrf: true });
  const body = await readJson(req);
  const row = database().prepare('SELECT * FROM customers WHERE id = ? LIMIT 1').get(customerId);
  if (!row) throw new HttpError(404, 'Customer was not found.', 'NOT_FOUND');
  const status = safeText(body.status, 60);
  if (!status) throw new HttpError(400, 'Payment status is required.', 'INVALID_STATUS');
  const paid = /^paid$/i.test(status);
  const payload = { ...json(row.payload_json), payment: { ...(json(row.payload_json).payment || {}), ...cleanPayload(body), status }, paymentStatus: status, status: paid ? 'Active' : row.status };
  transaction(() => {
    database().prepare(`UPDATE customers SET status = ?, payment_status = ?, subscription_status = ?, payload_json = ?, updated_at = ? WHERE id = ?`)
      .run(paid ? 'Active' : row.status, status, paid ? 'Active' : row.subscription_status, JSON.stringify(payload), now(), row.id);
    database().prepare(`INSERT INTO payments
      (id, customer_id, registration_id, status, method, amount, order_id, payment_id, proof_name, payload_json, approved_by, approved_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id('pay'), row.id, row.registration_id, status, safeText(body.method, 80), Math.max(0, Number(body.amount || 0)), safeText(body.orderId, 100), safeText(body.paymentId, 100), safeText(body.proofName, 180), JSON.stringify(cleanPayload(body)), paid ? actor.id : null, paid ? now() : null, now(), now());
    if (paid) {
      database().prepare("UPDATE kitchen_jobs SET status = 'queued', updated_at = ? WHERE customer_id = ? AND status = 'held_payment'").run(now(), row.id);
      database().prepare("UPDATE delivery_jobs SET status = 'queued', updated_at = ? WHERE customer_id = ? AND status = 'held_payment'").run(now(), row.id);
    }
  });
  audit(actor.id, 'PAYMENT_UPDATED', 'customer', row.id, { status, amount: Number(body.amount || 0) }, req);
  sendJson(res, 200, { ok: true, customer: customerView(database().prepare('SELECT * FROM customers WHERE id = ?').get(row.id)) });
}

async function updateLifecycle(req, res, customerId, action) {
  const actor = authenticate(req, { roles: MANAGEMENT_ROLES, csrf: true });
  const body = await readJson(req);
  const row = database().prepare('SELECT * FROM customers WHERE id = ? LIMIT 1').get(customerId);
  if (!row) throw new HttpError(404, 'Customer was not found.', 'NOT_FOUND');
  const payload = json(row.payload_json);
  let status = row.status;
  let remaining = row.remaining_days;
  if (action === 'add-days') {
    const days = Math.max(1, Math.min(120, Number(body.days || 0)));
    if (!Number.isInteger(days)) throw new HttpError(400, 'Enter a whole number of days.', 'INVALID_DAYS');
    remaining += days;
    payload.deliveryDays = Math.max(Number(payload.deliveryDays || 0), remaining);
    payload.adjustments = [...(Array.isArray(payload.adjustments) ? payload.adjustments : []), { type: 'Add Days', days, reason: safeText(body.reason, 240), by: actor.name, at: now() }];
  } else if (action === 'pause') {
    status = 'Paused';
    payload.pauseStartDate = safeText(body.date, 10) || now().slice(0, 10);
    database().prepare("UPDATE kitchen_jobs SET status = 'paused', updated_at = ? WHERE customer_id = ? AND status = 'queued'").run(now(), row.id);
    database().prepare("UPDATE delivery_jobs SET status = 'paused', updated_at = ? WHERE customer_id = ? AND status = 'queued'").run(now(), row.id);
  } else if (action === 'resume') {
    status = row.payment_status === 'Paid' ? 'Active' : 'Pending Payment';
    payload.resumeDate = safeText(body.date, 10) || now().slice(0, 10);
    database().prepare("UPDATE kitchen_jobs SET status = 'queued', updated_at = ? WHERE customer_id = ? AND status = 'paused'").run(now(), row.id);
    database().prepare("UPDATE delivery_jobs SET status = 'queued', updated_at = ? WHERE customer_id = ? AND status = 'paused'").run(now(), row.id);
  }
  payload.status = status;
  payload.remainingDays = remaining;
  database().prepare('UPDATE customers SET status = ?, remaining_days = ?, payload_json = ?, updated_at = ? WHERE id = ?')
    .run(status, remaining, JSON.stringify(payload), now(), row.id);
  audit(actor.id, `CUSTOMER_${action.toUpperCase().replace('-', '_')}`, 'customer', row.id, { remainingDays: remaining, reason: safeText(body.reason, 240) }, req);
  sendJson(res, 200, { ok: true, customer: customerView(database().prepare('SELECT * FROM customers WHERE id = ?').get(row.id)) });
}

async function updateCustomer(req, res, customerId) {
  const actor = authenticate(req, { roles: [...STAFF_ROLES, 'customer'], csrf: true });
  const body = cleanPayload(await readJson(req));
  const row = database().prepare('SELECT * FROM customers WHERE id = ? LIMIT 1').get(customerId);
  if (!row) throw new HttpError(404, 'Customer was not found.', 'NOT_FOUND');
  if (actor.role === 'customer' && row.user_id !== actor.id) throw new HttpError(403, 'You can only update your own customer account.', 'FORBIDDEN');
  const current = json(row.payload_json);
  let updates = body;
  if (actor.role === 'customer') {
    const allowed = ['weeks', 'registrationMenuSelections', 'lastMenuSelectionDate', 'pauseRequests', 'renewalRequest', 'payment', 'paymentStatus', 'notes', 'deliveryNote', 'language'];
    updates = Object.fromEntries(allowed.filter(key => Object.prototype.hasOwnProperty.call(body, key)).map(key => [key, body[key]]));
    if (updates.paymentStatus && !['Waiting Admin Approval', 'Cash Pending', 'Payment Uploaded', 'Awaiting Payment'].includes(updates.paymentStatus)) delete updates.paymentStatus;
    if (updates.payment?.status && !['Waiting Admin Approval', 'Cash Pending', 'Payment Uploaded', 'Awaiting Payment'].includes(updates.payment.status)) delete updates.payment.status;
  }
  const payload = cleanPayload({ ...current, ...updates, backendId: row.id, userId: row.user_id });
  const status = actor.role === 'customer' ? row.status : safeText(payload.status || row.status, 60);
  const paymentStatus = actor.role === 'customer'
    ? safeText(updates.paymentStatus || updates.payment?.status || row.payment_status, 60)
    : safeText(payload.paymentStatus || payload.payment?.status || row.payment_status, 60);
  const remainingDays = actor.role === 'customer' ? row.remaining_days : Math.max(0, Math.min(366, Number(payload.remainingDays ?? row.remaining_days)));
  database().prepare(`UPDATE customers SET name = ?, status = ?, category = ?, meal_package_id = ?, plan = ?, payment_status = ?, remaining_days = ?, payload_json = ?, updated_at = ? WHERE id = ?`)
    .run(safeText(payload.name || row.name, 120), status, safeText(payload.cat || row.category, 12), safeText(payload.mealPackageId || row.meal_package_id, 60), safeText(payload.plan || row.plan, 160), paymentStatus, remainingDays, JSON.stringify(payload), now(), row.id);
  audit(actor.id, 'CUSTOMER_UPDATED', 'customer', row.id, { role: actor.role, fields: Object.keys(updates).slice(0, 40) }, req);
  sendJson(res, 200, { ok: true, customer: customerView(database().prepare('SELECT * FROM customers WHERE id = ?').get(row.id)) });
}

async function handleApi(req, res, url) {
  if (!url.pathname.startsWith('/api/')) return false;
  try {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertSameOrigin(req);
    if (req.method === 'OPTIONS') return sendJson(res, 204, {}), true;
    if (req.method === 'GET' && url.pathname === '/api/health') {
      const counts = database().prepare(`SELECT
        (SELECT COUNT(*) FROM registrations WHERE status = 'pending') AS pendingRegistrations,
        (SELECT COUNT(*) FROM customers) AS customers`).get();
      sendJson(res, 200, { ok: true, service: 'Triangle Healthy Kitchen API', mode: production ? 'production' : 'development', database: 'connected', sms: production ? 'twilio-verify' : 'development-code', time: now(), counts });
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/staff/login') return await staffLogin(req, res), true;
    if (req.method === 'POST' && url.pathname === '/api/auth/customer/login') return await customerLogin(req, res), true;
    if (req.method === 'POST' && url.pathname === '/api/auth/otp/send') return await sendOtp(req, res), true;
    if (req.method === 'POST' && url.pathname === '/api/auth/otp/verify') return await verifyOtp(req, res), true;
    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset') return await resetCustomerPassword(req, res), true;
    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      const actor = authenticate(req, { csrf: true });
      database().prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(now(), actor.sessionId);
      audit(actor.id, 'AUTH_LOGOUT', 'session', actor.sessionId, {}, req);
      sendJson(res, 200, { ok: true }, { 'Set-Cookie': `thk_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${production ? '; Secure' : ''}` });
      return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/auth/session') {
      const actor = authenticate(req);
      sendJson(res, 200, { ok: true, user: actor });
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/registrations') return await createRegistration(req, res), true;
    if (req.method === 'GET' && url.pathname === '/api/registrations') {
      authenticate(req, { roles: MANAGEMENT_ROLES });
      const status = safeText(url.searchParams.get('status') || 'pending', 40);
      const rows = database().prepare('SELECT * FROM registrations WHERE status = ? ORDER BY created_at DESC LIMIT 500').all(status);
      sendJson(res, 200, { ok: true, registrations: rows.map(registrationView) });
      return true;
    }
    const approvalMatch = url.pathname.match(/^\/api\/registrations\/([^/]+)\/approve$/);
    if (req.method === 'POST' && approvalMatch) return await approveRegistration(req, res, approvalMatch[1]), true;
    if (req.method === 'GET' && url.pathname === '/api/customers') {
      authenticate(req, { roles: STAFF_ROLES });
      const rows = database().prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT 1000').all();
      sendJson(res, 200, { ok: true, customers: rows.map(customerView) });
      return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/customers/me') {
      const actor = authenticate(req, { roles: ['customer'] });
      const row = database().prepare('SELECT * FROM customers WHERE user_id = ? LIMIT 1').get(actor.id);
      if (!row) throw new HttpError(404, 'Customer account was not found.', 'NOT_FOUND');
      sendJson(res, 200, { ok: true, customer: customerView(row) });
      return true;
    }
    const paymentMatch = url.pathname.match(/^\/api\/customers\/([^/]+)\/payment$/);
    if (req.method === 'POST' && paymentMatch) return await updatePayment(req, res, paymentMatch[1]), true;
    const customerUpdateMatch = url.pathname.match(/^\/api\/customers\/([^/]+)$/);
    if (req.method === 'PATCH' && customerUpdateMatch) return await updateCustomer(req, res, customerUpdateMatch[1]), true;
    const lifecycleMatch = url.pathname.match(/^\/api\/customers\/([^/]+)\/(add-days|pause|resume)$/);
    if (req.method === 'POST' && lifecycleMatch) return await updateLifecycle(req, res, lifecycleMatch[1], lifecycleMatch[2]), true;
    if (req.method === 'GET' && url.pathname === '/api/kitchen/jobs') {
      authenticate(req, { roles: ['ceo', 'admin', 'kitchen'] });
      const rows = database().prepare('SELECT * FROM kitchen_jobs ORDER BY service_date, created_at LIMIT 1000').all();
      sendJson(res, 200, { ok: true, jobs: rows.map(row => ({ ...row, payload: json(row.payload_json) })) });
      return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/delivery/jobs') {
      authenticate(req, { roles: ['ceo', 'admin', 'transport', 'driver'] });
      const rows = database().prepare('SELECT * FROM delivery_jobs ORDER BY service_date, created_at LIMIT 1000').all();
      sendJson(res, 200, { ok: true, jobs: rows.map(row => ({ ...row, payload: json(row.payload_json) })) });
      return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/audit-logs') {
      authenticate(req, { roles: MANAGEMENT_ROLES });
      const rows = database().prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500').all();
      sendJson(res, 200, { ok: true, logs: rows.map(row => ({ ...row, details: json(row.details_json) })) });
      return true;
    }
    throw new HttpError(404, 'API route was not found.', 'NOT_FOUND');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status >= 500) console.error(error);
    sendJson(res, status, { ok: false, error: error instanceof HttpError ? error.code : 'SERVER_ERROR', message: status >= 500 ? 'The server could not complete this request.' : error.message });
    return true;
  }
}

module.exports = { handleApi, securityHeaders };
