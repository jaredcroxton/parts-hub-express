VERDICT: Revise before acceptance. The settled visuals are sound, but visibility, accessibility and timing defects remain.
SCORE: 75
P0: none

P1:

1. **site/lib/drawings.ts:86; site/app/page.tsx:193**: Reduced motion is checked only during initialization. Enabling it afterward leaves paused effects armed and running effects active; `animation:none!important` does not cancel these JavaScript animations. **Fix:** listen for the media query’s `change` event and cancel every owned animation, including running ones, then disconnect observers and retain the static state.

2. **site/app/globals.css:369**: The negative sticky offset can leave keyboard focus outside the viewport. After scrolling down, tabbing from Find reaches Parts and Machines in the hidden first row. Changing outline offset at line 376 does not reveal that row. **Fix:** set `top:0` while the wordmark or first-row navigation has keyboard focus, without a transition or height change.

3. **site/lib/drawings.ts:112; site/app/page.tsx:216**: Negative observer margins leave already visible content paused. At 1440px width, the drawing trigger excludes approximately 173px at the viewport bottom, and arrivals exclude 115px. A user stopping there sees missing drawing content or transparent tiles indefinitely. Percentages resolve against root **width**, further exaggerating this on shallow desktop windows. **Fix:** trigger at the actual viewport boundary and release entrance effects on focus. [Intersection Observer specification](https://www.w3.org/TR/intersection-observer/#dom-intersectionobserver-rootmargin).

4. **site/lib/drawings.ts:96**: Drawing effects take precedence over immediate interaction. During the entrance, selecting or focusing a key cannot reveal callout numbers held at opacity zero until 900ms; wear-part fills remain suppressed by `fillOpacity`, and animated dashed parts override highlight dimming. **Failure:** the key responds while its corresponding drawing information remains missing. **Fix:** on drawing/key focus or pointer interaction, synchronously cancel that section’s drawing effects before applying the highlight.

P2:

1. **site/lib/drawings.ts:108; site/app/page.tsx:212**: Started animations are removed from `held`, but `beforeprint` cancels only `held`. Printing during an entrance can capture incomplete drawings, faded cards or clipped stars. **Fix:** maintain an ownership registry until cancellation, and release both pending and running effects before printing. Exercising the supplied callbacks confirms running effects survive `beforeprint`.

2. **site/app/globals.css:70; site/app/globals.css:285**: Later `transition:background var(--t)` declarations override the press block’s transition properties for Find and quantity buttons. Their scale changes snap on both press and release; the 90ms fourth duration has no corresponding transform property. **Fix:** consolidate the declarations or place the complete press transition block after these rules, preserving background transitions.

3. **site/app/globals.css:152**: Wear-part fill is missing from the claimed synchronized highlight. Line 157 and its equivalents immediately replace the hatch paint with orange, while stroke and opacity transition for 160ms. **Fix:** crossfade separate hatch and orange paint layers using the same 160ms ease. Simply adding `fill` to the transition cannot smoothly interpolate a pattern URL into a color.

4. **site/app/page.tsx:83; site/app/page.tsx:205**: Review-card star spans stretch across the card because they are children of a column flex container. The clip wipe therefore traverses mostly empty space, revealing all five stars substantially before its nominal 700ms ends. **Fix:** give card stars `align-self:flex-start` or `width:max-content`, keeping the wipe bound to the actual rating. [Flexbox alignment specification](https://www.w3.org/TR/css-flexbox-1/#align-items-property).

5. **site/app/page.tsx:211**: Stagger indices mix review cards with their nested stars. When aggregate stars, card 1, its stars, card 2 and its stars arrive together, the cards start 140ms apart, and each card’s stars start 310ms after its card. Separate observer deliveries make the relationship even less predictable. **Fix:** observe cards as groups, stagger cards by 70ms, and schedule their stars exactly 240ms relative to each card’s start. Trigger aggregate stars from the band separately.

6. **site/lib/drawings.ts:91**: Dash lengths are frozen at load even though the drawing can resize before entering view. Loading at desktop width and then narrowing below the 900px single-column breakpoint enlarges the SVG substantially. The old dash length can become shorter than the rendered non-scaling stroke, producing gaps that disappear abruptly on cancellation. Clamping scale to at least one also changes effective drawing speed when SVGs shrink. **Fix:** calculate lengths from current rendered geometry immediately before playback, and finish or update active drawings on resize. Non-scaling strokes require scale-aware dash calculations. [Documented implementation issue](https://github.com/juliangarnier/anime/issues/793).

WHAT IS ALREADY RIGHT:

- Static markup remains visible without motion scripts, and initial reduced-motion mode skips arming.
- The normal pause, update timing, play and cancel sequence is valid. The supplied code does not establish a normal-path double-arming bug.
- The drawing selector excludes Enlarge dialog copies, so opening a dialog presents the static drawing.
- I independently confirmed zero differing pixels between the saved settled and reduced-motion drawing screenshots at both sizes.
- The locked palette, typography and non-overshooting motion remain intact.
- Repeatedly adding `.open` while suggestions remain open does not restart the animation. The phone `:has()` usage is supported throughout the requested Safari 16 to 18 range. [WebKit support announcement](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/).

VERIFICATION GAPS:

- **.tmp/motion/motion-check.mjs:76**: Desktop reviews already entered during the drawing capture. Their later contact sheet shows settled cards, so it does not verify a fresh reviews entrance.
- **.tmp/motion/motion-check.mjs:65**: Resetting CLS after 1800ms discards startup and font-loading shifts. The result supports that particular scroll walk, not a general cold-load CLS claim.
- **.tmp/motion/motion-check.mjs:80**: Walking the whole page and checking afterward does not establish visibility two seconds after each trigger, or visibility when scrolling stops inside the excluded bottom strip.
- **.tmp/motion/motion-check.mjs:33**: An iPhone user-agent string still runs Chromium. Safari, Firefox, real iOS `:active`, the software keyboard and SVG rendering differences remain untested.
- **.tmp/motion/motion-check.mjs:104**: Sampling one button after 160ms and release after 400ms proves endpoints, not 90ms/220ms timing or coverage of Find and steppers.
- **.tmp/motion/motion-check.mjs:89**: Reading transition declarations omits wear-part fill behavior and interaction during the drawing entrance.
- No checks cover printing mid-animation, preference changes, keyboard entry into the collapsed header, resize before drawing playback, back/forward restoration or delayed fonts.
- The reported 158/166 paused animations establish allocation count, not startup cost. Parse-time geometry reads and SVG paint work need a performance trace.
- My additional checks were source analysis, callback lifecycle checks and saved-image comparison. No independent live-browser reproduction was available.

CONFIDENCE: medium
