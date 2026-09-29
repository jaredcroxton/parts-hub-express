# Parts Hub Express: Project Constitution

Status: Phase 1 Blueprint, design stage. Platform decided 2026-09-14: custom build. Discovery session closed. Data schema drafted against the Odoo export and Odoo's API docs, locked for products, unlocked for prices, stock and weight until the first live pull.

## What this is

A custom storefront for Australian Crushing and Belting Group (ACBG) at partshubexpress.com. Crusher, screen and conveyor parts, Australia, GST registered. Odoo is the system of record for products, prices, stock and orders. The site reads from Odoo on a schedule, sells through Stripe, emails through Resend, and pushes paid orders back into Odoo.

Decision record:
- 2026-09-14, Jared: custom build on Vercel with Stripe and Resend. Shopify store abandoned. Reason: Odoo owns products and orders, core UX is find-part-by-machine, existing Shopify store had no gateway, wrong domain, 277 products.
- 2026-09-14, Jared: use the images already in the Odoo export (128px thumbnails, 1,156 products). Client adds photos later.
- 2026-09-14, Jared: design first. Stripe, Resend and Odoo API integration come later.

## Behavioural rules

- Odoo is the source of truth for catalogue data. The site never edits product data. One-way, Odoo to site, nightly plus manual "sync now".
- Orders flow site to Odoo instantly on the Stripe payment webhook, as a sale order. Never batched.
- One live stock read per checkout before payment. Public page views never call Odoo.
- Never delete a product on the site. A product missing from the latest pull is marked inactive and tagged `odoo-missing`. URLs keep resolving.
- Superseded part numbers resolve to the current part. Never 404.
- Never guess fitment. Machine model tokens parsed from names become fitment tags only after the client confirms the parsing rule. Unparsed products show no fitment.
- Exclude the "MMA / Maximus Machinery" branch. Treat "Domestic" as excluded until the client explains it.
- Prices in AUD, GST inclusive, stated on the page. Trade pricing is a later phase.
- Images: part photos are real only (Odoo thumbnails, client-owned Shopify store photos matched by SKU), never AI-generated. Machine photos only if openly licensed or client-owned, with source and licence logged in design/assets/image_sources.json. Manufacturer and supplier site photos are not used without written permission. Hero image may be AI-generated (no logos, no parts). Part photos are kept to a minimum on the homepage, and every part photo used anywhere is listed in design/assets/parts_to_verify.md for ACBG to confirm before launch. Never upscale beyond 1.5x. Designed no-photo state for products without one.
- Frontend: single monolithic file pattern per page. Never componentise into a component library.
- No em dashes anywhere, including copy, comments and code.
- Never use "Sarah" in demo content.
- Previews are never indexed: the site sends noindex and robots.txt disallows all unless `SITE_LIVE=1`, which is set only on the real domain at launch (2026-09-15). Preview URL: https://partshubexpress.vercel.app.
- Launch gate (2026-09-29): a build with `SITE_LIVE=1` fails while `site/lib/company.ts` holds placeholder contacts (`contactConfirmed: false`), and at launch the homepage shows only reviews marked `verified_by_client: true`.
- Do not scrape auscbgroup.com.au and do not use its content as a source (Jared, 2026-09-14). Company name spelling ("Australia" or "Australian") and contact details come from the client directly.
- Design LOCKED 2026-09-14: option B Title Block layout, Inter Tight font, Original B colours with the Codex contrast fix (accent #f45120, accent text #c63a00). Build target design/homepage.html. See design/DESIGN_CHARACTERISTICS.md sections 10.3 and 10.4. No design decisions without updating that file first.

## Data Schema

### Input: Odoo product row (from JSON-2 `search_read` on `product.product`, or XML-RPC `execute_kw` on Odoo 17 and 18)

Locked fields (present in the export we hold): `id`, `default_code`, `name`, `categ_id`, `image_1920` or `image_128`.
Requested fields (confirmed to exist in Odoo, not yet seen with data): `list_price`, `qty_available`, `weight`, `description_sale`, `active`, `write_date`.

```json
{
  "id": 2,
  "default_code": "0116-0010",
  "name": "0116-0003 Pressure Filter",
  "categ_id": [42, "All / Filters / Hydraulic"],
  "list_price": 84.50,
  "qty_available": 12,
  "weight": 1.2,
  "description_sale": "",
  "active": true,
  "write_date": "2026-09-10 03:12:44",
  "image_1920": "<base64 or false>"
}
```

### Output: site product record

```json
{
  "odoo_id": 2,
  "sku": "0116-0010",
  "slug": "0116-0010-pressure-filter",
  "name": "0116-0003 Pressure Filter",
  "category_path": ["Filters", "Hydraulic"],
  "category_slug": "filters/hydraulic",
  "price_aud_inc_gst": 84.50,
  "stock_qty": 12,
  "stock_status": "in_stock",
  "weight_kg": 1.2,
  "weight_source": "odoo",
  "description": "",
  "image_path": "/img/products/0116-0010.jpg",
  "image_source": "odoo_128",
  "fits": [],
  "alt_part_numbers": ["0116-0003"],
  "brand": null,
  "active": true,
  "synced_at": "2026-09-14T20:00:00+10:00"
}
```

`stock_status` is one of `in_stock`, `low_stock` (qty at or below 2), `made_to_order` (qty 0, active), `unavailable` (inactive). `weight_source` is `odoo` or `category_default`. `fits` stays empty until the fitment rule is confirmed. `alt_part_numbers` holds the code-in-name value pending the client's answer on supersession.

### Output: category record

```json
{
  "odoo_id": 42,
  "name": "Hydraulic",
  "slug": "filters/hydraulic",
  "parent_slug": "filters",
  "path": ["Filters", "Hydraulic"],
  "product_count": 28,
  "image_count": 3,
  "excluded": false
}
```

### Order push: Odoo `sale.order` create payload

```json
{
  "partner_id": 1234,
  "client_order_ref": "cs_live_stripe_session_id",
  "origin": "partshubexpress.com",
  "order_line": [
    [0, 0, { "product_id": 2, "product_uom_qty": 2, "price_unit": 84.50 }]
  ]
}
```

### Sync manifest

```json
{
  "run_id": "2026-09-14T06:00:00+10:00",
  "transport": "json2",
  "odoo_count": 5702,
  "pulled": 5702,
  "excluded": 1140,
  "created": 0,
  "updated": 0,
  "marked_missing": 0,
  "errors": [],
  "duration_s": 0
}
```

## Architectural invariants

- Layer 1 SOPs in `architecture/`. Written so far: `odoo_api_sync.md` (runtime path), `odoo_mcp_connector.md` (Claude path, Sadeem MCP). Layer 3 tools in `tools/`, one script one job. Intermediates in `.tmp/`. Client documents in `source/`. Design work in `design/`.
- Stack (decided 2026-09-14, build started): Next.js App Router with TypeScript on Vercel, in `site/`. Data store is static JSON in `site/data/` built by `tools/build_catalogue.py`: from the Odoo export until the API is connected, then nightly from the Odoo API through GitHub Actions (commit, Vercel redeploys). No site database (decided 2026-09-15). Stripe Checkout plus webhook; the webhook pushes paid orders to Odoo and Stripe's retries are the order queue. Resend for email. Odoo JSON-2 on Odoo 19, JSON-RPC on 17 and 18 (`ODOO_TRANSPORT`). Integration SOPs: architecture/odoo_api_sync.md, architecture/payments_and_email.md. Storefront SOP: architecture/storefront.md.
- MCP (Sadeem) is a Layer 2 tool for Claude during build and maintenance. It is never in the runtime path.
- Public traffic never reaches Odoo. Odoo Online fair use is about one request per second.
- Hosting (checked against Vercel docs 2026-09-29): ACBG's Vercel team must be on Pro, because Hobby is non-commercial only. The repository stays in Jared's personal GitHub account with ACBG as a collaborator (Jared, 2026-09-30); a personal account, not an organisation, so collaborators' and the sync bot's commits deploy without Vercel seats. Stripe webhooks target a production domain, never a protected preview URL.
- Odoo API keys expire within three months. Rotation is a scheduled maintenance task.
- Images live in the site's own storage, named by SKU. Odoo thumbnails are the seed; later client photos replace them by SKU.
- Design tokens and reference lock live in `design/DESIGN_CHARACTERISTICS.md` once the A/B/C choice is made. Frontend code derives from that file.
- Review protocol (three-brain, set by Jared 2026-09-14): Claude builds, Codex reviews. Codex review runs only when Jared asks for it (he declined automatic runs twice on 2026-09-14). Claude never self-reviews its own code. Command shape: `cat <file> | codex exec -m gpt-6-astra --skip-git-repo-check "<review brief>"`. Findings are integrated and the reply states "(Routed via three-brain to Codex review.)". Gemini CLI handles media and whole-repo scans when needed.

## Maintenance log

Empty. Written in Phase 5 Trigger.
