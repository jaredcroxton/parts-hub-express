# Parts Hub Express go-live runbook

For the handover session with ACBG. Work top to bottom and tick as you go. Details behind each step: architecture/odoo_api_sync.md, architecture/payments_and_email.md and architecture/storefront.md (Deployment).

**Keys rule for the whole session.** ACBG creates every key in their own account. Type keys straight into Vercel, GitHub or the local `.env` file by hand. Never paste a key into Antigravity's agent chat or any AI prompt (it goes to the model provider and can stay in chat history), never into Slack, never into a committed file. The Resend key arriving by email is the agreed exception.

**Nothing to install on ACBG's laptop.** The site runs on Vercel, the nightly catalogue sync runs on GitHub, paid orders go straight into Odoo. ACBG needs a browser, their logins and their phone for two-factor codes. Only Jared's laptop runs code (handshake scripts, first pull), and even that is optional.

**Order for the day.** Company details first (section 2), because a launch build refuses placeholder contacts. Then ownership, Odoo, Resend and DNS, Stripe test, go live. Add the Resend DNS records early; they can take up to an hour to verify.

Checked 2026-09-29 on the preview: 6,569 pages and 1,157 images crawled, no broken links or images, every part number and superseded number resolves, integration tests 60 of 60. The remaining dead ends are the placeholders this runbook replaces: the 1300 000 000 number, the `sales@` address with no mailbox, and the quote, trade and signup forms, which switch on with Resend.

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
| 11 | Terms, privacy, refund, returns and shipping policy text; the logo; part photos | |
| 12 | The two homepage reviews (John Smith, Alice Jones): real customers, real names, the rating each gave? Unconfirmed reviews hide automatically at launch | |
| 13 | Email address shown on the site. `sales@partshubexpress.com` has no mailbox today (the domain has no MX records), so mail to it bounces. Set up a mailbox or forwarding on the domain, or show an existing address | |
| 14 | Odoo API user: a dedicated "Parts Hub Express API" user normally costs one Odoo user licence. An existing user's key avoids that but gives the site that user's full rights | |

## 1. Before the meeting (Jared)

- [ ] ACBG has these logins ready, each on a company email address with two-factor on: Odoo admin, Stripe (or ABN, bank account and ID to open one), Resend, Crazy Domains, GitHub (free personal account), Vercel (Pro, see section 3).
- [ ] Your laptop: Node 20 or later, Python 3.12, Git, the Vercel CLI, access to the private repository.
- [ ] Run `python3 tools/test_integrations.py` once and confirm every check passes.
- [ ] Commit and push, so GitHub holds the final code before the transfer.

## 2. Company details first (10 minutes)

- [ ] Put the confirmed name, phone, email, ABN, hours and dispatch address in `site/lib/company.ts` and set `contactConfirmed: true`. Until then every page shows the placeholder 1300 000 000 number (footer, the Call button on all 4,555 product pages, cart, quote, trade, terms, privacy), and a build with `SITE_LIVE=1` fails on purpose.
- [ ] Reviews: set `"verified_by_client": true` on each review ACBG confirms (correct the name, company and rating where needed) and delete the rest from `site/data/reviews.json`. At launch the homepage shows only verified reviews.
- [ ] Commit and push.

## 3. Ownership (20 minutes)

- [ ] **Vercel plan.** ACBG's Vercel team must be on Pro (US$20 a month plus tax, one deploying seat included). Vercel's Hobby plan is for non-commercial personal use only, and a site that takes payment or advertises products counts as commercial.
- [ ] **GitHub.** The repository stays in Jared's personal GitHub account (Jared, 2026-09-30). Add ACBG as a collaborator (Settings, Collaborators, Add people) and have them accept the invite. On ACBG's machine, `git clone` it; never copy Jared's project folder, which holds Jared's own `.env` and `.tmp`. Keep it on a personal account, not an organisation: on an organisation's private repository Vercel deploys a commit only if its author is a member of the Vercel team, and Vercel documents that this check does not apply to collaborators on personal accounts. The nightly sync runs on Jared's GitHub Actions minutes; if the relationship ends, transfer the repository to ACBG.
- [ ] **Vercel project.** Easiest: ACBG imports the repository as a new project (Add New, Project, Import) with **Root Directory `site`**. `site/vercel.json` sets the framework. If the repository does not appear in the import list, Jared installs the Vercel GitHub app on his account with access to this repository (only the owner can). Transferring Jared's existing project instead requires Jared to be a member of ACBG's team first.
- [ ] **Preview address.** Once ACBG's project builds, remove `partshubexpress.vercel.app` from Jared's project (Settings, Domains), add it to ACBG's project, then pause Jared's project. Stripe's test webhook and `NEXT_PUBLIC_SITE_URL` use this address until the real domain is connected.
- [ ] **Jared's ongoing access.** Code changes need only GitHub: push to `main` and Vercel deploys. For Vercel settings, pick one:
  - a Member seat (US$20 a month, Jared's own login, removable any time);
  - a free Viewer seat (read only, cannot deploy or change settings);
  - an access token ACBG creates (Account Settings, Tokens), scoped to their team, with an expiry date. A token acts as ACBG's own login with full power over the team (deploys, variables, domains, deleting projects), so keep it in a password manager and revoke it when support ends.

## 4. Jared's laptop (optional, 5 minutes)

Only needed to run the handshake scripts and the first catalogue pull by hand. The "Run workflow" button in section 5 does the pull without it.

- [ ] Clone the repository with `git clone` (never a folder copy). In a terminal: `cd site && npm install`.
- [ ] Copy `.env.example` to `.env` at the project root. Both `.env` files are ignored by Git. Clear the keys out of it at the end of the day; the working copies live in Vercel and GitHub.

## 5. Odoo (20 minutes)

- [ ] **Integration user:** in Odoo, create an internal user "Parts Hub Express API" with these rights and nothing more: read products and stock, create contacts, create sales orders (decision 14).
- [ ] **API key:** logged in as that user, go to Preferences, Account Security, New API Key. Give it a description and the longest duration allowed (three months at most). Copy it once.
- [ ] **Local `.env`:** fill in `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN` (the user's login email), `ODOO_API_KEY`, `ODOO_TRANSPORT` and `ODOO_PRICES_INCLUDE_GST`.
- [ ] **Handshake:** run `python3 tools/handshake_odoo.py` and confirm every line is PASS. If the transport line fails, switch `ODOO_TRANSPORT`.
- [ ] **First pull:** run `python3 tools/odoo_pull.py`, then `python3 tools/build_catalogue.py --source odoo`.
  - The product count should match Odoo, less the excluded groups. Today's catalogue has 4,555 active products from the export. If Odoo's count is more than 20 percent lower the build stops and writes nothing; check why in Odoo, and if the lower count is right, rerun with `--allow-drop`.
  - Spot check five SKUs for price including GST and stock. Today no product has a price, so every part is quote only until this pull lands.
- [ ] **GitHub secrets:** in GitHub, Settings, Secrets and variables, Actions, add the secrets `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY` and `ODOO_TRANSPORT`, and the variable `ODOO_PRICES_INCLUDE_GST`. GitHub lets collaborators on a personal repository add these; if it refuses, Jared adds them as owner.
- [ ] **First sync:** in the Actions tab, open "Odoo catalogue sync" and choose Run workflow (tick "Allow active products to drop" only after the check above). Confirm it commits, then in Vercel, Deployments, confirm that commit **built**. If it shows as blocked, the repository is in an organisation (section 3). After this it runs at 6am AEST every day.

## 6. Resend and DNS at Crazy Domains (15 minutes, plus propagation)

Today partshubexpress.com shows the Crazy Domains parking page (A record 27.124.125.171 on the root and www, Crazy Domains nameservers) and has no MX, SPF or DMARC records, so there is no existing email to break. Keep the Crazy Domains nameservers; only add or change records.

- [ ] **Domain:** in Resend, add the domain `partshubexpress.com`. At Crazy Domains, add the records Resend lists (DKIM at `resend._domainkey`, MX and SPF on the `send` subdomain). Also add a DMARC record: `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:<ACBG inbox>`. Press Verify.
- [ ] **API key:** one named "partshubexpress-site" with Sending access, limited to that domain.
- [ ] **Local `.env`:** fill in `RESEND_API_KEY`, `ORDER_FROM_EMAIL` (for example `Parts Hub Express <orders@partshubexpress.com>`) and `ENQUIRY_TO_EMAIL`.
- [ ] **Test email:** run `python3 tools/handshake_resend.py --send` and check the test email arrives.
- [ ] **Site mailbox (decision 13):** if the site shows an address on this domain, set up the mailbox or forwarding now. Its MX and SPF records sit on the root domain and do not clash with Resend's, which sit on `send`.
- [ ] **Audience (optional):** create an Audience for email signups and note its id for `RESEND_AUDIENCE_ID`.

## 7. Stripe, test mode first (30 minutes)

Test on the production address, `https://partshubexpress.vercel.app`, not a preview URL. Vercel's standard Deployment Protection puts preview and generated deployment URLs behind a Vercel login, so Stripe's webhook calls to them fail with 401.

- [ ] **Account:** confirm the Stripe account is ACBG's: business details, ABN, bank account, and a statement descriptor such as PARTSHUBEXPRESS. Stripe reviews the website for contact details and refund, returns, shipping and cancellation policies; the terms and privacy pages are placeholders today, so expect Stripe to ask for that text (decision 11) before payouts.
- [ ] **GST:** if decision 6 is Stripe Tax, register Australian GST in Stripe Tax.
- [ ] **Freight:** if decision 5 is shipping rates, create them and note their ids.
- [ ] **Test key (test mode):** Developers, API keys, create a restricted key with write access to Checkout Sessions, Payment Intents, Products and Prices.
- [ ] **Test webhook:** Developers, Webhooks, add endpoint `https://partshubexpress.vercel.app/api/stripe/webhook` with the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy the signing secret.
- [ ] **Vercel Production environment:** set the test `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, plus every Odoo and Resend variable (section 8). Redeploy. The site is still noindex while it runs on test keys.
- [ ] **Handshake:** run `python3 tools/handshake_stripe.py` with the test key in `.env`.
- [ ] **Test purchase:** buy a priced, in-stock part (priced parts exist only after the first Odoo sync) with card 4242 4242 4242 4242, any future date, any CVC. Check each of these:
  - a quotation appears in Odoo with the Stripe session id as the customer reference, the right product, quantity and price
  - the buyer email arrives
  - the ACBG notice arrives
  - the cart clears
- [ ] **Declined card:** try 4000 0000 0000 0002 and confirm checkout shows the decline and no order is created.
- [ ] **No duplicates:** in Stripe, open the webhook event and resend it. Confirm no second order and no second email.
- [ ] **Stock check:** put more of a part in the cart than Odoo holds. Checkout should name the part and stop.
- [ ] **Quote form:** send one quote request from the site and confirm it lands in the `ENQUIRY_TO_EMAIL` inbox with reply-to set to the buyer.
- [ ] Cancel the test quotations in Odoo.

## 8. Vercel environment variables (10 minutes)

Set in Vercel, Settings, Environment Variables, on the Production environment. Redeploy after every change; variables apply only to new deployments.

| Variable | While testing | At launch |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://partshubexpress.vercel.app` | `https://partshubexpress.com` |
| `SITE_LIVE` | leave empty | `1` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | test values | live values |
| `STRIPE_AUTOMATIC_TAX`, `STRIPE_SHIPPING_RATE_IDS` | per decisions 5 and 6 | same |
| `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY`, `ODOO_TRANSPORT` | real values | same |
| `ODOO_PRICES_INCLUDE_GST`, `ODOO_CONFIRM_PAID_ORDERS`, `ALLOW_BACKORDER` | per decisions 3, 7 and 8 | same |
| `RESEND_API_KEY`, `ORDER_FROM_EMAIL`, `ENQUIRY_TO_EMAIL`, `ORDER_NOTIFY_EMAIL`, `RESEND_AUDIENCE_ID` | real values | same |

Never set `STRIPE_API_BASE`, `RESEND_API_BASE`, `CATALOGUE_DIR` or `NEXT_PUBLIC_SHOW_SAMPLE_REVIEWS` in Vercel. They exist only for the test harness and local previews.

## 9. Go live (15 minutes, plus DNS)

- [ ] **Company details:** confirmed and pushed (section 2). The launch build fails without them.
- [ ] **Domain:** in Vercel, Domains, add `partshubexpress.com` and `www.partshubexpress.com`. At Crazy Domains, replace the parking A record (27.124.125.171) on the root and on www with the exact records Vercel shows, and turn off any Crazy Domains parking or forwarding on the domain. Wait until Vercel shows Valid Configuration and has issued the certificate.
- [ ] **Live Stripe:** in live mode, create the restricted key and a live webhook endpoint at `https://partshubexpress.com/api/stripe/webhook` (same two events). Put both in Vercel Production.
- [ ] **Launch variables:** set `NEXT_PUBLIC_SITE_URL=https://partshubexpress.com` and `SITE_LIVE=1` in Production. Redeploy.
- [ ] **Real purchase:** buy one low-value part with a real card. Confirm the Odoo order and emails, then refund it in Stripe and cancel the Odoo quotation.
- [ ] **Google:** in Google Search Console, verify the domain and submit `https://partshubexpress.com/sitemap.xml`.
- [ ] **Facebook card:** in the Facebook Sharing Debugger, scrape the homepage so the share card is fresh.

## 10. After go-live

- [ ] **Next morning:** confirm the 6am sync ran in GitHub Actions and Vercel built its commit.
- [ ] **Key rotation:** calendar reminder every 90 days. Rotate the Odoo API key, update the GitHub secret and the Vercel variable, then rerun `tools/handshake_odoo.py`. Replace the Resend key that came by email with a fresh one.
- [ ] **Domain:** auto-renew and domain lock on at Crazy Domains. The registration expires 2027-09-07.
- [ ] **Who watches what:**
  - GitHub emails the repository owner if the nightly sync fails, including when the guardrail stops a big product drop.
  - ACBG's inbox gets "Order not yet in Odoo" alerts.
  - Stripe shows webhook failures, and emails if its website review needs anything.
- [ ] **Sign-offs still open:** logo approval and trade mark search, part photos, policies (see design/assets/content_to_confirm.md).

## Rollback

| Problem | Do this |
|---|---|
| Payments misbehaving | Remove `STRIPE_SECRET_KEY` in Vercel and redeploy. Checkout shows "Payments are not live yet"; quote requests keep working. |
| Bad catalogue sync | In GitHub, revert the sync commit (Vercel redeploys the previous catalogue). Disable the workflow until fixed. |
| Broken deploy | Vercel, Deployments, promote the previous deployment. |
| Launch build fails | Read the build log. "placeholder contact details" means `site/lib/company.ts` still needs section 2. The previous deployment keeps serving meanwhile. |
| Paid order missing in Odoo | Read the alert email, fix the cause (expired key, missing product), then resend the event from the Stripe dashboard. |
