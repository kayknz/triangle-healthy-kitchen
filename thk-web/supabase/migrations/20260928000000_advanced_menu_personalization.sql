-- Advanced Menu Personalization and Detailed Meal Architecture

-- 1. Enhance Weekly Menu Selections
ALTER TABLE weekly_menu_selections ADD COLUMN IF NOT EXISTS customizations jsonb DEFAULT '{}'::jsonb;
ALTER TABLE weekly_menu_selections ADD COLUMN IF NOT EXISTS dish_id text;

-- 2. Add Dinner support to constraints if not already there
ALTER TABLE weekly_menu_selections DROP CONSTRAINT IF EXISTS weekly_menu_selections_meal_type_check;
ALTER TABLE weekly_menu_selections ADD CONSTRAINT weekly_menu_selections_meal_type_check
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'snacks'));

-- 3. Ingredients Master Registry
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  name_ar text,
  allergen_tag text, -- e.g. 'dairy', 'nuts', 'gluten'
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. Meal Metadata & Ingredient Relationships
-- Note: We link by 'dish_slug' to maintain flexibility with the code-based WEEKLY_MENU
CREATE TABLE IF NOT EXISTS meal_ingredient_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_slug text NOT NULL,
  ingredient_slug text NOT NULL REFERENCES ingredients(slug) ON DELETE CASCADE,
  is_required boolean DEFAULT true,
  is_removable boolean DEFAULT false,
  approved_substitutions text[], -- Array of ingredient slugs
  created_at timestamptz DEFAULT now(),
  UNIQUE(dish_slug, ingredient_slug)
);

-- 5. Security (RLS)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_ingredient_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ingredients" ON ingredients;
CREATE POLICY "public_read_ingredients" ON ingredients FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "public_read_meal_config" ON meal_ingredient_config;
CREATE POLICY "public_read_meal_config" ON meal_ingredient_config FOR SELECT TO authenticated, anon USING (true);

-- 6. Helper Function to get personalized meal summary (Optional but useful for Kitchen)
CREATE OR REPLACE FUNCTION get_personalized_summary(customs jsonb)
RETURNS text AS $$
DECLARE
  summary text := '';
  removed text[];
  subs jsonb;
  k text;
  v text;
BEGIN
  -- Handle removed ingredients
  IF (customs->>'removed_ingredients') IS NOT NULL THEN
    removed := ARRAY(SELECT jsonb_array_elements_text(customs->'removed_ingredients'));
    IF array_length(removed, 1) > 0 THEN
      summary := 'NO: ' || array_to_string(removed, ', ');
    END IF;
  END IF;

  -- Handle substitutions
  IF (customs->>'substitutions') IS NOT NULL THEN
    subs := customs->'substitutions';
    FOR k, v IN SELECT * FROM jsonb_each_text(subs) LOOP
      IF summary <> '' THEN summary := summary || ' | '; END IF;
      summary := summary || k || ' -> ' || v;
    END LOOP;
  END IF;

  RETURN summary;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
