-- Purchasing totals follow approved customer removals and substitutions.
-- Keep customer-specific notes in the production view; this remains aggregated.
create or replace view public.kitchen_ingredient_order_view
with (security_invoker = false, security_barrier = true)
as
  select m.week_start_date,
         target.id as ingredient_id,
         target.name as ingredient_name,
         target.name_ar as ingredient_name_ar,
         mic.unit,
         sum(mic.quantity_per_serving)::numeric(12,3) as quantity_to_order,
         count(*)::integer as meal_servings
  from public.weekly_menu_selections m
  join public.subscribers s on s.id = m.subscriber_id and s.status = 'active'
  join public.dishes d on d.id::text = m.dish_id or d.slug = m.dish_id or lower(d.name) = lower(m.dish_name)
  join public.meal_ingredient_config mic on mic.dish_slug = d.slug
  join public.ingredients target on target.slug = coalesce(m.customizations->'substitutions'->>mic.ingredient_slug, mic.ingredient_slug)
  where m.dish_name <> 'SKIP DAY'
    and mic.quantity_per_serving > 0
    and not (coalesce(m.customizations->'removed_ingredients', '[]'::jsonb) ? mic.ingredient_slug)
    and not (coalesce(m.customizations->'substitutions', '{}'::jsonb) ? mic.ingredient_slug
             and m.customizations->'substitutions'->>mic.ingredient_slug is distinct from mic.ingredient_slug)
    and private.has_staff_role(array['ceo','admin','kitchen'])
  group by m.week_start_date, target.id, target.name, target.name_ar, mic.unit;

revoke all on public.kitchen_ingredient_order_view from public, anon;
grant select on public.kitchen_ingredient_order_view to authenticated;

notify pgrst,'reload schema';
