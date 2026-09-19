/*
# Provider access, notifications log, and reminder tracking

## Overview
Locks down booking reads to authenticated providers, adds status updates,
creates a notifications log for every email sent, and a reminders table to
de-duplicate 24h / 1h reminders.

## Changes to existing tables

### bookings
- SELECT policy changed from public (anon) to authenticated-only.
  The public booking form no longer reads bookings back — the edge function
  handles the insert server-side with the service role key and returns the ID.
- INSERT policy kept for anon as a safety-net fallback.
- NEW UPDATE policy for authenticated providers (change status).

## New Tables

### notifications
Records every email the system attempts to send (client confirmations,
provider alerts, reminders).

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| booking_id | uuid | FK to bookings |
| recipient | text | Email address sent to |
| recipient_role | text | 'client' or 'provider' |
| subject | text | Email subject |
| body_html | text | Email HTML body |
| status | text | sent / pending / failed |
| provider | text | Email provider used (e.g. 'resend') |
| error | text | Error message if failed |
| created_at | timestamptz | Timestamp |

### reminders
De-duplicates reminders so the same booking doesn't get two "24h" reminders.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| booking_id | uuid | FK to bookings |
| reminder_type | text | '24h' or '1h' |
| sent_at | timestamptz | When the reminder was sent |

## Security
- bookings: SELECT + UPDATE for authenticated (provider). INSERT for anon (fallback).
- notifications: SELECT for authenticated (provider sees email history).
  INSERT only via service role (edge function).
- reminders: SELECT for authenticated. INSERT/DELETE via service role (edge function).
*/

-- === bookings RLS changes ===

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
DROP POLICY IF EXISTS "provider_select_bookings" ON bookings;
CREATE POLICY "provider_select_bookings" ON bookings FOR SELECT
  TO authenticated USING (true);

-- Providers only change status; restrict to the status column and valid values.
DROP POLICY IF EXISTS "provider_update_bookings" ON bookings;
CREATE POLICY "provider_update_bookings" ON bookings FOR UPDATE
  TO authenticated USING (true)
  WITH CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

REVOKE UPDATE ON bookings FROM authenticated;
GRANT UPDATE (status) ON bookings TO authenticated;

-- === notifications table ===

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  recipient_role text NOT NULL CHECK (recipient_role IN ('client', 'provider')),
  subject text NOT NULL,
  body_html text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'pending', 'failed')),
  provider text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_select_notifications" ON notifications;
CREATE POLICY "provider_select_notifications" ON notifications FOR SELECT
  TO authenticated USING (true);

-- === reminders table ===

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reminder_type)
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_select_reminders" ON reminders;
CREATE POLICY "provider_select_reminders" ON reminders FOR SELECT
  TO authenticated USING (true);

-- === Indexes ===
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings (appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications (booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_booking_type ON reminders (booking_id, reminder_type);
