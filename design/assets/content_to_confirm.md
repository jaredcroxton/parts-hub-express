# Content to confirm with ACBG before launch

| Item | Where | Status |
|---|---|---|
| Company name spelling: "Australia" or "Australian" Crushing & Belting Group | footer, terms, product pages | to confirm |
| Phone, email, dispatch address, hours | footer, every product page (Call button), cart, quote, trade, terms and privacy pages | placeholders in site/lib/company.ts. Launch gate (2026-09-29): a build with SITE_LIVE=1 fails while `contactConfirmed` is false, so the site cannot launch with the placeholder 1300 number. |
| Site email address | footer, quote, terms, privacy | sales@partshubexpress.com has no mailbox: the domain has no MX records (checked 2026-09-29), so mail to it bounces. ACBG either sets up a mailbox or forwarding on the domain, or gives an existing address for the site to show. |
| Express dispatch cut-off time and carriers | homepage "Why Parts Hub Express" | claim held to "fast" until confirmed |
| Customer reviews | homepage "Our clients say" | Copied from the old store for preview: John Smith, Screens Online and Alice Jones, SJ Crushing. Both shown with a 5 star rating that the old store did NOT show; the rating is a placeholder. Jared confirming with ACBG on 2026-09-15: real customers, real names, and the actual rating each gave. MUST be confirmed or removed from site/data/reviews.json before launch. From 2026-09-29 the launch build (SITE_LIVE=1) hides any review not marked `"verified_by_client": true`. |
| Terms, privacy, returns, shipping policies | /terms, /privacy | placeholder pages |
| Supersession rule for code-in-name products | product page "Also known as" | shown as alias only, never "supersedes" |
| Machine make for the ST 45 token | /machines | listed under "Make to confirm" |
| Every part photo shown on the site | design/assets/parts_to_verify.md | ACBG to verify each photo shows that part |
