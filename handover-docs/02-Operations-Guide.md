# Operations Guide

## Where each role works

| Role | Main workspace | Intended work |
|---|---|---|
| CEO | Web operations portal | Oversight and all operating areas. |
| Admin | Web operations portal | Customers, subscriptions, menus, payments, reports, team/settings, and daily administration. |
| Kitchen | Web operations portal | Menu catalogue/release, daily production, ingredient purchasing totals, allergies/preparation notes, and packing. |
| Transport | Web operations portal | Delivery addresses/zones, rider assignment, routes, delivery status, and rider fleet. |
| Rider | Mobile app | Assigned stops, delivery execution, and availability. |
| Customer | Website or mobile app | Subscription, meals, delivery details, health/rewards, and account settings. |

The mobile app routes CEO/Admin/Kitchen/Transport to the web portal. Do not look for a Kitchen or Transport dashboard inside the mobile app. Riders are the operations role intended to work in mobile.

## Sign-in and role access

1. Use the staff member’s own approved sign-in account. Do not share a personal owner account among staff.
2. The web role is read from the authenticated staff-role record; the interface is not the only security boundary. Supabase policies/views/functions must also be present and current.
3. After sign-in, confirm the workspace label and tabs match the staff member’s role. If access is wrong, stop and ask the system administrator to correct the role assignment; do not work around it by sharing another role’s credentials.
4. Sign out on shared devices. Remove access promptly when a staff member leaves.

### Role areas in the web portal

- **CEO/Admin:** Dashboard, Customers, Subscriptions, Meal Plans, Kitchen, Packing, Delivery, Drivers, Payments, Reminders, Reports, Consultations, Team, Settings. Actual visible tabs are role-filtered.
- **Kitchen:** Dashboard, Meal Plans, Kitchen, Packing, and Reports are the work areas relevant to food preparation. If the Kitchen account shows Consultations, remove it from Kitchen navigation and verify that the role cannot access consultation records. Consultations belong with CEO/Admin.
- **Transport:** Dashboard, Delivery, Drivers.

The web fleet view currently reads approved rider records. A pending-application approval control was not identified in the operations workflow reviewed for this handover. Before inviting riders, the Director must assign an owner and verify the actual approval route in the production system. Do not assume that submitting an application makes a rider approved.

## Daily operating rhythm

### CEO/Admin

- Review alerts for pending payments, consultation requests, incomplete customer zones, pause/resume requests, and failed email events.
- Check new subscriptions and payment status before telling a customer the plan is active.
- For Tap manual verification, inspect the exact transaction in Tap first. Confirm it is captured, the reference matches, and amount/currency match. Only then use **Verify captured in Tap**. This action activates the plan and is audited.
- For cash, confirm cash was physically collected before using **Confirm cash received**. This activates the plan and is audited.
- Review package price/duration and current menu before advertising signup.
- Activate demo customers only for presentation/operations previews. Demo records remain marked synthetic and unpaid, and never count as cash or Tap revenue.
- Keep Customer exports and consultation/health information restricted to staff who need it.

### Kitchen

- In **Meal Plans**, manage the dish catalogue, ingredient recipe configuration, monthly menu, review, and publication.
- In **Kitchen**, pick the service week and day. Use **Today’s production** to focus on the selected day instead of scanning every day’s dishes.
- Use dish/meal/portion counts for preparation. Read the parallel allergy, avoid, and preparation notes before cooking.
- Use **Weekly bulk purchasing** to see aggregated ingredient totals. Seeded recipe quantities are estimates until verified by the kitchen; do not place a purchase order from unvalidated estimates.
- Use **Packing** for the client-specific portion/dish detail after bulk ingredients arrive. A–F portion ranges are configurable in Settings and need Triangle Healthy Kitchen’s approved gram ranges entered.

### Transport

- Choose the delivery date and review zone/address grouping. Resolve missing or ambiguous zones before route assignment.
- A customer gets one stop with all meals for that day. Friday stops appear only for monthly customers with the Friday add-on.
- Assign one rider to each stop; use the map link to confirm the location. Record delivered/failed status promptly.
- Do not use kitchen screens to resolve customer zones; those belong to Transport/Admin.

### Rider

- Sign in through the mobile app after the application is approved.
- Set availability/online state as supported, review assigned stops, use the address/map details, and update delivery status honestly.
- Contact Transport/Admin for an unsafe, inaccessible, or incorrect address. Do not mark a stop delivered until it has been delivered.

## Escalation rules

- **Payment says pending after customer paid:** capture transaction reference and amount; check Tap dashboard and payment event log; use manual review only after verifying captured status. Do not tell the customer to purchase again first.
- **No menu appears:** check Meal Plans publication and available-from date; confirm active collection, archived fallback, and production database migrations.
- **Kitchen lists empty:** confirm active paid/demo records, meal selections for the Saturday service week, and valid dish IDs; confirm demo customers were activated for display where necessary. Check recipe config separately for ingredient totals.
- **Rider missing:** confirm rider approval process and active rider record. Current code does not prove that pending applications can be approved in the dashboard.
- **Data/API error:** save the time, role, page, and request/error code; do not attach keys or personal customer data. Escalate to the technical owner.
