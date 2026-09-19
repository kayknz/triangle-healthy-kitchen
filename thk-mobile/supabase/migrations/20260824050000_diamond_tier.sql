/*
# Diamond Tier Upgrades
1. Add points and referrals to subscribers
2. Add live GPS tracking for riders
3. Add point transaction ledger
*/

-- 1. Enhancing Subscribers
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taste_profile jsonb DEFAULT '{}';

-- 2. Enhancing Rider Applications for Live Tracking
ALTER TABLE public.rider_applications
  ADD COLUMN IF NOT EXISTS current_lat numeric,
  ADD COLUMN IF NOT EXISTS current_lng numeric,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- 3. Loyalty Ledger (Preventing Fraud)
CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES public.subscribers(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- 4. Automatically give points on delivery
CREATE OR REPLACE FUNCTION public.reward_delivery_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Update subscriber points (+10)
    UPDATE public.subscribers
    SET points = points + 10
    WHERE id = NEW.subscriber_id;

    -- Log to ledger
    INSERT INTO public.loyalty_ledger (subscriber_id, points, reason)
    VALUES (NEW.subscriber_id, 10, 'Meal Delivered');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reward_points
  AFTER UPDATE ON public.rider_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_delivery_points();

-- 5. RLS for Ledger
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own points" ON public.loyalty_ledger FOR SELECT USING (subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid()));

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
