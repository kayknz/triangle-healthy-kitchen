const crypto = require('crypto');

const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('974') ? digits.slice(3) : digits;
  return /^\d{8}$/.test(local) ? `+974${local}` : '';
}

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(24).toString('base64url');
  const key = await scrypt(password, salt);
  return { salt, hash: key.toString('base64url') };
}

async function verifyPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;
  const actual = await scrypt(password, salt);
  const expected = Buffer.from(expectedHash, 'base64url');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function parseCookies(header) {
  return String(header || '').split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index < 1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try { cookies[key] = decodeURIComponent(value); } catch { cookies[key] = value; }
    return cookies;
  }, {});
}

module.exports = { normalizePhone, hashPassword, verifyPassword, randomToken, digest, parseCookies };
