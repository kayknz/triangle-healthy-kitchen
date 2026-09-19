-- SECURITY HARDENING MIGRATION 2026-09-20
-- Addresses Privilege Escalation, PII Leak, and Payment Integrity.

-- 1. Hardening subscribers table
-- Prevent users from setting their own is_owner flag or status during insert/update.
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Revoke column-level write access for sensitive fields
REVOKE INSERT, UPDATE (is_owner, status, tap_charge_id, subscription_start, current_period_end) ON subscribers FROM anon, authenticated;

-- Ensure owners can be identified safely
CREATE OR REPLACE FUNCTION public.is_provider()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscribers
    WHERE user_id = auth.uid() AND is_owner = true
  );
$$;

-- 2. Hardening bookings table (PII Protection)
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
DROP POLICY IF EXISTS "provider_select_all_bookings" ON bookings;
DROP POLICY IF EXISTS "public_check_availability" ON bookings;

-- Visibility: all rows are "visible" to allow availability checks,
-- but column-level grants will restrict the data.
CREATE POLICY "bookings_visibility"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enforce column-level security
REVOKE SELECT ON bookings FROM anon, authenticated;
-- Public/Authenticated can only see availability
GRANT SELECT (appointment_date, appointment_time) ON bookings TO anon, authenticated;

-- For Providers: Use a Secure View to access PII
-- This avoids leaking PII via the base table to regular authenticated users
CREATE OR REPLACE VIEW provider_bookings_view AS
SELECT * FROM bookings
WHERE public.is_provider();

GRANT SELECT ON provider_bookings_view TO authenticated;
-- The 'authenticated' role now has SELECT permission on all columns,
-- but the 'public_check_availability' policy is only for (date, time) usually?
-- No, RLS is ROW level. Column grants are additional.
-- If a provider selects *, they see all. If a regular user selects *, they get a permission error on restricted columns.

-- 3. Hardening bookings update (Provider Only)
DROP POLICY IF EXISTS "provider_update_bookings" ON bookings;
CREATE POLICY "provider_update_bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (public.is_provider())
  WITH CHECK (public.is_provider());

REVOKE UPDATE ON bookings FROM anon, authenticated;
GRANT UPDATE (status) ON bookings TO authenticated;

-- 4. Rider Deliveries (Security Scope)
DROP POLICY IF EXISTS "riders_select_own_deliveries" ON rider_deliveries;
CREATE POLICY "riders_select_own_deliveries"
  ON rider_deliveries FOR SELECT
  TO authenticated
  USING (
    rider_user_id = auth.uid()
  );

-- 5. Health Data (Ensure no provider escalation leaks)
-- Already scoped to auth.uid() = user_id OR is_provider().
-- We just need to make sure is_provider() is robust (done in step 1).
