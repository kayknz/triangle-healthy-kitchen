-- Hybrid Menu Refresh Engine Migration
-- Task: Add menu period and deadline tracking

-- 1. Update global_settings
ALTER TABLE public.global_settings
ADD COLUMN IF NOT EXISTS current_menu_period text,
ADD COLUMN IF NOT EXISTS selection_deadline timestamptz;

-- 2. Update weekly_menu_selections to track period
ALTER TABLE public.weekly_menu_selections
ADD COLUMN IF NOT EXISTS menu_period text;

-- Add index for performance on period-based queries
CREATE INDEX IF NOT EXISTS idx_weekly_menu_period ON public.weekly_menu_selections(menu_period);

-- 3. Update existing data if possible (optional, but good practice)
UPDATE public.global_settings
SET current_menu_period = 'September 2026',
    selection_deadline = now() + interval '7 days'
WHERE current_menu_period IS NULL;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
