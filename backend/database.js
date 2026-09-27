const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const { staffPasswords } = require('./config');
const { databasePath } = require('./config');
const { hashPassword } = require('./security');

let db;

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function json(value, fallback = {}) {
  try { return JSON.parse(value || ''); } catch { return fallback; }
}

function transaction(work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function createSchema() {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('ceo','admin','transport','kitchen','driver','customer')),
      phone TEXT UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      reviewed_by TEXT,
      approved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS registrations_pending_phone
      ON registrations(phone) WHERE status = 'pending';

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
      registration_id TEXT UNIQUE REFERENCES registrations(id) ON DELETE SET NULL,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      category TEXT,
      meal_package_id TEXT,
      plan TEXT,
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      subscription_status TEXT NOT NULL DEFAULT 'Pending',
      remaining_days INTEGER NOT NULL DEFAULT 0 CHECK(remaining_days >= 0),
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
      registration_id TEXT REFERENCES registrations(id) ON DELETE SET NULL,
      status TEXT NOT NULL,
      method TEXT,
      amount REAL NOT NULL DEFAULT 0 CHECK(amount >= 0),
      order_id TEXT,
      payment_id TEXT,
      proof_name TEXT,
      payload_json TEXT NOT NULL DEFAULT '{}',
      approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      approved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kitchen_jobs (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      service_date TEXT NOT NULL,
      status TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(customer_id, service_date)
    );

    CREATE TABLE IF NOT EXISTS delivery_jobs (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      service_date TEXT NOT NULL,
      zone TEXT,
      area TEXT,
      assigned_driver_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(customer_id, service_date)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      csrf_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      revoked_at TEXT
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS payments_customer_id ON payments(customer_id);
    CREATE INDEX IF NOT EXISTS kitchen_jobs_service_date ON kitchen_jobs(service_date, status);
    CREATE INDEX IF NOT EXISTS delivery_jobs_service_date ON delivery_jobs(service_date, status);

    CREATE TABLE IF NOT EXISTS otp_requests (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      purpose TEXT NOT NULL CHECK(purpose IN ('registration','password-reset')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','expired','blocked')),
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS otp_requests_phone_purpose
      ON otp_requests(phone, purpose, created_at DESC);

    CREATE TABLE IF NOT EXISTS phone_verifications (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      purpose TEXT NOT NULL CHECK(purpose IN ('registration','password-reset')),
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS phone_verifications_lookup
      ON phone_verifications(phone, purpose, token_hash);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS audit_logs_created_at ON audit_logs(created_at DESC);
  `);
}

async function seedStaffUsers() {
  const staff = [
    ['ceo', 'CEO', staffPasswords.ceo],
    ['admin', 'Admin', staffPasswords.admin],
    ['transport', 'Transportation Manager', staffPasswords.transport],
    ['kitchen', 'Kitchen Team', staffPasswords.kitchen],
    ['driver', 'Drivers Team', staffPasswords.driver]
  ];
  const find = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1');
  const insert = db.prepare(`INSERT INTO users
    (id, role, phone, name, password_hash, password_salt, status, created_at, updated_at)
    VALUES (?, ?, NULL, ?, ?, ?, 'active', ?, ?)`);

  for (const [role, name, password] of staff) {
    if (find.get(role)) continue;
    const credentials = await hashPassword(password);
    const timestamp = now();
    insert.run(id('usr'), role, name, credentials.hash, credentials.salt, timestamp, timestamp);
  }
}

async function initDatabase() {
  if (db) return db;
  db = new DatabaseSync(databasePath);
  createSchema();
  await seedStaffUsers();
  return db;
}

function database() {
  if (!db) throw new Error('Database has not been initialized.');
  return db;
}

module.exports = { initDatabase, database, transaction, now, id, json };
