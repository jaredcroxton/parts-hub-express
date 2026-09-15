#!/usr/bin/env python3
"""handshake_odoo: confirm the Odoo link before anything else runs (Express Link phase; SOP architecture/odoo_api_sync.md).

Checks: server version, transport, login, product count, the fields the sync reads, and the API user's access
(read products, create customers and sale orders). Prints a pass or fail line per check. Read only: creates nothing.
Run: python3 tools/handshake_odoo.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from odoo_client import Odoo, OdooError  # noqa: E402

NEEDED_FIELDS = ["default_code", "name", "categ_id", "list_price", "qty_available", "weight", "description_sale",
                 "sale_ok", "active", "write_date", "image_128"]
ACCESS = [("product.product", "read"), ("res.partner", "read"), ("res.partner", "create"), ("res.country", "read"),
          ("sale.order", "read"), ("sale.order", "create")]


def main():
    failures = 0

    def check(label, ok, detail=""):
        nonlocal failures
        print(("PASS  " if ok else "FAIL  ") + label + (f": {detail}" if detail else ""))
        if not ok:
            failures += 1

    try:
        odoo = Odoo(pause=0.5)
    except OdooError as e:
        print(f"FAIL  configuration: {e}")
        sys.exit(1)
    try:
        version = odoo.version()
        check("server reachable", True, f"Odoo {version} at {odoo.url}")
        major = int(str(version).split(".")[0].split("+")[0].replace("saas~", "") or 0) if str(version)[:1].isdigit() else 0
        if major:
            want = "json2" if major >= 19 else "jsonrpc"
            check("transport matches version", odoo.transport == want, f"ODOO_TRANSPORT={odoo.transport}, Odoo {major} wants {want}")
        odoo.whoami()
        check("login with API key", True, f"database {odoo.db}")
        count = odoo.search_count("product.product", [])
        check("product count", count > 0, f"{count} active products")
        fields = odoo.fields_get("product.product")
        missing = [f for f in NEEDED_FIELDS if f not in fields]
        check("product fields present", not missing, "missing " + ", ".join(missing) if missing else f"{len(NEEDED_FIELDS)} fields")
        sample = odoo.search_read("product.product", [["default_code", "!=", False]], ["default_code", "name", "list_price", "qty_available", "sale_ok"], limit=3)
        check("sample products readable", bool(sample), "; ".join(f"{s['default_code']} ${s['list_price']} qty {s['qty_available']}" for s in sample))
        for model, mode in ACCESS:
            allowed = odoo.can(model, mode)
            if allowed is None:
                print(f"INFO  {mode} on {model}: Odoo would not report access, confirm in Settings, Users")
            else:
                check(f"{mode} on {model}", allowed)
    except OdooError as e:
        check("Odoo call", False, str(e))
    print(f"\n{'All checks passed' if not failures else str(failures) + ' check(s) failed'}.")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
