# Triangle Healthy Kitchen Backend

This folder contains the persistent API used by strict real-data mode. The preserved browser demo is inactive unless `preserveDemoFallback` is explicitly enabled again in `config.js`.

## Current security controls

- SQLite persistence with foreign keys, WAL mode, constraints, and transactions
- Scrypt password hashing with per-account random salts
- Opaque server sessions stored as hashes
- HttpOnly, SameSite cookies
- CSRF protection on authenticated write actions
- Same-origin checks and request-size limits
- Login and registration rate limits
- Role authorization for CEO, Admin, Transportation, Kitchen, Driver, and Customer
- Audit records for authentication, registration approval, payment, pause/resume, and add-days actions
- Server-authoritative OTP verification tokens and password reset
- Twilio Verify integration in production and a development-only local code outside production
- Security response headers

## Production environment variables

Set these before production deployment:

- `NODE_ENV=production`
- `THK_SESSION_SECRET`
- `THK_CEO_PASSWORD`
- `THK_ADMIN_PASSWORD`
- `THK_TRANSPORT_PASSWORD`
- `THK_KITCHEN_PASSWORD`
- `THK_DRIVER_PASSWORD`
- `THK_DATABASE_PATH` when the database should live outside this workspace
- `THK_PUBLIC_ORIGIN=https://trianglehk.com`
- `TWILIO_API_KEY`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_VERIFY_SERVICE_SID`

Backend records are stored in `data/triangle-health.db` locally. Production uses the path supplied through `THK_DATABASE_PATH`. See `deploy/README.md` for the domain deployment requirements.
