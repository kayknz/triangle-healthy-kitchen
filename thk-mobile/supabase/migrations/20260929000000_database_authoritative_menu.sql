-- REVISED DATABASE-AUTHORITATIVE MENU ARCHITECTURE
-- STAGE 0: Safety - Disable existing validation to allow data healing
DROP TRIGGER IF EXISTS tr_validate_customization ON public.weekly_menu_selections;

-- STAGE 1: Infrastructure & Core Identity
CREATE TABLE IF NOT EXISTS public.dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text UNIQUE NOT NULL,
  name_ar text,
  description text,
  origin text,
  history text,
  prep_traditional text,
  prep_triangle text,
  cooking_method text,
  kcals integer NOT NULL CHECK (kcals >= 0),
  macros jsonb DEFAULT '{"protein": 0, "carbs": 0, "fats": 0}'::jsonb,
  allergens text[] DEFAULT '{}'::text[],
  is_heritage boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  day_of_week text NOT NULL CHECK (day_of_week IN ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday')),
  meal_period text NOT NULL CHECK (meal_period IN ('breakfast','lunch','dinner','snacks')),
  collection text NOT NULL CHECK (collection IN ('summer','autumn','ramadan')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(week_number, day_of_week, meal_period, collection, dish_id)
);

-- Add tracking columns to selections
ALTER TABLE public.weekly_menu_selections ADD COLUMN IF NOT EXISTS dish_id uuid REFERENCES public.dishes(id);
ALTER TABLE public.weekly_menu_selections ADD COLUMN IF NOT EXISTS dish_name_snapshot text;

-- STAGE 2: Authoritative Cycle Math & Validation Helpers

-- 1. Qatar Service Week Calculator RPC
CREATE OR REPLACE FUNCTION public.get_current_qatar_week()
RETURNS integer AS $$
DECLARE
  v_anchor date;
  v_today date;
  v_diff integer;
BEGIN
  SELECT cycle_anchor_date INTO v_anchor FROM public.global_settings LIMIT 1;
  IF v_anchor IS NULL THEN RAISE EXCEPTION 'Menu Configuration Error: global_settings.cycle_anchor_date is missing.'; END IF;
  v_today := (now() AT TIME ZONE 'Asia/Qatar')::date;
  v_diff := v_today - v_anchor;
  IF v_today < v_anchor THEN RAISE EXCEPTION 'Menu Configuration Error: Current Qatar date precedes cycle anchor date (%)', v_anchor; END IF;
  RETURN (floor(v_diff / 7)::integer % 4) + 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Personalized Validation Helper
CREATE OR REPLACE FUNCTION public.check_meal_customization_validity(p_customs jsonb, p_dish_id uuid)
RETURNS boolean AS $$
DECLARE
  removed_slug text;
  sub_key text;
  sub_val text;
  v_dish_slug text;
BEGIN
  -- If no customization, it is valid by default
  IF p_customs IS NULL OR p_customs = '{}'::jsonb THEN RETURN true; END IF;

  SELECT slug INTO v_dish_slug FROM public.dishes WHERE id = p_dish_id;
  -- If we can't find the dish, we can't validate, so we return true to allow historical rows to exist
  IF v_dish_slug IS NULL THEN RETURN true; END IF;

  IF p_customs ? 'removed_ingredients' THEN
    FOR removed_slug IN SELECT jsonb_array_elements_text(p_customs->'removed_ingredients') LOOP
      IF EXISTS (SELECT 1 FROM public.meal_ingredient_config WHERE dish_slug = v_dish_slug AND ingredient_slug = removed_slug AND is_required = true) THEN RETURN false; END IF;
    END LOOP;
  END IF;

  IF p_customs ? 'substitutions' THEN
    FOR sub_key, sub_val IN SELECT * FROM jsonb_each_text(p_customs->'substitutions') LOOP
      IF NOT EXISTS (SELECT 1 FROM public.meal_ingredient_config WHERE dish_slug = v_dish_slug AND ingredient_slug = sub_key AND sub_val = ANY(approved_substitutions)) THEN RETURN false; END IF;
    END LOOP;
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- STAGE 3: Seed Data (Dishes & Availability)
DO $$
DECLARE
  tuna_id uuid; shak_id uuid; hall_id uuid; maj_id uuid; maq_id uuid; kab_id uuid;
  bam_id uuid; sal_id uuid; stk_id uuid; aca_id uuid; ball_id uuid;
  w integer; c text; day text;
  days text[] := ARRAY['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
  placeholder_meta jsonb := '{"is_placeholder": true, "source_week": 1}'::jsonb;
BEGIN
  -- 1. Insert Researched Dishes
  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros, allergens)
  VALUES ('tuna_avocado_melt', 'Grilled Tuna Avocado Melt', 'تونا مشوية مع أفوكادو', 210, '{"protein": 22, "carbs": 18, "fats": 6}', '{fish, gluten, dairy}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO tuna_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros, allergens)
  VALUES ('shakshuka', 'Spiced Shakshuka', 'شكشوكة بالتوابل', 195, '{"protein": 14, "carbs": 12, "fats": 9}', '{eggs, gluten}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO shak_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros, allergens)
  VALUES ('halloumi_wrap', 'Halloumi & Zaatar Wrap', 'لفائف الحلوم والزعتر', 230, '{"protein": 18, "carbs": 24, "fats": 8}', '{dairy, gluten, sesame}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO hall_id;

  INSERT INTO public.dishes (slug, name, name_ar, is_heritage, kcals, macros)
  VALUES ('chicken_majboos', 'Traditional Chicken Majboos', 'مجبوس دجاج قطري', true, 345, '{"protein": 35, "carbs": 42, "fats": 6}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO maj_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros)
  VALUES ('chicken_maqlouba', 'Levantine Maqlouba', 'مقلوبة دجاج', 380, '{"protein": 32, "carbs": 45, "fats": 8}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO maq_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros)
  VALUES ('chicken_kabsa', 'Aromatic Chicken Kabsa', 'كبسة دجاج عطرة', 360, '{"protein": 34, "carbs": 40, "fats": 7}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO kab_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros)
  VALUES ('beef_bamia', 'Premium Beef Bamia', 'بامية باللحم', 310, '{"protein": 28, "carbs": 15, "fats": 10}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO bam_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros, allergens)
  VALUES ('baked_salmon', 'Wild Salmon with Quinoa', 'سلمون مع كينوا', 320, '{"protein": 30, "carbs": 20, "fats": 12}', '{fish}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sal_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros)
  VALUES ('beef_steak', 'Lean Sirloin with Mash', 'ستيك مع بطاطا مهروسة', 390, '{"protein": 40, "carbs": 25, "fats": 14}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO stk_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros, allergens)
  VALUES ('acai_bowl', 'Amazonian Açai Bowl', 'وعاء آساي الأمازون', 180, '{"protein": 4, "carbs": 32, "fats": 5}', '{nuts}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO aca_id;

  INSERT INTO public.dishes (slug, name, name_ar, kcals, macros)
  VALUES ('energy_balls', 'Dark Chocolate Energy Units', 'كرات الطاقة بالشوكولاتة', 140, '{"protein": 3, "carbs": 22, "fats": 4}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO ball_id;

  -- 2. Seed Availability
  FOR w IN 1..4 LOOP
    FOR c IN SELECT unnest(ARRAY['autumn', 'summer', 'ramadan']) LOOP
      FOR day IN SELECT unnest(days) LOOP
        INSERT INTO public.menu_availability (dish_id, week_number, day_of_week, meal_period, collection, metadata)
        VALUES
          (tuna_id, w, day, 'breakfast', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (shak_id, w, day, 'breakfast', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (hall_id, w, day, 'breakfast', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (maj_id, w, day, 'lunch', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (maq_id, w, day, 'lunch', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (kab_id, w, day, 'lunch', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (bam_id, w, day, 'dinner', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (sal_id, w, day, 'dinner', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (stk_id, w, day, 'dinner', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (aca_id, w, day, 'snacks', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END),
          (ball_id, w, day, 'snacks', c, CASE WHEN w=1 THEN '{}' ELSE placeholder_meta END)
        ON CONFLICT (week_number, day_of_week, meal_period, collection, dish_id) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- STAGE 4: Migration Linkage (Identity Integrity)

-- 1. Normalize
UPDATE public.weekly_menu_selections SET meal_type = 'snacks' WHERE meal_type = 'snack';
UPDATE public.weekly_menu_selections SET dish_name_snapshot = dish_name WHERE dish_name_snapshot IS NULL;
UPDATE public.weekly_menu_selections SET customizations = '{}'::jsonb WHERE customizations IS NULL;

-- 2. Link by Name (Trigger is currently DISABLED, so this will pass)
UPDATE public.weekly_menu_selections s
SET dish_id = d.id
FROM public.dishes d
WHERE s.dish_name = d.name
AND s.dish_id IS NULL;

-- STAGE 5: Security & Enforcement (CUTOVER)

-- Re-create Trigger with explicit cast
CREATE OR REPLACE FUNCTION public.validate_meal_customization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dish_id IS NOT NULL AND NOT public.check_meal_customization_validity(NEW.customizations, NEW.dish_id::uuid) THEN
    RAISE EXCEPTION 'Personalization logic violation: Unauthorized ingredient removal or substitution.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validate_customization ON public.weekly_menu_selections;
CREATE TRIGGER tr_validate_customization
BEFORE INSERT OR UPDATE ON public.weekly_menu_selections
FOR EACH ROW EXECUTE FUNCTION validate_meal_customization();

-- Final Security Policies
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_dishes" ON public.dishes;
CREATE POLICY "public_read_dishes" ON public.dishes FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "public_read_availability" ON public.menu_availability;
CREATE POLICY "public_read_availability" ON public.menu_availability FOR SELECT TO authenticated, anon USING (true);
