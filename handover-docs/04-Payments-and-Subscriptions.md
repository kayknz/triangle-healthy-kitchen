# Payments and Subscriptions

## Source of truth

The production `packages` records are the active source for package name, price, currency, meal periods, duration, and availability. The web/mobile code includes fallback package examples for resilience; those examples are not proof that current database values match them. Admin should verify packages in the web Subscriptions area before publishing prices.

Known business rules reflected in source/product decisions:

- Monthly subscriptions use 24 service days.
- The one-day and six-day trial offers provide three meals and one snack, subject to current package records.
- The additional 1,600 kcal offer is described as three meals plus two different snack choices at QAR 2,499; verify the active database record before quoting.
- Monthly Friday add-on is QAR 199 for Friday meals/selections and delivery for the month, not per Friday. Trials are excluded.

Do not use this document as a price list when the active database record or customer checkout shows a different current price.

## Tap online payments

### Intended flow

1. The customer chooses a package, menu, address, and Tap as payment method.
2. A server-side Supabase Edge Function creates the Tap charge using server secrets.
3. Tap returns the customer to `/payment/callback?tap_id=...`; a webhook/callback updates the transaction and plan state.
4. The customer app waits for captured status. A captured payment activates the plan; a pending result stays pending.

### If the return page loops or says pending

1. Do not make the customer purchase again immediately.
2. Record the customer account email and exact Tap reference/charge ID, amount, currency, and time. Do not copy card data.
3. Check the exact charge in the Tap dashboard and the web **Payments** event log.
4. If the Tap dashboard confirms that exact charge is captured and amount/currency match the transaction, a CEO/Admin may use **Verify captured in Tap**. That is a privileged manual reconciliation action, not a substitute for looking up the charge.
5. If not captured, failed, or mismatched, leave the plan unactivated and resolve through the payment provider.
6. Ask the customer to sign in again and refresh plan status after the review. The auth layer rechecks server-side subscription access when the page regains focus.

Tap checkout and manual reconciliation code exist. This handover review does not certify live merchant credentials, Tap account configuration, deployed webhook delivery, refund/dispute handling, or a successful production end-to-end payment. Perform a low-value authorized live transaction and reconcile/refund it under an approved process before launch.

## Cash collection

1. Customer chooses cash and submits the subscription request.
2. The payment transaction is pending; the plan remains inactive.
3. Staff contacts the customer and collects the full amount before the plan begins.
4. Only after receiving the cash, a CEO/Admin opens **Payments** and clicks **Confirm cash received** for that transaction.
5. The database function checks payment method, status, package amount/currency, and authorized staff role; it activates the plan and writes an audit event.
6. Reconcile physical cash against the system report according to Triangle Healthy Kitchen’s bookkeeping process.

Never verify cash because a customer says it was handed over; verify only after the responsible employee confirms actual collection. Do not let Kitchen or Transport approve a cash transaction.

## Demo records

Demo customers are synthetic and unpaid. Admin/CEO can activate them for kitchen/routing previews where supported. Activation must not be treated as payment, cash collection, or real revenue. Keep demo records clearly marked in operations and exclude them from financial reports.

## Payment provider and notification setup

- Tap is the only online checkout integration evidenced by the reviewed current product source. No Sadad implementation was found.
- Tap account keys and merchant settings are stored server-side through Supabase-managed secrets/vault access; never enter them into client code or this documentation.
- Brevo-backed functions send operational email/reminders; the sender identity, API secret, domain verification, suppression handling, and production cron invocation must be checked.
- Payment settlement, refunds, chargebacks, tax/accounting, and cash reconciliation procedures remain Triangle Healthy Kitchen’s financial responsibility unless a signed services agreement says otherwise.
