/*
# Subscription, Menu Selection, Delivery & Progress Tracking Schema

## Purpose
Adds tables to support:
1. Subscriptions — customers who subscribe to a meal plan package
2. Delivery addresses — geolocation + building/street/maid's number for delivery
3. Weekly menu selections — subscribers choose dishes per meal per day
4. Delivery time windows — preferred delivery times for breakfast/lunch/dinner
5. Progress entries — weight and measurement tracking over time

## New Tables

### subscribers
- Stores subscription metadata linked to auth.users
- package_id, package_name, status (active/paused/cancelled)
- stripe_customer_id, stripe_subscription_id for payment integration
- subscription_start, current_period_end dates
- delivery_address fields (building_number, street, area, maid_number, latitude, longitude)

### weekly_menu_selections
- One row per subscriber per week per day per meal
- Links to subscriber, contains selected dish name and meal type
- week_start_date (Monday of that week)
- day_of_week, meal_type (breakfast/lunch/dinner/snack)
- dish_name, dish_kcals

### delivery_time_windows
- Subscriber's preferred delivery windows per meal type
- breakfast_window (e.g. "7-9 AM"), lunch_window, dinner_window
- delivery_notes (optional instructions)

### progress_entries
- Weight and body measurement tracking
- weight_kg, waist_cm, hip_cm (optional)
- notes field
- logged_at timestamp

## Security
- All tables enable RLS
- Owner-scoped policies using auth.uid() — subscribers can only access their own data
- TO authenticated (requires sign-in)
- owner columns default to auth.uid()

## Notes
1. Subscribers table has user_id DEFAULT auth.uid() so inserts from authenticated sessions auto-populate
2. All child tables (weekly_menu_selections, delivery_time_windows, progress_entries) reference subscribers
3. Policies scope child table access through the parent subscriber ownership check
*/

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id text NOT NULL,
  package_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'trialing')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  -- Delivery address
  building_number text,
  street text,
  area text,
  maid_number text,
  latitude double precision,
  longitude double precision,
  delivery_notes text,
  -- Breakfast/lunch/dinner delivery windows
  breakfast_window text DEFAULT '7-9 AM',
  lunch_window text DEFAULT '12-2 PM',
  dinner_window text DEFAULT '5-7 PM',
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscription" ON subscribers;
CREATE POLICY "select_own_subscription" ON subscribers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscription" ON subscribers;
CREATE POLICY "insert_own_subscription" ON subscribers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscription" ON subscribers;
CREATE POLICY "update_own_subscription" ON subscribers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscription" ON subscribers;
CREATE POLICY "delete_own_subscription" ON subscribers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Weekly menu selections
CREATE TABLE IF NOT EXISTS weekly_menu_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday')),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  dish_name text NOT NULL,
  dish_kcals integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, week_start_date, day_of_week, meal_type)
);

ALTER TABLE weekly_menu_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "select_own_menu_selections" ON weekly_menu_selections FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "insert_own_menu_selections" ON weekly_menu_selections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "update_own_menu_selections" ON weekly_menu_selections FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "delete_own_menu_selections" ON weekly_menu_selections FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

-- Progress entries
CREATE TABLE IF NOT EXISTS progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  weight_kg numeric(5,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON progress_entries;
CREATE POLICY "select_own_progress" ON progress_entries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_progress" ON progress_entries;
CREATE POLICY "insert_own_progress" ON progress_entries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_progress" ON progress_entries;
CREATE POLICY "update_own_progress" ON progress_entries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_progress" ON progress_entries;
CREATE POLICY "delete_own_progress" ON progress_entries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weekly_menu_subscriber_week ON weekly_menu_selections(subscriber_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_progress_subscriber ON progress_entries(subscriber_id, logged_at);