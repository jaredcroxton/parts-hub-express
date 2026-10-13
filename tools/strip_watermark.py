#!/usr/bin/env python3
"""strip_watermark: paint ACBG's own text stamp out of the product thumbnails that carry it.

SOP: architecture/strip_watermark.md. Deterministic. Only thumbnails listed in
design/assets/watermark_register.json are touched, and only inside the listed box.

Used by tools/build_catalogue.py on every Odoo thumbnail. To clean a folder of thumbnails in place:
  python3 tools/strip_watermark.py design/assets/img
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTER = os.path.join(ROOT, "design", "assets", "watermark_register.json")

STRONG = 30      # clearly the stamp colour
MIN_STRONG = 12  # fewer stamp pixels than this inside the box means the photo is already clean
WEAK = 14        # "text" fill only: faintly the stamp colour
WIDEN = 2        # "text" fill only: pixels added around the stamp pixels before filling
REACH = 2        # fill window radius

NEIGHBOURS = [(dx, dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]


def load_register():
    if not os.path.exists(REGISTER):
        return {}
    with open(REGISTER) as f:
        return json.load(f)


def score(p, stamp):
    """How strongly a pixel is the stamp colour. Red unless the entry says yellow."""
    if stamp == "yellow":
        return min(p[0], p[1]) - p[2]
    return p[0] - max(p[1], p[2])


def stamp_mask(px, size, entry):
    """Set of (x, y) to fill, or an empty set when the box holds no stamp."""
    w, h = size
    x0, y0, x1, y1 = entry["box"]
    stamp = entry.get("stamp", "red")
    text_only = entry.get("fill") == "text"  # a faint stamp over a drawing: fill the letters, keep the drawing
    box = {(x, y) for y in range(max(0, y0), min(h, y1)) for x in range(max(0, x0), min(w, x1))}
    if sum(1 for p in box if score(px[p], stamp) >= (WEAK if text_only else STRONG)) < MIN_STRONG:
        return set()
    if not text_only:
        return box
    mask = {p for p in box if score(px[p], stamp) >= WEAK}
    for _ in range(WIDEN):
        mask |= {(x + dx, y + dy) for x, y in mask for dx, dy in NEIGHBOURS
                 if 0 <= x + dx < w and 0 <= y + dy < h}
    return mask


def fill(px, size, mask):
    """Fill the mask from its edge inward. Each pixel takes the distance-weighted mean of known pixels around it."""
    w, h = size
    todo = set(mask)
    while todo:
        layer = [(x, y) for x, y in todo
                 if any((x + dx, y + dy) not in todo and 0 <= x + dx < w and 0 <= y + dy < h
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        if not layer:  # the mask covers the whole image
            return
        values = {}
        for x, y in layer:
            acc, total = [0.0, 0.0, 0.0], 0.0
            for dy in range(-REACH, REACH + 1):
                for dx in range(-REACH, REACH + 1):
                    q = (x + dx, y + dy)
                    if q in todo or not (0 <= q[0] < w and 0 <= q[1] < h):
                        continue
                    wt = 1.0 / (dx * dx + dy * dy)
                    c = px[q]
                    acc = [acc[i] + wt * c[i] for i in range(3)]
                    total += wt
            values[(x, y)] = tuple(int(round(v / total)) for v in acc)
        for p, v in values.items():
            px[p] = v
        todo -= set(layer)


def strip(pil, entry):
    """Return (image, changed). The image must be RGB. Untouched when the entry does not match."""
    if not entry or list(pil.size) != list(entry["size"]):
        return pil, False
    out = pil.copy()
    px = out.load()
    mask = stamp_mask(px, out.size, entry)
    if not mask:
        return pil, False
    fill(px, out.size, mask)
    return out, True


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: python3 tools/strip_watermark.py <folder of thumbnails named <stem>.jpg>")
    folder = sys.argv[1]
    changed = 0
    for stem, entry in sorted(load_register().items()):
        fn = os.path.join(folder, stem + ".jpg")
        if not os.path.exists(fn):
            continue
        with Image.open(fn) as im:
            out, did = strip(im.convert("RGB"), entry)
        if did:
            out.save(fn, "JPEG", quality=88)
            changed += 1
    print(f"stripped {changed} thumbnails in {folder}")


if __name__ == "__main__":
    main()
