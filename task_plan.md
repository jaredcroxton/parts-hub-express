# Parts Hub Express: Task Plan

## Goal

Ship partshubexpress.com as a custom storefront driven by Odoo. Find a part by machine, part number or category, buy it or request a quote, order lands in Odoo.

## Decisions made

- Custom build on Vercel, Stripe, Resend. Not Shopify. (Jared, 2026-09-14)
- Use existing 128px Odoo thumbnails now. Client adds photos later.
- Design first. Integrations later.
- MCP connector (Sadeem) for Claude only. Runtime sync via Odoo API. Both wait on the client's Odoo plan answer (Q17).

## Workstreams

### A. Design (current)
- [x] Discovery closed
- [x] Real assets prepared: 1,156 thumbnails extracted, category tree, sample products, brand and model tokens (design/assets)
- [x] Workflow: research (Refero styles and screens, wider web, reference flow), five concepts, three judges, select A/B/C, build three mockups, review and fix, chooser page
- [x] Jared picked B, then font B (Inter Tight), then Original B colours
- [x] Design locked in DESIGN_CHARACTERISTICS.md 10.3, build target design/homepage.html
- [ ] Simple homepage (10.6) built and reviewed, parts_to_verify.md produced
- [ ] Pages in the locked design built in site/: home, parts, category, product, machines, machine, search, quote, cart, trade

### B. Catalogue pipeline (Odoo to site)
- [ ] Client answers Q17 (Odoo edition and plan), Q17b (read-only user)
- [ ] Handshake tool: authenticate and `fields_get` on product.product, store output in .tmp
- [ ] SOP exists: architecture/odoo_api_sync.md. Tools: pull_products, pull_categories, normalise, upsert, manifest
- [ ] Category default weights table agreed if Odoo weights are empty
- [ ] Supersession rule agreed for code-in-name products

### C. Storefront build (started 2026-09-14)
- [x] SOPs: architecture/build_catalogue.md, architecture/storefront.md
- [ ] tools/build_catalogue.py run, site/data and product images generated
- [ ] Next.js scaffold in site/, globals.css from the locked design
- [ ] Pages from the locked design: home, category, product, search, quote, cart, checkout, account
- [ ] Search: part number exact and partial, hyphen-insensitive, machine model, keyword

### D. Commerce
- [ ] Stripe account set up at handover (Jared)
- [ ] Stripe Checkout, GST via Stripe Tax, shipping by weight table, webhook to Odoo sale order
- [ ] Stock check at checkout

### E. Email
- [ ] Resend API set up at handover (Jared)
- [ ] Order confirmation, quote request received, quote request routed to ACBG inbox or Odoo CRM (Q14)

### F. Launch
- [ ] Domain partshubexpress.com to Vercel, redirect the typo domain, mail on the domain
- [ ] Policies: terms, refund, shipping, privacy
- [ ] 6am sync cron live, API key rotation reminder, maintenance log

## Express Checklist

### Phase 1: Blueprint
- [ ] Taste bundle loaded (`claude-design` + `popular-web-designs`): not installed, `refero-design` used instead
- [x] Memory files initialised (claude.md, task_plan.md, findings.md, progress.md)
- [x] Five discovery questions answered (discovery session held 2026-09-14; remaining client answers tracked in discovery_questions.md)
- [ ] Data schema locked in claude.md (products locked, price, stock, weight pending first live pull)
- [x] Research logged in findings.md

### Phase 2: Link
- [ ] All .env credentials present (Odoo API key, Stripe, Resend, database)
- [ ] Handshake script passes for each external service
- [ ] Any broken links fixed and logged

### Phase 3: Architect
- [ ] Layer 1: SOP written for every tool in architecture/ (odoo_api_sync.md and odoo_mcp_connector.md done)
- [ ] Layer 2: Navigation logic defined
- [ ] Layer 3: Tools built in tools/, one file per tool

### Phase 4: Stylize
- [ ] Payload format finalised
- [ ] UI styled: design direction locked after A/B/C choice
- [ ] User approved the look

### Phase 5: Trigger
- [ ] Deployed to production
- [ ] Trigger set up (Vercel Cron 6am AEST, Stripe webhook)
- [ ] Maintenance log written in claude.md
