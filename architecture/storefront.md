# SOP: storefront (Parts Hub Express site)

Layer 1 SOP for the site in `site/`. Design locked in design/DESIGN_CHARACTERISTICS.md 10.3, 10.4, 10.6. This SOP covers structure, data flow, and page contracts.

## Stack (decided 2026-09-14)

- Next.js 16.3.5, App Router, TypeScript, on Vercel. Node 22 present locally. Route params and searchParams are Promises; pages typed with the global PageProps helper.
- No component library, no CSS framework. One global stylesheet `site/app/globals.css` holds the locked tokens and shared B styling (header, controls, lattice, plate, drawing panel, footer). Each route is one file `site/app/<route>/page.tsx` with its own markup and page-specific styles in a `<style>` block. No `components/` directory. Shared layout chrome lives in `site/app/layout.tsx` only.
- Data: static JSON in `site/data/` from `tools/build_catalogue.py`, read at build time by server components through `site/lib/catalogue.ts`. No database until the Odoo sync phase; the JSON matches the site product record schema so the swap to Postgres changes the loader only.
- Images: `site/public/img/products/`, `site/public/img/machines/`, `site/public/img/hero/`. Plain `<img>` with width and height set; thumbnails never optimised or upscaled.
- Search: `/search` runs server-side over `search-index.json`. Rank: exact SKU, normalised SKU prefix, alt part numbers, machine tokens, name words. Header type-ahead calls `GET /api/suggest?q=` for the top 8 in three groups (part numbers, machines, categories).
- Cart: localStorage `phx_cart` (`[{sku, qty}]`). Quote list: localStorage `phx_quote`.
- Quote request: `POST /api/quote` validates, appends to `site/data/inbox/quotes.jsonl` always, then sends via Resend when `RESEND_API_KEY` is set. Never dropped silently.
- Checkout: `POST /api/checkout` creates a Stripe Checkout Session when `STRIPE_SECRET_KEY` is set. Without it the cart page says "Checkout opens when payments go live" and offers Request a quote. Prices GST inclusive; Stripe Tax at checkout.
- Odoo: never called by the site. The nightly sync regenerates the JSON, later the database.

## Routes

| Route | File | Data |
|---|---|---|
| `/` | `app/page.tsx` | homepage per 10.8: search hero with machine finder, machines strip, where each part fits, why Parts Hub Express, reviews (real only, from data/reviews.json), email signup |
| `/parts` | `app/parts/page.tsx` | 12 groups with children and counts, plus the annotated crusher drawing ("where each part fits") |
| `/parts/[...slug]` | `app/parts/[...slug]/page.tsx` | category listing, 48 per page, machine filter, has-photo filter, sort by SKU |
| `/part/[slug]` | `app/part/[slug]/page.tsx` | product page: photo plate, SKU, name, category, alt part numbers, machine tokens shown as "appears in the part name", "Price on request", "Stock: call to confirm", Add to cart or Request quote, "Fitment not listed, confirm with our team" |
| `/machines` | `app/machines/page.tsx` | machines grouped by manufacturer with counts |
| `/machines/[model]` | `app/machines/[model]/page.tsx` | parts carrying that token, grouped by part group |
| `/search` | `app/search/page.tsx` | ranked results |
| `/quote` | `app/quote/page.tsx` | paste-a-list form |
| `/cart` | `app/cart/page.tsx` | cart with checkout or quote fallback |
| `/trade` | `app/trade/page.tsx` | trade account application |
| `/api/suggest`, `/api/quote`, `/api/subscribe`, `/api/checkout`, `/api/stripe/webhook` | route handlers | as above; subscribe appends to data/inbox/subscribers.jsonl and adds to a Resend audience when RESEND_AUDIENCE_ID is set |

## Contracts

- Pages read only through `site/lib/catalogue.ts`: `getProducts()`, `getProduct(slug)`, `resolveSku(code)`, `getCategories()`, `getCategory(slug)`, `getMachines()`, `getMachine(model)`, `search(q)`, `suggest(q)`.
- `/part/<code>` resolves SKUs and alt part numbers and redirects to the canonical slug. Known codes never 404.
- Metadata: title `<name> · <sku> · Parts Hub Express`. Sitemap from the catalogue.
- Copy: sentence case, no em dashes, no unverified claims, GST inclusive wording, "Price on request", "Fitment not listed".
- Company name and contact details: placeholders until the client confirms (`ACBG_NAME`, `ACBG_PHONE`, `ACBG_EMAIL` in `site/lib/company.ts`).

## Environment

`site/.env.local` (never committed): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `ENQUIRY_TO_EMAIL`, `ORDER_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`. All optional in development.

`SITE_LIVE=1` is set only on the real domain at launch. Without it the site sends `noindex, nofollow` and robots.txt disallows everything, so previews never reach search results with placeholder contacts or unconfirmed content.

## Deployment (preview, 2026-09-15)

- Vercel project `partshub` in scope `jaredcroxtons-projects`, root is `site/` (linked in `site/.vercel`). Public URL https://partshubexpress.vercel.app (project domain, follows the latest production deployment). `partshub.vercel.app` was already taken.
- Redeploy: `cd site && vercel deploy --prod --yes`. `site/vercel.json` pins `"framework": "nextjs"`; without it the CLI-created project defaulted to "Other" and served only `public/` (every page 404).
- `next.config.ts` `outputFileTracingIncludes` ships `data/*.json` and `data/drawings/*.svg` with every server route, because the loaders compute file names. `.vercelignore` keeps `data/inbox`, `.env*` and build folders out of the upload.
- Vercel functions have a read-only filesystem. Quote and subscribe write the inbox file where they can and otherwise need Resend; with neither they return 503 with a plain message and the quote draft stays on the device. Before Stripe goes live, `api/stripe/webhook` must stop writing `data/inbox/orders.jsonl` (push to Odoo or a database instead) or it will fail on Vercel.

## Motion (DESIGN_CHARACTERISTICS 10.12)

- Tokens in `app/globals.css` (`--ease-settle`, `--ease-gentle`, `--ease-press`, `--t-*`). `--t` is the 160ms settle used by every hover and state transition.
- Press dip, linked highlight timing and the suggestions drop are CSS only. Section arrivals and the star wipe are `MOTION_SCRIPT` in `app/page.tsx`. The drawing plot is `DRAW_SCRIPT` in `lib/drawings.ts`, used on `/` and `/parts`.
- Scripts hold only elements below the fold at load, as paused Web Animations (no inline styles), play once when they reach the viewport edge (IntersectionObserver, no negative margin) and cancel when finished. They also cancel on focus inside a held group, on pointer or focus inside a drawing section (the linked highlight is never masked), on a viewport width change mid-draw, before printing, and when reduced motion is switched on. Drawing dash lengths are measured just before playback. Reduced motion at load, no IntersectionObserver or no Web Animations means nothing is held.
- Highlight fill: `lib/drawings.ts` injects an orange `.part-hl` copy (attribute `data-hk`, no `data-k`) under each wear part so the hatch crossfades to orange in the same 160ms beat.
- Header controls carry a negative `scroll-margin-top` equal to `--hdr-h` so keyboard focus on them never scrolls the page to clear the sticky header they sit in; content focus still clears it through `html{scroll-padding-top}`.
- Phone header: wordmark row on top, search, Quote and Cart row below; `.hdr{top:-44px}` lets the top row scroll away so the search row pins at 61px. No height tween.
- Check after any motion change: `.tmp/motion/motion-check.mjs <outdir>` with the server on 3105 (tests T1 to T10: cold-load layout shift, settled vs reduced frame, fresh reviews entrance, hover during the draw, print and preference release, resize before playback, bottom-edge stop, press transitions, phone keyboard header, back navigation). Pass means layout shift 0, nothing paused or not at rest in view, no running animations after a full scroll, settled frame within anti-aliasing noise of the reduced-motion frame.

## Share cards and icons (DESIGN_CHARACTERISTICS 10.13)

- `app/opengraph-image.png` and `app/twitter-image.png` (1200x630) with `.alt.txt` files apply to every page. Source and regeneration steps: `design/brand/share-tile/README.md`.
- `metadataBase` comes from `NEXT_PUBLIC_SITE_URL` (Vercel production env: https://partshubexpress.vercel.app; at launch change it to https://partshubexpress.com). Without it, Vercel's production URL is used, then localhost.
- Each page's own title and description become its og:title and og:description, so a shared product link shows the part name.
- Before launch, robots.txt allows link-preview crawlers (Facebook, WhatsApp, X, LinkedIn, Slack, Telegram, Discord) and disallows everyone else. Facebook obeys robots.txt, so blocking it breaks the card.
- Icons: `app/favicon.ico` (RGBA PNG frames, 16/32/48), `icon.png` 512, `apple-icon.png` 180, all generated from the logo masters in design/brand/logo.
- Logo: header and footer inline the lockup from `lib/logo-paths.json` (generated by design/brand/logo/build.py); ink is currentColor, the square uses `--accent`.
- Facebook caches cards per URL: use the Sharing Debugger "Scrape Again" after changing the image.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Slow category pages | Reading JSON per request | Loader caches at module scope; pages static at build |
| Search misses "HP 300" | Space in token | Normalise spaces, hyphens, dots on both sides |
| Quote lost | Email fails | Inbox file written first where writable; on Vercel without Resend the API returns 503 and the draft stays on the device |
| Every page 404 on Vercel | Project framework preset "Other" | `site/vercel.json` pins `nextjs` |
| Search or category 500 on Vercel | `data/` not traced into functions | `outputFileTracingIncludes` in `next.config.ts` |
| Build too large | Images | 9 MB total today; move to Vercel Blob if it grows past 100 MB |

## Verification before handover

- `npm run build` passes, zero type errors.
- Every category route and a 200-product sample render in dev with no 404s or missing images.
- Lighthouse accessibility 95 or better on `/` and one product page.
- `design/assets/parts_to_verify.md` lists every part photo shown on the homepage and category landing tiles.
