/*
# Owner Provider Access to Client Data

## Purpose
Allows owners (is_owner = true on their subscribers record) to read ALL
subscriber data: subscribers, weekly_menu_selections, progress_entries,
health_data. This is needed so owners can manage their clients' meal plans,
health data, delivery info, and progress from the Provider Dashboard.

## Approach
- A SECURITY DEFINER helper `is_provider()` checks if the current auth user
  has an owner-flagged subscriber record.
- New SELECT policies on each subscriber-data table allow reads when
  `is_provider()` returns true, OR when the user owns the record (existing
  policy preserved via OR).
- Owners do NOT get insert/update/delete on other users' data — read only.
*/

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

GRANT EXECUTE ON FUNCTION public.is_provider() TO authenticated;

-- subscribers: owners can read ALL subscriber records
DROP POLICY IF EXISTS "provider_select_all_subscribers" ON subscribers;
CREATE POLICY "provider_select_all_subscribers"
  ON subscribers FOR SELECT
  TO authenticated
  USING (public.is_provider());

-- weekly_menu_selections: owners can read all
DROP POLICY IF EXISTS "provider_select_all_menu_selections" ON weekly_menu_selections;
CREATE POLICY "provider_select_all_menu_selections"
  ON weekly_menu_selections FOR SELECT
  TO authenticated
  USING (public.is_provider());

-- progress_entries: owners can read all
DROP POLICY IF EXISTS "provider_select_all_progress" ON progress_entries;
CREATE POLICY "provider_select_all_progress"
  ON progress_entries FOR SELECT
  TO authenticated
  USING (public.is_provider());

-- health_data: owners can read all
DROP POLICY IF EXISTS "provider_select_all_health_data" ON health_data;
CREATE POLICY "provider_select_all_health_data"
  ON health_data FOR SELECT
  TO authenticated
  USING (public.is_provider());