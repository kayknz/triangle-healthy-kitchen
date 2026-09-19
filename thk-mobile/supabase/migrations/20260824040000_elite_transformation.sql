/*
# Premium Transformation Updates
1. Add gender and age to subscribers
2. Add onboarding_completed flag
*/

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
