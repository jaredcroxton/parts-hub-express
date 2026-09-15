# SOP: build_catalogue (Odoo export to site catalogue)

Layer 1 SOP for `tools/build_catalogue.py`. Deterministic. One job: turn the Odoo product export into the JSON the storefront reads, plus the product image files.

## Goal

Produce `site/data/catalogue.json`, `site/data/categories.json`, `site/data/machines.json`, `site/data/search-index.json`, `site/data/manifest.json` and `site/public/img/products/<sku>.jpg` from `source/odoo_products_export_2026-09.xlsx`. Re-runnable. Same input, same output.

## Inputs

- `source/odoo_products_export_2026-09.xlsx` (sheet "Products", header on row 3: ID, Internal Reference, Name, Product Category, Image). Images embedded, anchored to their row (0-based, so row = anchor row + 1).
- `design/assets/img_large/*` (client-owned Shopify photos named by SKU). Used as the main image when present; thumbnail kept as `image_thumb`.
- `design/assets/brand_model_tokens.json` (machine model tokens and brands).
- `design/assets/image_sources.json` (image register: licensed machine photos, hero, curated group photos).

## Rules (from claude.md)

- Exclude category branches `MMA`, `Domestic`, `Non-Inventory`, `Consumables`.
- SKU is Internal Reference. No reference: skip, list under `skipped_no_sku`. Duplicate reference: first row wins, rest under `skipped_duplicate_sku`.
- Slug: SKU lowercased, non-alphanumerics to `-`, collapsed, trimmed, then `-` and a slug of the name. Unique; append `-2`, `-3` on collision.
- `alt_part_numbers`: if the name opens with a code (regex `^[0-9A-Z][0-9A-Z\-\.\/]{3,}\b`) that differs from the SKU, record it. Searchable, not labelled "supersedes" until the client confirms.
- `fits`: empty. Fitment is never inferred. `machine_tokens`: model tokens found in the name (word boundary, case-insensitive, spaces and hyphens ignored) for search and filtering only.
- Price and stock: `null`. The storefront shows "Price on request".
- Images: thumbnail written at native size as JPEG quality 88 (PNG flattened on white). Client photo written as-is with its extension. Never upscale.
- No em dashes in any output.

## Output contracts

`catalogue.json`: array of site product records (claude.md schema) plus `image_w`, `image_h`, `image_source` (`odoo_128`, `client_shopify`, `none`), `image_thumb`, `machine_tokens`, `brand_tokens`.

`categories.json`: tree `{name, slug, path, product_count, image_count, children[], hero_sku}`. `hero_sku` from image_sources.json where a curated group photo exists, else the product with the largest image in the group.

`machines.json`: `[{model, brand, type, product_count, image, image_credit}]` for every token with count above 0. `type` from a fixed table (jaw, cone, impact, mobile jaw, mobile impact, unknown). `image` only when image_sources.json has a licensed machine image with that exact `machine_model` and the entry has no `site_excluded` reason. A `site_excluded` entry stays in the register for the record and is never shipped (added 2026-09-14 after the mobile review: the HP400 Commons photo shows a dealer sign).

`search-index.json`: `[{sku, sku_norm, name, alt, alt_norm, slug, cat, tokens}]`, lowercased; `_norm` fields strip spaces, hyphens, dots and slashes.

`manifest.json`: counts in, excluded, written, skipped lists, images by source, run timestamp.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Image count far below 1,156 | Anchor offset | row = `anchor._from.row + 1` |
| Slug collision | Same SKU and name twice | Duplicate SKU rule applies |
| PNG saves black | Alpha channel | Flatten on white before JPEG |
| Category "False" | Odoo writes False for blank | Put under `Other` |

## Re-run

`python3 tools/build_catalogue.py` from the project root. About 30 seconds. Outputs are committed so Vercel builds without Python.
