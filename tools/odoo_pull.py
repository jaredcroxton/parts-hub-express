#!/usr/bin/env python3
"""odoo_pull: pull the product catalogue from the Odoo API into a local folder (SOP: architecture/odoo_api_sync.md).

Output (default .tmp/odoo_pull):
  products.json   list of {id, default_code, name, categ_path, list_price, qty_available, weight, description_sale,
                  sale_ok, active, write_date, image_file}
  images/<id>.bin raw image_128 bytes, fetched only for products with no image on the site yet or changed since the last sync
  manifest.json   counts, transport, timing

Run from the project root: python3 tools/odoo_pull.py [--out DIR] [--images-dir site/public/img/products]
Next step: python3 tools/build_catalogue.py --source odoo
"""
import argparse
import base64
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from odoo_client import ROOT, Odoo, OdooError  # noqa: E402

FIELDS = ["id", "default_code", "name", "categ_id", "list_price", "qty_available", "weight", "description_sale",
          "sale_ok", "active", "write_date"]
PAGE = 500
IMAGE_BATCH = 100


def safe_name(sku):
    return re.sub(r"[^A-Za-z0-9_\-]+", "_", sku)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, ".tmp", "odoo_pull"))
    ap.add_argument("--images-dir", default=os.path.join(ROOT, "site", "public", "img", "products"))
    ap.add_argument("--previous-manifest", default=os.path.join(ROOT, "site", "data", "manifest.json"))
    ap.add_argument("--pause", type=float, default=1.0)
    args = ap.parse_args()

    started = time.monotonic()
    try:
        odoo = Odoo(pause=args.pause)
        version = odoo.version()
        total = odoo.search_count("product.product", [])
        print(f"Odoo {version} via {odoo.transport}: {total} active products")
        rows, offset = [], 0
        while True:
            page = odoo.search_read("product.product", [], FIELDS, limit=PAGE, offset=offset, order="id")
            rows.extend(page)
            offset += len(page)
            if len(page) < PAGE:
                break
        if len(rows) != total:
            print(f"warning: counted {total} but pulled {len(rows)}", file=sys.stderr)

        last_write = None
        if os.path.exists(args.previous_manifest):
            with open(args.previous_manifest) as f:
                last_write = json.load(f).get("odoo_max_write_date")

        os.makedirs(os.path.join(args.out, "images"), exist_ok=True)
        need = []
        products = []
        for r in rows:
            categ = r.get("categ_id")
            path = [p.strip() for p in categ[1].split("/")] if isinstance(categ, list) and len(categ) > 1 else []
            sku = (r.get("default_code") or "").strip() if isinstance(r.get("default_code"), str) else ""
            rec = {
                "id": r["id"], "default_code": sku, "name": (r.get("name") or "").strip(), "categ_path": path,
                "list_price": r.get("list_price") or 0, "qty_available": r.get("qty_available") or 0,
                "weight": r.get("weight") or 0, "description_sale": r.get("description_sale") or "",
                "sale_ok": bool(r.get("sale_ok")), "active": bool(r.get("active", True)), "write_date": r.get("write_date"),
                "image_file": None,
            }
            products.append(rec)
            if sku:
                has_file = os.path.exists(os.path.join(args.images_dir, safe_name(sku) + ".jpg"))
                changed = bool(last_write and rec["write_date"] and rec["write_date"] > last_write)
                if not has_file or changed:
                    need.append(rec)

        fetched = 0
        by_id = {p["id"]: p for p in products}
        for i in range(0, len(need), IMAGE_BATCH):
            ids = [p["id"] for p in need[i:i + IMAGE_BATCH]]
            for img in odoo.read("product.product", ids, ["image_128"]):
                data = img.get("image_128")
                if data:
                    fn = f"{img['id']}.bin"
                    with open(os.path.join(args.out, "images", fn), "wb") as f:
                        f.write(base64.b64decode(data))
                    by_id[img["id"]]["image_file"] = fn
                    fetched += 1
    except OdooError as e:
        print(f"odoo_pull failed: {e}", file=sys.stderr)
        sys.exit(1)

    with open(os.path.join(args.out, "products.json"), "w") as f:
        json.dump(products, f, ensure_ascii=False)
    writes = [p["write_date"] for p in products if p.get("write_date")]
    manifest = {
        "run_at": datetime.now(timezone.utc).isoformat(), "transport": odoo.transport, "odoo_version": version,
        "odoo_count": total, "pulled": len(products), "images_requested": len(need), "images_fetched": fetched,
        "odoo_max_write_date": max(writes) if writes else last_write, "duration_s": round(time.monotonic() - started, 1),
    }
    with open(os.path.join(args.out, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
    print(json.dumps(manifest, indent=1))


if __name__ == "__main__":
    main()
