# Share tile and interim icon

Source for the 1200x630 share image (site/app/opengraph-image.png and twitter-image.png) and the interim "P." icon (favicon.ico, icon.png, apple-icon.png). Spec: design/DESIGN_CHARACTERISTICS.md 10.13.

Regenerate (fonts load from Google Fonts, so it needs internet):

1. Edit `tile-final.html` or `icon.html`. The tile inlines site/data/drawings/jaw.svg.
2. `node render.mjs 1200 630 2 tile-final.html tile@2x.png` and `node render.mjs 512 512 1 icon.html icon-512.png`.
3. Downscale the tile to 1200x630 (Lanczos) and save as site/app/opengraph-image.png and twitter-image.png.
4. Icons: save icon-512 as RGBA. Next rejects an ICO holding RGB PNGs. Write favicon.ico (16, 32, 48), icon.png (512) and apple-icon.png (180).
5. Rebuild and redeploy. Facebook caches cards: paste the URL into the Sharing Debugger and press Scrape Again. iMessage caches per device.

Since 15 September 2026 the tile shows the chosen logo (design/brand/logo/phx-lockup-white.svg) and the icons come from the logo masters: favicon.ico holds phx-p-dot at 16px and the framed symbol at 32 and 48px on white; icon.png (512) and apple-icon.png (180) are the white symbol on black at 64 percent. The old interim P. icon source (icon.html) is kept for reference only.
