# Deployment and Maintenance

## Account ownership

The client should own the production Vercel project/domain, Supabase project, payment account, email sender, Firebase project, Apple Developer account, Google Play Console account, and any signing credentials. Invite the developer as a named user with only the role needed. Keep a separate secure inventory of owners, billing contacts, recovery contacts, MFA, and renewal dates; do not put passwords or recovery codes in this manual.

## Web development and release

The current website lives under `thk-web/` and requires Node.js 24 per its package metadata.

```sh
cd thk-web
npm install
npm run lint
npm run build
npm run preview
```

Before a production release:

1. Review the code change and database impact.
2. Confirm required environment variables in the correct Vercel environment (preview and production are separate).
3. Review and apply any database migration through the agreed release process. Back up first; check remote migration history because the local README reports historical drift.
4. Deploy a Vercel preview and run the relevant customer/role workflow checks.
5. Promote/deploy the approved commit to production using the client-owned Vercel workflow.
6. Verify the deployed commit, login, customer signup, menu, payment return, operations roles, and mobile-web entry point.
7. Record deployment date, commit, migration IDs, checks, owner, and rollback target.

To roll back a web-only defect, use Vercel’s previous known-good deployment. A Vercel rollback does not reverse database changes; use a reviewed forward fix or a verified database restore plan.

## Mobile build and release

The mobile application is under `thk-mobile/`. Android and iOS share the customer UI, but native signing, permissions, Firebase, HealthKit/Health Connect, and store policies are platform-specific.

```sh
cd thk-mobile
npm install
npm run typecheck
npm run lint
npm run build
npx cap sync
```

- Android emulator/debug APK: `npm run build:apk` (requires Android SDK/Gradle environment).
- Android store bundle: use Android Studio **Build → Generate Signed Bundle / APK**, with the client-owned Play Console app and protected release keystore.
- iOS assets sync: `npm run build:ios`; open `ios/App/App.xcworkspace` in Xcode, set the client Team/signing profile/capabilities, archive, and upload using the client-owned Apple account.
- Increase the platform build/version number for each store update. Preserve and back up the same Android signing key; losing it can block updates.
- Test signed release builds on physical iPhone and Android devices. Emulator preview is not store acceptance.
- Store listing, privacy disclosures, age/content ratings, screenshots, review, and account fees are client-owned dependencies unless a separate written delivery includes them. Store publication has not been established by this handover.

## Supabase/database/functions release

1. Identify the canonical migration and Edge Function tree first. The repository currently duplicates migrations and splits functions between web and mobile folders.
2. Compare local files with the deployed production function versions and deployed migration history.
3. Back up or confirm point-in-time recovery is available; rehearse a restore to a non-production environment.
4. Review policies, function grants, triggers, cron jobs, and secrets for every change.
5. Apply one reviewed migration at a time through the client-approved procedure. Do not bulk push while migration history is unresolved.
6. Deploy the intended functions and inspect function logs.
7. Confirm `send-reminders-job`, kitchen-choice default processing, account data cleanup schedule, and any required network extension jobs in the production project.
8. Verify exact post-release role access and audit records.

Never copy production database data into preview/local without sanitization. Do not manually update payment/subscriber tables to bypass RPC validation and audit history.

## Backups and recovery

- Define a client-owned backup schedule and retention period based on the Supabase plan and the business’s legal/accounting needs.
- Confirm database backup/PITR capability and storage backup coverage; database backups may not include all Storage objects or secrets.
- Store export/encryption keys separately from backups.
- Test restoration into a separate Supabase project before calling a backup usable.
- Record recovery time objective (RTO), recovery point objective (RPO), incident owner, and client notification path. These have not been contractually set in the reviewed agreements.

## Routine maintenance calendar

| Frequency | Owner | Work |
|---|---|---|
| Each menu cycle | Admin/Kitchen | Verify next week’s menu release, kitchen choice, package eligibility, recipe completeness, ingredient estimates, and deadline jobs. |
| Daily operations | Admin/Transport/Kitchen | Review payment exceptions, missing zones, delivery assignments, failed email events, and today’s production/packing totals. |
| Monthly | System owner | Review staff access, provider charges/renewals, Vercel/Supabase errors and usage, backups, failed jobs, and domain/email health. |
| Each release | Developer/system owner | Review code, migration, security policies, preview, acceptance scenarios, release notes, and rollback path. |
| Quarterly or after incident | Client + technical owner | Rehearse restore, rotate access where needed, review data retention, and confirm vendor/account owners. |

## Support and maintenance terms

No response-time SLA, included support period, maintenance price, hosting responsibility, or uptime commitment should be implied by this document. Agree those items in writing. A practical maintenance agreement should define supported hours/time zone, severity levels, response targets, included defect fixes, paid enhancement work, backups/recovery ownership, third-party account costs, security updates, and termination/handover steps.
