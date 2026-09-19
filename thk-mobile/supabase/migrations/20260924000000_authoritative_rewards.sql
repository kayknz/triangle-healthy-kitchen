-- AUTHORITATIVE REWARDS MIGRATION 2026-09-24
-- Moves reward calculations and streak logic to the database.

-- 1. Atomic Point Accumulation Function
CREATE OR REPLACE FUNCTION public.accrue_points(
  p_subscriber_id uuid,
  p_points integer,
  p_reason text,
  p_idempotency_key text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into ledger first (UNIQUE key will block duplicates)
  INSERT INTO public.points_ledger (subscriber_id, points_delta, event_type, idempotency_key)
  VALUES (p_subscriber_id, p_points, p_reason, p_idempotency_key);

  -- Update subscriber balance
  UPDATE public.subscribers
  SET points_balance = points_balance + p_points
  WHERE id = p_subscriber_id;

  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false; -- Already processed
END;
$$;

-- 2. Authoritative Streak Calculation (View)
-- This replaces mock logic in the UI with a real database-derived streak.
CREATE OR REPLACE VIEW public.subscriber_streaks AS
WITH daily_completions AS (
  SELECT
    subscriber_id,
    target_date,
    LAG(target_date) OVER (PARTITION BY subscriber_id ORDER BY target_date) as prev_date
  FROM public.user_daily_goals
  WHERE is_completed = true
),
streak_groups AS (
  SELECT
    subscriber_id,
    target_date,
    target_date - (ROW_NUMBER() OVER (PARTITION BY subscriber_id ORDER BY target_date) * interval '1 day') as group_id
  FROM daily_completions
)
SELECT
  subscriber_id,
  COUNT(*) as current_streak,
  MAX(target_date) as last_completed_date
FROM streak_groups
GROUP BY subscriber_id, group_id;
