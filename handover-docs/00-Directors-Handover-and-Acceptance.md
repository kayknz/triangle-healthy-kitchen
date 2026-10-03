# Director's Handover Letter and Acceptance Guide

**To:** Director, Triangle Healthy Kitchen  
**From:** Software Developer  
**Handover date:** 3 October 2026  
**Product:** Triangle Healthy Kitchen website, customer mobile apps, and operations system

## A note to the Director

I have prepared this handover so you and your team can understand what the software is intended to do, how the daily work moves through it, which outside accounts support it, and what must be checked before you rely on it for live customers. It is written for Triangle Healthy Kitchen first. The technical instructions later in the book are included so that you can direct an employee or future developer without losing control of your accounts or system.

The package includes the customer guide, operating guides for management and each work team, the kitchen production guide, payment and subscription guidance, a technical reference, a release and maintenance guide, a launch checklist, and a runbook for outside services such as Supabase, Vercel, Brevo, Tap, and Firebase. The PDF is the convenient reading copy. The Markdown files are the editable text source.

## What has been handed over

| Delivered area | What your team can use it for |
|---|---|
| Public website | Introduce Triangle Healthy Kitchen, explain plans, and provide the customer account and subscription experience. The live URL recorded for this handover is `https://trianglehealthykitchen.vercel.app/`. |
| Customer account and mobile app | Let customers register or sign in, provide their profile, select meals, enter a delivery address, see account information, and use the available wellness features. The Android and iOS app projects are in the repository; source code is not inside this document ZIP. |
| Operations website | Give CEO/Admin, Kitchen, and Transport their role-specific web workspaces. Business operations dashboards belong on the web. Riders use the mobile app. |
| Menu and kitchen workflow | Maintain the dish catalogue and weekly/monthly menu, receive customer choices, produce day-level meal and portion totals, calculate ingredient estimates from recipes, show kitchen safety notes, and support packing. The kitchen must approve recipe amounts and portion ranges before procurement relies on the totals. |
| Payments | Provide Tap checkout and a staff-controlled manual review for a captured Tap payment, plus a pending cash request that only activates after a staff member confirms cash was received. The live Tap account, webhook, and end-to-end production transaction still need client-side verification. |
| Outside-service instructions | Explain how to maintain the connected provider accounts without putting credentials into this package. |

## Readiness in plain language

A feature appearing in the source code or on a screen does not prove that it is configured, deployed, tested, or ready for production. The website is live, but the following items remain conditions to verify before you treat the complete service as production-ready:

| Item | What is known at handover | What must happen before relying on it |
|---|---|---|
| Online payments | Tap checkout, callback, and a staff reconciliation control are present in the reviewed source. | Confirm the client-owned Tap account, live/test mode, callback and webhook, and a real authorized transaction from checkout through active plan. Never ask a customer to pay twice while a charge is being checked. |
| Cash payments | Cash requests can wait for review; the plan should stay inactive until cash is actually received and an authorized Admin/CEO confirms it. | Train the staff who collect and confirm cash. Match the system entry to the cash received and to the finance records. |
| Menus and reminders | Menu publication and scheduled menu-choice/reminder code are present. | Confirm the correct menu appears to customers on Saturday, Kitchen's choice fills missed selections after Thursday's cutoff, and the reminder is sent about 24 hours before cutoff. These depend on production database jobs and email setup. |
| Kitchen purchasing | The system can total ingredients from recipe quantities and selected meals. | Kitchen must replace/approve seeded estimates, check units and substitution behavior, and enter the agreed gram ranges for portions A-F. Until signed off, totals are planning aids, not approved purchase orders. |
| Staff access | CEO/Admin, Kitchen, and Transport web workspaces are intended; Rider and Customer use the mobile app. | Create named staff accounts, check each role on the live system, and confirm data permissions. The reviewed web source did not show a clear control for approving pending rider applications; confirm the actual rider approval process before onboarding riders. |
| Email and external services | Brevo, Supabase, Vercel, Tap, Firebase, and health/location integrations have source-level setup notes. | The Director or named account owners must verify account access, secrets, sender/domain configuration, scheduled jobs, and real-device behavior. |
| App stores and mobile health | Android and iOS projects exist. | Store publication requires the client's own developer accounts, signing, declarations, review, and device testing. iOS HealthKit needs Apple's paid developer membership and signing. This handover does not claim either app is approved or published in an app store. |
| Arabic | Arabic language support is present. | Complete a screen-by-screen review of customer and role-specific flows in Arabic before advertising the translation as complete. |

The one-day and six-day trial offers are described as three meals and one snack. The additional offer discussed with Triangle Healthy Kitchen is 1,600 kcal, three meals and two different snack choices, at QAR 2,499. The monthly Friday add-on discussed is QAR 199 and includes Friday meal selections and Friday delivery for the subscription month. Treat these as business-approved prices and rules only after confirming the active package and checkout records display them correctly. The active package records control what customers are actually offered. The monthly plan duration is 24 service days, according to the current product rules. Sadad was not found as an integrated checkout in the reviewed source.

## How the service works from order to delivery

1. **The Director or Admin keeps the offer current.** Active package records define what is for sale, the price, duration, included meal periods, and any Friday eligibility.
2. **The customer subscribes and chooses meals.** The customer completes the profile, keeps or changes the preselected Kitchen's choice, adds allergy and preparation notes, enters the place where food should arrive, then chooses an offered payment method. A customer should not need to change a meal choice they already accept.
3. **A payment is checked before activation.** A Tap plan becomes active when the verified payment status is captured. Cash stays pending until cash is physically received and an authorized Admin/CEO confirms it. Pending does not mean paid or ready for service.
4. **Menu choices become kitchen production totals.** Kitchen needs day-specific dish and meal counts, bulk ingredient estimates, portion counts, and the allergy/avoid/preparation information needed to cook safely. Kitchen does not need customer addresses or a full customer directory to purchase ingredients.
5. **Kitchen portions and Packing uses the detail.** Once bulk food arrives, staff use packing details to match dishes, requested modifications, allergy notes, and the configured A-F portion category to the correct package.
6. **Transport plans one delivery stop per customer for that service day.** All that day's meals travel together. A zone is inferred from the customer's chosen map location when the lookup works; staff must resolve missing or uncertain zones before assigning a route.
7. **The customer receives the daily delivery and manages the account.** Staff should keep the operational status current and resolve payment, menu, address, or delivery exceptions in their designated workspace.

## Who owns the work

| Owner | Responsibility |
|---|---|
| Director / business owner | Owns business decisions, provider accounts, approved prices and terms, acceptance, support arrangements, data/privacy decisions, and who can access production. |
| Admin | Maintains packages, reviews customers and payments, checks operational alerts, manages staff access as permitted, and coordinates exceptions. |
| Kitchen lead | Approves dish catalogue, recipes, quantities, units, A-F ranges, menus, daily production and packing procedures, and allergy/preparation handling. |
| Transport lead | Confirms address/zone information, groups stops, assigns riders, and follows up on delivery exceptions. |
| Rider | Uses the assigned mobile workflow to complete stops and report accurate delivery status. |
| Named technical owner | Maintains deployments, Supabase database/access rules, outside-service settings, mobile builds, backups, and incident response. This can be the developer or another provider appointed by the Director. |
| Finance owner | Reconciles Tap settlements, cash receipts, refunds/disputes, receipts, and accounting records. |

One person may hold more than one business role, but the system should still use individual named accounts. Do not give a role more customer, health, payment, or address information than its work requires.

## Handover actions and evidence

Use the checklist in **07 - Launch Checklist and Known Limits** as the acceptance record. For each item, the assigned owner records Pass, Fail, or Not tested, the date, and a safe evidence reference. A passing visual check alone is not sufficient for payment, role security, scheduled jobs, backups, or store builds.

The first acceptance should confirm: the Director can access and recover the provider accounts; each role can sign into the right workspace; the customer flow respects the package limits; menu publishing and the Thursday/Saturday schedule work in the live database; Kitchen can see day totals and relevant safety notes; Transport can resolve zones and assign a single stop per customer/day; a payment is reconciled exactly once; and Arabic and mobile layouts have been reviewed on the intended devices.

Do not use live customer data as test data. Demo customers are synthetic, unpaid records and must remain excluded from financial revenue. Do not delete live data for a demonstration. Use a test account or a clearly marked demo dataset, then clean up only the records identified as demo.

## The words used in this handover

- **Service day / service week:** The day or Saturday-starting week for which meals are prepared and delivered. This is separate from the calendar date on which a monthly package is purchased.
- **Meal period / meal slot:** A meal category such as breakfast, lunch, dinner, or snack on a given service day. Package limits decide which periods the customer can select.
- **Kitchen's choice:** The kitchen-selected default meal for a slot. It is preselected for the customer where available and can fill a missed choice after the weekly deadline if the production schedule is configured.
- **Zone:** The delivery area used to group customer stops and assign riders. A map lookup can suggest a zone; a suggestion still needs review when blank or uncertain.
- **Portion class A-F:** The kitchen's agreed portion band for an individual packed meal. The business must provide the gram range for each letter. The range is not a medically prescribed serving size.
- **Recipe quantity:** The ingredient amount and unit assigned to one serving of a dish. Ingredient totals are calculated from these values, so inaccurate recipes produce inaccurate purchasing estimates.
- **Production total:** The daily aggregate of dishes/meals/portion counts needed by Kitchen. It is deliberately different from the customer-by-customer Packing list.
- **Supabase:** The platform's sign-in, database, file storage, server-side functions, access rules, and scheduled jobs.
- **Vercel:** The hosting/deployment service for the public website and web operations portal.
- **Edge Function:** Server-side code hosted by Supabase. It keeps payment and email secrets off the customer app.
- **RLS (row-level security):** Database rules that decide which records each signed-in role may read or change. Hiding a screen tab is not a replacement for these rules.

## Records, scope, and separate agreements

This handover explains the software and operational setup; it is not a price list, a payment guarantee, a support SLA, or legal advice. The fee, license, referral, ownership, support, maintenance, and app-store responsibilities are governed by the signed commercial agreements. The supplied agreements were described as drafts with blanks; complete and reconcile them before signing. This manual does not fill in missing contract terms.

### Legal documents for customers: obtain Qatar-qualified advice

Before inviting live customers to rely on the service, appoint a Qatar-qualified lawyer to prepare or review two separate customer-facing documents: the **Terms and Conditions** and the **Privacy Policy/Privacy Notice**. Qatar has a Personal Data Privacy Protection Law, and the Ministry has published guidance for organizations on their data-protection responsibilities. The lawyer should confirm which requirements apply to Triangle Healthy Kitchen's actual business and data flows; this handover is an operational brief, not a legal opinion or a substitute for counsel.

The lawyer will need the Director's decisions and accurate descriptions of how the service operates. Ask counsel to cover at least the following:

| Document | What it is for | Topics for the Director and lawyer to resolve |
|---|---|---|
| Customer Terms and Conditions | Set the rules customers accept when they create an account, subscribe, pay, and receive the service. | Package duration and included meal periods; menu choices, Thursday cutoff, Saturday availability, and Kitchen's-choice defaults; Friday add-on price and included service; online payment, manual reconciliation, cash collection and activation; renewals, cancellations, pauses, refunds, failed/duplicate payments and disputes; delivery days, one-stop daily delivery, delivery zones and customer address duties; allergy and preparation-note handling; food, nutrition, and health disclaimers; missed/late delivery and complaint handling; account suspension, closure, and record retention. Confirm every rule against the actual approved offer and production configuration before publishing it. |
| Privacy Policy / Privacy Notice | Explain what personal information is collected, why it is used, who receives it, how long it is kept, and how a person can ask questions or exercise applicable rights. | Identity and contact information; profile and health-related information such as age, weight, height, goals, optional BMI/health reports and health-platform data; allergies and kitchen notes; delivery address, map location and inferred zone; subscription, payment-reference, support and booking records; purposes and legal basis/consent as counsel advises; optional versus required fields; access by staff roles; providers and integrations (including Supabase, Vercel, Brevo, Tap, Firebase, mapping/geocoding, Apple Health and Health Connect where enabled); provider locations and any cross-border processing; retention, deletion and backups; security and incident contact; marketing messages and opt-out; customer privacy contact and request process. Verify the live provider list, data locations, settings, and retention behavior instead of promising unverified practices. |

Have counsel confirm the relationship between Triangle Healthy Kitchen and each technology provider, review the actual collection and sharing flows, and advise whether additional notices, consent wording, records, or provider terms are needed. The Director must decide the business policies that the lawyer cannot infer, including cancellation/refund rules, support contact, retention schedule, and the customer-facing company identity and address. Publish the approved versions in both English and Arabic if both languages are offered, and keep dated copies of each published version.

### Labor fee and the boundary for future work

The labor amount is to be completed by the developer before negotiation and agreed in the signed labor/commercial agreement. Define it as payment for the work completed through a specific scope and cutoff date, with the delivered items and acceptance conditions named in that agreement. Do not leave the amount blank in the version presented for signature.

Any work requested after that cutoff—including new features, revisions beyond the agreed handover corrections, provider configuration, app-store submission, or ongoing maintenance—must be separately described, estimated, and approved in writing before it starts. The agreement should say how such work is priced and what happens if it is declined. This prevents an open-ended promise to continue developing for an uncertain fee or referral outcome. Keep the package valuation/waiver, labor fee, referral arrangement, license, and ongoing services clearly distinguished and make their cross-references consistent across the signed agreements.

This documentation bundle does not contain source code, customer exports, provider passwords or API keys, Firebase configuration, mobile signing keys, recovery codes, or signed commercial agreements. Those items belong in the client-owned repository/provider accounts and approved secure storage.

## Director's handover record

| Record | Complete together |
|---|---|
| Director / authorized owner | Name: ______________________________  Date: __________ |
| Business operating lead | Name: ______________________________  Date: __________ |
| Named technical owner | Name: ______________________________  Date: __________ |
| Finance/payment owner | Name: ______________________________  Date: __________ |
| Kitchen lead sign-off | Name: ______________________________  Date: __________ |
| Transport lead sign-off | Name: ______________________________  Date: __________ |
| Items accepted | Checklist/reference: __________________________________________ |
| Items still open | Checklist/reference and owner: _________________________________ |
| Support/maintenance agreement | Document/reference: __________________________________________ |
