/*
  # Packages table

  Stores public meal-plan package cards in Supabase so pricing and copy can be
  managed without rebuilding the app. Public clients can read active packages.
*/

CREATE TABLE IF NOT EXISTS packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  kcals integer NOT NULL CHECK (kcals > 0),
  price integer NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'QR',
  meals text NOT NULL,
  duration text NOT NULL,
  description text NOT NULL,
  highlight text NOT NULL,
  image text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_active_packages" ON packages;
CREATE POLICY "public_select_active_packages"
  ON packages FOR SELECT
  TO anon, authenticated
  USING (active = true);

INSERT INTO packages (
  id, name, kcals, price, currency, meals, duration, description, highlight, image, active, sort_order
) VALUES
  (
    '1100kcal',
    'Essential',
    1100,
    1700,
    'QR',
    '2 Meals + 1 Snack',
    '4 Weeks (28 boxes)',
    'A focused, calorie-controlled plan designed for steady, healthy weight loss.',
    'Best for weight loss',
    'https://images.pexels.com/photos/7660437/pexels-photo-7660437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    true,
    1
  ),
  (
    '1400kcal',
    'Balance',
    1400,
    2000,
    'QR',
    '3 Main Meals',
    '4 Weeks (28 boxes)',
    'The perfect all-day meal plan for balanced nutrition and sustained energy.',
    'Most popular',
    'https://images.pexels.com/photos/19130868/pexels-photo-19130868.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    true,
    2
  ),
  (
    '1500kcal',
    'Performance',
    1500,
    2200,
    'QR',
    '3 Meals + 1 Snack',
    '4 Weeks (28 personalised boxes)',
    'A fully personalised plan for active lifestyles and performance goals.',
    'For active lifestyles',
    'https://images.pexels.com/photos/4929676/pexels-photo-4929676.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    true,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  kcals = EXCLUDED.kcals,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  meals = EXCLUDED.meals,
  duration = EXCLUDED.duration,
  description = EXCLUDED.description,
  highlight = EXCLUDED.highlight,
  image = EXCLUDED.image,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
