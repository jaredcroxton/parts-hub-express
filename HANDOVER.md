# Part Hub Express: Context Handover

Paste this into a new chat. It contains everything known as of 14 Sep 2026. Project folder: /Users/jc/Part Hub Express

## Who and what

- Client: Australia Crushing and Belting Group (ACBG). Crusher, screen and conveyor parts, Australia, GST registered. Client contact is male, decision-maker for sign-off not yet confirmed.
- Agency: Managed Digital (Jared). Audited the store 18 Aug 2026, sent a proposal after a 21 Aug verdict email.
- Site: existing Shopify store, ThemeForest theme "Autopzy" renamed and configured. Built by a previous developer, last edits 19 Jul and 14 Oct 2025, then abandoned.
- Client runs Odoo as the product system of record.

## The proposal on the table

| Option | Price | Scope |
|---|---|---|
| Open for Business | $2,500 +GST | Payment gateway connected and live-tested, tax settings verified against ACBG registration, refund/terms/shipping policy pages, settings and access review (remove previous developer), domain secured, storefront password on until launch |
| Open + Finished (recommended) | + $2,500 +GST the following month, up to $5,000 +GST if product data needs product-by-product work | Category navigation for every product, trade enquiry form (company, machine, part number, quote), shipping re-rate by weight and destination, content cleanup, SEO baseline |

Out of scope for both: trade portal login, supplier marketplace (client's long-term idea, competitors listing on the site), photography, copywriting, ongoing support, descriptions and images for the rest of the catalogue.

Acceptance criteria: live test payment then refund; checkout links to all three policies; every product browsable not just searchable; trade enquiry captures company, machine, part; shipping rates reflect weight and destination; no demo content visible.

Client-side critical path: company and bank details for payment gateway approval.

Parcel two pricing assumes product data "carries the work in bulk": categories assigned, shipping weights recorded, titles applicable across the catalogue in one pass.

## Domain situation (verified 14 Sep 2026)

- Live store runs on the TYPO domain partshubexpresscom.com. Registered 13 Oct 2025 via Tucows, pointed at Shopify, Cloudflare in front, HTTPS fine.
- Correct domain partshubexpress.com registered 7 Sep 2026 via Crazy Domains (Dreamscape). Parked. Not connected to Shopify. HTTPS fails.
- support@ email bounces because no mail is set up on the domain.
- Parcel one domain task is really: connect partshubexpress.com as primary, redirect the typo domain, set up mail.

## Live store state (audit 18 Aug plus public JSON pull 14 Sep)

| Metric | Value |
|---|---|
| Published products | 277 (bulk import 14 Oct 2025) |
| Vendor field | ACMS 261, EEA 10, "My Store" 4, Partshubexpress.com 1, SKF 1 |
| Product type set | 3 of 277 |
| Empty description | 40 |
| Grey "ACMS_no_image" placeholder | 251 of 277 (91%). Only 26 have a real photo |
| Weight recorded | 4 of 277. The rest are 0g |
| Empty SKU | 2 |
| Price range | $1.38 to $17,575.30, none at zero |
| In at least one collection | 112 of 277 (165 orphans, audit said ~147) |
| Collections | 14, most empty (Bearings, Belts, Cone Parts, Electrical, Hydraulics all 0), duplicate "Mantles & Concaves", "New Listed" 97, "Whats Hot!" 12 |
| Tags | 168 tagged "NO", 85 tagged "YES" (an import column leaked into tags) |
| Payments | No gateway. Checkout says cannot accept payments. Payment badges are theme images |
| Policies | Privacy exists. Refund, terms, shipping 404 |
| Shipping | One AU zone, $10 and $15 flat. Loses money on heavy parts |
| Contact form | Stock Shopify, no company/ABN/machine/part fields. "Can't find your part?" points at the same form |
| Newsletter | Footer form works, no email platform connected |
| SEO | Homepage title only, no meta descriptions, empty h1 |
| Content | Demo testimonial and a 2020 demo blog post live. "My Store" leftovers |
| Password page | OFF while store cannot trade. Recommend re-enable |
| Access | Previous developer may still hold access. Unverified |
| Mobile | Clean at 390px |

Miro board: https://miro.com/app/board/uXjVHwIMLoE=/?share_link_id=102818305735

## Odoo export the client sent (profiled 14 Sep 2026)

File: Products (5).xlsx, saved as source/odoo_products_export_2026-09.xlsx. Columns: ID, Internal Reference, Name, Product Category, Image. Nothing else.

| Metric | Value |
|---|---|
| Products | 5,702 |
| Categories | 214, hierarchical "All / Group / Sub / Sub" |
| Products with an embedded image | 1,156 (20%), all 128px (Odoo image_128 field) |
| Price, stock, weight, description, brand, fitment | Not in the export |
| Null internal reference | 2. Duplicate reference: 1. Duplicate names: 581 |
| "All / Domestic / ..." branch | 814 products, mirrors the main tree, meaning unknown |
| "MMA / Maximus Machinery - Pronar" branch | 326 products, looks like a sister business |
| Names opening with a code different from the internal reference | ~300, e.g. ref 0116-0010 named "0116-0003 Pressure Filter". OEM number, old code, or supersession, unknown |
| "Manufactured Drawings" category | 126 products, suggests drawings exist |

Top-level groups: Manganese 1,055; Domestic 814; Screen Media 703; Rollers 684; Conveyors Rubber 505; Fasteners 417; Wear Parts 416; MMA 324; Power Transmission 285; Hydraulics 169; Other 127; Filters 87; Belt Joiners 80; Pumps 26.

Image coverage by group is uneven: Rollers 251/684, Manganese 340/1055, Screen Media 13/703, MMA 0/324.

Machine model tokens live inside product names (HP300 71, C160 52, C130 48, ST 45 74, J1175 32, HP400 31, GP200 28, LT1213 23). Brand tokens too (Kleemann 31, Finlay 26, Metso 25, Extec 21, McCloskey 19, Symons 15). No brand or fitment field.

Cross-match: 219 of 277 Shopify SKUs match an Odoo internal reference. 119 titles match exactly. Shopify catalogue is a subset of Odoo, keyable on SKU.

## What the evidence means

- Categories: solved in bulk. Odoo category paths map to Shopify Type and Tags, automated collections build themselves.
- Titles: solved, clean names for all 5,702.
- Weights: the real risk. Not in this export, 4 of 277 in Shopify. If Odoo has no weight field populated, shipping re-rate needs hand entry, which is the $5,000 case.
- Images: re-export with image_1920 instead of image_128 should give usable images for the 1,156 at no cost. The other 80% have nothing.
- Scope gap: proposal is scoped around 277 products. Odoo has 5,702. Full catalogue load is a separate scope and price. Raise before parcel two is confirmed.
- Odoo tech: no native fitment, supersession or brand field. API access is possible on every edition except Odoo Online One App Free plan. Edition unknown.

## Open questions for the client (ordered by what blocks first)

Blocks parcel one:
1. Which option?
2. Company and bank details for the gateway. Who sends, when?
3. Who signs off design and content?
4. Revoke previous developer's access on sight?
5. Who hosts email? Move the store to partshubexpress.com and redirect the typo domain?

Blocks catalogue work:
6. Re-export from Odoo with sale price, quantity on hand, weight, sales description, image_1920. Weight matters most.
7. What does the "Domestic" branch mean?
8. Exclude the MMA / Maximus Machinery branch?
9. The code at the start of ~300 names: OEM number, old code, or superseded part?
10. Goal is the 277 in Shopify or the full 5,702?
11. Where does machine-to-part fitment live? Are model numbers in names reliable enough for a "shop by machine" filter?
12. Full-size photos anywhere outside Odoo?
13. Drawings or exploded diagrams for the "Manufactured Drawings" products?
14. Who processes orders, and where should trade enquiries land (inbox, Odoo CRM, both)?

Shapes shipping:
15. Ship from one location or several?
16. Carriers, pickup option, how oversized manganese and rollers ship today?
17. Odoo edition, plan and version?
18. Export cadence, weekly or monthly?

Nice to know:
19. Reference sites they like?
20. Do any policy documents exist to draft from?

## Rules already set for the build

- Shopify stays. No replatform.
- Odoo is source of truth, one-way to Shopify, CSV until API is agreed.
- Never delete a Shopify product. Unpublish and tag odoo-missing.
- Never guess fitment. Parsed model tags only after the client confirms the rule.
- Exclude MMA branch unless told otherwise.
- Soft delete only. No em dashes. Single-file frontend if any.

## Files in the project folder

- claude.md: constitution, draft schemas (Odoo row in, Shopify CSV row out, collection map). Schema is UNLOCKED until the re-export lands.
- findings.md: full evidence log.
- task_plan.md: workstream A checklist (manual Shopify admin) and workstream B phases (catalogue pipeline).
- discovery_questions.md: the 20 open questions.
- progress.md: session log.
- source/: the two PDFs and the Odoo export.
- .tmp/shopify_products_2026-09-14.json: snapshot of the 277 live products.
- No tool code written yet.
