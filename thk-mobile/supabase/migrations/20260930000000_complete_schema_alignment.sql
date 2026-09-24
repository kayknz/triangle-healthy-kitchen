-- MASTER SCHEMA ALIGNMENT MIGRATION
-- Ensures complete parity across all database columns for thk-mobile and thk-web

DO $$
BEGIN
    -- 1. Ensure all extended subscriber profile columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'membership_type') THEN
        ALTER TABLE subscribers ADD COLUMN membership_type text DEFAULT 'subscriber';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'reward_tier') THEN
        ALTER TABLE subscribers ADD COLUMN reward_tier text DEFAULT 'community';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'points_balance') THEN
        ALTER TABLE subscribers ADD COLUMN points_balance integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'current_streak') THEN
        ALTER TABLE subscribers ADD COLUMN current_streak integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'longest_streak') THEN
        ALTER TABLE subscribers ADD COLUMN longest_streak integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'streak_history') THEN
        ALTER TABLE subscribers ADD COLUMN streak_history integer[] DEFAULT '{0,0,0,0,0,0,0}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'gender') THEN
        ALTER TABLE subscribers ADD COLUMN gender text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'preferred_region_id') THEN
        ALTER TABLE subscribers ADD COLUMN preferred_region_id uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE subscribers ADD COLUMN onboarding_completed boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'push_token') THEN
        ALTER TABLE subscribers ADD COLUMN push_token text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'taste_profile') THEN
        ALTER TABLE subscribers ADD COLUMN taste_profile jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'allergies') THEN
        ALTER TABLE subscribers ADD COLUMN allergies text[] DEFAULT '{}'::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'dislikes') THEN
        ALTER TABLE subscribers ADD COLUMN dislikes text[] DEFAULT '{}'::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'activity_level') THEN
        ALTER TABLE subscribers ADD COLUMN activity_level text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'referral_code') THEN
        ALTER TABLE subscribers ADD COLUMN referral_code text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'weight_kg') THEN
        ALTER TABLE subscribers ADD COLUMN weight_kg numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'height_cm') THEN
        ALTER TABLE subscribers ADD COLUMN height_cm numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'fitness_goal') THEN
        ALTER TABLE subscribers ADD COLUMN fitness_goal text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'points') THEN
        ALTER TABLE subscribers ADD COLUMN points integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'referral_count') THEN
        ALTER TABLE subscribers ADD COLUMN referral_count integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'is_owner') THEN
        ALTER TABLE subscribers ADD COLUMN is_owner boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'is_paused') THEN
        ALTER TABLE subscribers ADD COLUMN is_paused boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'paused_until') THEN
        ALTER TABLE subscribers ADD COLUMN paused_until date;
    END IF;
END $$;

-- 2. Ensure Bookings RLS policies allow SELECT and UPDATE for booking management
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO anon;

DROP POLICY IF EXISTS "public_select_bookings" ON public.bookings;
CREATE POLICY "public_select_bookings" ON public.bookings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_update_bookings" ON public.bookings;
CREATE POLICY "public_update_bookings" ON public.bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
