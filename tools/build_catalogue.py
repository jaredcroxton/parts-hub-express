#!/usr/bin/env python3
"""build_catalogue: Odoo products to site catalogue JSON and product images.

SOP: architecture/build_catalogue.md and architecture/odoo_api_sync.md. Deterministic. Re-runnable.

Sources:
  --source xlsx  the Odoo product export in source/ (original build, until the API is connected)
  --source odoo  the folder written by tools/odoo_pull.py; merges with the previous catalogue so products missing from
                 Odoo stay as inactive records tagged odoo-missing, keeps existing URLs, maps price and stock, and stops
                 before writing when the pull looks wrong (zero rows, or active products down more than 20 percent)

Run from the project root: python3 tools/build_catalogue.py [--source odoo]
"""
import argparse
import io
import json
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "source", "odoo_products_export_2026-09.xlsx")
IMG_LARGE = os.path.join(ROOT, "design", "assets", "img_large")
TOKENS = os.path.join(ROOT, "design", "assets", "brand_model_tokens.json")
IMAGE_SOURCES = os.path.join(ROOT, "design", "assets", "image_sources.json")

EXCLUDE_GROUPS = {"MMA", "Domestic", "Non-Inventory", "Consumables"}
MAX_ACTIVE_DROP = 0.20

# Machine type table. Public model naming, to be confirmed with the client.
MACHINE_TYPES = {
    "HP200": ("Metso", "cone"), "HP300": ("Metso", "cone"), "HP400": ("Metso", "cone"), "GP200": ("Metso", "cone"),
    "C120": ("Metso", "jaw"), "C130": ("Metso", "jaw"), "C160": ("Metso", "jaw"),
    "LT106": ("Metso", "mobile jaw"), "LT1213": ("Metso", "mobile impact"),
    "C12": ("Extec", "mobile jaw"), "J1175": ("Finlay", "mobile jaw"), "I44": ("McCloskey", "mobile impact"),
    "J45": ("McCloskey", "mobile jaw"), "MR130": ("Kleemann", "mobile impact"), "QJ341": ("Sandvik", "mobile jaw"),
    "ST 45": ("Make to confirm", "unknown"),
}
ALT_CODE = re.compile(r"^([0-9A-Z][0-9A-Z\-\.\/]{3,})\b")


def machine_credit(mi):
    """One credit line: '<author>, <licence>, via Wikimedia Commons'. The register's credit field already
    carries that shape, so use it as is and only assemble from parts when it is missing."""
    if not mi:
        return None
    credit = (mi.get("credit") or "").strip()
    if credit:
        return credit
    parts = [mi.get("licence", ""), "via " + mi.get("source", "") if mi.get("source") else ""]
    return ", ".join(x for x in parts if x) or None


def norm(s):
    return re.sub(r"[\s\-\.\/]", "", (s or "").lower())


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)


def safe_name(sku):
    return re.sub(r"[^A-Za-z0-9_\-]+", "_", sku)


def load_tokens():
    with open(TOKENS) as f:
        t = json.load(f)
    models = [m for m, _ in t["models"]]
    brands = [b for b, _ in t["brands"]]
    return models, brands


def load_image_sources():
    if not os.path.exists(IMAGE_SOURCES):
        return {"images": []}
    with open(IMAGE_SOURCES) as f:
        return json.load(f)


def token_pattern(tok):
    # word boundary, spaces optional inside the token (ST 45 matches ST45 and ST-45)
    inner = r"[\s\-]?".join(re.escape(c) for c in tok.replace(" ", ""))
    return re.compile(r"(?<![A-Za-z0-9])" + inner + r"(?![A-Za-z0-9])", re.I)


def split_category(raw):
    path = [p.strip() for p in str(raw).split("/")] if raw and str(raw) != "False" else []
    if path[:1] == ["All"]:
        path = path[1:]
    return path or ["Other"]


# ---------------------------------------------------------------------------------------------------------------
# Sources: each yields the same row shape.
#   {odoo_id, sku, name, path, image_bytes, list_price, qty, weight, description, sale_ok, active, write_date}
# ---------------------------------------------------------------------------------------------------------------

def rows_from_xlsx():
    import openpyxl

    wb = openpyxl.load_workbook(SRC)
    ws = wb["Products"]
    header_row, cols = None, []
    for i, row in enumerate(ws.iter_rows(min_row=1, max_row=5, values_only=True), start=1):
        if row and "Internal Reference" in [str(c) for c in row if c]:
            header_row = i
            cols = [str(c) if c else "" for c in row]
            break
    if header_row is None:
        sys.exit("header row not found")
    imgmap = {im.anchor._from.row + 1: im for im in ws._images}
    for rownum, row in enumerate(ws.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
        d = dict(zip(cols, row))
        im = imgmap.get(rownum)
        sku = d.get("Internal Reference")
        yield {
            "odoo_id": d.get("ID"), "sku": str(sku).strip() if sku else "", "name": (d.get("Name") or "").strip(),
            "path": split_category(d.get("Product Category")), "image_bytes": im._data() if im is not None else None,
            "list_price": None, "qty": None, "weight": None, "description": "", "sale_ok": None, "active": True,
            "write_date": None,
        }


def rows_from_odoo(pull_dir):
    with open(os.path.join(pull_dir, "products.json")) as f:
        products = json.load(f)
    for p in products:
        data = None
        if p.get("image_file"):
            fn = os.path.join(pull_dir, "images", p["image_file"])
            if os.path.exists(fn):
                with open(fn, "rb") as fi:
                    data = fi.read()
        yield {
            "odoo_id": p["id"], "sku": (p.get("default_code") or "").strip(), "name": (p.get("name") or "").strip(),
            "path": split_category(" / ".join(p.get("categ_path") or [])), "image_bytes": data,
            "list_price": p.get("list_price") or 0, "qty": p.get("qty_available") or 0, "weight": p.get("weight") or 0,
            "description": p.get("description_sale") or "", "sale_ok": bool(p.get("sale_ok")),
            "active": bool(p.get("active", True)), "write_date": p.get("write_date"),
        }


def price_inc_gst(list_price, sale_ok, includes_gst):
    if not sale_ok or not list_price or list_price <= 0:
        return None
    value = Decimal(str(list_price)) if includes_gst else Decimal(str(list_price)) * Decimal("1.1")
    return float(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def stock_status(active, qty):
    if not active:
        return "unavailable"
    if qty > 2:
        return "in_stock"
    if qty > 0:
        return "low_stock"
    return "made_to_order"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["xlsx", "odoo"], default="xlsx")
    ap.add_argument("--pull-dir", default=os.path.join(ROOT, ".tmp", "odoo_pull"))
    ap.add_argument("--out-data", default=os.path.join(ROOT, "site", "data"))
    ap.add_argument("--out-img", default=os.path.join(ROOT, "site", "public", "img", "products"))
    ap.add_argument("--out-machines", default=os.path.join(ROOT, "site", "public", "img", "machines"))
    ap.add_argument("--allow-drop", action="store_true", help="skip the 20 percent active product drop guardrail")
    args = ap.parse_args()
    started = time.monotonic()
    from_odoo = args.source == "odoo"
    includes_gst = os.environ.get("ODOO_PRICES_INCLUDE_GST", "0").strip() == "1"
    synced_at = datetime.now(timezone.utc).isoformat()

    os.makedirs(args.out_data, exist_ok=True)
    os.makedirs(args.out_img, exist_ok=True)
    models, brands = load_tokens()
    model_re = {m: token_pattern(m) for m in models}
    brand_re = {b: re.compile(r"\b" + re.escape(b) + r"\b", re.I) for b in brands}
    sources = load_image_sources()

    previous = []
    prev_catalogue = os.path.join(args.out_data, "catalogue.json")
    if from_odoo and os.path.exists(prev_catalogue):
        with open(prev_catalogue) as f:
            previous = json.load(f)
    prev_by_sku = {p["sku"]: p for p in previous}

    large = {}
    if os.path.isdir(IMG_LARGE):
        for fn in os.listdir(IMG_LARGE):
            base, ext = os.path.splitext(fn)
            if ext.lower() in (".png", ".jpg", ".jpeg", ".webp"):
                large[base] = fn

    manifest = {"rows_in": 0, "excluded": 0, "written": 0, "skipped_no_sku": [], "skipped_duplicate_sku": [],
                "images": {"odoo_128": 0, "client_shopify": 0, "none": 0}, "run_at": synced_at}
    seen_sku, seen_slug = set(), set()
    products = []
    pending_images = []  # written only after the guardrails pass
    created = updated = 0

    rows = rows_from_odoo(args.pull_dir) if from_odoo else rows_from_xlsx()
    for d in rows:
        manifest["rows_in"] += 1
        path = d["path"]
        if path[0] in EXCLUDE_GROUPS:
            manifest["excluded"] += 1
            continue
        sku, name = d["sku"], d["name"]
        if not sku:
            manifest["skipped_no_sku"].append({"odoo_id": d["odoo_id"], "name": name})
            continue
        if sku in seen_sku:
            manifest["skipped_duplicate_sku"].append({"odoo_id": d["odoo_id"], "sku": sku, "name": name})
            continue
        seen_sku.add(sku)

        prev = prev_by_sku.get(sku)
        if prev and prev.get("slug") and prev["slug"] not in seen_slug:
            slug = prev["slug"]  # URLs keep resolving when Odoo renames a product
        else:
            slug = slugify(sku) + "-" + slugify(name)
            base_slug, n = slug, 2
            while slug in seen_slug:
                slug = f"{base_slug}-{n}"
                n += 1
        seen_slug.add(slug)

        machine_tokens = [t for t, rx in model_re.items() if rx.search(name)]

        # Code-in-name rule. A leading token is an alt part number only when it is not a machine model
        # token and not a short number (belt widths like "1000" parse as codes otherwise).
        alt = []
        m = ALT_CODE.match(name)
        if m and norm(m.group(1)) != norm(sku):
            code = m.group(1)
            machine_norms = {norm(t) for t in machine_tokens}
            if norm(code) not in machine_norms and not (code.isdigit() and len(code) < 5):
                alt.append(code)
        brand_tokens = [b for b, rx in brand_re.items() if rx.search(name)]

        # images
        safe = safe_name(sku)
        image_path, image_thumb, image_source, iw, ih = None, None, "none", None, None
        thumb_fn = f"{safe}.jpg"
        if d["image_bytes"]:
            try:
                pil = Image.open(io.BytesIO(d["image_bytes"]))
                if pil.mode in ("RGBA", "LA", "P"):
                    bg = Image.new("RGB", pil.size, (255, 255, 255))
                    bg.paste(pil.convert("RGBA"), mask=pil.convert("RGBA").split()[-1])
                    pil = bg
                else:
                    pil = pil.convert("RGB")
                pending_images.append((os.path.join(args.out_img, thumb_fn), pil))
                image_thumb = f"/img/products/{thumb_fn}"
                image_path, image_source, iw, ih = image_thumb, "odoo_128", pil.size[0], pil.size[1]
            except Exception as e:  # noqa: BLE001
                print("image failed", sku, e, file=sys.stderr)
        elif from_odoo and os.path.exists(os.path.join(args.out_img, thumb_fn)):
            with Image.open(os.path.join(args.out_img, thumb_fn)) as existing:  # unchanged since the last sync
                iw, ih = existing.size
            image_thumb = f"/img/products/{thumb_fn}"
            image_path, image_source = image_thumb, "odoo_128"
        if safe in large:
            src_fn = large[safe]
            dst_fn = f"{safe}-large{os.path.splitext(src_fn)[1].lower()}"
            pending_images.append((os.path.join(args.out_img, dst_fn), os.path.join(IMG_LARGE, src_fn)))
            with Image.open(os.path.join(IMG_LARGE, src_fn)) as lp:
                iw, ih = lp.size
            image_path, image_source = f"/img/products/{dst_fn}", "client_shopify"
        manifest["images"][image_source] += 1

        rec = {
            "odoo_id": d["odoo_id"], "sku": sku, "slug": slug, "name": name,
            "category_path": path, "category_slug": "/".join(slugify(p) for p in path),
            "price_aud_inc_gst": None, "price_source": None, "stock_qty": None, "stock_status": "call_to_confirm",
            "weight_kg": None, "weight_source": None, "description": "",
            "image_path": image_path, "image_thumb": image_thumb, "image_source": image_source, "image_w": iw, "image_h": ih,
            "fits": [], "machine_tokens": machine_tokens, "brand_tokens": brand_tokens,
            "alt_part_numbers": alt, "brand": None, "active": True,
        }
        if from_odoo:
            qty = d["qty"] or 0
            price = price_inc_gst(d["list_price"], d["sale_ok"], includes_gst)
            rec.update({
                "price_aud_inc_gst": price, "price_source": "odoo" if price is not None else None,
                "stock_qty": int(qty) if float(qty).is_integer() else qty, "stock_status": stock_status(d["active"], qty),
                "weight_kg": d["weight"] if d["weight"] and d["weight"] > 0 else None,
                "weight_source": "odoo" if d["weight"] and d["weight"] > 0 else None,
                "description": d["description"] or "", "active": d["active"], "tags": [], "synced_at": synced_at,
            })
            if prev is None:
                created += 1
            elif any(prev.get(k) != rec.get(k) for k in ("name", "price_aud_inc_gst", "stock_qty", "stock_status", "category_path", "active")):
                updated += 1
        products.append(rec)
        manifest["written"] += 1

    marked_missing = 0
    if from_odoo:
        # Soft delete: anything the site had that Odoo no longer returns stays, inactive and tagged.
        for prev in previous:
            if prev["sku"] in seen_sku or prev.get("slug") in seen_slug:
                continue
            gone = dict(prev, active=False, stock_status="unavailable", price_aud_inc_gst=None, price_source=None,
                        tags=sorted(set((prev.get("tags") or []) + ["odoo-missing"])), synced_at=synced_at)
            products.append(gone)
            seen_slug.add(gone["slug"])
            marked_missing += 1

        active_now = sum(1 for p in products if p["active"])
        active_before = sum(1 for p in previous if p.get("active", True))
        if manifest["written"] == 0 or active_now == 0:
            sys.exit("Guardrail: the Odoo pull produced no products. Nothing written.")
        if active_before and active_now < active_before * (1 - MAX_ACTIVE_DROP) and not args.allow_drop:
            sys.exit(f"Guardrail: active products would drop from {active_before} to {active_now} (more than 20 percent). "
                     "Nothing written. Check Odoo, then rerun with --allow-drop if the drop is real.")

    for dest, item in pending_images:
        if isinstance(item, str):
            with open(item, "rb") as fi, open(dest, "wb") as fo:
                fo.write(fi.read())
        else:
            item.save(dest, "JPEG", quality=88)

    active_products = [p for p in products if p["active"]]
    cat_products = defaultdict(list)
    for r in active_products:
        cat_products[tuple(r["category_path"])].append(r)

    # categories tree
    curated = {}
    for img in sources.get("images", []):
        if img.get("role") == "part" and img.get("category") and img.get("sku"):
            curated.setdefault(img["category"], img["sku"])

    def node(path):
        return {"name": path[-1], "slug": "/".join(slugify(p) for p in path), "path": list(path),
                "product_count": 0, "image_count": 0, "children": {}, "hero_sku": None, "_best": (0, None)}

    tree = {}
    for path in cat_products:
        level = tree
        for i, part in enumerate(path):
            if part not in level:
                level[part] = node(path[: i + 1])
            level = level[part]["children"]

    def finish(level):
        out = []
        for key in sorted(level, key=lambda k: -level[k]["product_count"]):
            nd = level[key]
            nd["hero_sku"] = curated.get(nd["name"]) or nd["_best"][1]
            del nd["_best"]
            nd["children"] = finish(nd["children"])
            out.append(nd)
        return out

    for r in active_products:
        level = tree
        for part in r["category_path"]:
            nd = level[part]
            nd["product_count"] += 1
            if r["image_path"]:
                nd["image_count"] += 1
                area = (r["image_w"] or 0) * (r["image_h"] or 0)
                if area > nd["_best"][0]:
                    nd["_best"] = (area, r["sku"])
            level = nd["children"]
    categories = finish(tree)

    # machines
    machine_images = {}
    os.makedirs(args.out_machines, exist_ok=True)
    for img in sources.get("images", []):
        # site_excluded: kept in the register for the record, never shipped (for example dealer branding in frame)
        if img.get("role") == "machine" and img.get("machine_model") and not img.get("site_excluded"):
            src = os.path.join(ROOT, "design", img["file"])
            if os.path.exists(src):
                fn = os.path.basename(src)
                with open(src, "rb") as fi, open(os.path.join(args.out_machines, fn), "wb") as fo:
                    fo.write(fi.read())
                img = dict(img, file="/img/machines/" + fn)
                # register names are long form (Nordberg HP400); match the model token inside them
                for model in models:
                    if norm(model) in norm(img["machine_model"]) and model not in machine_images:
                        machine_images[model] = img
    machines = []
    for model in models:
        count = sum(1 for r in active_products if model in r["machine_tokens"])
        if count == 0:
            continue
        brand, mtype = MACHINE_TYPES.get(model, ("Make to confirm", "unknown"))
        mi = machine_images.get(model)
        machines.append({"model": model, "slug": slugify(model), "brand": brand, "type": mtype, "product_count": count,
                         "image": mi.get("file") if mi else None,
                         "image_credit": machine_credit(mi)})
    machines.sort(key=lambda m: -m["product_count"])

    index = [{"sku": r["sku"], "sku_norm": norm(r["sku"]), "name": r["name"].lower(), "alt": r["alt_part_numbers"],
              "alt_norm": [norm(a) for a in r["alt_part_numbers"]], "slug": r["slug"], "cat": r["category_path"][0],
              "tokens": [t.lower() for t in r["machine_tokens"]]} for r in active_products]

    with open(os.path.join(args.out_data, "catalogue.json"), "w") as f:
        json.dump(products, f, ensure_ascii=False)
    with open(os.path.join(args.out_data, "categories.json"), "w") as f:
        json.dump(categories, f, ensure_ascii=False, indent=1)
    with open(os.path.join(args.out_data, "machines.json"), "w") as f:
        json.dump(machines, f, ensure_ascii=False, indent=1)
    with open(os.path.join(args.out_data, "search-index.json"), "w") as f:
        json.dump(index, f, ensure_ascii=False)
    manifest["skipped_no_sku_count"] = len(manifest["skipped_no_sku"])
    manifest["skipped_duplicate_sku_count"] = len(manifest["skipped_duplicate_sku"])
    if from_odoo:
        pull_manifest = {}
        pm = os.path.join(args.pull_dir, "manifest.json")
        if os.path.exists(pm):
            with open(pm) as f:
                pull_manifest = json.load(f)
        manifest.update({
            "source": "odoo", "transport": pull_manifest.get("transport"), "odoo_version": pull_manifest.get("odoo_version"),
            "odoo_count": pull_manifest.get("odoo_count"), "pulled": pull_manifest.get("pulled"),
            "created": created, "updated": updated, "marked_missing": marked_missing,
            "active_products": sum(1 for p in products if p["active"]), "prices_include_gst": includes_gst,
            "odoo_max_write_date": pull_manifest.get("odoo_max_write_date"), "errors": [],
            "duration_s": round(time.monotonic() - started, 1),
        })
    with open(os.path.join(args.out_data, "manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in manifest.items() if not k.startswith("skipped_") or k.endswith("_count")}, indent=1))
    print("categories:", len(categories), "machines:", len(machines))


if __name__ == "__main__":
    main()
