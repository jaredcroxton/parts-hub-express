# SOP: Odoo API sync (runtime path)

Layer 1 SOP for the path that feeds the website. Written 2026-09-14 from Odoo's own documentation (18.0 External API, 19.0 External JSON-2 API). Nothing in this SOP is from third-party blogs.

## Goal

Copy products, prices, stock and weights from Odoo into the website database on a schedule, push paid orders back into Odoo, and check stock for one order at checkout. No LLM in the loop. No public traffic reaching Odoo.

## Plan gate (Odoo's words)

"Access to data via the external API is only available on Custom Odoo pricing plans. Access to the external API is not available on One App Free or Standard plans."

Applies to Odoo Online only. Odoo.sh and self-hosted have no plan gate. Discovery Q17 decides.

## Two transports, pick by Odoo version

| Odoo version | Transport | Endpoint | Status |
|---|---|---|---|
| 19 and later | JSON-2 | `POST /json/2/<model>/<method>` | Current. Build against this. |
| 17, 18 | XML-RPC | `/xmlrpc/2/common`, `/xmlrpc/2/object` | Works. Scheduled for removal in Odoo 22 (2028). |
| 17, 18 | JSON-RPC | `POST /jsonrpc` (`common.authenticate`, `object.execute_kw`) | Same calls as XML-RPC in JSON. **This is what we build for 17 and 18** (no XML parsing in the site's TypeScript). |

Isolate the transport in one module so it can be swapped without touching the logic: `tools/odoo_client.py` for the sync tools, `site/lib/odoo.ts` for the site (stock check and order push). Select it with `ODOO_TRANSPORT=json2` (Odoo 19 and later) or `ODOO_TRANSPORT=jsonrpc` (17 and 18). `tools/handshake_odoo.py` reports which one the database answers.

## Authentication

- API key per user. Generated in Odoo under Preferences, Account Security, New API Key. Needs a description and a duration.
- **Keys expire. Maximum lifetime three months.** Odoo's docs: "long lasting keys must be rotated at least once every three months." The key is shown once at creation. Plan a rotation reminder in the maintenance log.
- JSON-2: send as `Authorization: bearer <key>`. Also send `X-Odoo-Database: <db>` (required when one server hosts several databases) and a `User-Agent` naming our software.
- XML-RPC: call `authenticate(db, login, api_key, {})` on `/xmlrpc/2/common` to get `uid`, then pass `db, uid, api_key` on every `execute_kw` call. The API key replaces the password.
- Dedicated Odoo user for the site: read on Products and Inventory, create on Sales. Nothing else.

## JSON-2 request shape

```
POST /json/2/product.product/search_read
Host: <odoo-host>
Authorization: bearer <api-key>
X-Odoo-Database: <db>
Content-Type: application/json; charset=utf-8
User-Agent: partshubexpress-sync

{
  "context": {"lang": "en_AU"},
  "domain": [["sale_ok", "=", true], ["active", "=", true]],
  "fields": ["id", "default_code", "name", "categ_id", "list_price", "qty_available", "weight", "image_1920", "write_date"],
  "limit": 500,
  "offset": 0,
  "order": "id asc"
}
```

Success: HTTP 200, body is the method's return value as JSON. Error: 4xx or 5xx with `{name, message, arguments, context, debug}`. A wrong key returns 401 with message "Invalid apikey".

Method parameters go in the body as named keys. `ids` is an array of record ids for methods that act on records, omitted for model-level methods like `search_read` and `create`.

## XML-RPC equivalent (Odoo 17 and 18)

```python
import xmlrpc.client

common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
uid = common.authenticate(db, login, api_key, {})
models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object")
rows = models.execute_kw(
    db, uid, api_key,
    "product.product", "search_read",
    [[["sale_ok", "=", True], ["active", "=", True]]],
    {"fields": ["id", "default_code", "name", "categ_id", "list_price",
                "qty_available", "weight", "image_1920", "write_date"],
     "limit": 500, "offset": 0, "order": "id asc"},
)
```

`execute_kw(db, uid, password, model, method, positional_args, keyword_args)`. Domain is the first positional arg. `fields`, `offset`, `limit`, `order` go in keyword args.

## Methods we use

| Method | Purpose | Notes |
|---|---|---|
| `search_read` | Pull catalogue, categories, stock | Preferred over `search` then `read`. One round trip, no missing-record race. |
| `search_count` | Sanity check row counts before and after a sync | Cheap. |
| `fields_get` | Confirm field names and types on the client's database | Run once at Link phase, store output in `.tmp/`. |
| `create` | Create `sale.order` and `sale.order.line` on paid checkout | Returns the new id. |
| `read` | Re-read one product's stock at checkout | `ids` plus `fields`. |

Never call `unlink`. Never call `write` on product data. Soft delete only.

## Sync job (nightly 6am, plus manual "sync now")

Decided 2026-09-15: no site database. The nightly job runs in GitHub Actions (`.github/workflows/odoo-sync.yml`, 20:00 UTC, which is 6am AEST and 7am during daylight saving, plus a manual "Run workflow" button). It runs `tools/odoo_pull.py` then `tools/build_catalogue.py --source odoo`, commits `site/data` and any new product images as `github-actions[bot]` (an identity GitHub recognises as automated), and the push makes Vercel redeploy. After the Git connection, confirm Vercel built the first sync commit; if the Deployments list shows it blocked, the repository sits in a GitHub organisation whose commit authors must be Vercel team members (architecture/storefront.md, Deployment). Public traffic still never reaches Odoo. Secrets live in GitHub Actions (`ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY`, `ODOO_TRANSPORT`, `ODOO_PRICES_INCLUDE_GST`). Without them the job exits cleanly and changes nothing.

Steps:

1. `search_count` on `product.product` with the sale domain. Log it.
2. Page `search_read` in batches of 500, ordered by id, until a page comes back short. Each page is one request. Roughly 12 requests for 5,702 products. Add a 1 second pause between pages to stay under Odoo Online fair use (about 1 request per second).
3. `search_read` on `product.category` for `id`, `complete_name`, `parent_id`.
4. `search_read` on `stock.quant` if per-location stock is needed. Otherwise `qty_available` on the product is enough.
5. Write everything to `.tmp/odoo_pull_<date>.json`.
6. Build the site catalogue from the pull, merged with the previous `site/data/catalogue.json`: products absent from Odoo keep their record and URL, marked `active: false` and tagged `odoo-missing`. Never deleted.
   - Price: only products with `sale_ok` and `list_price > 0` get `price_aud_inc_gst`; everything else stays "Price on request". `ODOO_PRICES_INCLUDE_GST=0` (Odoo's Australian default, list prices ex GST) multiplies by 1.1 and rounds to cents; `1` uses the list price as is.
   - Stock: `stock_status` from `qty_available` per the schema in claude.md (above 2 in stock, 1 to 2 low, 0 made to order, inactive unavailable).
   - Images: `image_128` is fetched only for products with no image file yet or a `write_date` newer than the last sync.
7. Write the sync manifest (schema in claude.md). Guardrails: zero rows, or an active product count more than 20 percent below the previous catalogue, stops the build before anything is written and fails the GitHub job (GitHub emails the repo owner). Any 4xx from Odoo also fails the job.

Incremental option: filter on `write_date > last_sync` to pull only changed products. Do a full pull weekly regardless, to catch deactivations.

## Order push (on Stripe payment webhook)

1. Stripe `checkout.session.completed` (or `checkout.session.async_payment_succeeded`) arrives at `site/app/api/stripe/webhook`. Verify the signature. Act only when `payment_status` is `paid`.
2. Idempotency: `search_read` on `sale.order` with `client_order_ref = <Checkout Session id>`. If it exists, do not create another.
3. Read the session's line items from Stripe (product metadata carries the SKU); map each SKU to its `odoo_id` from the catalogue.
4. Find the customer as `res.partner` by email (case-insensitive), else create one with name, email, phone and the Stripe shipping address (country looked up by code).
5. `create` on `sale.order` with `partner_id`, `client_order_ref` (session id), `origin` (`partshubexpress.com`), a note with the Stripe payment id, and `order_line` as `(0, 0, {product_id, product_uom_qty, price_unit})`. `price_unit` is the paid unit price, divided by 1.1 when `ODOO_PRICES_INCLUDE_GST=0`. `ODOO_CONFIRM_PAID_ORDERS=1` also calls `action_confirm`; default leaves a quotation for ACBG to confirm.
6. Email the customer and ACBG through Resend, then mark the Stripe PaymentIntent metadata `phx_confirmation_sent=1` so a retry never emails twice.
7. The queue is Stripe itself: if Odoo is unreachable or rejects the order, the webhook returns 500 and Stripe retries with backoff for up to three days. ACBG gets an alert email on each failure. Never lose a paid order.

## Stock check at checkout

One `read` on `product.product` for the cart's ids, fields `qty_available`, `active` and `sale_ok`, before creating the Stripe session. If a line is short, or the product is archived or not for sale, block checkout with a clear message naming the part. `ALLOW_BACKORDER=1` lets short lines through (ACBG's call). If Odoo is not configured the check is skipped; if it is configured but unreachable, checkout is blocked with a "try again or request a quote" message. One request per checkout, so no rate concern.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| 401 "Invalid apikey" | Key expired (three month max) or revoked | Rotate key, update `.env`, rerun |
| 403 or empty results on a model | Odoo user lacks access rights | Grant read on that model to the sync user |
| 404 on `/json/2/...` | Odoo older than 19 | Use XML-RPC transport |
| Slow or 429 | Too many requests | Increase pause between pages, never parallelise |
| Row count drops sharply | Export domain changed, or Odoo archive event | Halt the upsert, alert, inspect manifest |

## Maintenance

- Rotate the API key every 90 days at most. Calendar reminder.
- Keep `fields_get` output in `.tmp/` and re-run after any Odoo upgrade.
- When Odoo moves to 19, set `ODOO_TRANSPORT=json2` in GitHub and Vercel and rerun `tools/handshake_odoo.py`.
- Test harness without real keys: `python3 tools/test_integrations.py` runs the pull, the build and the site's checkout and webhook against `tools/mock_services.py`.

## Sources

- https://www.odoo.com/documentation/18.0/developer/reference/external_api.html
- https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
