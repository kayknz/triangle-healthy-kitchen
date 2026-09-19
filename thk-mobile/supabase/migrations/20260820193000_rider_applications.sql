/*
# Rider Applications and Approval

Rider signups are stored separately from auth metadata so owners can approve
delivery access without exposing Supabase Auth admin privileges to the client.
Approved riders can access route data; pending riders see the waiting screen.
*/

CREATE OR REPLACE FUNCTION public.is_provider()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'kevmulgeo@gmail.com',
      'issashahid1@gmail.com',
      'georgekmuliika@gmail.com'
    )
    OR EXISTS (
      SELECT 1 FROM subscribers
      WHERE user_id = auth.uid() AND is_owner = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_provider() TO authenticated;

CREATE TABLE IF NOT EXISTS rider_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE rider_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "riders_insert_own_application" ON rider_applications;
CREATE POLICY "riders_insert_own_application"
  ON rider_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND approved = false);

DROP POLICY IF EXISTS "riders_select_own_application" ON rider_applications;
CREATE POLICY "riders_select_own_application"
  ON rider_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "providers_select_all_rider_applications" ON rider_applications;
CREATE POLICY "providers_select_all_rider_applications"
  ON rider_applications FOR SELECT
  TO authenticated
  USING (public.is_provider());

DROP POLICY IF EXISTS "providers_update_rider_applications" ON rider_applications;
CREATE POLICY "providers_update_rider_applications"
  ON rider_applications FOR UPDATE
  TO authenticated
  USING (public.is_provider())
  WITH CHECK (public.is_provider());

CREATE INDEX IF NOT EXISTS idx_rider_applications_approved_created
  ON rider_applications(approved, created_at DESC);
