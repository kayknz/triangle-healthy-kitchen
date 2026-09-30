-- Monthly menu uploads have their own unique index scoped by monthly_menu_id.
-- Remove the old table-wide unique constraint, which otherwise rejects new
-- monthly rows even when they belong to a different uploaded menu document.
alter table public.menu_availability
  drop constraint if exists menu_availability_week_number_day_of_week_meal_period_colle_key;

-- Also cover the untruncated name in databases where the constraint was named
-- explicitly instead of receiving PostgreSQL's shortened generated name.
alter table public.menu_availability
  drop constraint if exists menu_availability_week_number_day_of_week_meal_period_collection_dish_id_key;

notify pgrst, 'reload schema';
