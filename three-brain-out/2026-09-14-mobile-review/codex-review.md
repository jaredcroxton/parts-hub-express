# Codex review: Parts Hub Express mobile (gpt-6-astra, 2026-09-14)

VERDICT: Clear visual foundation, but mobile buying needs work before release, especially cart integrity, touch targets, product density and quote access.
SCORE: 61

P0 (broken):
1. Where: site/app/cart/page.tsx, SCRIPT, handling of ?paid=1.
Problem: Visiting /cart?paid=1 clears the stored cart and displays “Payment received” without verifying payment. A stale or manually entered URL can erase a buyer’s current parts list.
Exact fix: Verify the checkout session and payment status server-side before showing success. Remove only the purchased quantities associated with that session, preserve subsequent additions, and make repeat visits idempotent.

P1 (hurts buyers on phones):
1. Where: globals.css, .chip, .btn.sm, .qty, .pager, .ac a, .crumbs a, .foot li a and .rule .right; category.png and search.png.
Problem: The 44px hardening is incomplete. Chips and View buttons remain 32px high, pagination 36px, breadcrumbs 36px and footer links 40px. Single-line suggestions are approximately 35px. Section links have no minimum target size. Claude’s “no links under 36px” check does not establish 44px compliance.
Exact fix: At the mobile breakpoint, give interactive controls min-height:44px and icon/number controls min-width:44px. Use height:auto where text can wrap. Include suggestion rows, section links and post-add confirmation links in the target audit.

2. Where: site/app/cart/page.tsx, .cart-page .lattice.three and render(); cart.png shows only the empty state.
Problem: A populated cart retains three columns at 375px. Quantity and Remove controls consume much of the 343px content width, squeezing names and identifiers. Quantity buttons remain 32px. Every change replaces the entire list, losing focus, and minus at quantity one immediately removes the item.
Exact fix: Render each item as one mobile card with SKU/name above a controls row. Use 44px controls, an editable numeric quantity, explicit Remove with Undo, and preserve focus during updates. Clamp minus at one. Verify a populated cart with long SKUs and multiple items.

3. Where: layout.tsx, .main .r a[href="/quote"]; product-photo.png, quote.png and cart flow.
Problem: Quote access disappears from the mobile header even though the displayed products have request-only prices. “Request a quote” on a product only adds to a separate list. After leaving that page, the buyer loses its visible counter and convenient entry point. Add to cart remains the dominant action despite uncertain checkout availability.
Exact fix: Keep a visible Quote list entry and count on phones. For products without a confirmed purchasable price, make “Add to quote” primary, followed by a 44px “Review quote” action. Show checkout only when the cart is actually eligible, with accurate price and availability messaging.

4. Where: site/app/cart/page.tsx, quoteBtn handler and write(); site/app/quote/page.tsx, QUOTE_SCRIPT.
Problem: Returning to the cart and choosing “Request a quote for this cart” again adds the same quantities again. Cart storage failures are swallowed, yet navigation proceeds. Typed quote details and edited part lists are not saved across reloads or navigation.
Exact fix: Make cart-to-quote transfer idempotent for an unchanged cart and explicitly resolve quantities already in the quote. Return success/failure from write() and navigate only after successful persistence. Save and restore the quote draft, clear it only after confirmed submission, and avoid appending stored items twice.

5. Where: layout.tsx, #q, HEADER_SCRIPT and .ac; all header screenshots.
Problem: The placeholder visibly clips mid-word. Suggestions have no height limit or independent scrolling, so the keyboard and sticky header can leave options unreachable. The listbox markup lacks a complete combobox keyboard interaction. The results page also leaves the header input blank instead of retaining the query.
Exact fix: Use a short placeholder such as “Part number or model”; retain the full accessible label. Populate the input from the search query. Add enterKeyHint="search", autoCapitalize="none" and spellCheck={false}. Bound and scroll the suggestion panel within the visible viewport above the keyboard. Implement combobox semantics with active-option handling, or use an ordinary accessible list of links instead of incomplete listbox roles.

6. Where: globals.css, .hdr and .main .frame; home-1.png and all interior pages.
Problem: Approximately 125 CSS pixels remain sticky, about 19% of a 667px viewport before browser controls. With the keyboard open, the two-row header consumes particularly valuable space. Search stays at the top edge, while there is no persistent quote action near the thumb.
Exact fix: Keep both rows at the top of the page, but collapse the navigation row while scrolling or editing search, preserving a 44px search control. Set scroll-padding-top and focused-element scroll margins to the actual sticky height. Keep Quote access in the compact navigation or a restrained bottom action bar.

7. Where: category.png, search.png, machines.png and machine-hp300.png; .prod .img, .mx .cell.mach, PER_PAGE, CAP and PER_GROUP.
Problem: Large image areas and repeated metadata make scanning slow. The category’s first product begins around 840 CSS pixels down. Machine cards reserve 200px just to repeat the model name. Categories render 48 tall cards before pagination; search can render 96 and provides no route to later matches. Machine groups show up to 24 cards before the next group.
Exact fix: Use compact mobile product rows with 72 to 96px thumbnails, full identifiers and a clear product link. Remove large image placeholders when no photo exists. Put category/machine filters behind a 44px disclosure with an active-filter summary. Use a smaller server-paginated result set, such as 20, with accessible Previous/Next above and below results. Paginate search instead of stopping at 96, and add machine-category jump links.

8. Where: product-photo.png and product-nophoto.png; site/app/part/[slug]/page.tsx, .pp .grid, .plate .img, .tb-block and .buy.
Problem: Product identification follows a large image or a 280px empty placeholder. On the photographed product, buying actions appear roughly 1,000 CSS pixels down. A buyer checking a part number must scroll through imagery and metadata before acting.
Exact fix: Put SKU and title first in the DOM, followed by price/availability and the quote action. Place the photo next, then specifications. Replace the no-photo panel with a compact note. Offer a bottom quote action after the main action scrolls away, with matching content clearance and safe-area padding.

9. Where: globals.css, .tb .pn, .prod .name and .prod .img.type .pn; product page .sku and h1; search page .page-h h1 and .nores .btn.
Problem: Product identifiers are deliberately clipped and names clamped to two lines. Long unbroken codes have no reliable wrapping in several other locations. A long failed search is also inserted into a white-space:nowrap button. The supplied examples fitting does not establish safety for longer catalogue data.
Exact fix: Show complete identifiers with overflow-wrap:anywhere and min-width:0. Change .tb to auto height with minmax(0,1fr), and move match-reason metadata below when needed. Remove mobile name clamping where it hides specifications. Allow headings to wrap and use a fixed “Request a quote” label with the query displayed separately.

10. Where: home-5.png and home-6.png; .draw3 .dpanel svg, .sch2 .sq, .sch2 .n and [data-hl].
Problem: Fitting the drawings to the screen fixes overflow but shrinks callout squares to roughly 13px and diagram labels to very small text. The 44px key is usable, but it sits before all three drawings, far from the later diagrams. Highlight behavior cannot be confirmed because HIGHLIGHT_SCRIPT was not supplied.
Exact fix: Put the relevant 44px category links directly beneath each diagram. Add “Enlarge drawing” with zoom and pan in a dedicated viewer. Give interactive callouts non-overlapping hit areas equivalent to 44 CSS pixels at rendered scale, or make the drawing illustrative and use the adjacent links. Any explanatory highlight must respond to tap and focus, not require hover.

11. Where: home-3.png and home-4.png; page.tsx TYPE_IMAGE, .whyrow .shot img and hero image markup.
Problem: Mobile impact and dispatch areas appear blank in the captures. That establishes a visible gap, not whether files are missing or lazy loading was uncaptured. The homepage serves fixed 1600px, 1400px and 1050px image sources without responsive variants; the mobile hero receives high fetch priority despite appearing below the initial content.
Exact fix: Check image responses and decode state after actual scrolling. Repair failed images or provide a compact error fallback. Supply appropriately compressed responsive sources and sizes, retaining dimensions. Use height:auto or an explicit aspect ratio for the dispatch image. Reserve high priority for the measured initial-view LCP image; defer lower-priority mobile imagery. Measure transferred bytes on a cold mobile connection before setting an image budget.

12. Where: home-7.png, home-8.png, quote.png and cart.png; COMPANY values used in layout.tsx and quote/page.tsx.
Problem: “1300 000 000”, “Dispatch address to confirm” and “Hours to confirm” appear in the buyer-facing contact flow. For an urgent breakdown, the advertised fallback must be usable.
Exact fix: Replace these with verified operational contact information before release. Remove unfinished address/hours rows until confirmed. Put a 44px Call action and quote access near the primary buying controls, rather than relying on the long footer.

P2 (polish):
1. Where: home-1.png; page.tsx FINDER_SCRIPT, #brand and #model.
Problem: Native selects are an appropriate touch choice, but the hero permits submission without a model and can send buyers to the general machine directory. Option labels combining model, brand and count may be awkward in a narrow native picker.
Exact fix: Require a brand and model for “Show parts”, retaining the separate browse link. Initialise dependent options from restored form state and preserve valid selections. Keep model identifiers first in option text. Test actual iPhone Safari selection, cancellation and Back restoration; Chrome iPhone emulation does not reproduce the iOS picker.

2. Where: quote.png; quote/page.tsx, #machine, #parts, .send and .contact.
Problem: Email and phone types/autocomplete are good, but part codes lack autocorrection/spelling controls. Required versus optional fields are inconsistently signposted, Notes reserves 180px, and Send is not full width.
Exact fix: Set autoCapitalize="none" and spellCheck={false} on machine/code fields, keeping a text keyboard for alphanumeric SKUs. Use enterKeyHint="next" on appropriate single-line fields while preserving multiline entry in #parts. Mark optional fields consistently, shrink Notes initially, make Send full width on phones, and expose field-specific errors with aria-describedby and aria-invalid.

3. Where: home-4.png, home-6.png and footer; globals.css :focus-visible and .foot li.
Problem: The global black focus outline disappears against black sections. Footer counts sit above the vertical centre of their corresponding padded links. Much supporting information uses 12px type, which is harder to read outdoors despite reasonable colour contrast.
Exact fix: Apply a white or two-colour focus ring in dark sections. Centre footer row contents vertically and make each category/count row one 44px link. Increase essential stock, fitment and count text to 14px; retain strong black/white contrast.

4. Where: home-1.png through home-7.png; .home .hero, .sec.deep, .home .dark and .home .fits.
Problem: Large consecutive section gaps, tall machine cards and repeated fitment explanations turn the homepage into a lengthy scroll. Buyers reach practical category drawings after substantial promotional content.
Exact fix: Reduce mobile section spacing to roughly 32 to 40px, avoiding stacked padding and margins. Put compact machine/category navigation before promotional blocks. Keep the necessary fitment warning near selection and purchase, with extended explanation in a disclosure.

5. Where: layout.tsx and globals.css; viewport configuration, safe areas and .crumbs.
Problem: Safe-area handling is not explicit. Breadcrumb separators and current-page text visibly sit above the vertically centred links. No explicit viewport export is shown, but Next.js can generate the default viewport, so its absence here is not proof of a missing meta tag.
Exact fix: Inspect rendered head output for width=device-width, initial-scale=1 and unrestricted zoom. If using viewport-fit=cover, add env(safe-area-inset-*) padding to edge-mounted controls and reserve their occupied space. Align breadcrumb items centrally and let complete breadcrumb segments wrap together.

WHAT IS ALREADY RIGHT:
- Consistent 16px phone gutters and clear black/white primary controls.
- Main inputs and selects are at least 16px, addressing the usual iOS focus-zoom trigger.
- Primary buttons and product-page quantity buttons are 44px.
- Single-column forms, stacked reviews and full-width product actions suit phones.
- Native selects have labels; the dependent model field visibly explains its disabled state.
- Most catalogue images have dimensions and lazy loading.
- Quote failures retain current form contents; status messages use live regions.
- Fitment uncertainty is stated clearly, and category filters preserve state in URLs.
- No obvious horizontal overflow appears in the supplied screenshots. Actual iOS behavior, network bytes and populated-cart rendering remain untested.

CONFIDENCE: medium
