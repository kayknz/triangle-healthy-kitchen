> **For the Director and acceptance owners.** This is the sign-off record, not a list of claims that every item has already passed. Assign each item to a named owner. Mark it Pass only after the stated evidence has been checked in the intended production account or on the intended device. If an item is not complete, record the responsible person and the operational effect before accepting the handover.

# Launch Acceptance and Known Limits

The Director assigns each section to named owners from Triangle Healthy Kitchen’s business, Kitchen, Transport, Finance, and technical teams. Mark each item **Pass**, **Fail**, or **Not tested** and attach a safe reference (no passwords, card data, or client health records).

## A. Ownership and access

- [ ] Client owns Vercel/domain and can deploy or roll back.
- [ ] Client owns Supabase and can manage users, billing, backups, and secrets.
- [ ] Client owns Tap, Brevo, Firebase, Apple Developer, and Google Play accounts as applicable.
- [ ] Staff have individual accounts and correct CEO/Admin/Kitchen/Transport roles.
- [ ] Role access checked in both UI and database (Kitchen cannot access customer/transport-only information; Transport cannot approve payments).
- [ ] Rider application approval has a confirmed supported workflow. **Current operations source only loads approved riders; pending approval control was not found.**
- [ ] Recovery contacts and MFA set; departing staff can be removed without sharing/resetting other people’s credentials.

## B. Customer signup and account

- [ ] English and Arabic landing/navigation, forms, errors, legal links, and account views reviewed on mobile and desktop.
- [ ] Email signup/login, password reset from the live domain, and session recovery tested.
- [ ] Phone country-code selection and OTP delivery channel tested using production provider settings; verify whether WhatsApp OTP is actually configured before promising it.
- [ ] Profile fields reject invalid/zero weight or height and explain optional BMI report clearly.
- [ ] Existing customer can sign in, renew, see their plan, and request deletion without being forced into a duplicate purchase.
- [ ] Account deletion request and 30-day inactive-customer cleanup are tested; published policy and actual cron schedule match.

## C. Plan, menu, and kitchen

- [ ] Active package prices, currency, service days, meal periods, Friday eligibility, and meal limits match business-approved values.
- [ ] One-day and six-day trials show 3 meals + 1 snack if confirmed by the business.
- [ ] 1,600 kcal, 3-meal/2-different-snack package is active at the approved price (currently requested as QAR 2,499).
- [ ] Friday add-on is QAR 199 per monthly subscription and includes Friday meals/selections and one Friday delivery stop per service Friday.
- [ ] Admin menu import/upload, editable review, additions/deletions, publication, Saturday customer availability, and future week selection tested.
- [ ] Previous release fallback fills a missing week and does not duplicate menu-availability rows.
- [ ] Customers can keep preselected Kitchen choice, edit desired meals, and cannot exceed package meal periods.
- [ ] Weekly cutoff is Thursday 11:59 PM Qatar time; job applies Kitchen’s choice only after cutoff; reminders arrive approximately 24 hours beforehand.
- [ ] Kitchen sees today’s required dish/meal totals and relevant allergy/preparation notes; customer addresses/zones remain with Transport/Admin.
- [ ] Purchase quantities use kitchen-verified recipe amounts/units, include substitutions/removals correctly, and handle portion A–F scaling as intended.
- [ ] Packing shows client-specific dish and portion details needed after bulk purchase.
- [ ] Friday delivery list includes only monthly add-on customers; delivery is one stop per customer/day with all meals together.
- [ ] Test at least two customers with different dishes, shared dishes, different A–F portions, allergy notes, customizations, and different zones.

## D. Payments

- [ ] Tap production keys and account settings verified in Tap and stored only in server-side configuration.
- [ ] Tap redirect URL is the live domain callback and Tap webhook points to the correct production Edge Function.
- [ ] A permitted live test produces the correct transaction, currency, package/Friday total, callback, webhook, and plan activation.
- [ ] Delayed callback case stays pending and is reconciled without asking the customer to repurchase.
- [ ] CEO/Admin manual Tap verification works only after a human confirms the exact captured charge, currency, and amount.
- [ ] Cash stays pending until physically collected; CEO/Admin verification activates it and creates an audit event.
- [ ] Failure, duplicate callback, cancellation, refund, and chargeback procedures are agreed. Refund/chargeback UI/process is not established by this documentation review.
- [ ] Sadad is not described as available unless separately implemented and acceptance-tested.

## E. Email, mobile, and integrations

- [ ] Brevo API configuration, sender/domain verification, booking notifications, menu reminder delivery, and failure logs tested.
- [ ] Supabase cron jobs verified in production: weekly default, send-reminders, and 30-day cleanup.
- [ ] Canonical Supabase Edge Function tree chosen and deployed; `tap-webhook` and other mobile-tree functions are not assumed to exist just because files are in the repo.
- [ ] Android Firebase config belongs to client’s project, is secure, and push is tested on a real device.
- [ ] Apple Developer team, app identifiers, HealthKit capability, privacy usage text, and signed iOS build are configured.
- [ ] Apple Health and Android Health Connect consent/read/sync are tested on real devices; Samsung Health sharing steps documented for users.
- [ ] Address autocomplete/locate/manual entry and Qatar zone mapping verified with real addresses; map marker accuracy checked.
- [ ] Store privacy, data safety, account deletion, nutrition/health, payment, and location disclosures match actual collection/use.

## F. Release and operations acceptance

- [ ] Web build, role sign-in, customer signup, menu, payment, kitchen, route, Arabic, and mobile responsive checks pass.
- [ ] Android signed build installed/tested on physical phone and release signing key backed up.
- [ ] iOS signed build installed/tested on physical iPhone. Store publication is separately scheduled with client-owned account.
- [ ] Demo customers are labeled unpaid and excluded from sales totals.
- [ ] Customer, payment, kitchen, packing, and route CSV exports open and contain expected columns.
- [ ] Backup restore is demonstrated outside production.
- [ ] Operations and client-owner training completed; support owner and escalation contact named.
- [ ] Client accepts the agreed scope and signs the aligned commercial/license documents.

## Known limitations and items requiring acceptance

1. **Payment provider:** Tap implementation is present but live transaction/callback behavior needs Triangle Healthy Kitchen’s credential and webhook verification. Sadad was not found in application files reviewed for this handover.
2. **Supabase functions are split:** checkout appears under the web tree; webhook, reminders, booking email, health reconciliation, and account deletion appear under the mobile tree. Production deployment must be reconciled with this layout.
3. **Migration history:** root README warns that the linked production project has local/remote migration-history drift. Bulk database push is not a safe assumed handover step.
4. **Menu/kitchen data quality:** recipe ingredient quantities are seeded estimates and require Kitchen approval. Portion ranges A–F require real gram values. Procurement should not rely on defaults until confirmed.
5. **Rider approval:** the reviewed operations dashboard shows approved riders but no pending application approval action. Confirm a usable approval process before onboarding riders.
6. **Mobile publication:** source projects exist but the reviewed state does not establish signed, store-approved iOS/Android releases. Client store memberships and signing are prerequisites.
7. **Push notifications:** Android registration depends on Firebase configuration; the Firebase config file is deliberately excluded from this package.
8. **Arabic completeness:** translation infrastructure and many Arabic strings exist. A complete screen-by-screen Arabic review is still an acceptance task; this package does not certify every string.
9. **Operational reminder scheduling:** SQL/function code exists; actual production cron, secrets, and delivery require verification.
10. **Support/warranty:** response times, uptime, included maintenance period, and ongoing fees are not established here. Agree them separately in the signed commercial terms.

## Sign-off

| Area | Result | Owner | Date / evidence reference |
|---|---|---|---|
| Customer signup and plans |  |  |  |
| Menu and Kitchen |  |  |  |
| Payments |  |  |  |
| Transport and riders |  |  |  |
| Arabic and mobile |  |  |  |
| Deployment, backups, and recovery |  |  |  |
| Client acceptance |  |  |  |
