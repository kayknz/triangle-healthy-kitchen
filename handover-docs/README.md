# Triangle Healthy Kitchen Software Handover

**Documentation set:** 1.0
**Reviewed:** 3 October 2026
**Product:** Triangle Healthy Kitchen customer platform, operations portal, and mobile apps

## What this package covers

This handover set explains how customers use the service, how each operations team works, how menus and production flow through the system, how payments are reconciled, and what the client or next developer must configure before a full launch. It is written against the current `thk-web/` and `thk-mobile/` source trees. It does not include source code, customer exports, database credentials, payment keys, Firebase configuration files, signing keys, or signed contracts.

## Read these first

1. **Customer Guide** — account, package, meal selection, delivery details, payment, and mobile health connections.
2. **Operations Guide** — the web dashboards for CEO/Admin, Kitchen, and Transport, plus the Rider mobile workflow.
3. **Kitchen Production Guide** — daily production, weekly bulk purchasing, portions, safety notes, and packing.
4. **Payments and Subscriptions** — Tap and cash processing, review steps, plan states, menu schedule, and customer retention.
5. **Technical Handover** — architecture, roles, data flows, integrations, configuration names, security, and migration cautions.
6. **Deployment and Maintenance** — web releases, database/functions, mobile builds, backups, recovery, and ongoing responsibilities.
7. **Launch Checklist and Known Limits** — acceptance checks and items that need production-owner confirmation.

## Current delivery snapshot

| Area | Current state described by source/configuration | Before calling it production-ready |
|---|---|---|
| Web | Live Vercel site: [trianglehealthykitchen.vercel.app](https://trianglehealthykitchen.vercel.app/) | Run the client’s final acceptance checks on the live domain. |
| Customer mobile app | Capacitor iOS and Android projects are in `thk-mobile/`; app features use the shared customer product. | Build, sign, and distribute through the client’s Apple/Google accounts. Store approval is external and not included in this code handover. |
| Operations mobile access | CEO, Admin, Kitchen, and Transport are directed to the web operations portal. Riders use the mobile app. | Confirm role assignments and portal access for named staff. |
| Menu and kitchen | Monthly menu creation, weekly meal selections, production views, ingredient totals, and packing views are present in source/migrations. | Confirm the production database has the matching migrations, menu data, recipe quantities, scheduled jobs, and the client-approved portion ranges. Recipe quantities currently require kitchen validation. |
| Payments | Tap checkout/callback and manual reconciliation are present; cash collection requests and verification are present. | Confirm live provider credentials, webhook delivery, amount/currency, and one real end-to-end transaction. Tap callback was not independently certified by this documentation review. |
| Sadad | No Sadad checkout implementation was found in the reviewed product source. | Do not advertise Sadad as an available in-app payment method unless it is separately implemented and tested. |
| Emails/reminders | Brevo-backed Edge Function code and a scheduled reminder job exist in the repository copies. | Confirm the deployed function source, Brevo secrets/sender verification, and Supabase cron job on the production project. |
| Android push | Android push registration is conditional on a Firebase Android config file. A local Firebase config file is not included in this documentation bundle. | Set up under the client-owned Firebase project, secure the file, rebuild, and test on a real device. |
| iOS distribution | The iOS project is present. | Client Apple Developer membership, HealthKit entitlement/signing, signed archive, privacy disclosures, and App Store review are required for store release. |

“Present in source” does not prove that a feature is deployed, configured, or accepted in the production environment. The launch checklist identifies those checks explicitly.

## Access and data handling

- The client should own or control Vercel, Supabase, Tap, Brevo, Apple Developer, Google Play, and Firebase accounts.
- Transfer access through each provider’s invitation/role system. Never put passwords, service-role keys, Tap secrets, webhook secrets, signing keys, or private Firebase files in this bundle, email, Git, or a support ticket.
- The browser/mobile app’s Supabase anon key is a public client key; it is not a substitute for RLS and must never be confused with the service-role key.
- Do not send real client health, allergy, address, or payment information in sample screenshots or support messages.

## Commercial paperwork is separate

The supplied fee, license, and referral agreements are working drafts, not product manuals. Use one agreed master agreement and make its fee, license scope, support obligations, referrals, and app-store scope consistent with the EULA before anyone signs. This documentation set does not change or replace those agreements.

## Handover completion record

Complete this with the client at handover:

- Production URL and Vercel project owner: ____________________
- Supabase project owner and project reference: ____________________
- Production database migration review completed by/date: ____________________
- Tap live configuration and test transaction verified by/date: ____________________
- Brevo sender and reminder schedule verified by/date: ____________________
- Firebase Android push configured/tested by/date: ____________________
- Apple signing/store release owner/date: ____________________
- Staff roles and initial access verified by/date: ____________________
- Backup/restore rehearsal owner/date: ____________________
- Client acceptance owner/date: ____________________
