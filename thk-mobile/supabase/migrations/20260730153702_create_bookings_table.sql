/*
# Triangle Healthy Kitchen — Bookings Table

## Overview
Creates the core bookings table that stores all client appointment and intake data
collected through the multi-step booking flow on the website.

## New Tables

### bookings
Stores every booking submission from the website.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| package_id | text | Selected meal plan (1100kcal / 1400kcal / 1500kcal) |
| package_name | text | Human-readable package name |
| weight_kg | numeric | Client weight in kilograms |
| height_cm | numeric | Client height in centimetres |
| fitness_goal | text | Primary goal (e.g. weight loss, muscle gain, maintenance) |
| exercise_routine | text | Current exercise description, or null if none |
| wants_exercise_plan | boolean | Whether client wants an exercise recommendation |
| dietary_restrictions | text | Allergies / dietary preferences free-text |
| health_notes | text | Any other health notes |
| appointment_date | date | Date of the chef consultation |
| appointment_time | text | Time slot (e.g. "10:00") |
| client_name | text | Full name |
| client_email | text | Email address for confirmation |
| client_phone | text | Phone number |
| status | text | pending / confirmed / completed / cancelled |
| created_at | timestamptz | Row creation timestamp |

## Security
- RLS enabled.
- Public (anon + authenticated) INSERT so any visitor can submit a booking.
- Public SELECT so a confirmation page can read back a just-created booking.
- No public UPDATE/DELETE to protect submitted data.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id text NOT NULL,
  package_name text NOT NULL,
  weight_kg numeric,
  height_cm numeric,
  fitness_goal text,
  exercise_routine text,
  wants_exercise_plan boolean NOT NULL DEFAULT false,
  dietary_restrictions text,
  health_notes text,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public INSERT constrained to pending bookings on user-supplied columns only.
-- id / status / created_at keep their defaults and cannot be set by the caller.
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (status = 'pending');

REVOKE INSERT ON bookings FROM anon, authenticated;
GRANT INSERT (
  package_id, package_name, weight_kg, height_cm, fitness_goal,
  exercise_routine, wants_exercise_plan, dietary_restrictions,
  health_notes, appointment_date, appointment_time,
  client_name, client_email, client_phone
) ON bookings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);
