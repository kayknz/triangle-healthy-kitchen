/*
# Seasonal and Cultural Settings
1. Create global_settings table
2. Initialize with default season and Ramadan mode OFF
*/

CREATE TABLE IF NOT EXISTS public.global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_season text DEFAULT 'autumn',
  ramadan_mode boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Seed initial settings if none exist
INSERT INTO public.global_settings (active_season, ramadan_mode)
SELECT 'autumn', false
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings);

-- RLS Policies
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view settings" ON public.global_settings;
CREATE POLICY "Anyone can view settings"
  ON public.global_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners can update settings" ON public.global_settings;
CREATE POLICY "Owners can update settings"
  ON public.global_settings FOR UPDATE
  TO authenticated
  USING (public.is_provider())
  WITH CHECK (public.is_provider());

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
