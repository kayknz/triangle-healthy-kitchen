# Technical Handover

## System overview

| Component | Repository location | Technology / responsibility |
|---|---|---|
| Customer and operations website | `thk-web/` | React, TypeScript, Vite, Supabase JS, Vercel. Public site, customer account, subscription, menu, and role-filtered operations portal. |
| Mobile application | `thk-mobile/` | React, TypeScript, Vite, Capacitor 7. Customer and rider app; operations staff are sent to the web portal. |
| Database and access rules | `thk-web/supabase/migrations/` and duplicated migration tree under `thk-mobile/` | PostgreSQL schema, RLS, views, triggers, RPCs, scheduled jobs. Review migration history before applying changes. |
| Server-side functions | `thk-web/supabase/functions/` and `thk-mobile/supabase/functions/` | Supabase Edge Functions for payment, webhook, reminders, booking email, health activity reconciliation, and account deletion. The copies are not complete mirrors. |
| Older prototype | Repository root `app.js`, `index.html`, `styles.css`, JSON translations | Earlier static prototype. It is not the current production app; make current product changes under `thk-web/` and `thk-mobile/`. |

Production web URL: `https://trianglehealthykitchen.vercel.app/`  
Supabase project reference used in source: `teguqlkfmchxucedxvpu`  
Mobile app ID: `com.trianglehealthykitchen.app`

## Main data areas

Names below are the principal data concepts visible in the reviewed source/migrations; this is an operational map, not a complete column-level schema export.

| Data area | Purpose and primary users |
|---|---|
| `auth.users`, `subscribers`, `staff_members` | Identity, customer subscription profile, account state, and staff roles. Auth user creation alone does not mean a paid customer plan is active. |
| `packages` | Current package price, currency, duration, meals, availability, and display properties. Active database rows take precedence over code fallback samples. |
| `dishes`, `ingredients`, `meal_ingredient_config` | Shared menu catalogue, ingredient catalogue, and recipe quantities/units used in purchase totals. |
| `monthly_menu_documents`, `menu_availability`, `weekly_menu_selections` | Uploaded/reviewed menu source, scheduled dish availability, and each service-week meal choice. |
| `kitchen_production_view`, `kitchen_ingredient_order_view` | Aggregated production/safety and bulk ingredient views for Kitchen; restricted to authorized operations roles. |
| `payment_transactions`, `payment_logs` | Payment request/callback/reconciliation status and audit events. Do not edit production rows manually to bypass guarded RPC workflows. |
| `rider_applications`, `rider_deliveries` | Rider identity/approval and assigned delivery stops/status. The web source reads approved riders for fleet views; pending approval workflow needs confirmation. |
| `notifications`, `weekly_menu_reminders` | Email outcomes and per-customer/service-week reminder tracking. |
| `subscription_pause_requests`, consultation/provider booking records | Customer requests and consultation review queues for CEO/Admin. |
| Health/activity records and BMI report storage | Customer-provided wellness data and optional uploaded health report; treat as sensitive personal data. |

## Access model

- Staff role values in the app are CEO, Admin, Kitchen, and Transport. Rider is a separate application/approval role. Subscriber is the customer role.
- The web app filters tabs by role and obtains staff role through the `current_staff_role` database RPC.
- Supabase RLS, staff checks, guarded RPC functions, and restricted views are intended to enforce access at the data layer too. Never treat a hidden tab as authorization.
- `transport_subscribers_view` is a narrow transport-specific view; `kitchen_subscribers_view` intentionally exposes only kitchen-relevant active/demo status metadata. Kitchen production and safety views supply meal, portion, allergy, avoid, and prep information without making the full customer directory a kitchen tool.
- Manual payment RPCs are CEO/Admin-only. Review policies/RPC definitions whenever staff roles change.
- Exports may include personal data. Limit export rights and retention to named staff with an operational need.

## Data flow

1. Customer signs in and provides subscription, profile, menu, delivery, and payment details.
2. Package, menu, identity, and payment records are validated by the app and server/database constraints.
3. Tap callback/webhook or authorized cash-review RPC updates transaction and plan state.
4. Weekly customer meal choices feed Kitchen’s day-specific production totals, ingredient order totals, allergy/preparation notes, and packing details.
5. Delivery address/zone feeds Transport’s route list; one rider assignment is created per customer stop/day, not once per meal.
6. Reminder/booking functions write email delivery outcomes for Operations to review.

## Configuration names — values are not included here

### Web/mobile client build environment

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (public client key; never use the service-role key here)
- `VITE_OPERATIONS_WEB_URL` (optional mobile override; default is the production Vercel domain)

The web has a source fallback for the public Supabase URL/key. Keep deployment values aligned with the intended project. Do not paste any actual keys into handover documents.

### Supabase server-side functions and vault

The reviewed functions refer to configuration such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_APP_URL`, Tap configuration (`TAP_SECRET_KEY`, merchant config through protected database helpers), and Brevo configuration (`BREVO_API_KEY`, `SENDER_EMAIL`, provider notification destination). Exact storage path differs between functions: some use Edge Function secrets and some call protected database/Vault helper RPCs. Inspect each deployed function before rotating credentials. `SUPABASE_SERVICE_ROLE_KEY` and Tap/Brevo secrets must remain server-side.

### Native mobile configuration

- Android Firebase uses `thk-mobile/android/app/google-services.json`. The local file is excluded from this documentation bundle and should be supplied from the client-owned Firebase project through a secure channel. Its presence enables Android push setup in the Vite build configuration; absence intentionally skips push registration.
- iOS health sync needs the HealthKit capability, usage description, correct Apple App ID, provisioning profile, and signed build. Store account access is controlled by the client.
- Android health sync uses Health Connect; users with Samsung Health must enable its Health Connect sharing.
- Device location/notifications/health permission prompts must be tested after producing signed builds.

## Integration inventory and state

| Integration | Source evidence | Configuration/acceptance still required |
|---|---|---|
| Supabase Auth/Database/Storage | Used by both apps and Edge Functions. | Verify deployed schema/policies, storage access for BMI reports, project ownership, backup plan, and auth email/phone settings. |
| Vercel | Vite production build and SPA rewrite configuration exist. | Confirm domain, project ownership, environment variables, analytics setting, and production deployment commit. Browser extensions can block Analytics without affecting app behavior. |
| Tap | Checkout function, callback page, webhook implementation, and manual review exist in duplicated function trees. | Reconcile canonical source, deploy webhook, validate Tap dashboard settings/secret, and complete authorized captured-payment test plus callback/manual-reconciliation cases. |
| Sadad | No current checkout code located. | Not available until implementation, credentials, callback, security review, and end-to-end verification are separately completed. |
| Brevo | Booking notification and menu-reminder function code exists in mobile function tree and migration scheduling refers to `send-reminders`. | Confirm canonical deployed code, sender/domain, vault settings, delivery logs, recipient behavior, and scheduled invocation. |
| Firebase Cloud Messaging | Android push registration is conditional on local Firebase config. | Configure client-owned Firebase app, Android package, file, permissions, and real-device push test. |
| Apple Health / Health Connect | Capacitor health plugin integration in mobile source. | Complete platform capability/signing and real-device permission/read/sync tests. |
| Maps/geolocation | Geolocation, address fields, zone helper, and map-link generation exist in client/ops source. | Test Qatar address lookup, manual entry, map coordinates, and zone assignment on real devices; a GPS pin is not guaranteed to fill every address label correctly. |

## Critical repository cautions

1. **Edge Function source is split.** `thk-web/supabase/functions/` contains `tap-checkout`; `thk-mobile/supabase/functions/` contains additional functions including `tap-webhook`, `send-reminders`, `send-booking-notification`, `reconcile-activity`, and `process-account-deletion`. Do not deploy one folder blindly. Confirm which code is deployed to the production Supabase project, diff the duplicates, choose a canonical source, and bring the other tree into agreement.
2. **Migration history may be incomplete.** The repository README records missing-local migration history in the linked Supabase project. Do not run a bulk `supabase db push` until the remote/local history is reconciled. Review each migration and apply through the client-approved release procedure.
3. **Database migrations are duplicated.** Compare web and mobile migration trees before database changes; apply each intended migration once to the correct Supabase project.
4. **Current repository contains local build artifacts and configuration outside this documentation set.** Do not distribute `node_modules`, `dist`, `www`, `.temp`, `.env*`, `google-services.json`, signing files, or local IDE/AI state as handover material.
5. **Demo SQL scripts are destructive or mutate demo records.** Read their comments and target filters; do not run against live customers.

## Useful source entry points

- Web routing and customer pages: `thk-web/src/App.tsx`, `src/pages/`, `src/components/`
- Staff access: `thk-web/src/lib/auth.tsx`
- Operations workspaces and role modules: `thk-web/src/pages/OperationsWorkspace.tsx`
- Meal signup and payments: `thk-web/src/components/SubscriptionFlow.tsx`, `src/pages/PaymentCallbackPage.tsx`
- Kitchen data transforms/views: `thk-web/supabase/migrations/`
- Mobile role routing and native integration: `thk-mobile/src/App.tsx`, `src/lib/health.ts`, `capacitor.config.ts`
