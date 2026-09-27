const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const databasePath = process.env.THK_DATABASE_PATH || path.join(dataDir, 'triangle-health.db');
const production = process.env.NODE_ENV === 'production';

fs.mkdirSync(dataDir, { recursive: true });

function sessionSecret() {
  if (process.env.THK_SESSION_SECRET) {
    if (production && process.env.THK_SESSION_SECRET.length < 64) throw new Error('THK_SESSION_SECRET must contain at least 64 characters in production.');
    return process.env.THK_SESSION_SECRET;
  }
  if (production) throw new Error('THK_SESSION_SECRET is required in production.');

  const secretPath = path.join(dataDir, '.session-secret');
  try {
    const saved = fs.readFileSync(secretPath, 'utf8').trim();
    if (saved.length >= 64) return saved;
  } catch {}

  const generated = crypto.randomBytes(48).toString('base64url');
  fs.writeFileSync(secretPath, generated, { encoding: 'utf8', mode: 0o600 });
  return generated;
}

function productionValue(name, fallback = '') {
  const value = String(process.env[name] || fallback).trim();
  if (production && !value) throw new Error(`${name} is required in production.`);
  return value;
}

const staffPasswords = {
  ceo: productionValue('THK_CEO_PASSWORD', production ? '' : 'THKceo@2026'),
  admin: productionValue('THK_ADMIN_PASSWORD', production ? '' : 'THKadmin@2026'),
  transport: productionValue('THK_TRANSPORT_PASSWORD', production ? '' : 'THKtransport@2026'),
  kitchen: productionValue('THK_KITCHEN_PASSWORD', production ? '' : 'THKkitchen@2026'),
  driver: productionValue('THK_DRIVER_PASSWORD', production ? '' : 'THKdriver@2026')
};

if (production) {
  for (const [role, password] of Object.entries(staffPasswords)) {
    if (password.length < 14) throw new Error(`THK_${role.toUpperCase()}_PASSWORD must contain at least 14 characters in production.`);
  }
}

const twilio = {
  apiKey: productionValue('TWILIO_API_KEY'),
  apiSecret: productionValue('TWILIO_API_KEY_SECRET'),
  verifyServiceSid: productionValue('TWILIO_VERIFY_SERVICE_SID')
};
const publicOrigin = productionValue('THK_PUBLIC_ORIGIN', production ? '' : 'http://127.0.0.1:4173');
if (production && !/^https:\/\//i.test(publicOrigin)) throw new Error('THK_PUBLIC_ORIGIN must use HTTPS in production.');

module.exports = {
  rootDir,
  dataDir,
  databasePath,
  production,
  publicOrigin,
  sessionSecret: sessionSecret(),
  staffPasswords,
  twilio,
  developmentOtpCode: production ? '' : String(process.env.THK_DEVELOPMENT_OTP_CODE || '123456'),
  sessionTtlMs: 12 * 60 * 60 * 1000,
  customerSessionTtlMs: 7 * 24 * 60 * 60 * 1000,
  maxJsonBytes: 5 * 1024 * 1024
};
