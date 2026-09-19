/*
# Double Booking Prevention + Tap Payment Integration

## Purpose
1. Prevents two clients from booking the same appointment slot (same date + time)
2. Adds Tap Payments columns to subscribers table

## Changes
- Unique constraint on bookings (appointment_date, appointment_time) where status is not cancelled
- Adds tap_charge_id to subscribers for Tap payment tracking
*/

-- Double booking prevention: no two active bookings can share the same date+time
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_booking
ON bookings (appointment_date, appointment_time)
WHERE status NOT IN ('cancelled');

-- Add Tap payment column to subscribers
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS tap_charge_id text;