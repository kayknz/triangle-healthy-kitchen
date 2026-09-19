/*
# Rewards, Streaks & Regional Community Schema (IDEMPOTENT VERSION)

## Purpose
Extends Triangle Healthy Kitchen with a loyalty system, activity tracking, and community features.

## Tables
1. regional_communities: Broad Doha areas (Lusail, Al Sadd, etc.)
2. challenge_templates: Definitions for weekly activity goals
3. user_daily_goals: Tracks a user's progress against a template
4. daily_activity_summaries: Normalized activity data from health platforms
5. points_ledger: Immutable record of all point transactions
6. rewards: Catalog of available redemptions
7. reward_redemptions: History of user redemptions
8. community_posts: Encouragement feed for regions
9. community_reactions: Social interactions on posts
*/

-- 1. Extend Subscribers/Profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'membership_type') THEN
        ALTER TABLE subscribers ADD COLUMN membership_type text NOT NULL DEFAULT 'subscriber' CHECK (membership_type IN ('subscriber', 'community'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'reward_tier') THEN
        ALTER TABLE subscribers ADD COLUMN reward_tier text NOT NULL DEFAULT 'community' CHECK (reward_tier IN ('community', 'reset', 'balance', 'perform'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'points_balance') THEN
        ALTER TABLE subscribers ADD COLUMN points_balance integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'current_streak') THEN
        ALTER TABLE subscribers ADD COLUMN current_streak integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'longest_streak') THEN
        ALTER TABLE subscribers ADD COLUMN longest_streak integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'preferred_region_id') THEN
        ALTER TABLE subscribers ADD COLUMN preferred_region_id uuid;
    END IF;
END $$;

-- 2. Regional Communities
CREATE TABLE IF NOT EXISTS regional_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  weekly_team_target_pct integer DEFAULT 60,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE regional_communities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select communities" ON regional_communities;
CREATE POLICY "Anyone can select communities" ON regional_communities FOR SELECT TO authenticated USING (true);

-- Link subscribers to their region
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_subscriber_region') THEN
        ALTER TABLE subscribers ADD CONSTRAINT fk_subscriber_region FOREIGN KEY (preferred_region_id) REFERENCES regional_communities(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Activity & Challenges
CREATE TABLE IF NOT EXISTS challenge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL CHECK (activity_type IN ('steps', 'distance_walk', 'distance_run', 'active_minutes', 'workout')),
  daily_target numeric NOT NULL,
  weekly_threshold_days integer DEFAULT 5,
  difficulty text DEFAULT 'moderate',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE challenge_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select active templates" ON challenge_templates;
CREATE POLICY "Anyone can select active templates" ON challenge_templates FOR SELECT TO authenticated USING (is_active = true);

CREATE TABLE IF NOT EXISTS user_daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES challenge_templates(id),
  target_date date NOT NULL,
  current_value numeric DEFAULT 0,
  target_value numeric NOT NULL,
  is_completed boolean DEFAULT false,
  points_awarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, target_date)
);

ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own goals" ON user_daily_goals;
CREATE POLICY "Users can see own goals" ON user_daily_goals FOR SELECT TO authenticated USING (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

-- 4. Normalized Activity Summaries
CREATE TABLE IF NOT EXISTS daily_activity_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  time_zone text DEFAULT 'Asia/Qatar',
  activity_type text NOT NULL,
  total_value numeric NOT NULL,
  unit text NOT NULL,
  source_platform text,
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'flagged')),
  sync_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, local_date, activity_type)
);

ALTER TABLE daily_activity_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own activity" ON daily_activity_summaries;
CREATE POLICY "Users can see own activity" ON daily_activity_summaries FOR SELECT TO authenticated USING (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

-- 5. Points Ledger
CREATE TABLE IF NOT EXISTS points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_delta integer NOT NULL,
  source_goal_id uuid REFERENCES user_daily_goals(id),
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own ledger" ON points_ledger;
CREATE POLICY "Users can see own ledger" ON points_ledger FOR SELECT TO authenticated USING (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

-- 6. Rewards Catalog
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL CHECK (tier IN ('community', 'reset', 'balance', 'perform')),
  name text NOT NULL,
  description text,
  point_cost integer NOT NULL,
  stock_count integer DEFAULT -1,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select active rewards" ON rewards;
CREATE POLICY "Anyone can select active rewards" ON rewards FOR SELECT TO authenticated USING (is_active = true);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  redeemed_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own redemptions" ON reward_redemptions;
CREATE POLICY "Users can see own redemptions" ON reward_redemptions FOR SELECT TO authenticated USING (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

-- 7. Community Feed
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES regional_communities(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text DEFAULT 'status' CHECK (post_type IN ('status', 'achievement', 'announcement')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see posts in their region" ON community_posts;
CREATE POLICY "Users can see posts in their region" ON community_posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can create own posts" ON community_posts;
CREATE POLICY "Users can create own posts" ON community_posts FOR INSERT TO authenticated WITH CHECK (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  reaction_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, subscriber_id, reaction_type)
);

ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can see reactions" ON community_reactions;
CREATE POLICY "Anyone can see reactions" ON community_reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can react to posts" ON community_reactions;
CREATE POLICY "Users can react to posts" ON community_reactions FOR INSERT TO authenticated WITH CHECK (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

-- Default Communities
INSERT INTO regional_communities (name, slug) VALUES
('Lusail', 'lusail'),
('Al Sadd', 'al-sadd'),
('Al Wakrah', 'al-wakrah'),
('West Bay', 'west-bay'),
('The Pearl', 'the-pearl'),
('Al Rayyan', 'al-rayyan')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Default Challenge Templates
INSERT INTO challenge_templates (activity_type, daily_target, difficulty) VALUES
('steps', 8000, 'moderate'),
('steps', 12000, 'premium'),
('distance_walk', 5, 'moderate'),
('active_minutes', 30, 'moderate')
ON CONFLICT DO NOTHING;
