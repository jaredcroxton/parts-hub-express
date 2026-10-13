# SOP: strip_watermark (ACBG text stamp off product thumbnails)

Layer 1 SOP for `tools/strip_watermark.py`. Deterministic. One job: remove ACBG's own text stamp from the product thumbnails that carry it, so no product image on the site shows a watermark.

## Goal

Some Odoo product photos (mostly rollers) were stamped by ACBG with "AUSCB GROUP" across the part: red on 125, yellow on one, and one drawing carries a faint diagonal "AUSTRALIAN CRUSHING & BELTING". The stamp is burned into the image Odoo serves. This tool paints it out before the thumbnail is written to `site/public/img/products/`.

Found 2026-10-13 by viewing every image the site ships on contact sheets: 127 of the 1,023 Odoo thumbnails carry the stamp. The 11 client Shopify photos, the hero, dispatch and machine images, the share cards and the icons carry none. The 139 thumbnails that exist only in `design/assets/img/` (not shipped) carry none.

## Inputs

- A thumbnail (PIL image, RGB) and its file stem (the SKU made file-safe, same as `build_catalogue.py`).
- `design/assets/watermark_register.json`: one entry per stamped thumbnail, keyed by file stem (schema in claude.md).

## Tool logic

1. No register entry for the stem: return the image untouched.
2. Image size differs from the entry `size`: return untouched (the photo was replaced in Odoo).
3. Count pixels inside `box` that are clearly the stamp colour (red: `r - max(g, b)`, yellow: `min(r, g) - b`, at or above 30). Fewer than 12: return untouched (the photo is already clean).
4. Fill every pixel in `box`, from the edge inward, each from the distance-weighted mean of the known pixels within 2 pixels of it.
5. Entry with `"fill": "text"`: step 3 counts faint stamp pixels (at or above 14) and step 4 fills only those pixels, widened by 2, so the picture between the letters stays. Used where the stamp runs across a line drawing.

`build_catalogue.py` runs steps 1 to 5 on every Odoo thumbnail before saving it and writes the count to `manifest.json` as `watermarks_stripped`. Client Shopify photos (`-large`) are never touched.

## Rules

- Only ACBG's own stamp is removed. Another company's watermark is never removed: that photo is a supplier photo and the fix is to drop it (claude.md, images rule).
- The register is the only switch. A photo is never altered because it looks stamped to a detector. Every entry was checked by eye, before and after.
- The fill is plain interpolation of the photo's own pixels. Nothing is generated (part photos are real only) and nothing is upscaled. It leaves a soft band where the stamp was.
- The spec table under roller photos is part of the picture and stays.
- No em dashes in any output.

## Adding a stamped photo later

1. Open the thumbnail at native size and read the pixel box around the stamp: `[x0, y0, x1, y1]`, upper bounds exclusive. Leave 5 pixels of margin: the red bleeds past the letters.
2. Add `"<file stem>": {"box": [...], "size": [w, h]}` to the register. Add `"stamp": "yellow"` for a yellow stamp.
3. Run `python3 tools/build_catalogue.py`, look at the result, adjust the box if red haze remains or the band covers more of the part than it needs to.

The lasting fix is at the source: ACBG uploads the unstamped photo in Odoo. The stamp colour count then falls to zero and the entry goes quiet.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Stamp back on one photo | Photo changed size in Odoo | Update `size` and `box` in the register |
| Pink haze beside the band | Box too tight, red bleed sits outside it | Grow the box by 2 pixels |
| Clean photo gets a soft band | Part itself is red or orange inside the box, so step 3 still counts stamp colour | Remove the register entry |
| New stamped photo on the site | Product photo added in Odoo after 2026-10-13 | Add a register entry |
| `watermarks_stripped` drops in `manifest.json` | Photos replaced in Odoo | Expected when clean, otherwise see row 1 |

## Re-run

`python3 tools/build_catalogue.py` rebuilds every thumbnail from the Odoo source with the stamp removed. To clean an existing folder of thumbnails in place (the design mock-up copies): `python3 tools/strip_watermark.py design/assets/img`.
