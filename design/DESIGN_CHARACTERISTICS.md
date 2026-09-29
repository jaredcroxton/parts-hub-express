# Parts Hub Express: Design Characteristics

Client: Australia Crushing and Belting Group (ACBG). Product: partshubexpress.com. Agency: Managed Digital.
Status: three directions locked for mockup (A, B, C). Written 2026-09-14 by the design lead after five pitches and three judge rounds.

Rules that apply to this file and every mockup built from it: no em dashes anywhere (commas, periods, parentheses and middle dots only), single monolithic HTML file per mockup, real content only, no emoji as icons.

---

## 1. Design brief (refero-design brief format)

- **What is being designed.** The homepage of a parts storefront for crusher, screen and conveyor wear parts, plus the product tile, search, machine selector, category grid, why-us, trade and quote block and footer that every other page reuses. Three visual directions, one shared flow.
- **Platform.** Web. Next.js on Vercel, Stripe checkout, Resend email. Odoo is the source of truth for products, prices and stock. Mockups are static HTML; APIs come later.
- **Audience and technical level.** Trade buyers: quarry operators, crushing contractors, fitters, procurement staff. They know part numbers and machine models. They read on phones in yards and on desktops in offices. They buy manganese jaws, blow bars, cheek plates, concaves and mantles, rollers, screen media, fasteners, hydraulics and belting.
- **Primary user goal.** Find a part by part number, machine model or category, see price, stock and a photo, then buy online or request a quote, with as few decisions as possible.
- **Desired feeling.** Extremely premium and world-class, in the register of an instrument maker or an engineering drawing, not a hardware retailer and not a brochure. Confident, exact, fast.
- **Objections to overcome.** Does this supplier actually hold the part (stock counts). Does it fit my machine (fitment stated, never inferred). What does it cost with GST (ex and inc on every price). Can I order on terms (trade account). Can I send a parts list (paste-to-quote).
- **Constraints.** Light canvas, heavy black wordmark, sans type. 5,702 products, 214 categories. 1,156 products photographed at 128px longest edge from the Odoo export; the rest have no photo. Machine fitment exists only as tokens inside product names today. No list price field in the export yet. GST registered. No claim of authorised-dealer status for any OEM. Google Fonts only.
- **Research mix needed.** Visual direction (styles), concrete UI patterns for search, selector, tiles and states (screens), and the homepage journey (flow deconstruction of the reference site).
- **Catalogue facts every mockup must use as written.** Manganese 1,055; Screen Media and Accessories 703; Rollers 684; Conveyors Rubber and Accessories 505; Fasteners 417; Wear Parts 416; Power Transmission Parts 285; Hydraulics 169; Other 127; Filters 87; Belt Joiners and Clips 80; Gravel and Slurry Pumps 26. Machines: HP300 (71), C160 (52), C130 (48), C12 (41), J1175 (32), HP400 (31), GP200 (28), C120 (24), LT1213 (23), HP200 (16), LT106 (8). (ST 45 (74) is in brand_model_tokens.json but is not a machine; see the Option C docket note in section 6.) Brands in names: Kleemann 31, Finlay 26, Metso 25, Extec 21, McCloskey 19, Symons 15, Flexco 12, Powerscreen 7, Sandvik 4, Terex 3.

---

## 2. Research summary

### 2.1 Refero styles reviewed (pulled in full)

| Style | URL | Refero style_id | Role in this project |
|---|---|---|---|
| teenage engineering | https://teenage.engineering | 2055406e-755a-4276-af43-09d6b06a78f3 | Primary for Direction A. Bordered 0-radius grid cell on cool off-white, one accent as indicator light |
| Timescale | https://www.timescale.com | 520e6739-69c0-4c16-a3ce-1c891c8c77c6 | Primary for Directions B and C. Sketched 1px controls, search locked into its button, colour for emphasis separated from colour for action |
| DJI | https://dji.com | c6fe2881-d664-4756-849e-5c254f712338 | Secondary. Platinum Gray #ededed product ground, two-level elevation cap |
| Sigmaphoto | https://www.sigmaphoto.com | 0b2fcaa8-27fe-49bc-a89d-24f69afa9c07 | Secondary. Density rule (tight section rhythm), precisely cropped photography on clear ground |
| Peak Design | https://peakdesign.com | 374af946-0972-40c3-a888-2700c29b3d5f | Secondary. Geist Mono reserved for product codes, category tab bar above the grid |
| Dyson | https://dyson.com | ae819596-eb04-4533-b136-d1233faa73e6 | Supporting. Tinted image stage that makes a mixed catalogue look uniform |
| T1 Energy | https://t1energy.com | 9fd2165d-4a32-4ee9-98b7-c921ca237797 | Supporting. Motion timing (0.25s ease, colour and opacity only). Warm canvas rejected |
| ON.energy | https://www.on.energy | 1d0983e0-be29-4e1d-b217-1edec1003fb3 | Supporting. Evidence for plant-signage yellow as an action colour. Dark theme rejected |
| Andercore | https://www.andercore.com | 15fd028d-c493-47a9-8e69-0a59c6fdb14b | Reviewed for the dark pitch (Night Bench). Not shipped |
| Superlative | https://playsuperlative.com | (preview only) | Reviewed for the dark pitch. Not shipped |
| Elektron | https://elektron.se | (preview only) | Reviewed for the dark pitch. Not shipped |
| Acme Cups | https://acmecups.nz | c9036f6d-32b0-4b54-9d0a-44f9dde2c091 | Preview only. Pale canvas, thin dividers, catalogue-like grid |
| Agronomy Workshop | https://agronomywork.shop | 7fe32f5c-90ee-4149-893c-358dbb034580 | Preview only. Mono labels and price chips on cutout thumbnails |

Style search queries that returned useful results: "industrial equipment manufacturer website", "precision engineering brand dark", "technical product brand monochrome", "heavy machinery company website", "hardware brand product photography", "premium ecommerce product catalogue", "luxury product catalogue gallery grid", "camera lens ecommerce monochrome", "tool brand online store", "parts and components online store".

### 2.2 Refero screens reviewed (20 pulled in full detail)

| Pattern | Screen | Refero screen id |
|---|---|---|
| Header, utility strip, category pills, mega menu | IKEA | 8bb491fe-f6d5-4da3-b6e1-96c31a2552dd |
| Search-dominant header, left-rail departments menu | Walmart | 7cd56ee6-b591-4342-8b5d-92cc3c81720a |
| Search autocomplete, Suggestions and Products with counts | adidas | 7fdac1fc-926f-4314-a36c-7627fad48789 |
| Search autocomplete with grouped Brands section | Faire | 1034807a-fca8-4952-b3e6-c06856b25575 |
| Vehicle selector grouped by make with count pill and type-ahead | Chargetrip | 5e14c4c3-d473-4bcf-ae12-f0bc338369d2 |
| One dropdown drives a recommended set, All / Recommended tabs | Square | fe000b7a-b7e9-4f82-b204-26b442091e91 |
| Guided finder tiles | Nomad | 8f7c3944-2da0-4527-a12f-b3377e997583 |
| Help me choose radio cards | DJI | 687e9097-5017-408f-9d96-01be11c77acf |
| Left category menu plus product cards | DJI Components | 24d796b9-81b6-4323-8130-e6a6f1121989 |
| Large category tiles | ARKET | 2ebc691b-16e1-46a1-91c9-78df8d369d58 |
| Category page with tiles and collapsible sidebar | Walmart | 383b1646-08ce-4564-9d48-cceb5733ca23 |
| Dense tile grid with stock pill | DoorDash | c15eb2f1-5154-46b8-b329-d24b5c2aa861 |
| Availability dot, quantity stepper, per-card add | IKEA My list | 18ed6838-e04b-4eec-8724-c74584cde577 |
| Wholesale cards with price, brand, shipping note | Faire Trending | d0215511-b764-40f2-8e54-8ba9ecd12b0b |
| Quiet image-led 4-up listing with sidebar | New Balance | f0e4554d-3b9b-4148-a050-730c534d3f41 |
| Pill filter toolbar | shop.app | c7c4027e-f197-4443-94f8-760f8a721123 |
| One-row filter toolbar | ASOS | cd1b81de-59af-4028-91c7-e036ea4d908b |
| Specs page, Buy now and Contact sales as siblings, compatibility | Square Stand | b980b14f-50af-4582-b605-c899899e4546 |
| Two-column spec rows | DJI Ronin 4D | fd271009-b316-487a-992b-548147255f3c |
| Spec list, compatibility, comparison table | Apple AirPods Max | be23d431-ff30-41ae-bd2f-74e6001d1988 |
| Product page with availability check and accordions | IKEA | 907b8c59-dd97-44ca-b976-543c1614f26d |
| Compare page, differences only | IKEA | 1118894c-9b91-472c-b084-4c5cded3ee56 |
| Partner logo grid with labels | Tidal | 6c690b04-ada5-4ded-a746-9afbc7e1108e |
| Contact sales, short progressive form | Cursor | 43ea210d-e470-4a13-a3f8-3caf3253dd85 |
| Contact form in 2x2 grid | Factory.ai | eb68abfb-6b62-421d-8123-2c70e776e1ab |
| Cart with minimums and progress | Faire | 9c08c213-d411-417d-8852-c324a8ce68ee |
| Out-of-stock cart recovery | Walmart | 0f4134e6-b815-4ead-b6ed-a747c045fb72 |
| OOS tiles with Request instead of Add | Instacart | 0a75ca11-e379-423f-8554-84b92b418149 |
| No results with recovery | ASOS, Aesop, West Elm, Replo | 11026318-bd2d-4348-93ab-1098ed47ab38, 20cea2d5-dac1-448a-a4a2-9cc216e5de05, 4be7610e-e25e-4528-8665-4b4dff28da5d, 1fc88546-0889-4ef8-b46b-6630bdb5925f |
| Notify me side sheet | ARKET, Pedestal, Acne | 6b275fe9-2710-4f11-a607-e962be690bb1, 6d478c2e-2ab9-4bc5-ace0-c31cce4ad00f, 53005120-d613-4229-b1ae-421e06613a8e |

### 2.3 Sites reviewed outside Refero

Premium parts and hardware commerce: Cat Parts Store (https://parts.cat.com, secondary sources), Hilti (https://www.hilti.com), RS Online AU (https://au.rs-online.com/web/), Sandvik Rock Processing wear protection (https://www.rockprocessing.sandvik/en/lifecycle-services/stationary-crushers-and-screens/wear-protection-solutions/), Metso wears (secondary), Buster and Punch (https://uk.busterandpunch.com), Teenage Engineering products (https://teenage.engineering/products), Framework Marketplace (https://frame.work/marketplace), Trek AU (https://www.trekbikes.com/au/en_AU/bikes/c/B100/), Porsche Classic parts catalogue (https://www.porsche.com/international/accessoriesandservice/classic/originalpartscatalogue/), Rexroth Store (https://www.boschrexroth.com/en/gb/service-and-support/buy/rexroth-store/).

Reference for flow only: JR Factory Services (https://www.jrfactoryservices.com.au). Principles kept: search-first entry, Type / Make / Model selector row directly under the header, brand trust strip, why-us section, counts on category tiles, the finder repeated before the footer. Layout, copy, colours and imagery are not carried over.

Competitor baseline (the category slop to avoid): Precisionscreen (https://precisionscreen.com.au), Crushing Plant and Equipment (https://crushplantequip.com.au), Mining Wear Parts (https://www.miningwearparts.com.au), Crusher Spares (https://www.crusherspares.net.au), Intercast (https://intercastaustralia.com.au), Kinder Australia (https://kinder.com.au), MRT Australia (https://mrtaustralia.com.au), CMS Cepcor (https://www.cmscepcor.com), Foreman Equipment parts store (https://parts-store.foremanequipment.com), Unified Screening (https://www.unifiedscreening.com), and ACBG's current site (https://auscbgroup.com.au). Shared tells: navy or corporate blue plus safety orange, golden-hour quarry hero with uppercase superlative, OEM logo wall implying dealer status, bullet lists of nouns, no price, no stock, no part number, every path ending in a contact form, stretched or missing thumbnails.

### 2.4 What the research settled

1. Monochrome base, one saturated accent with a written job. Refero's recurring metaphor is the indicator light.
2. Structure is drawn with 1px rules, not tinted boxes. Product tiles are cells in a grid, not cards.
3. Radius 0 to 4px. No blur shadows. Depth only by surface inversion or, at most once, a hard offset.
4. Canvas is off-white and cool, never cream, so product plates and photo edges read.
5. Dark is a band (utility bar, hero band, trade block, footer), never the page theme.
6. Weight carries hierarchy, not size. Heavy grotesk wordmark at 700 to 800; body never below 400.
7. Monospace for the data layer only: part numbers, OEM references, machine codes, counts, prices, stock.
8. Photography rule: isolated, contained, on a uniform plate. Small photos in a uniform frame read as deliberate; small photos floating on white read as broken.
9. Density is precision: 16px element gap, 16px tile padding, 48px section gap, 4px or 8px base.
10. Part number is the primary identifier everywhere; two identifiers (ACBG ref and OEM cross-reference) on every tile.

### 2.5 Asset audit (checked on disk before locking the imagery rules)

Path: /Users/jc/Part Hub Express/design/assets/img. 1,156 files. Sizes cluster at 128x96 (268), 96x128 (261), 128x72 (119), 128x128 (33). Only 151 of 1,156 have a near-white border; median border luminance is 165 on a 0 to 255 scale. These are yard and rack photographs with concrete, timber and steel backgrounds, not studio cutouts. Consequences: any blend-mode trick that assumes a white background fails on 87 percent of the set, and any plate the photo sits on needs a keyline so the photo edge reads as deliberate. The cleanest backgrounds in the 48-product sample (border deviation under 11) are MM0297742, MM0527972, 937405, MM1122599, 1062440045, MM1155334, 0116-0010, 501-011-070 and 1022145975; these are the candidates for any hero-scale drawer.

---

## 3. Shared principles (apply to A, B and C)

The flow is locked. The three directions are skins on one page skeleton, and the client should be told that in the presentation: they are choosing how the site looks and feels, not how it works.

### 3.1 Page skeleton, top to bottom

1. Utility bar (32px): phone, ex GST / inc GST toggle, Trade login, Quote list count. No unconfirmed facts here.
2. Header (72px): heavy wordmark left, the search field as the dominant element, cart and quote counts right.
3. Machine selector row directly under the header: Brand, Machine model, Part category, Show parts, Reset. No Year step (the export has no year data; the row is honest at three fields).
4. Hero: headline plus the direction's signature object. No photograph of a quarry.
5. Parts to suit: ten OEM makes as text wordmarks with fitment counts, plus popular machines with counts, plus the non-affiliation line.
6. Browse by category: 12 top groups ordered by count, real thumbnails where coverage is strong, type-only cells where it is weak.
7. Featured shelf: 8 real SKUs, part number first.
8. The difference: six facts, no icons, no cards.
9. Trade account and quote block with the paste-a-parts-list textarea.
10. The finder repeated (same search and selector component).
11. Operational footer.

### 3.2 Search-first entry

The search field is the largest control in the header, 44 to 48px tall, with a trade-language placeholder ("Part number, machine model or keyword"). It locks into its button with no gap. Autocomplete drops in three labelled groups (Part numbers, Machines, Categories) with counts right-aligned in mono, and superseded numbers appear as "MM1006270 is now MM1155334". Debounce 100 to 120ms, 120ms fade with a 4px rise, no shadow (1px ink border).

### 3.3 Machine selector

Three dependent selects: Brand (ten makes with counts), Machine model (grouped by brand, count on every row, type-ahead inside, Chargetrip pattern), Part category (12 groups with counts). Locked selects look locked and say why ("Select brand first"). Once set, the machine persists as a removable chip beside the search field and stamps "Fits HP300" on matching tiles. Parts with no machine token show nothing. Fitment is never inferred from a name at render time; it comes from structured data synced from Odoo, and where Odoo has none the product page says "Fitment not listed. Confirm with our team."

### 3.4 Part numbers as first-class type

The reference is the first line of every tile, search row, order line and URL, set in the direction's mono face at 13px, exactly as Odoo holds it, including slashes and suffixes (MM1023214/MOD, 6/4D-AHR-R55-E4147R, Imp/Bar1524/100/50). OEM cross-references follow in brackets where the name carries one (MM1155334 (MM1006270)). Mono is confined to measured values: refs, cross-refs, machine codes, counts, prices, GST captions, stock quantities, ABN. No sentence is ever set in mono.

### 3.5 Imagery rules for the 128px photographs

- Never scale up. Every thumbnail renders at native pixels, centred on a fixed-ratio plate. On phones it may scale down; it never exceeds 1x.
- Always frame. The photo carries a 1px keyline in the direction's keyline colour so its edge is deliberate, because the photos have mixed backgrounds and mixed orientation (96x128 and 128x96 are the two commonest sizes).
- The plate is uniform. Same colour, same ratio, same inset in every cell, so a 44px bolt and a 128px jaw plate read as two specimens in one system.
- No blend modes. Multiply and screen assume a white background and the set does not have one.
- When ACBG shoots larger photos, the brief is one casting, evenly lit, on a neutral ground, tight crop, 3/4 view (Sandvik and Metso wear-part photography). Those drop into the same plate at 2x maximum.

### 3.6 No-photo state (4,546 of 5,702 products today)

The identical plate with the part number set in mono at 18 to 22px in ink, the sub-category in 12px muted beneath, and "Photo to come" in 11px mono at the plate's bottom edge. It reads as a labelled specimen, not a broken image. A "Has photo" filter and sort exist on every listing. No camera icon, no grey box, no stock image.

### 3.7 Stock and price treatment

- Price row: inc GST figure first at 16 to 18px 600 with tabular figures, ex GST figure beside or beneath in 12 to 13px mono muted, following the header toggle. GST is named on every price. Decision 2026-09-14: the site defaults to inc GST, matching the project constitution (prices AUD, GST inclusive, stated on the page). The utility bar toggle flips to ex GST for trade buyers.
- Quote-only parts (no list price in Odoo, oversize castings, zero stock with no lead time) show the word "Quote" in the price slot and a single "Request quote" action.
- Stock: a 6 to 8px square swatch plus a mono label with a real quantity: "In stock · 14", "Low stock · 3", "Backorder · 2 to 3 wks", "Quote". Green for in stock, the direction's amber or hollow ink for low, grey for backorder and quote. Stock never borrows the accent colour.
- The export has no list_price field, so mockup prices on buyable rollers, bushes and joiner kits are illustrative and carry a visible mono "Sample price" tag. Castings are set to the honest Quote state.
- Never invent a warehouse location. "In stock" stands alone until Odoo exports a location.

### 3.8 Copy voice

Numbers first, nouns second, no adjectives. Sentence case. Short declarative lines a fitter reads on a phone: "Priced and in stock in Australia." "Fits C160." "In stock · 14." Buttons are verbs with objects: Show parts, Add, Request quote, Send quote request, Apply for a trade account. Fitment uses "suit" and "fits", never "genuine", "authorised" or "OEM alternative". Banned: leading supplier, highest quality, over 30 years, premium, exclamation marks. Any fact the business has not confirmed (dispatch cut-off, trade terms, ABN, response window) is left out of the mockup and listed in the build notes, not written as marketing.

### 3.9 Anti-slop rules (all three directions)

No indigo or violet. No emoji as icons. No decorative left accent stripes. No cards as default containers (tiles are cells in a hairline grid). No serif or italic one-word swaps in headlines. No cream and terracotta. No navy plus safety orange. No golden-hour quarry hero. No OEM logo wall (text wordmarks with counts and a non-affiliation line). No uppercase superlatives. No big-stat hero of giant numerals on rules. No numbered mono eyebrows as a rhythm crutch. No blur shadows, no gradients, no glass. No pill filter rows. No lorem. Real SKUs, real counts, real thumbnails from the export only.

### 3.10 Build rules

Single monolithic HTML file per mockup, Google Fonts only, no em dashes in copy or code comments, page works at 400px with a 16px side gutter, prefers-reduced-motion respected, all counts and SKUs traceable to /Users/jc/Part Hub Express/design/assets.

---

## 4. Direction A: Specimen Drawer (reference lock)

Angle: precision instrument. The catalogue as a measuring tool, every part on an identical plate inside a hairline cell, labelled in mono like a specimen in a calibrated drawer. Merged from the Specimen Drawer and Specimen Grid pitches: Drawer's density, header, dark-form footer selector and copy voice; Grid's correct reading of the photographs and its keyline-on-plate rule.

```text
Primary reference/direction: teenage engineering (Refero style 2055406e-755a-4276-af43-09d6b06a78f3, https://teenage.engineering). Product grid item as a 1px-bordered, 0-radius cell on a cool off-white canvas; one accent as an indicator light.
Preserve: cool canvas #f6f8f7 (never pure white, never cream); tile as a shared-edge hairline cell (the border is the card); 0 radius and zero shadows with depth only from graphite band inversion; one accent used only as a state indicator; clinical framing of every product on an identical plate.
Borrow only: Timescale's search field locked into its filled button with a shared 1px ink border (flattened to 0 radius); Sigmaphoto's 48px section rhythm and warning against oversized padding; Specimen Grid's #ebedec plate with a 1px Smoke keyline around each print.
Role rules: Index Red #d6301c is a 2px line or 6px square marking the current reading only (active selector step, selected chip, active tab underline, search focus edge, hovered cell edge). Never a fill, never on price, stock, headline or wordmark. Primary actions are ink fills. Geist Mono is for measured values only.
Media strategy: real 128px thumbnails at native size on a #ebedec plate with a 1px #b2b2b2 keyline; hero is a curated drawer of eight real parts with the cleanest backgrounds; no stock photography; no-photo tiles are typographic on the same plate.
Reject: weight 100 to 300 display (display runs 700); rounded cards with soft shadows; navy plus safety orange; quarry stock hero; OEM logo wall; upscaled thumbnails; mono for sentences; camera-icon placeholders; italic or serif swaps; tinted section boxes; a 24px "big number" in category cells.
Token commitments: canvas #f6f8f7; surface #ffffff (header bar, fields); plate #ebedec; ink #0f0e12; ink_muted #6b6f6d; rule #dcdfde; keyline #b2b2b2; dark band rule #2a2a2e; dark band secondary #b2b2b2; accent #d6301c (state line only); stock ok #1f7a4d; stock low #b8730f; radius 0; borders 1px collapsed; no shadows; Instrument Sans 700 display and 400/500 body; Geist Mono data.
```

Sharpening applied from the judges' notes:

1. Photo premise corrected. The plate is #ebedec, not white, and every print carries a 1px #b2b2b2 keyline. The direction now describes the thumbnails as small prints pinned to a uniform plate, which is what they are. Plate-to-canvas contrast is visible (#ebedec on #f6f8f7) and the keyline holds the photo edge.
2. Hero drawer curated, not dumped. Eight cells (4 by 2), not twelve, chosen from the sample set for the cleanest backgrounds: 1062440045 HP300 Drive Ring Gear, 937405 GP200 Seal, MM1155334 C130 Toggle Plate, 1022145975 HP300 Lower Head Bush, 501-011-070 Accumulator 4L 8bar, 0116-0010 Pressure Filter, 19.30.1119 Disc Return Roller, MM0264797 C160 Hammer Screw. Each print on its plate with the ref in mono beneath. Mobile shows the first six as 3 by 2.
3. Utility bar carries no placeholder. Left phone, centre ex GST / inc GST toggle (two hairline cells, active one carries the Index Red top line), right Trade login and Quote list count. The dispatch cut-off is not on the page until the client confirms it.
4. Wordmark heavier. "Parts Hub Express" in Instrument Sans 700 at 28px, tracking -0.03em, with "by ACBG" in Geist Mono 11px beside it. It is the heaviest object in the header.
5. Category counts are counts, not stats. Geist Mono 18px, right-aligned on the same baseline as the group name, not 24px.
6. Illustrative prices are flagged. Every tile with a sample price shows a mono 11px "Sample price" tag in ink_muted beneath the price row.
7. The difference section lists only confirmed facts: 5,702 parts with a searchable number; 214 categories; 1,156 photographed; manganese and chrome grade stated on castings (XT710 18%Mn, XT720 22%Mn, 27%Cr); superseded numbers resolve to the current part; fitment shown only where the data confirms it. Dispatch cut-off and trade terms are build notes, not rows.
8. Swiss-portfolio sameness countered by density and weight: counts in every cell, a real drawer in the hero, the 12-group category table with children listed, and a 700-weight wordmark at 28px, so the hairlines carry data rather than decoration.

Typography: Instrument Sans (display 700, tracking -0.03em at 56px and -0.02em at 32px; body 400 and 500), Geist Mono (data, dotted zero). Scale 12 / 13 mono / 14 / 16 / 18 / 24 / 32 / 56, 4px base.

Signature object: the specimen drawer. Every part on the site, hero to tile, sits at native size on an identical #ebedec plate inside a shared-hairline cell with its reference in mono beneath.

---

## 5. Direction B: Title Block (reference lock)

Angle: engineering drawing set. Light sheet, drawn structure, thin rules, part numbers as first-class type, one marker colour used only for marks on the drawing.

```text
Primary reference/direction: Timescale (Refero style 520e6739-69c0-4c16-a3ce-1c891c8c77c6, https://www.timescale.com). Industrial blueprint on stark white: sketched 1px controls, monochrome line illustration, colour for emphasis separated from colour for action, one hard offset shadow.
Preserve: Canvas White #fafafa with Midnight Ink #000000 doing all structural work; every control drawn with a 1px ink border at 4px radius, search input 4px 0 0 4px locked into its filled Find button; Geist with negative tracking at display sizes and Geist Mono for technical values; orange for emphasis and marks only, ink for every action; monochrome outlined line drawing as the hero medium; no blur anywhere.
Borrow only: teenage engineering's hairline lattice grammar for the category and product grids; Chargetrip's grouped machine dropdown with a count on every row.
Role rules: Markout Orange #ff5b29 may appear on the hero callout dots and leader lines, the one emphasised phrase in the hero headline, the search caret and focus underline, and the "Fits HP300" stamp on a matched tile. Nothing else. Not the step indicator, not the difference register numerals, not buttons, borders, links, backgrounds, icons, stock states or hover states.
Media strategy: hero is an SVG schematic of a jaw crusher with six numbered callouts that are live category links, subject to the acceptance criteria below, with a photographic fallback sheet; tiles carry real thumbnails at native size on a plain #f1f3f2 ground with a 1px ink keyline (a print taped to the sheet); no blend modes; no-photo tiles are typographic title blocks.
Reject: Timescale's second accent (Highlight Yellow); 12px card radius and offset shadows across a grid; navy plus safety orange; quarry photo hero; OEM logo wall; drafting grid as page or tile wallpaper; mix-blend-mode on photographs; mono for sentences; two-weight wordmark; orange numerals anywhere but the hero callouts.
Token commitments: canvas #fafafa; surface #ffffff (controls, header); tile ground #f1f3f2 (plain); hero panel #f1f3f2 with an 8px #e6e8e7 drafting grid (the only place the grid appears); ink #000000; ink_muted #6c6c6c; hairline #d9dcdb; keyline #000000 at 1px around photos; accent #ff5b29 (marks only); stock ok #1f7a3f; stock low #b45309; radius 4px on controls, 0 on cells, tiles, chips and footer; one shadow, 4px 4px 0 0 #000000 on the focused search field only; Geist 800 wordmark, 700 hero, 600 headings; Geist Mono data.
```

Sharpening applied from the judges' notes:

1. Multiply blend removed. Photos sit at native size on a plain #f1f3f2 ground with a 1px ink keyline, centred with 36px of air on desktop, like a print taped onto a drawing sheet. This is honest about the yard backgrounds and matches the direction's own metaphor.
2. Drafting grid confined to the hero panel. Tile and category image grounds are plain #f1f3f2, so the grid is a single drawn object on the page rather than wallpaper across 5,702 tiles.
3. The crusher is a schematic with acceptance criteria and a fallback. The drawing is a two-dimensional side-section schematic, not a realistic elevation: fixed jaw, swing jaw, pitman, toggle plate, cheek plates, flywheel, drawn from geometric primitives in 1px ink with a mono "Schematic, not to scale" label. Acceptance criteria before it ships: a crushing contractor names the machine type unprompted; the six callouts (01 Jaws · 221, 02 Cheek Plates · 107, 03 Concave & Mantle · 132, 04 Wedges · 69, 05 Blow Bars · 105, 06 Impact Plates · 39) land on the correct region; no line is thicker than 1px; no fill except the callout squares. If the drawing fails that review, the panel ships as the fallback sheet: a 3 by 2 lattice of six real thumbnails (MM1023214/MOD, 949647154300, 7065558093, 550-003-056, MM1155334, N65558321) each carrying the same numbered callout square, pointing to the same key. The key and the links are identical in both states, so the direction survives either way.
4. Orange reduced to four marks. The selector step indicator is ink. The difference register index numerals are ink. Orange means "a mark on the drawing" and nothing else.
5. Wordmark is one weight. PARTS HUB EXPRESS in Geist 800, tracking -0.04em, 26px, ink. The stamped title block reads through weight, not through a two-weight trick.
6. The truncated pump reference is written in full: 6/4D-AHR-R55-E4147R.
7. Numerals appear in exactly two places, the hero callouts and the difference register, both in ink except the callouts.

Typography: Geist (wordmark 800, hero 56px 700 at -0.02em, section headings 28px 600, category names 20px 600, body 400 and 500), Geist Mono (data, eyebrows on rules, callout numerals). Scale 12 / 13 / 14 / 15 / 16 / 20 / 28 / 56, 8px base.

Layout notes specific to B: the content column is framed by two full-height 1px #d9dcdb vertical rules (the drawing-sheet frame) on screens over 1024px. Every section opens with a hairline rule carrying a mono 12px uppercase eyebrow and count ("CATEGORIES · 214"). Product tiles carry the title-block strip: a hairline-topped 32px row split into two cells, part number left in mono 13px, machine token right in mono 12px, stamped orange only when it matches the selected machine.

Signature object: the annotated crusher. Six callouts that are real categories with real counts, handing the same title-block grammar down to every tile.

---

## 6. Direction C: Counter Sheet (reference lock)

Angle: the counter at a well-run parts depot. A wide bench (the search), a machine board behind it (the selector), price and stock stated before you ask. Premium comes from confidence and speed, condensed signage type used with restraint, a drawn 1px structure, and one primer-yellow action colour used only where a hand goes.

```text
Primary reference/direction: Timescale (Refero style 520e6739-69c0-4c16-a3ce-1c891c8c77c6, https://www.timescale.com). Sketched 1px controls on near-white, colour for action kept separate from everything else, dense yet legible.
Preserve: every button, input, chip and select drawn with a 1px near-black stroke on canvas white; one action colour reserved for the primary action fill; Geist Mono as the data layer; comfortable-tight density (16px gap, 16px tile padding, 48px sections, 8px base, 4px radius on controls); depth by surface stepping only (canvas, bench, ink band).
Borrow only: DJI's Platinum Gray #ededed product ground with the two-level elevation cap; IKEA's availability square plus short label tied to a real quantity; Chargetrip's brand-grouped machine dropdown with a count on the right of each row.
Role rules: Chromate Yellow #e8c000 fills exactly four things: the Search button, the Show parts button, the Add button on buyable tiles, and the active machine chip. Nothing else is saturated. Emphasis is carried by weight and by mono, never by a second colour. Stock states are green, hollow ink, or grey.
Media strategy: real thumbnails at native size in a fixed 4:3 #ededed frame with a 1px #d9d9d9 keyline and 12px inset; no hero photograph; the hero is a machine docket, a mono list of the eleven machines with counts; no-photo tiles are spec tiles with the part number in mono.
Reject: hi-vis signage yellow (#ffd400) and uppercase condensed section heads (the Bunnings register); a second emphasis colour (signal orange) on price or fitment; 96px numerals as a hero; the Timescale offset shadow on the bench; pill filter rows; a Manganese cell spanning two columns; navy plus white; quarry photo hero; OEM logo wall; whispered 300-weight display; warm cream canvas; pill buttons.
Token commitments: canvas #fafafa; bench and tile ground #ededed; ink band #0f0e12 (utility bar, hero, footer); ink #0a0a0a; ink_muted #6c6c6c; tertiary #b3b3b3; hairline #d9d9d9; keyline #d9d9d9 around photos; accent #e8c000 (four fills only, ink text on top); stock ok #1f7a3a; stock low as a hollow 1px ink square with an ink label; backorder and quote #6c6c6c; radius 4px controls, 0 tiles and bands; search input 4px 0 0 4px locked into its yellow button; no shadows at all; Barlow Condensed 700 and 800 display, Barlow 400 to 600 body, Geist Mono data.
```

Sharpening applied from the judges' notes:

1. One saturated colour, tuned away from retail. Chromate Yellow #e8c000 replaces hi-vis #ffd400. It is the colour of zinc chromate primer on fabricated steel, darker and less green than plant signage, and it keeps 11:1 contrast with ink text on top. Signal Orange is removed from the system entirely: price digits are ink at 18px 600 tabular, the matched-machine line is Barlow 600 ink with the code in mono, and Low stock is a hollow ink square with an ink label. Three chromatic colours become one plus green.
2. The hero is a docket, not a stat ticket. Full-bleed #0f0e12 band. Left: headline in Barlow Condensed 800 white at 56px, sentence case, "5,702 crusher, screen and conveyor wear parts. Priced, in stock, shipped from Australia." with the count inline at headline size, then the yellow Search parts button and a ghost white Request a quote. Right: the machine docket, a hairline #333333 table in Geist Mono 14px white listing the eleven machines with counts (HP300 · 71 through LT106 · 8), each row a 48px tap target with a right-aligned arrow that opens the filtered result, headed "Tap your machine" in Barlow Condensed 700 white 20px. Beneath the docket, one mono line: "5,702 parts · 214 categories · 1,156 photographed". No numeral larger than the headline anywhere.
3. Offset shadow removed. The bench is #ededed with 1px ink rules top and bottom. The page has no shadows.
4. Section heads in sentence case. Barlow Condensed 700 at 28px, sentence case, on a 2px ink top rule with the mono count right-aligned: "On the shelf", "Parts to suit", "Browse by part type", "Why quarries buy here". Uppercase survives only in the wordmark PARTS HUB EXPRESS (Barlow Condensed 800, 28px, -0.02em, white on the ink header band) and in mono machine codes as Odoo writes them.
5. Condensed type capped. Maximum 56px, weights 700 and 800 only, never italic, never outlined, never three sizes in one headline.
6. Equal category cells. All 12 cells the same size in a 4-column hairline grid; Manganese leads by position, not by span. Weak-coverage groups (Screen Media 13 of 703, Filters 4 of 87, Other) show the count in Geist Mono 28px on the #ededed frame instead of an image.
7. Filter row as text tabs, not pills. Above the shelf, a hairline row of Barlow 500 14px tabs (All, Fits my machine, In stock, Has photo) with a 2px ink underline on the active tab and a Sort select at the right.
8. The truncated pump reference is written in full: 6/4D-AHR-R55-E4147R.

Decisions recorded during the Option C build review (2026-09-14):

- ST 45 removed from machine tokens: 345 of 395 rows carrying the token are Wire mesh at 45 degrees ("Mesh ST 45o"), not a machine. The docket keeps eleven rows; LT106 (8) takes row eleven. Any consumer of brand_model_tokens.json (the bench Machine model list, the autocomplete Machines group, the docket) treats ST 45 as a screen-media attribute, not a fitment token, until the client says otherwise.
- GST display defaults to inc GST. The project constitution says prices are AUD, GST inclusive, stated on the page, and Australian consumer price display leads with the inc figure. The ex/inc toggle stays and persists in localStorage; ex GST leads only after a trade-only display is confirmed by the client. Hero support line reads "Prices inc GST, ex GST shown beside."

Typography: Barlow Condensed (wordmark 800, hero 800 at 56px, section heads 700 at 28px, category names 700 at 22px), Barlow (body 400, tile names 500 at 15px, facts 600 at 20px), Geist Mono (data). Scale 12 / 13 mono / 14 / 15 / 16 / 20 / 22 / 28 / 56, 8px base. Controls 48px tall everywhere (thumb height), Add button full cell width on phones.

Signature object: the yellow-buttoned bench under a black docket of machines you can tap. The site opens with the size of the stock and the eleven machines a fitter is most likely to be standing next to, not a picture of a quarry.

---

## 7. Why these three and not the other two

- Specimen Grid was the same direction as Specimen Drawer (same primary reference, same canvas and ink, same hairline lattice, same contact-sheet hero). All three judges said the two could not both ship. Grid's correct reading of the photographs (prints on a keylined plate) is merged into A; the rest of Grid is dropped.
- Night Bench scored lowest with all three judges (29, 29, 31). Dark mode runs against what Jared explicitly loved (light canvas, heavy black wordmark), the hero and difference bands depend on tinted photography that does not exist, and procurement staff on office monitors are the revenue. Its one strong idea, the identical plate for every part with an engraved no-photo state, is already present in all three shipped directions as the plate rule.
- A, B and C are distinct in a screenshot test: cool off-white instrument panel with a red index line and Instrument Sans; white drawing sheet with an annotated crusher, orange marks and Geist; near-white counter with chromate-yellow actions, ink bands and Barlow Condensed. B and C share the Timescale primary, so the shared fingerprints have been split: the hard offset shadow now exists only in B (once, on search focus), and orange exists only in B while C has no second colour at all.

Judge totals used for selection: Specimen Drawer 38 / 35 / 39; Title Block 37 / 34 / 34; Counter Sheet 35 / 39 / 36; Specimen Grid 36 / 35 / 38 (merged into Drawer); Night Bench 29 / 29 / 31 (dropped).

---

## 8. Build notes (facts to confirm with the client before launch)

These are not on any mockup page. They are placeholders in the build only.

- Same-day dispatch cut-off time and time zone.
- Trade account terms (30 days is the assumption).
- Quote response window.
- ABN, dispatch address, trading hours, phone, email.
- Which products are buyable online versus quote-only (the assumption: buy when price and stock exist in Odoo; quote when price is absent, stock is zero with no lead time, or the item is an oversize casting).
- Warehouse location for stock labels, if Odoo exports it.
- List prices: the current export has no list_price field, so every price on the mockups is a labelled sample.

---

## 9. Decision ledger

| Decision | Source | Source rule / role | Why |
|---|---|---|---|
| Flow: utility bar, search-first header, selector row under the header, brand strip, category tiles with counts, featured shelf, why-us, trade and quote block, finder repeated, operational footer | JR Factory Services flow deconstruction (principles only) plus Refero screens (IKEA header, Walmart search, Chargetrip selector) | Section order and entry-point logic, not layout or copy | Jared's stated preference; the reference proves the order works for a fitment-led parts buyer |
| Search field is the dominant header element, locked into its button | Walmart header 7cd56ee6; Timescale text input 4px 0 0 4px | Search as the page's job; asymmetric radius locks field and button | Trade buyers type numbers first (Cat, MRT, RS Online) |
| Autocomplete in three groups with counts, supersession rows | adidas 7fdac1fc; Faire 1034807a; Cat parts behaviour | Grouped suggestions with counts right-aligned | Superseded numbers must never dead-end (project constitution) |
| Three-step selector, no Year, counts on every row, grouped model dropdown with type-ahead | Chargetrip 5e14c4c3; brand_model_tokens.json | Grouped list with count pill; persisted chip | Export has no year data; the site never guesses fitment |
| Fitment shown only from structured tokens; "Fitment not listed" state | Framework Marketplace; Square compatibility b980b14f; project rule | Compatibility as filter and as a sentence on the tile | No inferred fitment (constitution rule) |
| Part number first on every tile, OEM cross-ref in brackets, in mono | RS Online (two identifiers); Peak Design 374af946 (Geist Mono for codes) | Mono reserved for codes | The primary key for a trade buyer |
| Two identifiers, ex and inc GST on every price, stock with quantity | RS Online; IKEA 18ed6838 availability dot | Availability dot plus label tied to a real quantity | The trade buyer's entire decision on one row |
| Native-size thumbnails on a uniform plate with a keyline; no upscaling; no blend modes | Asset audit (151 of 1,156 near-white borders); Sigmaphoto contain rule; Dyson tinted image stage; teenage engineering grid rhythm | Photography precisely cropped and contained on a uniform ground | The photographs are yard shots; the plate and keyline make small photos deliberate |
| Typographic no-photo tile | Refero screens research states section; Peak Design mono codes | Same frame, part number in mono | 4,546 products have no photo; the tile must look like a choice |
| Tiles are cells in a collapsed hairline grid, not cards | teenage engineering product grid item; Timescale outlined controls | The border is the card | No cards as default containers (anti-slop rule) |
| Radius 0 to 4px, no blur shadows, depth by surface inversion | teenage engineering (0), Sigmaphoto (0), Timescale (4px, hard offset), DJI (two-level cap) | Elevation without blur | Engineered feel; the soft outliers stop reading as engineered |
| Cool off-white canvases (#f6f8f7, #fafafa), never cream | teenage engineering, Timescale, DJI | Off-white ground gives product plates an edge | T1 Energy's warm chalk is the calm-editorial autopilot to avoid |
| Dark as bands only (utility bar, hero band, trade block, footer), light page | DJI, Dyson, Peak Design section alternation; judge notes on Night Bench | Full-bleed dark blocks between light catalogue sections | Jared asked for a light canvas and a heavy black wordmark; dark theme fails in daylight glare |
| Heavy grotesk wordmark at 700 to 800, display never below 500, body never below 400 | Jared's brief; judges on weight-300 display | Hierarchy by weight, not size | Fitters read on phones in yards |
| One accent per direction with a written role; stock never borrows it | teenage engineering and DJI (indicator light); Timescale (emphasis vs action) | Accent as indicator or action only | Prevents the four-colour averaged palette |
| A: Index Red as a 2px state line, never a fill | teenage engineering accent role, translated | Indicator light | Keeps red from reading as error |
| A: plate #ebedec with #b2b2b2 keyline | Specimen Grid pitch (merged); asset audit | Print pinned to a uniform wall | Fixes the false "clinical white" premise |
| A: curated eight-cell hero drawer | Asset audit of sample backgrounds; judge notes on thumbnail dump | Real parts as the picture, curated | Twelve mixed yard shots read as a dump; eight clean ones read as a drawer |
| B: annotated crusher schematic with acceptance criteria and a photographic fallback | Timescale monochrome line illustration; Cat parts diagrams with numbered callouts; judge buildability notes | Explanatory drawing, not decoration | A wrong-looking crusher costs trust; the fallback keeps the direction alive |
| B: orange limited to four marks; step indicator and register numerals in ink | Timescale emphasis-only rule; judges on shared Timescale fingerprints | Emphasis colour never on actions | Separates B from C and keeps orange from drifting into the competitor palette |
| B: drafting grid only in the hero panel | Judge note on wallpaper across 5,702 tiles | Blueprint as one drawn object | Confines a known blueprint tell |
| C: Chromate Yellow #e8c000 as the only saturated colour, four fills | ON.energy and Timescale evidence for plant yellow; judges on the Bunnings register | Action fill only | Darker, less green than hi-vis; contrast 11:1 with ink text |
| C: machine docket hero instead of a stat ticket | Chargetrip grouped list; brand_model_tokens.json; judges on the big-stat tell | Tap targets, not numerals | Fitters tap machines; giant numerals are the AI landing-page tell |
| C: no offset shadow, sentence-case condensed heads, equal category cells, text tabs not pills | Judges on shared Timescale fingerprints, signage register, layout accident, shop.app pattern | Density without retail cues | Keeps C premium and distinct from B |
| Brand strip as text wordmarks with counts and a non-affiliation line | Tidal 6c690b04 (clickable, labelled); project rule on dealer status | Trust by truth, not by logos | ACBG is an independent supplier |
| Category tiles ordered by count with real thumbnails where coverage is strong | category_tree.json; RS Online browse grid; JR tiles with counts | Counts signal depth of stock | Manganese 340 images versus Screen Media 13 decides which cells get a photo |
| Paste-a-parts-list textarea in the quote block, first on phone | Hilti quick item entry; Cursor and Factory short forms | Bulk entry as a first-class path | A fitter with a parts list should never have to browse |
| Sample prices flagged, castings set to Quote | Export has no list_price; judge note on illustrative prices | Honest state | The client must not read mock prices as real |
| Unconfirmed facts left out of the mockup | Judge note on "client to confirm" in the first 32px | Nothing invented | Placeholders in the first viewport read as unfinished |
| Motion: 150 to 200ms ease on colour, border and opacity only; no scroll reveals, no count-ups, no marquee | T1 Energy documented timing; adidas autocomplete | Small and eased | Trade site must feel instant on 4G |
| No em dashes, single file, real content only | Project constitution and brief | Build rule | Hard rules from the client and the agency |

---

## 10. LOCKED DIRECTION (2026-09-14): B Title Block, Stripe type and black

Decision by Jared, 2026-09-14. This section overrides sections 3 to 7 wherever they conflict. Build from this section.

Jared's words: "I like Number B but I want the front to be simple and easy to read. I feel like it's more AI blocks. This is the black and type from Stripe." Then: no purples, no greys, "I want the black."

### What stays from B

- The annotated crusher schematic as the hero object, six numbered callouts that are real categories with real counts.
- Search first, then Brand, Machine model, Part category.
- Part number and machine on every product tile.
- Parts to suit strip, category tree with real counts, featured parts, the difference, trade account and quote, footer.

### What goes (the "AI blocks")

- Geist Mono and every monospaced label, eyebrow and count.
- Uppercase tracked labels and section eyebrows ("CATEGORIES · 214").
- Hairline lattices, boxed cells, drawing-sheet frame rules, dashed disabled borders.
- The 32px utility bar and the ex/inc GST segmented toggle. Prices show inc GST, per the constitution.
- The drafting-grid background on the hero panel.
- Numbered difference rows (01 to 06). Not a sequence, so no numbers.
- Heavy 800 uppercase wordmark. The black footer.

### Reference lock

```text
Primary reference/direction: Stripe (Refero style ff64110d-58dd-4e18-a500-0a95073943b1, https://stripe.com), typography and ink only.
Preserve: one typeface for everything; large display at weight 400 with tight negative tracking; body 16px weight 400; Stripe's near-black navy ink for all text; white canvas; 4px button and input radius; generous section spacing (64 to 96px); tabular figures for every number.
Borrow only: from B (Title Block), the annotated crusher hero and the part-number-plus-machine line on product tiles.
Role rules: Ink #061b31 is the only text colour. No grey text: hierarchy comes from size and weight, not tint. Buttons are filled ink with white text, or ink text with an ink border. Markout Orange #ff5b29 appears only as the callout dots on the crusher drawing. Stock green #1a7f4b appears only as the 8px stock dot. Nothing else carries colour.
Media strategy: 128px Odoo thumbnails at native size, never upscaled, centred on a soft plate (#f6f8fa, 6px radius), no keyline. No-photo state: the plate carries the part number in ink at 20px and "Photo to come" at 13px.
Reject: Stripe violet #533afd and every Stripe grey text token (#50617a, #64748d); Stripe's gradient ribbon; mono type; uppercase labels; boxed grids; shadows on tiles; cards used as layout.
Token commitments: canvas #ffffff; plate #f6f8fa; line rgba(6,27,49,0.12); ink #061b31; ink hover #0a2540; accent #ff5b29 (callout dots only); stock #1a7f4b (dot only); radius 4px controls, 6px plates; no shadows except the open search suggestion panel (0 12px 32px rgba(6,27,49,0.12)).
```

### Typography

- Face: Söhne is Stripe's typeface (Klim Type Foundry, commercial licence). Mockup uses Inter Tight, the closest free match on Google Fonts, compared side by side on 2026-09-14 against Hanken Grotesk, Albert Sans, Public Sans, Instrument Sans, Schibsted Grotesk and Geist. Production choice: buy a Söhne web licence from klim.co.nz, or keep Inter Tight. Jared to decide before build.
- Scale: 14 / 16 / 18 / 22 / 32 / 44 / 56. Display 56px weight 400, tracking -0.03em, line-height 1.05 (40px on phones). Section headings 32px 400, -0.02em. Card titles 18px 500. Body 16px 400, line-height 1.5. Small 14px. Part numbers 14px 500 with tabular figures.
- Sentence case everywhere. No uppercase except OEM make names as written by the maker.

### Layout rules

- Max width 1200px, 24px gutters (16px on phones).
- Header: wordmark "Parts Hub Express" 20px 600, simple text nav (Parts, Machines, Trade accounts, Request a quote), phone and cart right. White, one bottom line.
- Hero: left, headline, one sentence, search field (56px tall, 4px radius, ink border) with the three selectors beneath it as plain selects. Right, the crusher drawing in ink lines on white, orange callout dots, a plain key list under it.
- Sections separated by space, not boxes. A single light line only where two lists meet.
- Category tiles and product tiles are clickable, so they may have a plate for the image, but the text sits on white with no border.

### 10.1 Revision (2026-09-14, later the same day)

Jared: "Yep, that way" on the Stripe fonts and black text. Then: "I still want the same styles and colours as you had with the orange and those look-throughs. I still want it to be world-class."

This revision restores B's visual system and keeps the new typography. Where 10 and 10.1 conflict, 10.1 wins.

Keeps from 10:
- Inter Tight (Söhne substitute), sentence case, no mono, no uppercase tracked labels.
- Ink #061b31 for all text. No grey text, no purple.
- Hero layout: headline, lede, search, popular searches, machine finder, crusher drawing right.
- Prices inc GST, no toggle.

Restores from B (section 5):
- Canvas #fafafa, surface #ffffff, ground #f1f3f2, drafting gridline #e6e8e7, hairline #d9dcdb.
- Markout Orange #ff5b29 in its B roles: the emphasised phrase in the hero headline, callout leader lines and dots on the drawing, the search caret and focus underline, and the "Fits" stamp on a tile that matches the chosen machine.
- The drawing panel: #f1f3f2 ground with an 8px drafting grid, 1px ink line work, dashed cutaway frames for Detail A (cone) and Detail B (impactor), hatched cheek plate region, numbered callout squares (white fill, 1px ink, fill ink on hover).
- Drawn controls: 1px ink borders, 4px radius, search field locked into its button with no gap, hard 4px 4px 0 ink shadow on search focus.
- Hairline lattices for categories, makes and products (gap 0, shared 1px edges, outline 1px ink on hover).
- Photos at native size on the #f1f3f2 plate with a 1px ink keyline.
- Title-block strip on every product tile: part number left, machine right, split by a hairline.
- Section openers: heading on a full-width 1px ink rule, with the count or link on the right.
- Ink footer (#061b31) with white text.
- Stock ok #1f7a3f, stock low #b45309, dots only.

### 10.2 Colour scheme candidates (2026-09-14, pending Jared's pick)

Font B (Inter Tight) chosen by Jared. Four palette designers, contrast computed in script, three judges (design director, outdoor buyer, Jared lens), selector kept three. Full tokens and reports in design/assets/colour_schemes.json. Review page: design/colours.html.

| Scheme | Canvas | Ground | Ink | Muted | Orange marks | Orange text | Judges |
|---|---|---|---|---|---|---|---|
| Blueprint Sheet (recommended) | #f6f8fa | #edf0f3 | #061b31 | #2f4357 | #f0501f | #c63a00 | 112 |
| Graphite | #f2f3f4 | #eaecee | #061b31 | #3a4d60 | #ec4a10 | #bd3d0b | 107 |
| Quarry | #f5f5f3 | #ebebe8 | #061b31 | #34475a | #f43e01 | #c23500 | merged |

Recommendation: Blueprint Sheet was the top scheme with every judge (112 total) and now takes in Sunlit Sheet's best parts. It is the only one of the three that meets every locked item without trade-offs: the exact #061b31 ink and footer, muted text that reads as softened navy rather than grey (9.6:1), a saturated text orange that matches the drawing callouts, and ochre low stock that can't be confused with the Fits stamp. It also has the most contrast headroom for buyers reading a phone in full sun on a quarry site. With the paper's blue pulled back, it reads as a drafting sheet rather than a fintech dashboard, and it stays the closest match to the locked B Title Block drawing set. Graphite is the pick if Jared wants something heavier and more industrial. Quarry is the pick if he wants warmth without cream.

Role rule added: the hero headline phrase uses the bright orange (large text, passes 3:1). The deep orange is for small orange text only (the Fits stamp). Original B orange #ff5b29 fails 3:1 on its canvas and ground.
Fix applied with the new font: the brand strip wraps below 1281px because Inter Tight runs wider than Geist.

### 10.3 FINAL LOCK (2026-09-14): Option B, Inter Tight, Original B colours

Jared picked "number 4, the original" from the colour switcher. This section is the build target. It overrides 10, 10.1 and 10.2 wherever they conflict.

- **Layout and styling:** option B Title Block exactly as design/option-b.html.
- **Font:** Inter Tight for everything (both the sans and mono roles). Söhne licence decision still open.
- **Colours:** the original option B tokens: canvas #fafafa, surface #ffffff, ground #f1f3f2, gridline #e6e8e7, ink #000000, ink hover #222222, on-ink #ffffff, muted #6c6c6c, hair #d9dcdb, accent #ff5b29, ok #1f7a3f, low #b45309, footer #000000 with #ffffff text, #b3b3b3 secondary and #333333 rules.
- **Accepted trade-off:** the orange #ff5b29 measures 2.97 to 1 on canvas and 2.78 to 1 on ground, just under the 3 to 1 guideline for large text and graphics. Small orange text (the Fits stamp) is 3.1 to 1 against the 4.5 guideline. Jared chose the original with this known. Revisit only if he asks.
- **Kept fix:** the brand strip wraps below 1281px, because Inter Tight runs wider than Geist.
- **Build target file:** design/homepage.html.

### 10.4 Colour fix applied (2026-09-14): Original B with Codex's recommendation

Jared: "I want to go with the original B and go with Codex recommendations." Codex (gpt-6-astra) reviewed all four schemes blind and gave the smallest fix that keeps Original B's look and clears its four contrast failures. Applied to design/homepage.html. This supersedes the accepted trade-off noted in 10.3.

- accent (drawing leaders and dots, focus underline, search caret, hero headline phrase): #ff5b29 to **#f45120**. 3.33 to 1 on canvas #fafafa, 3.12 on ground #f1f3f2, 3.47 on white.
- accentText (small orange text, the Fits stamp): **#c63a00**. 5.02 to 1 on canvas, 5.24 on white, 4.70 on ground.
- Every other Original B token is unchanged.
- Review record: three-brain-out/2026-09-14-colour-schemes/codex-review.md.

### 10.5 Homepage brief: simple, models first (2026-09-14)

Jared: "The homepage is going to be really simple, but really focused around putting out the models, the parts, and where to find them." Visual system stays exactly as 10.3 and 10.4 (option B styling, Inter Tight, Original B colours with the Codex fix). This section changes content and structure only.

**Page, top to bottom (nothing else):**
1. Header: wordmark, the search field (part number, machine or keyword), quote list, cart. No utility bar, no GST toggle. Prices are GST inclusive where shown.
2. Hero: one short headline about finding the right part for your machine, one sentence, and a Brand then Machine model finder. A hero image is allowed (generated in Higgsfield, machine in context, never a part close-up). The annotated crusher drawing stays on the page as "where each part fits".
3. Shop by machine: the machine models with part counts, the biggest section on the page. Machine photo where an openly licensed or client-owned image exists, otherwise the typographic model tile.
4. Shop by part: the 12 part groups with counts and the best real photo per group.
5. Where each part fits: the annotated crusher drawing with its six numbered callouts linked to categories.
6. Find it fast: three short routes (part number search, by machine, by category) and a request-a-quote line for anything not listed.
7. Footer.

**Removed from the homepage:** featured products grid, the difference section, trade account band, repeated selector, parts-to-suit brand wall (brands move into the machine finder).

**Image sources and rights (hard rules):**
- Parts: real photos only. Odoo export thumbnails, and the client's own photos from the old Parts Hub Express Shopify store (26 images, up to 1025px), matched by SKU. Never AI-generated parts.
- Machines: openly licensed photos (for example Wikimedia Commons, with licence and credit recorded) or client-owned photos only. Manufacturer and supplier website photos are copyrighted and are not used without written permission; they are logged as "needs permission".
- Hero: may be generated in Higgsfield. No logos, no brand livery, no text, no parts close-up.
- auscbgroup.com.au is not scraped and not used (Jared, 2026-09-14).
- Every image used on the site is recorded in design/assets/image_sources.json with source, licence and credit.

**Part photo restraint (Jared, 2026-09-14):** keep part photos on the homepage to a minimum (one per part group, twelve at most, and only where the photo is clearly right). Every part photo used anywhere on the site goes on a client verification list (SKU, part name, photo, where it appears) and is treated as unverified until ACBG confirms it shows that part. Machine and hero images do not need part verification but still carry their licence record.

### 10.6 Homepage, minimal (Jared, 2026-09-14, overrides 10.5 where they differ)

"The homepage should be really minimalistic, but really easy to identify the parts, the manufacturer, and that side of things. I don't want that homepage to be super busy. The biggest key is the search bar."

Homepage sections, and nothing else:
1. Header: wordmark, quote list, cart. Small.
2. Search: the hero. One big search field (part number, machine or keyword) with type-ahead, and under it a Brand then Machine model finder. Hero image sits beside or behind this only if it does not compete; if in doubt, no image.
3. Shop by machine: manufacturers and their models with part counts. Plain, scannable, one line per model. Photos only where licensed and confirmed for that model.
4. Shop by part: the 12 part groups with counts, one photo each at most.
5. Footer.

Dropped from the homepage: the annotated crusher drawing (moves to the /parts page), the "find it fast" routes, any featured products, any difference or trade band. Copy is minimal: one headline, one sentence.

**2026-09-14, later, applied to the build:** 10.6 stands. design/homepage.html shipped the "Where each part fits" drawing and the "Find it fast" routes against it, so both sections were removed from the homepage. Their markup, CSS and script were moved intact to design/parts-page-fits-section.html for the future /parts page, with the scroll container made keyboard reachable (tabindex 0, role region, an aria-label naming the six callouts, and a focus-visible outline). The footer "Where each part fits" link is gone and the two "Request a quote" links that pointed at the removed quote line now point at the sales address. Same pass: the hero image was dropped ("if in doubt, no image") because the only generated image on the page still carried its own listed defects, and the LT106 machine photo was returned to the typographic tile because the Commons file page still shows no VRT ticket behind the self-licensed upload.

**Note against 10.7:** design/homepage.html still carries Shop by machine and Shop by part, which 10.7 moves to /machines and /parts. That is intentional: the Next.js site in site/ is the deliverable and its homepage was already cut to 10.7. design/homepage.html is the 10.6 reference mockup and the review fixes above were applied to it as such. The same three image fixes (LT106 tile, hero image, part photo wording) need checking against site/.

### 10.7 Homepage, final cut (Jared, 2026-09-14, overrides 10.6)

"All of these sections on the homepage are not needed. They can go and find them on the second page." Shop by machine and shop by part are removed from the homepage. They live at /machines and /parts.

Homepage, complete:
1. Header (wordmark, quote list, cart).
2. Search hero: one short headline, one sentence, the big search field, the Brand then Machine model finder. Hero image only if it does not compete.
3. Two quiet links under the finder: "Browse all parts" and "Browse by machine".
4. Footer.

### 10.8 Homepage, world-class but parts-focused (Jared, 2026-09-14, overrides 10.7)

"Home page needs a bit more to it. I just didn't want all the parts unfolded on the home screen. It should still be a world-class home screen, but focus on the parts."

Sections, in order:
1. Header.
2. Search hero: eyebrow, headline, one sentence, the big search, Brand then Machine model finder, hero image beside on desktop.
3. Machines strip: one compact row per brand, model chips with counts linking to /machines/<model>. This is the "models that link to all these parts". No photos here.
4. Where each part fits: the sectional drawings with numbered callouts to the six wear part categories, plus a short intro. Drawings are being redrawn as three clean sections (jaw, cone, impactor) with the wear parts hatched; until then the existing drawing is used.
5. Why Parts Hub Express: four facts, each backed by something on the site or in the data. Draft copy (delivery specifics are to confirm with ACBG before launch):
   - Search the number you already have. Part numbers, old numbers and machine models all resolve.
   - 4,555 parts in one place. Crusher, screen and conveyor wear parts from Australian stock.
   - Express dispatch. Stocked parts leave the warehouse fast. Cut-off time and carriers to confirm with ACBG.
   - Trade accounts and quotes. Order on account, or paste a parts list and get every line priced.
6. Our clients say: real reviews only, read from site/data/reviews.json ({name, company, quote, date}). The section renders only when the file has entries. The two testimonials on the old Shopify store (Alice Jones, John Smith) are theme demo content and are not used. ACBG to supply real reviews, or we connect Google reviews later.
7. Get connected: email signup band. Heading "Get connected with our exclusive email updates and sales" (the client's own line from the old store). Posts to /api/subscribe, which appends to site/data/inbox/subscribers.jsonl and, when Resend is configured, adds the contact to a Resend audience.
8. Footer.

Not on the homepage: category tiles, product tiles, blog, clearance banners, marketplace "list your parts" line.

### 10.9 Homepage amendments (Jared, 2026-09-14)

- Parts by machine is a tile grid: one tile per model with a machine type illustration (unbranded, generated in Higgsfield Nano Banana Pro, one image per type, never per model), model code, brand, type label, part count. Tiles link to /machines/<model>. Caption states the images are type illustrations, not the specific model.
- Order: search hero, parts by machine, why Parts Hub Express, where each part fits, our clients say, get connected, footer.
- Homepage has one search only, the big one in the hero. The header search is hidden on the homepage and shown on every other page.
- Reviews: site/data/reviews.json. Entries with "sample": true render only when NEXT_PUBLIC_SHOW_SAMPLE_REVIEWS=1 (local preview). Real entries (no sample flag) render on previews. At launch (SITE_LIVE=1) only entries with "verified_by_client": true render, so an unconfirmed review drops out on its own (added 2026-09-29). Nothing sample can reach production.

**Search amendment (Jared, 2026-09-14, overrides the search line in 10.9):** the text search (part number, machine model or keyword) lives in the header on every page, including the homepage. The homepage hero has no text search and no divider line; its only control is the Brand then Machine model finder.

### 10.10 Homepage colour and rhythm (Jared, 2026-09-14)

- Two dark bands break up the white: "Why Parts Hub Express" and "Our clients say", both black (#000000) with white headings, #b3b3b3 body, #333333 hairlines, and the eyebrow label in Markout Orange.
- Rhythm top to bottom: light hero, light machines, dark why, light drawings, dark reviews, grey email signup, black footer.
- Hero browse links are pill tokens: 44px tall, 1.5px orange outline, orange arrow; hover and keyboard focus fill deep orange #c63a00 with white text and a soft orange ring.
- Reviews show star ratings only from a rating field on each review. Aggregate score and count are computed from those fields.
- Hero copy is headline plus finder only; the supporting sentence and the finder note were removed as repetition.

### 10.11 Homepage amendments, late (Jared, 2026-09-14, overrides 10.8 to 10.10 where they differ)

- Parts by machine: four machine type tiles (jaw, cone, mobile jaw, mobile impact), each with its type photo, a model dropdown and View parts. ST 45 is listed as a text link until its make and type are confirmed. Overrides the per-model tiles in 10.9.
- Reviews: the two quotes from the old Parts Hub Express store (John Smith, Screens Online; Alice Jones, SJ Crushing) are shown as they appear there, flagged verified_by_client false, with placeholder 5 star ratings. Jared confirms names, quotes and ratings with ACBG. Overrides the "theme demo content, not used" line in 10.8.
- Dark band headings: "Why Parts Hub Express" and "Our clients say" are large Markout Orange headings (30 to 44px, weight 700) over a #333333 hairline, the same treatment in both bands. Overrides the white heading plus orange eyebrow line in 10.10.
- No "illustration" wording anywhere on the homepage. The photos stay.

### 10.12 Motion (2026-09-14, adapted from the HyperFrames motion rules)

Jared asked to run the HyperFrames and Remotion skills through the website. HyperFrames renders video from HTML and the Remotion skill only ports existing Remotion code, so neither runs on a live site. Their motion doctrine transfers and is applied here. No animation library: CSS transitions and the Web Animations API only.

Doctrine
- Smooth beats bouncy. No overshoot, bounce or elastic anywhere. The house settle is power3.out.
- Motion explains or confirms. It never slows finding a part. Nothing above the fold animates on load: header, hero headline, finder and hero photo are static.
- Animate transform, opacity, clip-path and SVG stroke or fill only. Never width, height, top, left, margin or padding.
- Scroll-triggered motion uses IntersectionObserver, fires once, never scrubs, never hijacks scrolling.
- prefers-reduced-motion: every transition and entrance is off and the page renders in its final state.
- Nothing is hidden without JavaScript. Entrance states are set by script only on elements still below the fold, and every entrance ends in the exact static layout.
- Group staggers stay under 0.5s in total so an arrival reads as one beat.

Tokens (app/globals.css)
- --ease-settle: cubic-bezier(.215,.61,.355,1), power3.out. Entrances and state changes.
- --ease-gentle: cubic-bezier(.25,.46,.45,.94), power2.out. Opacity, fills, secondary motion.
- --ease-press: cubic-bezier(.55,.085,.68,.53), power1.in. The press dip only.
- --t-press 90ms, --t-state 160ms, --t-enter 520ms, --t-draw 900ms.

Moments, with the HyperFrames rule each is adapted from
1. Press feedback (press-release-spring, subtle variation): buttons, pills, View parts, Show parts, Subscribe, Add to quote and cart steppers dip to scale .97 in 90ms and settle back in 220ms. No overshoot.
2. Linked highlight in one beat (control-target-sync): key row, wear part fill, callout square and the fade of the other parts all change in the same 160ms with one ease.
3. Drawings plot themselves once (svg-path-draw): when "Where each part fits" first enters view, each section's outlines draw like a plotter pass (900ms, gentle ease), panels 120ms apart. Wear part hatching fades in from 60 percent of the draw, leaders draw next, then callout numbers appear. Dashed centre lines fade instead of drawing. Inline styles are removed when the draw ends so hover and focus own the drawing afterwards.
4. Star wipe (stat-bars-and-fills, star rating fill): in the dark reviews band the aggregate stars wipe left to right (clip-path, 700ms, gentle ease) 120ms after the band enters view; each card's stars start 240ms after their card.
5. Section arrivals (waterfall-entry, softened for a store): machine type tiles, the four Why facts, the dispatch photo and the review cards rise 16px and fade in (transform 520ms settle, opacity 360ms gentle), 70ms apart. Below the fold only.
6. Suggestions panel (anchored-layout-expand, simplified): opens with a 140ms fade and a 4px drop, closes instantly.
7. Phone header: any condense on scroll uses transform or a negative sticky offset. Never tween height. As built: row 1 wordmark with Parts and Machines, row 2 search with Quote and Cart; a -44px sticky offset lets row 1 scroll away with the page and row 2 pins at 61px.

Verification (HyperFrames definition of done, adapted)
- Frames at 0, 250, 600 and 1400ms after each trigger. The settled frame must match the reduced-motion render.
- Cumulative layout shift caused by motion is 0.
- No entrance target sits below opacity 1 two seconds after its trigger.
- Reduced-motion emulation shows the final state immediately.
- Checked at 375px and at desktop width.

Codex review 2026-09-15 (score 75, no P0) led to: every entrance also releases on focus, on pointer or focus in a drawing section, on a width change mid-draw, before printing and when reduced motion is switched on; triggers at the viewport edge; the wear part fill crossfades hatch to orange in the same 160ms beat; card stars sized to the rating so the wipe tracks it; card and stars form one group. Re-verified 2026-09-15 (.tmp/motion/out4, tests T1 to T10), all pass.

Verified 2026-09-14 (.tmp/motion/out): settled frames match the reduced-motion render with 0 differing pixels at 1440x900 and 375x812; layout shift 0 through a full scroll; no element left hidden and no live animations afterwards; press dip reads scale .97 and aria-disabled buttons do not dip; highlight properties share 160ms and one ease; suggestions panel starts at opacity 0 and 4px up; reduced motion holds nothing.

### 10.13 Share tile and site icons (Jared, 2026-09-15)

Jared wants a strong preview card when the link is texted on iMessage or shared on Facebook, including Marketplace.

- Open Graph and Twitter image: one 1200x630 tile for the whole site (app/opengraph-image.png and twitter-image.png). Black ground like the dark bands, Inter Tight, the wordmark, the hero line "Find the right part for your machine." set large, and the jaw crusher section drawn in white with its wear parts in Markout Orange. Type is sized for a phone preview about 300px wide: nothing essential under 40px. No counts, prices, dispatch claims, reviews or domain in the image, so it never goes stale or wrong.
- Titles: product, machine and category links keep their own page title in the card (no site-wide og:title, which Next would copy onto every page). The homepage title carries the category line.
- Social preview crawlers (Facebook, WhatsApp, X, LinkedIn, Slack, Telegram, Discord) are allowed in robots.txt before launch so the card renders; search engines stay blocked by the noindex rule.
- Site icons: interim typographic icon until the new logo is approved (favicon.ico, icon.png, apple-icon.png). It replaces the default Next.js icon.
- Current logo (old Shopify store, 150x73 JPEG only): charcoal "PARTSHUB", steel-blue "EXPRESS", mustard gear with arrow swoosh and speed lines, domain inside the lockup. Not used on the site; brief and prompts for a new mark in design/brand/LOGO_BRIEF.md.

### 10.14 Logo direction chosen (Jared, 2026-09-15)

Jared picked concept A from design/brand/concepts (2026-09-15-logo-A-callout-P-pro.png): "This is the best one."

- Symbol: a square callout frame with a capital P inside and an orange square as a full stop. The frame opens on the right, level with the orange square. One stroke weight throughout. Rebuilt on a 90-unit grid: stroke 10, padding 9, P 52 wide by 52 tall, bowl 32 tall with a 16 radius (counter radius 6), orange square 10 by 10 sitting on the baseline under the bowl's right edge, frame gap from 61 to 71.
- Wordmark: PARTS HUB EXPRESS on one line in Antonio Bold (SIL Open Font Licence), tracking -0.02em, converted to outlines. Cap height 0.45 of the symbol height, gap between symbol and wordmark 14 units, vertically centred.
- Colours: ink #000000 or reversed #ffffff, the square always Markout Orange #F45120.
- Small sizes: 32px and up use the framed symbol; 16px uses the frameless "P." (the frame and the P merge at 16px).
- Use now: preview site header, footer, icons and share tile. Status: concept stage. Before launch or print, ACBG approves it, a designer redraws the final artwork, and an IP Australia trade mark search is done (design/brand/LOGO_BRIEF.md section 4).
- Master files and build script: design/brand/logo.

### 10.15 Hero underline (Jared, 2026-09-15, amends 10.12)

"Let's get an orange line through the machine underneath it, so as it loads, it underlines underneath the word machine." A straight line, not a squiggle.

- The word "machine" in the hero headline gets a Markout Orange underline, about 0.075em thick (never under 3px), sitting just below the baseline and spanning the word only (not the full stop).
- On load it draws left to right: transform scaleX 0 to 1, 700ms, settle ease, starting 350ms after first paint. CSS only, no JavaScript, so it runs before hydration.
- This is the one exception to 10.12's "nothing above the fold animates on load". Reduced motion shows the finished line with no animation.
