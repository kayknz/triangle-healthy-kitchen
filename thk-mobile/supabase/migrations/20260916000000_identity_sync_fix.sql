/*
# Identity & Logistics Hardening
1. Add missing clinical columns to subscribers for professional onboarding
2. Add phone signal to rider_applications for fleet coordination
3. Add menu_period to weekly_menu_selections for cycle tracking
*/

-- 1. Hardening Subscribers Identity
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'full_name') THEN
        ALTER TABLE subscribers ADD COLUMN full_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'email') THEN
        ALTER TABLE subscribers ADD COLUMN email text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'phone') THEN
        ALTER TABLE subscribers ADD COLUMN phone text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'duration') THEN
        ALTER TABLE subscribers ADD COLUMN duration text DEFAULT '4_weeks';
    END IF;
END $$;

-- 2. Hardening Rider Logistics
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rider_applications' AND column_name = 'phone') THEN
        ALTER TABLE rider_applications ADD COLUMN phone text;
    END IF;
END $$;

-- 3. Hardening Menu Selections
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_menu_selections' AND column_name = 'menu_period') THEN
        ALTER TABLE weekly_menu_selections ADD COLUMN menu_period text;
    END IF;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
