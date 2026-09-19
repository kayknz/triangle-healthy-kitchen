/*
# Calo-Killer Refinements
1. Add pause/skip functionality
2. Add allergy and dislike tracking
3. Add activity level for precise macro calculation
4. Add referral system foundation
*/

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS paused_until date,
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dislikes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS fitness_goal text;

-- Index for logistics performance
CREATE INDEX IF NOT EXISTS idx_subscribers_paused ON public.subscribers(is_paused) WHERE is_paused = true;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
