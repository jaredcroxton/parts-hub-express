# SOP: payments (Stripe) and email (Resend)

Layer 1 SOP. Written 2026-09-15, before the code. Companion to architecture/odoo_api_sync.md (catalogue sync, stock check, order push).

## Goal

A buyer pays for priced parts through Stripe Checkout. The paid order lands in Odoo as a sale order, the buyer gets a confirmation email, and ACBG gets a notification. Quote requests, trade applications and email signups reach ACBG by email. No site database; nothing is lost when a service is briefly down.

## Ownership

Every account is ACBG's: Stripe, Resend, the domain and DNS, the Odoo integration user, the Vercel project and the GitHub repository. Jared is added as a member. Keys are created by ACBG, typed straight into Vercel or GitHub secret fields, and never pasted into an AI chat or committed to Git.

## Environment variables

Site runtime (Vercel, Production and Preview; `site/.env.local` for local testing only):

| Variable | Purpose | Example or values |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs for Stripe return pages, share cards, sitemap | `https://partshubexpress.com` |
| `SITE_LIVE` | `1` only on the real domain at launch (indexing on) | `1` |
| `STRIPE_SECRET_KEY` | Checkout Sessions, line items, PaymentIntent metadata | `rk_live_...` restricted key, or `rk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures | `whsec_...` |
| `STRIPE_AUTOMATIC_TAX` | `1` turns on Stripe Tax (needs Stripe Tax set up for Australian GST); default off, prices charged as GST inclusive | `0` |
| `STRIPE_SHIPPING_RATE_IDS` | Optional Stripe shipping rates offered at checkout, comma separated | `shr_...,shr_...` |
| `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY`, `ODOO_TRANSPORT` | Stock check and order push | `json2` or `jsonrpc` |
| `ODOO_PRICES_INCLUDE_GST` | `0` when Odoo list prices exclude GST (Australian default) | `0` |
| `ODOO_CONFIRM_PAID_ORDERS` | `1` confirms the sale order automatically after payment | `0` |
| `ALLOW_BACKORDER` | `1` lets checkout sell more than Odoo has in stock | `0` |
| `RESEND_API_KEY` | Sending email | `re_...` sending-only key |
| `ORDER_FROM_EMAIL` | Sender for every email | `Parts Hub Express <orders@partshubexpress.com>` |
| `ENQUIRY_TO_EMAIL` | ACBG inbox for quotes, trade applications, order notices and alerts | `sales@...` |
| `ORDER_NOTIFY_EMAIL` | Optional separate inbox for order notices and alerts | defaults to `ENQUIRY_TO_EMAIL` |
| `RESEND_AUDIENCE_ID` | Optional audience for email signups | uuid |

GitHub Actions (repository secrets): `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY`, `ODOO_TRANSPORT`; repository variable `ODOO_PRICES_INCLUDE_GST`.

Test seams, never set in production: `STRIPE_API_BASE`, `RESEND_API_BASE`, `CATALOGUE_DIR` (used by `tools/test_integrations.py` to point the site at `tools/mock_services.py`).

## Stripe Checkout (`site/app/api/checkout`)

1. Read the cart, merge duplicate SKUs, clamp quantities 1 to 999.
2. Resolve each SKU in the catalogue. Only active products with a price reach Stripe; prices come from the catalogue on the server, never from the browser.
3. Stock check against Odoo (odoo_api_sync.md). Short, archived or not-for-sale lines block checkout with the part named.
4. Create the session: `mode=payment`, `currency=aud`, inline `price_data` with `tax_behavior=inclusive`, product metadata `sku` and `cart_sku`, billing address required, shipping address limited to Australia, phone number collection, `customer_creation=always`, a submit note that freight and dispatch are confirmed by ACBG after the order, shipping rates when `STRIPE_SHIPPING_RATE_IDS` is set, and automatic tax only when `STRIPE_AUTOMATIC_TAX=1`.
5. Success returns to `/cart?paid=1&session_id=...`, where `/api/checkout/verify` confirms payment with Stripe before the cart clears.

Restricted key permissions to start with: write on Checkout Sessions, Payment Intents, Products and Prices (inline line items create them). `tools/handshake_stripe.py` reports a missing permission.

## Webhook (`site/app/api/stripe/webhook`)

- Endpoint: `https://<domain>/api/stripe/webhook`. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`.
- Verify the `Stripe-Signature` header (HMAC SHA256, 5 minute tolerance). Reject anything else with 400.
- Act only on `payment_status=paid`. Order push steps are in odoo_api_sync.md: idempotent on the session id, emails once, returns 500 on failure so Stripe retries for up to three days, alert email to ACBG on each failure.
- Locally: `stripe listen --forward-to localhost:3105/api/stripe/webhook`, and put the printed `whsec_` in `site/.env.local`.

## Email (Resend)

Domain: verify `partshubexpress.com` in Resend (the SPF and DKIM TXT records plus the bounce MX record Resend lists; add a DMARC record). Use a sending-only API key restricted to that domain.

| Email | To | Trigger | Notes |
|---|---|---|---|
| Quote request | `ENQUIRY_TO_EMAIL`, reply-to the buyer | `/api/quote` type quote | All form fields |
| Trade account application | `ENQUIRY_TO_EMAIL`, reply-to the applicant | `/api/quote` type trade | All form fields |
| Order confirmation | Buyer | Paid order pushed to Odoo | Odoo order number, lines with SKU and quantity, total paid incl GST, the GST amount, "freight and dispatch confirmed by our team" |
| New order notice | `ORDER_NOTIFY_EMAIL` | Same | Odoo order number and link, Stripe payment id, buyer details |
| Order failure alert | `ORDER_NOTIFY_EMAIL` | Webhook could not push to Odoo | Stripe session id, error, "Stripe will retry" |
| Email signup | Resend audience | `/api/subscribe` | Only when `RESEND_AUDIENCE_ID` is set |

No em dashes and no marketing claims ACBG has not confirmed (dispatch times, stock promises) in any email.

## Handshakes and tests

- `python3 tools/handshake_odoo.py`: version, transport, login, product count, the fields we read, access to create customers and sale orders.
- `python3 tools/handshake_stripe.py`: key mode (test or live), Checkout Session list access, webhook secret shape.
- `python3 tools/handshake_resend.py`: key and sender present; `--send` emails `ENQUIRY_TO_EMAIL` a test message.
- `python3 tools/test_integrations.py`: end to end against mock Odoo, Stripe and Resend. Pull, build, checkout (priced, short stock, unpriced), webhook (bad signature, paid order, retry without duplicate, Odoo down then recovered). No real keys, no real emails.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Checkout says payments are not live | `STRIPE_SECRET_KEY` missing | Set it in Vercel, redeploy |
| Stripe error on session create mentioning tax | `STRIPE_AUTOMATIC_TAX=1` without Stripe Tax set up | Set up Stripe Tax or set `0` |
| Webhook 400 "Bad signature" | Wrong `STRIPE_WEBHOOK_SECRET` (test vs live, or CLI secret) | Copy the endpoint's signing secret again |
| Paid order missing in Odoo | Odoo down, key expired, or product id mismatch | Check the alert email and Stripe webhook attempts; fix, then resend the event from the Stripe dashboard |
| Duplicate sale orders | Should not happen: idempotent on `client_order_ref` | Check the ref search still uses the session id |
| Emails not arriving | Domain not verified, or key lacks sending access | Resend dashboard, domain status and logs |
| Quote form says requests are not switched on | Neither the inbox file nor Resend recorded it (normal on Vercel without Resend) | Set the Resend variables |
