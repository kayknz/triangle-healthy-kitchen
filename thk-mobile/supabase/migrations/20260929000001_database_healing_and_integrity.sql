-- Database Healing and Integrity Pass
-- Ensures all recently introduced architectural columns exist before cutover

DO $$
BEGIN
    -- 1. Rhythm & Rewards Architecture (Fixed missing current_streak)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'current_streak') THEN
        ALTER TABLE subscribers ADD COLUMN current_streak integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'points_balance') THEN
        ALTER TABLE subscribers ADD COLUMN points_balance integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'longest_streak') THEN
        ALTER TABLE subscribers ADD COLUMN longest_streak integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'streak_history') THEN
        ALTER TABLE subscribers ADD COLUMN streak_history integer[] DEFAULT '{0,0,0,0,0,0,0}';
    END IF;

    -- 2. Identity & Profile Alignment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'gender') THEN
        ALTER TABLE subscribers ADD COLUMN gender text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'membership_type') THEN
        ALTER TABLE subscribers ADD COLUMN membership_type text NOT NULL DEFAULT 'subscriber' CHECK (membership_type IN ('subscriber', 'community'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'reward_tier') THEN
        ALTER TABLE subscribers ADD COLUMN reward_tier text NOT NULL DEFAULT 'community';
    END IF;

    -- 3. Cleanup of legacy zone logic if needed
    -- (We removed it from code, but ensure we don't crash if it's missing in DB)
END $$;
