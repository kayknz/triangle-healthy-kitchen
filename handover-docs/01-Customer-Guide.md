# Customer Guide

## Using Triangle Healthy Kitchen

Customers can use the live website or the iOS/Android app to review plans, create an account, choose meals, provide delivery details, and manage an active subscription. The mobile app is for customer and rider tasks; company operations dashboards are on the web.

## Start or renew a plan

1. Open the website or app and choose **Start your plan**.
2. Complete the profile and health-goal questions. Enter realistic age, weight, and height values. A BMI report is optional; it is shared for the nutrition team’s review and is not a substitute for medical advice.
3. Choose a package. Package availability, name, price, meal periods, and duration are loaded from the active package records. Confirm the current values shown in the app before paying; the code’s fallback examples may not match later admin-edited package records.
4. Choose the available meals for the upcoming service week. The kitchen’s choice is preselected where one is available. Keep that selection if you are happy with it; change only the meals you want to change.
5. Provide allergies and kitchen preparation notes. These are shared with Kitchen for food safety and preparation. Describe ingredients to avoid clearly; contact the business directly for urgent allergy questions.
6. Enter the place that should receive the food: home, office, gym, or another location. Use **Locate** if you are physically there, or enter the address manually if you are elsewhere. Review the building, street, area, and map pin. Confirm the suggested delivery zone with the business if the address is not recognized.
7. Create/sign in to your account, accept the displayed terms, and choose the payment method offered.
8. Keep the confirmation/reference. If checkout returns without showing an active plan, sign in and check the plan status before trying to pay again. A pending payment should be reconciled by Admin/CEO first to avoid duplicate charges.

### Payment choices

- **Tap:** Continue to Tap’s secure checkout. The plan activates after a verified capture. If the return page says pending, do not assume the payment failed; contact the business with the transaction reference so staff can check Tap and the operations payment log.
- **Cash collection:** The request remains pending until Admin/CEO confirms that cash was physically received. The confirmation message says the team will reach out. Do not treat an unverified cash request as an active plan.
- Sadad is not documented as an available integrated checkout in the current source. Use only the payment options actually displayed.

## Weekly meals and deadlines

- The service week starts Saturday. The menu is intended to open on Saturday for the upcoming week.
- Change meal choices before **Thursday 11:59 PM Qatar time**. The app should preselect Kitchen’s choice when available, so customers who accept it do not need to reselect it.
- After the deadline, the scheduled kitchen-choice process fills any missing meal choices. Confirm that the client’s production environment has the scheduled database job enabled; see the Launch Checklist.
- A reminder email is intended to go out about 24 hours before the deadline to customers with incomplete meal choices. Email delivery depends on the production Brevo configuration and scheduled job.
- If there is no new release for the upcoming week, the system has a database function to roll the latest prior menu forward. Operations should still check the menu before the week opens and confirm the fallback job is active.

## Friday meals and delivery

The optional Friday add-on is **QAR 199 per monthly subscription** and includes Friday meal selections and the Friday delivery. It is not an extra charge per Friday. It is not offered with the one-day or six-day trial in the current flow. Confirm the total displayed before payment.

## Delivery details

Each customer receives **one delivery stop per service day**, with all meals for that day together. The delivery address and zone help Transport group stops and assign riders. If you move between home, office, and gym, update the active delivery address/details through the account flow as supported and tell the business about a change that affects an imminent route.

## Language and mobile health data

- Use the language control to switch between English and Arabic. If wording appears untranslated or confusing, capture the screen and report the page and language; do not assume a partial translation changes plan or payment rules.
- Health sync is optional and customer-initiated. iPhone uses Apple Health/HealthKit; Android uses Health Connect. The customer must grant read access on their device. Samsung Health data must be shared with Health Connect first. If unavailable, continue using the product without syncing. The app requests steps, distance, calories, and weight permissions in the mobile implementation; actual data availability depends on device, OS, permissions, and signing/configuration.

## Account help

Use the password-reset link sent to the email on the account and open it on the live domain. A reset page that reports a missing/expired auth session needs a fresh recovery email and valid session; do not repeat the password update from an old link. For a plan that is pending after payment, ask Admin/CEO to reconcile the transaction before starting another checkout.

The account has a **Request account deletion** flow. The app tells the customer the request is processed within 30 days. Separately, the database contains a scheduled cleanup for non-owner, non-staff, non-rider customer accounts whose subscription period ended more than 30 days earlier. Confirm production scheduling and the published privacy policy before promising retention/deletion dates beyond what the screen says.
