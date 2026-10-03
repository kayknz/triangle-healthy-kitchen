# Kitchen Production Guide

## The kitchen’s work is built around totals first, customer-specific packing second

Kitchen needs to know what to purchase and prepare for each service day without opening individual customers’ records one by one. The operational views separate bulk totals from the details needed to portion and prepare safely.

## Monthly menu release

1. Keep the dish catalogue accurate: names, Arabic names where used, active status, calories, ingredients, and recipe quantity/unit per serving.
2. Open **Meal Plans** and start a monthly menu from the catalogue (or import the current PDF if that workflow is available in the deployed build).
3. Review extracted/imported dishes against the source menu. Correct names, meal periods, day, and availability; add or remove dishes as needed.
4. Mark the Kitchen’s choice among the available options for each day/meal slot. Customers who miss the weekly deadline use this choice.
5. Review the monthly schedule and publish. The release is expected to be available to customers on Saturday for the service week ahead.
6. Sign in with a customer test account and confirm the published week is visible before relying on it. If no replacement release exists, the backend contains a function to roll a previous release forward, but that job and active collection must be verified on production.

The user interface describes a monthly menu repeating across four service weeks. Confirm the number and dates in the deployed schedule when publishing; monthly date boundaries and Saturday service-week boundaries are not identical.

## Customer choice and cutoff

- Customers make meal selections for their package before payment and can manage the next service week in their dashboard.
- Menu options are attached to a service day and meal period. A package limits which meal periods are available; Friday is added only for the eligible monthly Friday add-on.
- Existing Kitchen’s-choice defaults are preselected. Customers should not have to reselect unchanged defaults.
- The selection window closes Thursday at 11:59 PM Qatar time. A database job is intended to apply defaults just after the Qatar cutoff. Verify the job in Supabase rather than relying only on the UI message.

## Daily production board

Select the service week and the day being cooked. The **Today’s production** section should show the selected day’s required dishes grouped by dish/meal and portions. Demo records are visually marked **DEMO · UNPAID**; distinguish them from real paid customers in any production handoff.

The safety/preparation section summarizes the details Kitchen must not miss:

- allergies;
- ingredients to avoid or dislikes;
- meal-specific modification or preparation notes;
- selected dish and meal period;
- A–F portion category and count, when configured.

Use these notes to safely plan and portion orders. Allergy flags are not a guarantee that cross-contamination is prevented; the kitchen needs its own food-safety process.

## Weekly bulk purchasing

The ingredient-order view aggregates configured recipe quantities over selected active meal records. Conceptually:

`purchase quantity = sum(recipe quantity per serving for each selected serving, after removals/substitutions)`

The output is an ingredient total and the number of meals that use it, not a customer-by-customer purchase list. It can change when menu selections or recipe quantities change.

**Important:** recipe quantities seeded in the system are estimates. Kitchen must verify each recipe quantity, unit, edible yield/waste assumptions, and portion scaling before treating the computed amount as an authoritative purchase order. A zero/empty total may mean a dish has no recipe configuration, no current selections, inactive/non-matching dishes, or data has not loaded; it does not necessarily mean the kitchen needs zero ingredients.

Ingredient totals in source are based on configured per-serving ingredient quantities and customization logic. Confirm that portion classes A–F correctly affect actual ingredient ordering in the deployed recipe model before relying on different gram sizes for procurement.

## Packing and portioning

After bulk items arrive:

1. Open **Packing** for the same service week/day.
2. Use the customer/dish detail to assemble the requested meals.
3. Follow the recorded preparation notes, allergies, avoided ingredients, substitutions, and A–F category.
4. Use the saved A–F min/max gram ranges as guides only after the kitchen confirms them in Settings. Empty ranges are intentionally shown as unset.
5. Reconcile packed meal counts against the production totals before closing the sheet.

## Portions and recipes to configure before go-live

- Enter client-approved gram ranges for A, B, C, D, E, and F.
- Review every active dish ingredient list and per-serving quantity; replace seeded estimates with kitchen-approved values.
- Verify units are consistent (g, kg, ml, pieces, etc.) and substitution/removal recipes produce the expected totals.
- Run a controlled sample with two or more customers choosing the same dish at different portion levels and with different notes. Confirm the bulk purchasing total, daily production grouping, safety notes, and individual packing breakdown all make operational sense.
- Sign off the printed/exported production and packing views with the kitchen lead.
