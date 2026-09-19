-- DATA INTEGRITY & AUTHORIZATION HARDENING MIGRATION 2026-09-22
-- Audits and reinforces RLS, constraints, and authorization boundaries.

-- ============================================================================
-- 1. SECURING SUBSCRIBER OWNERSHIP & COLUMN ACCESS
-- ============================================================================

-- Protect sensitive metadata from being set by the user during signup
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Revoke column-level write access for all sensitive business logic fields
REVOKE INSERT, UPDATE (
  is_owner, status, tap_charge_id, last_payment_id, points,
  referral_count, membership_type, reward_tier, points_balance,
  current_streak, longest_streak
) ON subscribers FROM anon, authenticated;

-- ============================================================================
-- 2. HARDENING BOOKINGS (PII PROTECTION)
-- ============================================================================

-- Ensure the 'bookings' table never leaks PII to non-providers.
-- The secure view 'provider_bookings_view' is already created in 20260920.
-- We verify that anon/authenticated roles ONLY have access to availability columns.

REVOKE SELECT ON bookings FROM anon, authenticated;
GRANT SELECT (appointment_date, appointment_time) ON bookings TO anon, authenticated;

-- ============================================================================
-- 3. SECURING HEALTH & PROGRESS DATA (IDOR PROTECTION)
-- ============================================================================

-- health_connections: Ensure users only see their own
DROP POLICY IF EXISTS "select_own_health_connection" ON health_connections;
CREATE POLICY "select_own_health_connection" ON health_connections FOR SELECT
  TO authenticated USING (
    subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
  );

-- progress_entries: Ensure users only see their own
DROP POLICY IF EXISTS "select_own_progress" ON progress_entries;
CREATE POLICY "select_own_progress" ON progress_entries FOR SELECT
  TO authenticated USING (
    subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
  );

-- health_data: Ensure users only see their own
DROP POLICY IF EXISTS "select_own_health_data" ON health_data;
CREATE POLICY "select_own_health_data" ON health_data FOR SELECT
  TO authenticated USING (
    subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 4. COMMUNITY & SOCIAL BOUNDARIES
-- ============================================================================

-- Prevent users from reacting/posting as others
DROP POLICY IF EXISTS "Users can create own posts" ON community_posts;
CREATE POLICY "Users can create own posts" ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can react to posts" ON community_reactions;
CREATE POLICY "Users can react to posts" ON community_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 5. RIDER & PROVIDER SCOPING
-- ============================================================================

-- Rider deliveries: Ensure riders can only update status, not reassign themselves
REVOKE UPDATE ON rider_deliveries FROM authenticated;
GRANT UPDATE (status, proof_photo_url, notes, delivered_at) ON rider_deliveries TO authenticated;

-- ============================================================================
-- 6. DATA INTEGRITY CONSTRAINTS
-- ============================================================================

-- Prevent negative points
ALTER TABLE subscribers ADD CONSTRAINT check_points_positive CHECK (points >= 0);
ALTER TABLE subscribers ADD CONSTRAINT check_points_balance_positive CHECK (points_balance >= 0);

-- Prevent impossible booking states (e.g. past dates in check constraints if needed,
-- but better handled by business logic/triggers).
ALTER TABLE bookings ADD CONSTRAINT check_status_valid CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- ============================================================================
-- 7. VAULT PROTECTION (INTERNAL API HARDENING)
-- ============================================================================

-- Revoke all vault helper execution from public roles (they are for Edge Functions only)
REVOKE EXECUTE ON FUNCTION public.get_dibsy_config() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dibsy_webhook_secret() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_brevo_config() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_terra_config() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_tap_config() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_dibsy_config() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dibsy_webhook_secret() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_brevo_config() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_terra_config() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tap_config() TO service_role;
