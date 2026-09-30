# Triangle Healthy Kitchen

Triangle Healthy Kitchen is a Qatar meal subscription service with a customer website, an operations website, and a companion mobile app. Supabase provides authentication and data storage, Tap handles payments, and Brevo is used for email delivery.

## Project areas

- [`thk-web/`](thk-web/) — current React, TypeScript, and Vite website. Customer onboarding and subscriptions share the site with role-specific operations dashboards.
- [`thk-mobile/`](thk-mobile/) — Capacitor mobile application. Riders use the app for delivery work; company operations are handled on the web.
- [`thk-web/supabase/migrations/`](thk-web/supabase/migrations/) — versioned database schema, access policies, views, and database functions for the web workflows.
- Root level `app.js`, `index.html`, and `styles.css` — the earlier static prototype. Use `thk-web/` for the current web product.

## Operations access

The operations web app shows work according to the signed-in staff role:

- **CEO and Admin:** company oversight, customer and subscription management, menu publishing, payments, reports, team, and settings.
- **Kitchen:** menu review, bulk purchasing totals, production counts, allergy and meal-preparation notes, and customer-specific packing.
- **Transport:** customer delivery zones, addresses, rider assignments, and route status.
- **Riders:** delivery execution in the mobile app.

Role visibility in the interface is backed by Supabase role checks, policies, and restricted views. Do not use client-side visibility as the only access control for new data.

## Menu and kitchen workflow

1. **Admin publishes the monthly PDF.** In Meal Plans, upload the PDF, review and edit the extracted menu entries, then schedule the menu. The PDF is retained as the source document and the reviewed dishes populate the menu catalogue and schedule.
2. **The weekly menu opens Saturday.** The client sees the menu for the current selection cycle, based on the active collection. The scheduled release date is set to the next Saturday when the PDF is published.
3. **Clients choose meals before Thursday closes.** The selection window closes at 11:59 PM Qatar time on Thursday. Clients choose from the options available for their package before payment when subscribing, and make the next week's choices in their dashboard afterward.
4. **Kitchen-choice defaults fill missing selections.** After the Thursday deadline, the scheduled database job fills unselected meal slots with the menu's marked kitchen choice. Kitchen can use Friday for preparation.
5. **Purchasing stays aggregated.** Kitchen's ingredient order totals sum recipe quantities across all active subscribers' meal selections for that service week. The purchase view is not a customer-by-customer order list.
6. **Safety and prep details remain customer-specific.** Kitchen's separate safety table shows the customer, day, meal, selected dish, allergies, avoid list, and meal customizations. Packing provides the customer-by-customer meal breakdown used to portion bulk ingredients. Delivery notes belong to Transport.
7. **Clients receive a menu reminder.** The reminder job checks every 30 minutes and sends a Brevo email during the Wednesday 11 PM Qatar hour—about 24 hours before Thursday's 11:59 PM cutoff—to active clients who still have meal slots to choose.

Recipes and ingredients are maintained in Meal Plans. Ingredient totals depend on recipe quantities being configured for the dishes; an empty purchasing table means those recipes or weekly selections need attention.

## Run the web app

Requirements: Node.js 24 (see `thk-web/package.json`).

```sh
cd thk-web
npm install
cp .env.example .env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.
npm run dev
```

Create a production build with:

```sh
npm run build
```

The Vite preview can be started with `npm run preview`. Vercel configuration is in [`thk-web/vercel.json`](thk-web/vercel.json).

## Database changes

Review migrations in timestamp order before applying them. The linked Supabase project contains older remote migration-history entries that are not all present in this checkout; `supabase db push` may stop with a missing-local-migrations error. Reconcile that history before using bulk migration push. For a narrowly scoped repair, review and apply the specific SQL migration through the project’s approved workflow, then record its version as applied.

The menu publishing fix is tracked in [`20261010000000_drop_legacy_menu_availability_unique.sql`](thk-web/supabase/migrations/20261010000000_drop_legacy_menu_availability_unique.sql). It removes the older generated unique constraint that blocked menu rows attached to new monthly PDFs. Do not reintroduce the table-wide constraint; monthly PDFs use the partial unique index scoped to `monthly_menu_id`.

Never commit production credentials, database passwords, or service-role keys. Use the example environment files as templates and keep real values in local or deployment secrets.
