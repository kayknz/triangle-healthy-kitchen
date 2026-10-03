# External Services Runbook

This runbook identifies services outside the application code, what THK uses them for, who should own them, how to configure or verify them, and what to do when they fail. Create provider accounts in the client’s name. Keep all credentials in the provider or its approved secret store; this runbook intentionally contains no credential values.

## Service inventory

| Service/source | Use in THK | Key operational point |
|---|---|---|
| Supabase | Authentication, PostgreSQL, Storage, RLS, Edge Functions, cron jobs | System of record. Preserve migration history and verify security policies/functions before release. |
| Vercel | Production website hosting and deployment | Deploys the web app; keep the Supabase project and domain settings aligned. |
| Brevo | Supabase Auth SMTP and transactional booking/menu emails | SMTP key and API key are different credentials and are consumed through different paths. |
| Tap Payments | Online checkout, charge status, webhook/callback | Reconcile exact captured charges; never trust the browser return page alone. |
| Firebase Cloud Messaging | Android push registration | Android push is skipped unless `google-services.json` exists at the expected native path. |
| Apple HealthKit | Optional iPhone health-data read/sync | Requires client Apple Developer membership, HealthKit entitlement, signing, and user consent. |
| Android Health Connect | Optional Android health-data read/sync | Samsung Health must share data with Health Connect first. |
| Qatar GIS zones service | Converts a map point into Qatar `ZONE_NO` | Source code uses the Qatar GIS public FeatureServer query; if unavailable, zone stays unset and Transport must review. |
| OpenStreetMap Nominatim | Reverse-geocodes GPS coordinates into address labels | Current source calls the public reverse endpoint without an API key. Treat the result as a suggestion, provide manual entry, and check current usage terms/provider suitability before higher-volume production use. |
| Google Maps | Opens/parses customer/rider map links and coordinates | Current source builds links and parses coordinates; it does not show a Google Maps API key or Places autocomplete integration. |
| WhatsApp (`wa.me`) | Opens a prefilled support or rider-contact conversation | This is an outbound deep link, not evidence of WhatsApp Business API or WhatsApp OTP delivery. Check current number and privacy-safe message content. |
| Pexels / Unsplash | Food/marketing fallback images | Remote image availability can affect presentation. Replace with licensed, client-approved images for a production brand. |
| Pravatar | Community demo avatar images | Synthetic/community presentation use only; do not represent generated avatars as real named customers. |
| Instagram | Footer/social navigation | Confirm one correct official handle on web and mobile before launch; the source contains different web/mobile handle strings. |

## 1. Supabase

### Ownership and initial access

1. Keep the production project under the client’s organization, with at least two client-controlled owner/recovery contacts and MFA.
2. Invite developers as named team members with only the access needed. Do not share the owner login.
3. Keep the project URL and anon/public key in the client app configuration. Never use the service-role key in web/mobile code.
4. Store server keys only in Supabase Edge Function secrets or the protected database Vault/RPC mechanism expected by the function. The service-role key bypasses ordinary row policies and must never be sent to a browser/device.

### Auth and email setup

1. Set the production Site URL and redirect allow-list to the deployed domain and supported auth/payment return paths.
2. Test signup confirmation, sign-in, password recovery, session expiry, and callback handling on the live HTTPS domain. A recovery link must return to a valid app session and route.
3. If using custom SMTP for Supabase Auth, use Brevo’s **SMTP relay hostname** (`smtp-relay.brevo.com`) and the SMTP port supported by the account (the configured screen previously showed 587). Use Brevo’s SMTP username and a generated SMTP key in Supabase; this password is **not** the Brevo API key and is not the account login password.
4. Confirm sender/domain authentication and that Supabase Auth confirmation/reset messages arrive independently from THK booking/menu transactional messages.
5. Phone/WhatsApp OTP delivery depends on Auth provider setup. A WhatsApp support link in the app does not configure OTP delivery.

### Database, storage, functions, and scheduled jobs

1. Reconcile local and remote migration history before applying migrations. The repository records historical drift; do not use an unreviewed bulk push.
2. Review RLS and RPC permissions after each migration. Check as anonymous, customer, Kitchen, Transport, Admin, and CEO accounts.
3. Confirm the `bmi-reports` Storage bucket and policies restrict each uploaded report to the intended authorized flow. Treat reports as sensitive health data.
4. Reconcile the split Edge Function trees in the repository before deployment (see Technical Handover). Check production function source/deployed versions rather than assuming a local copy is live.
5. In Supabase logs, verify function invocations/errors and the cron jobs for menu defaults, menu reminders, and expired-customer cleanup. Confirm they target this production project and use the correct Qatar-week logic.
6. Confirm backup/PITR availability, storage coverage, and a restore drill. A database backup may not restore object files, function secrets, or external provider configuration.

### If something fails

- **Auth redirect/reset failure:** check Auth Site URL/redirect allow-list, SMTP logs, and whether the recovery link is stale; generate a fresh recovery link.
- **HTTP 401/403:** verify the current user/session, role assignment, RLS policy, and RPC grants. Do not solve by exposing service-role credentials.
- **HTTP 400 on a table/RPC:** read the Supabase error body and compare the deployed schema/function with local migration history before changing data.
- **Cron does not run:** inspect `cron.job` and job-run/network logs, function endpoint, secrets, and `pg_net`/extension configuration.

## 2. Vercel

1. Keep the Vercel project under the client’s account or organization and connect the intended GitHub repository/production branch.
2. Set the project root to `thk-web/` if that is not already the configured Vercel root. Confirm the build command is `npm run build`, output directory is `dist`, and SPA routes rewrite to `index.html`.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Preview and Production. Set `VITE_OPERATIONS_WEB_URL` in the mobile build only if the default production URL should be overridden.
4. Use a Preview deployment to verify each release before promoting to Production. Confirm `/login`, `/account`, `/payment/callback`, `/dashboard`, and role-specific routes load directly.
5. After a production deploy, record the Git commit and deployment URL; exercise sign-in, meal selection, and payment-return routing.
6. Vercel Analytics can be blocked by browser privacy extensions (`ERR_BLOCKED_BY_CLIENT`). Distinguish that client-side block from application/API failures; enable analytics for the Vercel project only if the owner wants it.
7. Roll back a web-only regression to a prior Vercel deployment. Database changes need a separate reviewed recovery/fix; a frontend rollback does not reverse SQL.

## 3. Brevo

THK uses Brevo through **two distinct channels**. Configure and test both:

### Supabase Auth transactional SMTP

- Set a verified sender/domain in Brevo and finish the DNS authentication steps Brevo requests.
- In Supabase Auth email/SMTP settings, enter Brevo’s SMTP relay, the account’s SMTP username, and a generated SMTP key.
- Use the SMTP key, not the Brevo dashboard password and not the API key.
- Test a new-user confirmation and a password reset on the production domain. Check spam placement, From name/address, reply handling, and rate limits.

### THK Edge Function emails

- The booking-notification function source reads `BREVO_API_KEY` and `SENDER_EMAIL` from Edge Function environment secrets.
- The menu-reminder function source calls the protected `get_brevo_config()` database helper, which reads a key/sender from the project’s Vault configuration.
- Because the two source copies use different configuration paths, first reconcile the canonical production function source. Put the API key only in the exact server-side secret/Vault location used by that deployed function. Do not paste it into `VITE_*`, frontend code, GitHub, or this manual.
- Confirm `send-booking-notification` sends the expected customer/operations booking messages and writes success/failure logs.
- Confirm `send-reminders` runs from the scheduled job, selects only customers who still need to choose meals, sends before the Thursday Qatar-time cutoff, and records the `(customer, service week)` reminder so a repeated invocation does not spam them.
- Check Brevo transactional email logs and the THK Notifications view for accepted, bounced, blocked, or failed outcomes. A 2xx provider response means accepted for processing, not guaranteed inbox placement.
- Rotate a compromised API key in Brevo and in the correct Supabase secret store, redeploy/restart dependent functions if needed, then send a controlled test.

## 4. Tap Payments

1. The client owns the Tap merchant account and activates live processing with Tap. Confirm the environment (test/live), enabled payment methods, currency, settlement, and account status directly in Tap.
2. Store the Tap secret only through the protected Supabase configuration path used by `get_tap_config()`; confirm the deployed checkout function can retrieve it. Do not place the secret in Vercel `VITE_*`, app source, or a mobile bundle.
3. Set the redirect URL to `https://trianglehealthykitchen.vercel.app/payment/callback` (or the approved active domain).
4. Set the webhook/post URL to the correct production Supabase `tap-webhook` Edge Function. Verify the URL and signing/HMAC behavior against the deployed function. The current checked-in webhook copy is under `thk-mobile/supabase/functions/`; reconcile it with the deployed function before editing/deploying.
5. Make one authorized end-to-end payment using an approved test/low-value method. Confirm the transaction row, Tap dashboard charge, webhook/callback logs, exact amount/currency, and active customer plan.
6. Simulate delayed callback behavior without creating a second charge. CEO/Admin manually reviews only after confirming the exact charge is captured in Tap.
7. Agree who handles refunds, disputes, chargebacks, settlement reconciliation, and customer receipts. Those procedures are not fully represented by the current app screens.
8. Sadad is not in the reviewed app code. Do not add Sadad credentials or advertise it as integrated until a separate implementation is built and tested.

## 5. Firebase Cloud Messaging (Android)

1. Create/choose the client-owned Firebase project and register the Android app with package/application ID `com.trianglehealthykitchen.app`.
2. Download the Android client configuration file from Firebase and put it at `thk-mobile/android/app/google-services.json`. Keep it out of public Git and out of this documentation archive.
3. Confirm Gradle’s Google Services/Firebase Messaging setup and the application ID match Firebase. Rebuild and sync the Capacitor project after adding configuration.
4. Sign in on a physical Android device, grant notification permission, confirm FCM token registration, then send a controlled test message through the intended server notification path.
5. If there is no Firebase configuration, current app code intentionally skips Android push registration. Email reminders continue as a separate channel; do not claim Android push is live until tested.
6. Store Firebase Admin/service credentials, if later needed by server push, only in a protected server secret store. The Android client JSON is not a server admin key, but it still belongs to the client’s project and should not be published casually.

## 6. Apple Health and Android Health Connect

### iPhone / Apple Health

- The app asks for customer consent to read steps, distance, calories, and weight. It does not sync until the customer initiates it.
- The iOS project has a HealthKit entitlement and usage description. The client still needs an active Apple Developer membership, the matching App ID capability, provisioning/signing, and a signed device build.
- The client has not yet paid for the Apple Developer subscription. Therefore iOS HealthKit store/distribution readiness is blocked until that account is active and signing is configured. A simulator/source check is not a production-device validation.
- Test grant, deny, revoke, empty data, and successful sync on an iPhone. Confirm the privacy policy accurately describes health data.

### Android / Health Connect

- The app queries Health Connect through the Capacitor health plugin after the user grants access.
- On Samsung phones, the user must enable Samsung Health sharing into Health Connect first. Test on a physical Samsung/Android device as well as a generic Android device.
- Test unavailable Health Connect, denied permissions, no samples, and successful daily steps/distance synchronization.

Health integrations are optional wellness features; do not present their output as diagnosis or medical advice.

## 7. Location and maps

- The app can use device geolocation, parse Google Maps URLs/coordinates, and create outgoing Google Maps links. The reviewed source does not use a Google Maps API key or provide Places autocomplete.
- The `Locate` flow calls OpenStreetMap Nominatim reverse geocoding to suggest address labels, and Qatar’s GIS FeatureServer to resolve a `ZONE_NO` from the GPS point. These are external network services; they can fail, time out, or return incomplete address data.
- If either lookup fails, the customer must be able to enter/review the delivery address manually. Treat zone as unconfirmed if the lookup is blank; Transport should check it before assigning a rider.
- Verify coordinates inside Qatar, edge-of-zone addresses, a manually entered home/office/gym address, denied location permission, and network failure. Ensure the location pin and human-readable address refer to the same place.
- Before increasing traffic, check current Nominatim and Qatar GIS terms/availability and decide whether the business needs a supported geocoding service or server-side proxy. Do not assume a public endpoint has a commercial uptime commitment.

## 8. WhatsApp, social links, and remote images

- WhatsApp buttons open `wa.me` chats; this is not a WhatsApp Business API integration. Confirm the business number, country-code formatting, prefilled text, and rider/client support routing.
- Do not place passwords, payment-card data, health measurements, BMI reports, or detailed allergy information in WhatsApp URLs/messages. The current client-support link can include the customer’s name in the prefilled text; review consent and minimize data in these message templates.
- Confirm website and mobile Instagram links point to the same official account. The reviewed source has different handle strings between the two clients.
- Pexels/Unsplash supply remote image URLs; Pravatar supplies generated community avatars. Ensure the owner has appropriate usage rights/approval and replace demo-looking assets before client sign-off. Remote images require network access; test their fallback/loading behavior.

## Provider incident checklist

For any external service failure, record: provider, affected environment, time in Qatar, affected workflow, safe transaction/request reference, error code, recent deployment or key rotation, and whether a fallback worked. Do not attach tokens, keys, password-reset links, full payment details, medical reports, or screenshots with customer PII. Assign one owner to contact the vendor and another to keep customer operations moving using the documented fallback.
