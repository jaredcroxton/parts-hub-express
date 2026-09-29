# Part Hub Express: Findings

## The real picture (2026-09-14, from three client documents)

Source docs are in `source/`.

**Client:** Australia Crushing and Belting Group (ACBG). Crusher, screen and conveyor parts, Australia. GST registered business, tax to be verified against registration.

**Site:** partshubexpress.com. Existing Shopify store, not a new build. Theme is Autopzy from ThemeForest, renamed and configured. Built by a previous developer, last edits 19 Jul and 14 Oct 2025, abandoned since.

**Auditor and proposer:** Managed Digital (Jared). Audit verified 18 Aug 2026 outside-in. Proposal sent after 21 Aug verdict email.

**Proposal on the table:**

| Option | Price | Scope |
|---|---|---|
| Open for Business | $2,500 +GST | Payment gateway live and tested, tax settings verified, three policy pages, settings and access review, domain secured, storefront password on |
| Open + Finished (recommended) | + $2,500 +GST the following month, up to $5,000 if data needs product-by-product work | Category navigation, trade enquiry form, shipping re-rate by weight, content cleanup, SEO baseline |

Out of scope both options: trade portal login, supplier marketplace, photography, copywriting, ongoing support, product descriptions and images for the rest of the catalogue.

Acceptance checklist from the proposal: live test payment then refund; checkout links to refund, terms and shipping policies; every product reachable by browsing; trade enquiry captures company, machine, part; shipping rates reflect weight and destination; no demo content visible.

**Critical path item on client side:** company and bank details for payment gateway approval.

## Shopify store state (audit, 18 Aug 2026)

- 277 products loaded, bulk import 14 Oct 2025, vendor field "ACMS", real pricing.
- 40 products with empty descriptions, many placeholder images.
- ~147 of 277 products in no collection. Nav categories are empty shells.
- No payment gateway. Checkout says cannot accept payments. Payment badges on product pages are theme images.
- Policy pages: privacy exists. Refund, terms, shipping all 404.
- Shipping: one AU zone, $10 and $15 flat. Loses money on heavy crusher parts.
- Contact form is stock Shopify. No company, ABN, machine or part number fields. "Can't find your part?" CTA goes to the same form.
- Newsletter footer form works, no email platform connected.
- SEO: homepage title only, no meta descriptions, empty h1.
- Demo testimonial and a 2020 demo blog post still live. "My Store" vendor leftovers.
- Password page OFF while store cannot trade. Recommend re-enable.
- Access hygiene unverified: previous developer may still hold access.
- Miro board: https://miro.com/app/board/uXjVHwIMLoE=/?share_link_id=102818305735

## Live store (checked 2026-09-14 by Claude)

**The live store is on the typo domain `partshubexpresscom.com`, not `partshubexpress.com`.** Registered 13 Oct 2025 via Tucows, pointed at Shopify (A 23.227.38.72, www CNAME shops.myshopify.com), served through Cloudflare, HTTPS fine. The correct domain `partshubexpress.com` was registered 7 Sep 2026 and is parked. Parcel one domain task is therefore: connect partshubexpress.com to Shopify as primary, redirect the typo domain to it, keep the typo domain registered so nothing breaks.

Pulled from the public products.json and collections.json endpoints. These show published products only, so unpublished drafts are invisible from outside.

| Metric | Value |
|---|---|
| Published products | 277 (matches audit) |
| Vendor field | ACMS 261, EEA 10, "My Store" 4, Partshubexpress.com 1, SKF 1 |
| Product type set | 3 of 277 |
| Empty description | 40 (matches audit) |
| Placeholder "ACMS_no_image" picture | 251 of 277 (91%). Only 26 products have a real photo |
| Weight recorded | 4 of 277. The other 273 are 0g, so weight-based shipping has nothing to work with |
| Empty SKU | 2 |
| Price range | $1.38 to $17,575.30, none at zero |
| In at least one collection | 112 of 277 (audit said ~147 orphaned, live count is 165 orphaned) |
| Collections | 14, most empty: Bearings 0, Belts 0, Cone Parts 0, Electrical 0, Hydraulics 0, duplicate "Mantles & Concaves" collection, "New Listed" 97, "Whats Hot!" 12 |
| Tags | 168 products tagged "NO", 85 tagged "YES". Looks like an import column leaked into tags |

**Cross-match to the Odoo export:** 219 of 277 Shopify SKUs match an Odoo internal reference. 119 titles match an Odoo name exactly. So the Shopify catalogue is a subset of Odoo and can be keyed on SKU. The 58 unmatched need a look, likely EEA, SKF and hand-entered items.

**What this changes for parcel two:**
- Weights are the real risk in the "data carries the work in bulk" assumption. Odoo may hold them, this export did not include them. If Odoo has no weights either, shipping re-rate needs a weight per product entered by hand, which is the $5,000 case.
- Category navigation is solved by the Odoo category path for the 219 matched products. Automated collections on Type and Tags, then delete the empty shells and the duplicate collection.
- The YES and NO tags should be stripped in the same pass.
- Snapshot of live products saved at `.tmp/shopify_products_2026-09-14.json`.

## Domain state (checked 2026-09-14 by Claude)

- partshubexpress.com registered 7 Sep 2026, registrar Dreamscape Networks (Crazy Domains).
- A record 27.124.125.171, nameservers ns1/ns2.crazydomains.com. That IP is Crazy Domains parking, not Shopify (Shopify apex is 23.227.38.x).
- HTTPS on apex and www both fail to connect.
- Conclusion: correct domain registered (task from 20 Aug done), not yet pointed at Shopify. Store lives on the typo domain for now. Support@ email bounces until mail is set up on whichever domain the address uses.

## Odoo export: `source/odoo_products_export_2026-09.xlsx` (profiled 2026-09-14)

Columns: ID, Internal Reference, Name, Product Category, Image. No price, no stock, no weight, no description, no brand, no fitment.

| Metric | Value |
|---|---|
| Products | 5,702 |
| Distinct categories | 214, hierarchical, "All / Group / Sub / Sub" |
| Products with an embedded image | 1,156 (20%) |
| Image size | 128px longest edge (Odoo `image_128`), PNG |
| Null internal reference | 2 |
| Duplicate internal reference | 1 |
| Duplicate names | 581 |
| Names that lead with a part code different from the internal reference | ~300 |
| Rows in "MMA / Maximus Machinery - Pronar" branch | 326 |
| Rows in "All / Domestic / ..." branch | 814 |
| Rows with category False or blank | 2 |

Top-level groups by volume: Manganese 1,055; Domestic 814; Screen Media 703; Rollers 684; Conveyors Rubber 505; Fasteners 417; Wear Parts 416; MMA Pronar 324; Power Transmission 285; Hydraulics 169; Other 127; Filters 87; Belt Joiners 80; Pumps 26.

Image coverage is uneven. Rollers 251 of 684, Manganese 340 of 1,055, Screen Media 13 of 703, MMA 0 of 324, Filters 4 of 87.

**What this export proves for the finishing parcel pricing assumption:**
- Categories: YES, carried in bulk. 214 Odoo categories collapse to roughly 14 top-level collections plus sub-collections. Solves the "147 products in no collection" problem by mapping, not by hand.
- Titles: YES, clean names exist for all 5,702.
- Weights: NO, not in this export. Odoo has a `weight` field on `product.template`. Needs a re-export.
- Prices and stock: NO, not in this export. Odoo `list_price` and `qty_available`. Needs a re-export.

**Patterns spotted:**
- Machine model tokens sit inside product names: ST 45 (74), HP300 (71), C160 (52), C130 (48), C12 (42), J1175 (32), HP400 (31), GP200 (28), C120 (24), LT1213 (23). These are Metso, Sandvik, Terex Finlay, Kleemann and Extec crusher models. Fitment is recoverable from names for a good share of the catalogue, but only by parsing, not from a field.
- Brand tokens in names: Kleemann 31, Finlay 26, Metso 25, Extec 21, McCloskey 19, Symons 15, Flexco 12. Amsted appears as a category branch. No brand field.
- ~300 products where the name opens with a different code than the internal reference, for example ref 0116-0010 named "0116-0003 Pressure Filter", ref 2564-9310 named "2564-0040 Cylinder Seal Kit". Either an OEM number, an old code, or a supersession. Client must say which.
- "All / Domestic / ..." mirrors the main tree with 814 products. Meaning unknown. Could be locally made, a pricing branch, or a second warehouse. Decides whether Domestic collapses into main collections or stays a separate filter.
- MMA Pronar branch (326) looks like a sister business (Maximus Machinery Australia). Likely exclude from Parts Hub Express, confirm.
- "Manufactured Drawings" category has 126 products under Conveyors. Suggests drawings exist somewhere, relevant to the exploded diagrams question.

## Direction change (2026-09-14, session 3, from Jared, PENDING, message was cut off)

Jared's statements, verbatim intent:
- Images: use the 128px images already in the Odoo spreadsheet. No re-export for images. Accept 1,156 of 5,702 with a thumbnail, placeholder for the rest.
- Odoo is the source of truth. Confirmed again.
- At handover Jared sets up the client's Resend API (transactional email) and Stripe account.
- Odoo connected "through MCP" as the source of truth, so that parts and pricing changes flow from Odoo. Sentence unfinished.

Open conflicts to resolve before this replaces the rules above:
- Stripe plus Resend implies a custom storefront, not Shopify. HANDOVER.md and claude.md say "Shopify stays, no replatform." One of these is now wrong. Jared to confirm.
- MCP is an agent-side channel (Claude talking to Odoo during build and maintenance). A live website cannot sync price and stock over MCP. Runtime sync needs the Odoo JSON-RPC or XML-RPC API called by the site backend or a scheduled job. Same Odoo API key serves both. Still requires Q17 (Odoo edition, One App Free plan blocks API).

## Client web presence (found 2026-09-14 via Firecrawl, unverified with client)

- Existing site: https://auscbgroup.com.au/ ("Crusher Spare Parts and Conveyor Belt Suppliers in Australia"). Sections: About, Services, Products, Equipment. Scrape before build for copy, photos, policies.
- Facebook: Australian Crushing & Belting Group, Caboolture QLD. Phone 07 5495 3322.
- LinkedIn: "Australian Crushing and Belting Group", slug australian-crushing-and-mining-supplies. Explains the "ACMS" vendor tag on 261 Shopify products (Australian Crushing and Mining Supplies, likely a prior or sister trading name).
- Naming: sources say "Australian", the proposal says "Australia". Confirm the legal and trading name with the client before it appears on the site.
- Tooling note: two Firecrawl connectors are attached. 0bcae4c8 works. c4b859ad returns 402, no credits.

## ACBG current website, scraped 2026-09-14 with Firecrawl (source/auscbgroup/*.md)

**DO NOT USE (Jared, 2026-09-14): no further scraping of auscbgroup.com.au, and nothing below is to be used as a source for the site. Kept for the record only.**

13 pages scraped from auscbgroup.com.au (map found 111 URLs). Raw markdown and JSON saved in source/auscbgroup.

Facts to use on Parts Hub Express (confirm with client before launch):
- **Correct name:** Australian Crushing and Belting Group. Every mockup so far says "Australia Crushing & Belting Group". Fix before client sign-off.
- **Group structure:** parent of Australian Crushing and Mining Supplies (ACMS, wear and spare parts) and Conveyor Belts Australia (CBA, belt service and repairs). Explains the "ACMS" vendor tag on the old Shopify store.
- **Phone:** 1300 226 222 (main, used 50 times on the site). Also +61 7 5495 3322 (Caboolture number from Facebook).
- **Email:** sales@auscbgroup.com.au. Older address sales@acmsupplies.com.au still appears on some pages.
- **Locations:** Brisbane, Sydney, Melbourne and Perth. Brisbane warehouse (Caboolture area). Melbourne opened recently; expansion into Victoria, Tasmania, South Australia and Western Australia. Also supplies the Pacific and PNG.
- **Hours:** Brisbane warehouse 7:30am to 4:00pm weekdays. Breakdown service 24/7.
- **Company numbers found:** ACN 134 953 370 and ACN 612 533 838 (two entities). ABN partially captured, confirm.
- **Claims on their site:** "over 30 years" experience in one place, "over 15 years" in another. Conflicting, do not use either until confirmed.
- **Services:** 24/7 conveyor belt field service, high stock, engineering including 3D scanning and reverse engineering, site inventory and wear-life planning.
- **Industries:** mining, quarrying, construction, recycling, transport, Defence.
- **Terms:** full ACBG Terms and Conditions (62k chars) and CBA Terms exist. Answers discovery Q20: policies exist, draft the store's terms from these.
- **Promotions:** newsletter code NEWCUSTOMER24 gives 5% off a first order.
- **Brands in their product pages:** Metso, Sandvik, Kleemann, Powerscreen, Pegson, Komatsu, Symons, Tesab, OM Marte, Jianshe, Kumbee. Adds Pegson, Komatsu, Tesab, OM Marte to the brand list from the Odoo names.

Mockup copy to correct: company name, phone (mockups show 1300 000 000 and 07 5495 3322), email, locations, hours.

## Build risks and fallbacks (added 2026-09-14, session 3)

- **Handle uniqueness.** Plan is Shopify Handle = Odoo internal reference. Export has 2 null references and 1 duplicate. Shopify rejects duplicate handles on import. Rule needed before schema lock: skip nulls and report them, and either suffix the duplicate or have the client fix it in Odoo. Prefer the Odoo fix, since the reference is also the SKU.
- **Weight fallback.** If Odoo `weight` comes back empty, do not fall into product-by-product entry. Set a default weight per category (Manganese and Rollers heavy, Fasteners and Filters light), have the client confirm a table of roughly 14 numbers, and apply in bulk. Per-product weights override where they exist. Turns the $5,000 case back into the $2,500 case for shipping re-rate.
- **Re-export file size.** Current xlsx is 6.7MB with 1,156 images at 128px. At `image_1920` expect 300MB to 1GB, likely too big for Odoo's export wizard and for email. Options: export images in category batches, export only ID plus `image_1920` as its own file, or pull images by URL from the Odoo web/image endpoint (`/web/image/product.template/<id>/image_1920`) if the instance is web-reachable and we get a login. Ask before the client tries and fails.
- **Code-in-name is probably supersession.** The ~300 names that open with a different code (ref 0116-0010, name "0116-0003 Pressure Filter") read like old part numbers kept for lookup. If the client confirms, that is 300 supersession mappings for free: old code becomes a searchable tag and a Shopify URL redirect. Ask this first among the catalogue questions because it feeds both search and redirects.

## Catalogue gap

Shopify holds 277 products. Odoo holds 5,702. The proposal scopes the finishing parcel around the 277. Expanding to the full 5,702 is a separate conversation and a separate price. Flag to Jared before parcel two is confirmed.

## Client discovery questions: status after the documents

Answered by evidence:
- Q7 Commerce: selling online on Shopify, plus a trade enquiry form. Confirmed.
- Q8 Tax: GST, Australia. Trade vs retail deferred to a post-launch trade portal. Who processes orders: still open.
- Q11 Domain: replacing nothing, existing Shopify store, domain now registered, not yet connected.
- Q12 Budget: $2,500 +GST, then $2,500 to $5,000 +GST. Timeline: days after payment approval, parcel two the following month.
- Q2 Price and stock: not in this export, Odoo can export them. Ask for re-export with `list_price`, `qty_available`, `weight`, `description_sale`, `image_1920`.
- Q4 Brand: no field. Names and categories carry brand for a subset.
- Q5 Images: 128px thumbnails for 20% of catalogue. Full size unknown.

Still open, see `discovery_questions.md` for the trimmed list.

## Research notes

- **Odoo API access by plan (verified 2026-09-14).** External API (XML-RPC, JSON-RPC, JSON-2) is officially available only on the Custom plan for Odoo Online. Not on One App Free or Standard. Reads sometimes work on lower plans in practice, but that is unenforced, not entitled. Do not build on it. Odoo.sh and self-hosted have no plan restriction. Sources: Odoo external API docs, Odoo forum threads on Custom plan requirement.
- **Odoo rate limit (verified 2026-09-14).** Odoo Online acceptable use policy: about 1 request per second, no sustained bursts, no parallel calls. Self-hosted has no policy limit but is bound by worker count. Confirms the nightly cron design: never let public web traffic reach Odoo.
- **XML-RPC and JSON-RPC deprecation.** Endpoints /xmlrpc, /xmlrpc/2, /jsonrpc scheduled for removal in Odoo 22 (2028) and Odoo Online 21.1 (winter 2027). Build the sync client against the JSON-2 API where the client's version supports it, or isolate the transport so it can be swapped.
- **Odoo API, from Odoo's own docs (read 2026-09-14).** Odoo 19 adds a JSON-2 API at `POST /json/2/<model>/<method>` with `Authorization: bearer <api-key>` and `X-Odoo-Database` headers. Odoo 17 and 18 use XML-RPC `execute_kw`. RPC endpoints removed in Odoo 22 (2028). **API keys expire, three month maximum**, shown once at creation. Rotation is a maintenance task, not optional. Full runtime SOP in architecture/odoo_api_sync.md.
- **Sadeem MCP.** See the dedicated section below (session 4). Short version: Layer 2 only, needs Odoo.sh or self-hosted, buy after Q17.

- Odoo product images: `product.template` holds `image_1920`, `image_1024`, `image_512`, `image_256`, `image_128`. The export used `image_128`. Re-export with `image_1920` should lift most of the 1,156 to usable size at no cost.
- Odoo has no native fitment or supersession field. Expect custom field, tags, or spreadsheet.
- Odoo external API is blocked only on Odoo Online One App Free plan.
- Shopify product CSV import handles up to 15MB per file. 5,702 products with images by URL is fine. Images must be publicly hosted URLs, not embedded. Plan an image host step.
- Shopify collections can be automated by tag or product type conditions. Mapping Odoo category path to Product Type plus Tags lets collections build themselves.
- Taste bundle skills `claude-design` and `popular-web-designs` are not installed here. Less relevant now: theme already chosen, design is polish not direction.

## Constraints

- Shopify is the platform. No replatform.
- Odoo is source of truth for catalogue. Shopify is the shop. One-way, Odoo to Shopify.
- File-based ingest until API access is confirmed.
- Soft delete only: unpublish, never delete, in Shopify.
- No em dashes.

## Odoo to Claude connector: Sadeem MCP (researched 2026-09-14, session 4)

Jared raised https://apps.odoo.com/apps/modules/19.0/sadeem_mcp for connecting Claude to ACBG's Odoo and tracking stock.

**What it is.** Paid Odoo 19 module (USD 23.24, OPL-1 licence, depends on Discuss). Adds an MCP endpoint to the Odoo instance. Transport is HTTP over HTTPS at a per-database URL ending in a random segment. Auth is OAuth 2.1, each user signs in with their own Odoo login, so Claude sees only what that user can see. Read or Read+Write approved at sign-in.

**Tools it exposes.** `search_records` on any installed model with a domain filter, `get_model_fields`, `get_record_url`, write tools (`create_record`, `create_records_bulk`, `copy_record`, `execute_action`), image tools (`upload_image`, `replace_image_in_field`, `list_attachments`), translation tools, and module-specific Inventory tools including low stock. Stock queries go through `search_records` on `product.product` (`qty_available`, `virtual_available`) or `stock.quant` (per location).

**Install path (all on the client's side, we do not own the Odoo).**
1. Client buys and installs the module. Requires Odoo 19 on Odoo.sh or self-hosted. Odoo Online (SaaS) does not allow third-party modules, so if ACBG is on Odoo Online this is dead on arrival. Discovery Q17 decides this.
2. Settings, Claude AI Connector, Enable MCP Endpoint. Behind a reverse proxy Odoo must run with `--proxy-mode`.
3. Add the connecting user to the "MCP: Can Connect" group. Jared needs an Odoo user on ACBG's database, read-only is enough for stock.
4. In claude.ai: Settings, Connectors, Add custom connector, paste the URL, leave OAuth ID and Secret blank, sign in.
5. In Claude Code the same URL works as a remote HTTP MCP server with OAuth, even though the vendor docs only mention claude.ai.

**Where it fits this build.** MCP is a Layer 2 tool: Claude reasons over live Odoo data, good for "what is low", "what is on hand for HP300 parts", spot checks before a sync. It does not replace the Layer 3 pipeline. The deterministic sync should use Odoo's native external API (XML-RPC or JSON-RPC with a personal API key), which is free, needs no module, and works on every hosting type except Odoo Online One App Free. Same Odoo user, same permissions, no LLM in the loop for the actual data movement.

**Cost and risk.** Cheap module, but it installs code on the client's ERP. Client IT sign-off needed. Write tools should be declined at sign-in for this project, read only.

**Free alternatives if the client will not install a module.** Native Odoo API via a Python XML-RPC tool in `tools/` (already the plan), or an open source MCP server run on our side pointed at the Odoo API: industream/mcp-odoo, rosenvladimirov/odoo-claude-mcp. Those need only an Odoo API key, no module install.

## Handover checks (2026-09-29)

- **Vercel plan.** Hobby is "restricted to non-commercial personal use only"; taking payment, advertising products, or being paid to build or host the site all count as commercial. ACBG needs Pro: US$20 a month platform fee with one deploying seat and US$20 usage credit; extra Owner or Member seats US$20 a month each; Viewer seats free and read only. Source: vercel.com/docs/limits/fair-use-guidelines, vercel.com/docs/plans/pro-plan.
- **Who can deploy from a private repository.** Pro: the commit author must be a member of the Vercel team. Hobby: the commit author must be the Hobby team owner, and private repositories in a GitHub organisation cannot deploy to Hobby at all. Vercel: this "only applies to commit authors on GitHub organizations ... It does not apply to collaborators on personal Git accounts." Hence the repository goes to ACBG's personal account. Source: vercel.com/docs/git.
- **Project transfer** needs the person transferring to own the source team and be a member of the target team; domains, variables and the Git link move, logs do not. Importing the repository fresh in ACBG's team avoids the membership step. Source: vercel.com/docs/projects/transferring-projects.
- **Deploy hooks are not a way round the author check**: Vercel's troubleshooting for a hook that fails to deploy points to the same collaboration rules. Source: vercel.com/docs/deploy-hooks.
- **Deployment Protection.** Standard Protection covers every deployment except production domains, so a Stripe webhook pointed at a preview or generated URL gets the Vercel login wall. Source: vercel.com/docs/deployment-protection.
- **Vercel tokens** are created under Account Settings, Tokens and can be scoped to a team. A token acts as the user who made it.
- **Stripe website review** looks for contact details, product descriptions and refund, returns, shipping and cancellation policies. Source: docs.stripe.com/get-started/checklist/website.
