# Parts Hub Express go-live runbook

For the handover session with ACBG. Work top to bottom and tick as you go. Details behind each step: architecture/odoo_api_sync.md and architecture/payments_and_email.md.

**Keys rule for the whole session.** ACBG creates every key in their own account. Type keys straight into Vercel, GitHub or the local `.env` file by hand. Never paste a key into Antigravity's agent chat or any AI prompt (it goes to the model provider and can stay in chat history), never into Slack or email, never into a committed file.

---

## 0. Decisions to settle before or at the start

| # | Decision | Answer |
|---|---|---|
| 1 | Odoo edition and plan (Online needs the Custom plan for API access; Odoo.sh or self-hosted is fine) | |
| 2 | Odoo version (19 uses `json2`; 17 and 18 use `jsonrpc`) | |
| 3 | Do Odoo list prices include GST? (usually no: `ODOO_PRICES_INCLUDE_GST=0`) | |
| 4 | Which products can be bought online? (priced and "Can be sold" in Odoo; the rest stay Price on request) | |
| 5 | Freight: Stripe shipping rates, or "confirmed by our team after your order" (current default) | |
| 6 | GST at checkout: Stripe Tax (`STRIPE_AUTOMATIC_TAX=1`) or GST inclusive prices with Odoo issuing the tax invoice (`0`) | |
| 7 | Paid orders: leave as quotations for ACBG to confirm (`ODOO_CONFIRM_PAID_ORDERS=0`) or confirm automatically (`1`) | |
| 8 | Sell beyond stock on hand? (`ALLOW_BACKORDER=0` blocks short lines) | |
| 9 | Inbox for quotes and trade applications (`ENQUIRY_TO_EMAIL`); inbox for order notices and alerts (`ORDER_NOTIFY_EMAIL`) | |
| 10 | Company name spelling, ABN, phone, email, hours, dispatch address | |
| 11 | Terms, privacy and refund policy text; reviews and star ratings; the logo; part photos | |

## 1. Before the meeting (Jared)

- [ ] Send ACBG the decisions table and ask them to have these logins ready: Odoo admin, Stripe (or ABN, bank account and ID to open one), a company email for Resend, the domain registrar or DNS host for partshubexpress.com, GitHub, Vercel.
- [ ] Your laptop: Antigravity, Node 20 or later, Python 3.12, Git, and access to the private repository.
- [ ] Run `python3 tools/test_integrations.py` once and confirm every check passes.

## 2. Ownership (15 minutes)

- [ ] **GitHub:** transfer the private repository to ACBG's GitHub organisation (Settings, Danger Zone, Transfer), or create the organisation first. Keep Jared as an admin.
- [ ] **Vercel:** transfer project `partshub` to ACBG's Vercel team (Project Settings, Advanced, Transfer), or create it fresh in their team.
- [ ] **Connect Git in Vercel:** connect the repository with **Root Directory `site`**. From then on every push deploys, including the nightly catalogue sync.

## 3. Open the project (5 minutes)

- [ ] Clone the repository and open it in Antigravity.
- [ ] In a terminal: `cd site && npm install`.
- [ ] Copy `.env.example` to `.env` at the project root. Copy `site/.env.example` to `site/.env.local` only if you will test the site locally. Both files are ignored by Git.

## 4. Odoo (20 minutes)

- [ ] **Integration user:** in Odoo, create an internal user "Parts Hub Express API" with these rights and nothing more: read products and stock, create contacts, create sales orders.
- [ ] **API key:** logged in as that user, go to Preferences, Account Security, New API Key. Give it a description and the longest duration allowed (three months at most). Copy it once.
- [ ] **Local `.env`:** fill in `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN` (the user's login email), `ODOO_API_KEY`, `ODOO_TRANSPORT` and `ODOO_PRICES_INCLUDE_GST`.
- [ ] **Handshake:** run `python3 tools/handshake_odoo.py` and confirm every line is PASS. If the transport line fails, switch `ODOO_TRANSPORT`.
- [ ] **First pull:** run `python3 tools/odoo_pull.py`, then `python3 tools/build_catalogue.py --source odoo`.
  - The product count should match Odoo, less the excluded groups.
  - Spot check five SKUs for price including GST and stock.
- [ ] **GitHub secrets:** in GitHub, Settings, Secrets and variables, Actions, add the secrets `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY` and `ODOO_TRANSPORT`, and the variable `ODOO_PRICES_INCLUDE_GST`.
- [ ] **First sync:** in the Actions tab, open "Odoo catalogue sync" and choose Run workflow. Confirm it commits and Vercel redeploys. After this it runs at 6am AEST every day.

## 5. Resend (15 minutes, plus DNS propagation)

- [ ] **Domain:** in Resend, add the domain `partshubexpress.com`. At the DNS host, add the records Resend lists (SPF and DKIM TXT records, bounce MX record). Also add a DMARC record: `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:<ACBG inbox>`. Press Verify.
- [ ] **API key:** create one named "partshubexpress-site" with Sending access, limited to that domain.
- [ ] **Local `.env`:** fill in `RESEND_API_KEY`, `ORDER_FROM_EMAIL` (for example `Parts Hub Express <orders@partshubexpress.com>`) and `ENQUIRY_TO_EMAIL`.
- [ ] **Test email:** run `python3 tools/handshake_resend.py --send` and check the test email arrives.
- [ ] **Audience (optional):** create an Audience for email signups and note its id for `RESEND_AUDIENCE_ID`.

## 6. Stripe, test mode first (30 minutes)

- [ ] **Account:** confirm the Stripe account is ACBG's: business details, ABN, bank account, and a statement descriptor such as PARTSHUBEXPRESS.
- [ ] **GST:** if decision 6 is Stripe Tax, register Australian GST in Stripe Tax.
- [ ] **Freight:** if decision 5 is shipping rates, create them and note their ids.
- [ ] **Test key (test mode):** Developers, API keys, create a restricted key with write access to Checkout Sessions, Payment Intents, Products and Prices.
- [ ] **Test webhook:** Developers, Webhooks, add endpoint `https://<preview address>/api/stripe/webhook` with the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy the signing secret.
- [ ] **Vercel Preview environment:** set the test `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, plus every Odoo and Resend variable (section 7). Redeploy.
- [ ] **Handshake:** run `python3 tools/handshake_stripe.py` with the test key in `.env`.
- [ ] **Test purchase:** buy a priced, in-stock part with card 4242 4242 4242 4242, any future date, any CVC. Check each of these:
  - a quotation appears in Odoo with the Stripe session id as the customer reference, the right product, quantity and price
  - the buyer email arrives
  - the ACBG notice arrives
  - the cart clears
- [ ] **Declined card:** try 4000 0000 0000 0002 and confirm checkout shows the decline and no order is created.
- [ ] **No duplicates:** in Stripe, open the webhook event and resend it. Confirm no second order and no second email.
- [ ] **Stock check:** put more of a part in the cart than Odoo holds. Checkout should name the part and stop.

## 7. Vercel environment variables (10 minutes)

Set in Vercel, Settings, Environment Variables. Use Preview for test keys and Production for live keys. Redeploy after changes.

| Variable | Production | Preview |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://partshubexpress.com` | the preview address |
| `SITE_LIVE` | `1` at launch | leave empty |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | live values | test values |
| `STRIPE_AUTOMATIC_TAX`, `STRIPE_SHIPPING_RATE_IDS` | per decisions 5 and 6 | same |
| `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY`, `ODOO_TRANSPORT` | real values | same (or a duplicate test database) |
| `ODOO_PRICES_INCLUDE_GST`, `ODOO_CONFIRM_PAID_ORDERS`, `ALLOW_BACKORDER` | per decisions 3, 7 and 8 | same |
| `RESEND_API_KEY`, `ORDER_FROM_EMAIL`, `ENQUIRY_TO_EMAIL`, `ORDER_NOTIFY_EMAIL`, `RESEND_AUDIENCE_ID` | real values | same |

Never set `STRIPE_API_BASE`, `RESEND_API_BASE` or `CATALOGUE_DIR` in Vercel. They exist only for the test harness.

## 8. Go live (15 minutes, plus DNS)

- [ ] **Domain:** in Vercel, Domains, add `partshubexpress.com` and `www.partshubexpress.com`. Add the DNS records Vercel shows at the DNS host.
- [ ] **Live Stripe:** in live mode, create the restricted key and a live webhook endpoint at `https://partshubexpress.com/api/stripe/webhook` (same two events). Put both in Vercel Production.
- [ ] **Launch variables:** set `NEXT_PUBLIC_SITE_URL=https://partshubexpress.com` and `SITE_LIVE=1` in Production. Redeploy.
- [ ] **Real purchase:** buy one low-value part with a real card. Confirm the Odoo order and emails, then refund it in Stripe and cancel the Odoo quotation.
- [ ] **Google:** in Google Search Console, verify the domain and submit `https://partshubexpress.com/sitemap.xml`.
- [ ] **Facebook card:** in the Facebook Sharing Debugger, scrape the homepage so the share card is fresh.
- [ ] **Company details:** once ACBG confirms their contact details, update `site/lib/company.ts` and set `contactConfirmed: true`.

## 9. After go-live

- [ ] **Key rotation:** calendar reminder every 90 days. Rotate the Odoo API key, update the GitHub secret and the Vercel variable, then rerun `tools/handshake_odoo.py`.
- [ ] **Who watches what:**
  - GitHub emails the repository owner if the nightly sync fails, including when the guardrail stops a big product drop.
  - ACBG's inbox gets "Order not yet in Odoo" alerts.
  - Stripe shows webhook failures.
- [ ] **Sign-offs still open:** logo approval and trade mark search, reviews, part photos, policies (see design/assets/content_to_confirm.md).

## Rollback

| Problem | Do this |
|---|---|
| Payments misbehaving | Remove `STRIPE_SECRET_KEY` in Vercel and redeploy. Checkout shows "Payments are not live yet"; quote requests keep working. |
| Bad catalogue sync | In GitHub, revert the sync commit (Vercel redeploys the previous catalogue). Disable the workflow until fixed. |
| Broken deploy | Vercel, Deployments, promote the previous deployment. |
| Paid order missing in Odoo | Read the alert email, fix the cause (expired key, missing product), then resend the event from the Stripe dashboard. |
