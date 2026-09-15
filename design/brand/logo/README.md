# Parts Hub Express logo (concept A, chosen 15 September 2026)

Spec: design/DESIGN_CHARACTERISTICS.md 10.14. Source concept: design/brand/concepts/2026-09-15-logo-A-callout-P-pro.png.

## Files

| File | Use |
|---|---|
| phx-lockup.svg | Primary logo: symbol plus wordmark, black ink, orange square. Light backgrounds. |
| phx-lockup-white.svg | Reversed lockup for black backgrounds (footer, share tile, dark bands). |
| phx-symbol.svg | Symbol alone, black. Social profile pictures, stamps, 32px and larger icons. |
| phx-symbol-white.svg | Symbol alone, white, for black backgrounds (iPhone and app icons). |
| phx-p-dot.svg | Frameless P with the orange square, for 16px (the frame and P merge at that size). |
| logo-paths.json | Path data. build.py also writes site/lib/logo-paths.json, which the site header and footer inline. |
| fonts/Antonio[wght].ttf, fonts/OFL-Antonio.txt | Wordmark typeface (Antonio Bold, SIL Open Font Licence 1.1), outlined into the SVGs. |

## Rules

- Colours: ink #000000 or #FFFFFF; the square is always Markout Orange #F45120. No other colours, no gradients, no effects.
- Clear space: at least one stroke width (a tenth of the symbol height) on every side.
- Minimum sizes: lockup 24px tall on screen; symbol 32px; below 32px use phx-p-dot.svg.
- Never stretch, rotate, outline, recolour the square or re-set the wordmark in another font.

## Rebuild

`python3 design/brand/logo/build.py` (needs fontTools). Then rebuild the icons and share tile (design/brand/share-tile/README.md), then rebuild and redeploy the site.

## Status

Concept stage, in use on the preview site only. Before launch, print or signage: ACBG approval, a designer's final vector redraw (for clean ownership), and an IP Australia trade mark search (design/brand/LOGO_BRIEF.md section 4).
