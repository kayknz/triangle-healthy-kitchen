/*
# Tighten bookings RLS policies

## Findings fixed
- anon_insert_bookings: WITH CHECK (true) let any caller set arbitrary column
  values, including status (e.g. 'confirmed'), bypassing the provider workflow.
- provider_update_bookings: USING (true) WITH CHECK (true) let any authenticated
  user rewrite every column of every booking row.

## Approach
The public booking form never inserts directly — the send-booking-notification
edge function inserts with the service role key (bypasses RLS), so the anon
INSERT policy is only a safety-net fallback. We keep it but constrain it.

INSERT: WITH CHECK (status = 'pending') plus column-level INSERT grant on only
the user-supplied columns. id / status / created_at keep their defaults and
cannot be set by the caller.

UPDATE: providers only change status (see ProviderDashboard.updateStatus).
Revoke table-wide UPDATE, grant UPDATE (status) only, and constrain the value
with WITH CHECK (status IN (...)). USING (true) is retained because every
authenticated user is a provider and all bookings are shared provider work.
*/

-- === INSERT: constrain to pending + user-supplied columns only ===
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

REVOKE INSERT ON bookings FROM anon, authenticated;
GRANT INSERT (
  package_id, package_name, weight_kg, height_cm, fitness_goal,
  exercise_routine, wants_exercise_plan, dietary_restrictions,
  health_notes, appointment_date, appointment_time,
  client_name, client_email, client_phone
) ON bookings TO anon, authenticated;

-- === UPDATE: status column only, valid values only ===
DROP POLICY IF EXISTS "provider_update_bookings" ON bookings;
CREATE POLICY "provider_update_bookings" ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

REVOKE UPDATE ON bookings FROM authenticated;
GRANT UPDATE (status) ON bookings TO authenticated;
