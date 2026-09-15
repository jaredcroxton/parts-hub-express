# Parts Hub Express logo: rules for the video

The logo is at concept stage (chosen 15 September 2026). Use it for internal and ACBG review. It needs ACBG approval before the video goes public.

## Files in this folder

| File | What it is | Use it for |
|---|---|---|
| `phx-lockup.svg` / `phx-lockup-2400.png` | Symbol plus PARTS HUB EXPRESS, black ink, orange square | Anything on a light background |
| `phx-lockup-white.svg` / `phx-lockup-white-2400.png` | Same, white ink, orange square | The logo open and the end card on black |
| `phx-symbol.svg` / `phx-symbol-1024.png` | Symbol alone, black | Light backgrounds, 32px and larger |
| `phx-symbol-white.svg` / `phx-symbol-white-1024.png` | Symbol alone, white | Black backgrounds, the logo open build |
| `phx-p-dot.svg` / `phx-p-dot-512.png` | P and orange square without the frame | Anything smaller than 32px |

The PNG files have transparent backgrounds. Prefer the SVG files in HyperFrames (they stay sharp at any size).

## Anatomy (for animating it)

The symbol sits on a 90 by 90 unit grid:

- **Frame:** stroke 10 units. It opens on the right between y 61 and y 71.
- **P:** stem x 19 to 29, height y 19 to 71. The bowl runs from y 19 to 51 with a 16 unit radius and a 6 unit inner radius.
- **Orange square:** x 61 to 71, y 61 to 71. It sits on the P's baseline, under the bowl's right edge, level with the frame's opening.
- **Lockup:** the wordmark starts 14 units right of the symbol. Its cap height is 40.5 units, vertically centred on the symbol. The full lockup is 420 by 90 units.

The path data is inside each SVG, so the frame, the P, the square and the wordmark can be animated as separate elements.

## Colours

- Ink: #000000 on light backgrounds, #FFFFFF on black.
- The square is always Markout Orange #F45120, in both versions.
- No other colours, no gradients, glows, shadows, outlines or textures on the logo.

## Space and size

- **Clear space:** at least one frame stroke (a tenth of the symbol height) on every side. Nothing else sits inside it.
- **Minimum sizes:** lockup 24px tall; symbol 32px. Below 32px, use `phx-p-dot.svg`.
- **Recommended in the 1920x1080 master:**
  - Logo open: lockup 180 to 220px tall, centred.
  - End card: lockup about 120px tall.
  - Corner watermark, if you use one: 40px tall, white, with clear space.

## Never

- Stretch, squash, rotate, skew or crop the logo.
- Recolour the square, or put the black version on a dark background.
- Retype the wordmark or set other text in its typeface (Antonio). Captions and titles use Inter Tight.
- Rebuild the logo from a screenshot of the website, trace it, or generate a variation with AI.
- Add a tagline, web address or effects inside the logo.
