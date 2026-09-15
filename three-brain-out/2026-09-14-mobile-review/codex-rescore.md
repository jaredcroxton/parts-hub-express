# Codex re-score: Parts Hub Express mobile (gpt-6-astra, 2026-09-14)

**VERDICT:** Substantially improved. The main phone flows are now usable, but quote-draft synchronisation and catalogue browsing still need work before release. The remaining fixes fit within the locked visual design.

**SCORE: 82/100**, up from 61.

**P0 (broken):**

None confirmed in the reviewed scope. The previous unverified `?paid=1` cart-clearing behaviour has been replaced with server-side payment verification and purchased-quantity removal.

**P1 (hurts buyers on phones):**

1. **Where:** `site/app/quote/page.tsx`, `QUOTE_SCRIPT`; cart-to-quote return journey.  
   **Problem:** Removing an item from the cart and transferring again updates `phx_quote`, but leaves that item in the saved quote form. The merge updates present SKUs without reconciling disappeared ones. I reproduced this using the current script in memory: `A x 2, B x 1` remained in the form after quote storage changed to only `B x 1`. A buyer can submit a part they already removed.  
   **Exact fix:** Track the previously imported lines and reconcile additions, quantity changes **and removals**. Remove an absent imported SKU when its draft line is unchanged; preserve manually edited lines and explicitly flag any conflict. Verify transfer → edit cart → transfer again, including removals and quote-only items.

2. **Where:** Category, search and machine-detail product rows; product-page “More in…” tiles.  
   **Problem:** Browsing remains unnecessarily tall. Category rows are approximately 160px, with conspicuous gaps between SKU and name, and still show 48 results per page. Search and machine rows repeat the spacing. Related products retain 160px “Photo to come” panels that repeat the SKU without helping identification.  
   **Exact fix:** Remove redundant inner sizing from the mobile rows: reset `.tb`’s inherited minimum height and the name link’s independent 44px minimum where its stretched link already makes the entire row tappable. Keep natural text wrapping, 4–8px content gaps and a whole-row target exceeding 44px. Reduce category pagination to 24 results. Apply the compact thumbnail/no-photo treatment to related products too.

3. **Where:** `/parts`, category cards in `site/app/parts/page.tsx`; `parts-01.png`.  
   **Problem:** Subcategory rows such as “Jaws” look independently selectable, but tapping them opens the broad parent category. Buyers must find the same subcategory again inside the Filter disclosure.  
   **Exact fix:** Make the card a non-anchor container. Give its heading a parent-category link and each subcategory a separate, full-width, minimum-44px link to its actual route. Avoid nested anchors.

4. **Where:** `/parts`, “Where each part fits”; `parts-05.png` and `parts-06.png`.  
   **Problem:** The homepage drawing improvements have not reached this page. Its key still precedes all three diagrams, and there is no Enlarge control. Buyers reaching the later drawings must use tiny callouts or scroll back to the key.  
   **Exact fix:** Reuse the homepage’s per-drawing category links and enlargement viewer here. On both pages, either provide non-overlapping 44px callout hit areas or make the small drawing callouts illustrative and route interaction through the adjacent links.

**P2 (polish):**

1. **Where:** Category bottom pagination; category/search disabled pager controls.  
   **Problem:** At 375px, category “Next” wraps onto its own line. Disabled “Previous” looks enabled in both category and search results.  
   **Exact fix:** Use the existing “Previous / Page X of Y / Next” arrangement at both ends of category results on phones; retain numbered pagination for larger screens. Give `[aria-disabled="true"]` a visibly muted treatment while retaining readable text and its non-interactive semantics.

2. **Where:** Product-page `.act`, `.buy`, `.msg` and `.next`; both product first segments.  
   **Problem:** The action block ends 16px before the content’s right edge. The outer `.act` inherits a horizontal flex layout, so the buy controls, status message and continuation links compete for horizontal space.  
   **Exact fix:** At the phone breakpoint, make `.pp .act` a block or single-column grid and `.pp .buy` full width. Place status and continuation links below it. Check the initial, added-to-quote, added-to-cart and storage-error states.

3. **Where:** Product-list stock and match metadata; `globals.css` `.stock`, `.attr` and `.tb .mc`.  
   **Problem:** Essential availability and machine-match information remains 12px. It is readable in enlarged captures but harder to scan outdoors at actual phone size.  
   **Exact fix:** Increase essential stock and match text to 14px on phones, allowing it to wrap. Keep small type for secondary credits and nonessential annotations. Preserve the approved font and colours.

4. **Where:** `/machines`, HP400 card; `machines-01.png`.  
   **Problem:** The photograph prominently displays another machinery company’s logo, creating ambiguity about whose equipment or business the storefront represents. Attribution does not resolve that visual confusion.  
   **Exact fix:** Replace it with an appropriately sourced HP400 photograph without prominent dealer branding, or use the existing compact text-only machine treatment until one is available.

**WHAT IS ALREADY RIGHT:**

- The measured audit reports no horizontal overflow, header overlaps, broken images or inputs below 16px across all 11 pages.
- Product identity, price/availability and primary quote controls now precede imagery. The main no-photo placeholder is compact.
- Quote and Cart counters remain available in the phone header; the source implements a 61px compact header.
- The populated cart has readable item cards, editable quantities, explicit Remove and Undo, and focus-preservation logic.
- Unchanged cart transfers no longer simply add the quantities again. Quote drafts persist, and field-specific validation is implemented.
- Search has real pagination, retains the query and provides navigation above and below results.
- Category filters collapse; machine pages have group jumps and shorter previews.
- Homepage drawing links, responsive imagery, section spacing, dark-section focus rings and footer alignment have improved.
- Inline sentence links and the cart’s 42px input inside its 44px quantity group do not warrant carrying forward the previous blanket touch-target criticism.

Placeholder company contact details remain the known client-data gap and are excluded from the score.

**CONFIDENCE:** Medium-high for the findings above. I located and inspected updated screenshots under `shots-after/segments`, reviewed the source and reproduced the quote merge defect without changing files. Actual iPhone Safari keyboard/picker behaviour, live payment completion and cold mobile-network performance remain unverified.
