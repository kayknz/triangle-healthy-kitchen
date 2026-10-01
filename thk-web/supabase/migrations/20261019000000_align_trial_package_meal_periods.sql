-- Trial plans follow the same three-period meal rule as their matching
-- package definitions in the web and mobile clients: lunch, dinner, snack.
-- The shared default of all four periods made trial checkout reject the
-- published Saturday menu when it had no breakfast choice.
update public.packages
set meal_periods = '["lunch", "dinner", "snacks"]'::jsonb
where id in ('daily_trial', 'weekly_reset')
  and meal_periods is distinct from '["lunch", "dinner", "snacks"]'::jsonb;
