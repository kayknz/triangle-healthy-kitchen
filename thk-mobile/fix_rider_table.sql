-- Create the rider_applications table
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

-- Create the is_provider function if it doesn't exist
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

-- RLS Policies for rider_applications
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rider_applications_approved_created
  ON rider_applications(approved, created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_rider_applications_updated_at ON rider_applications;
CREATE TRIGGER handle_rider_applications_updated_at
  BEFORE UPDATE ON rider_applications
  FOR EACH ROW
  WHEN (OLD.updated_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_updated_at();
