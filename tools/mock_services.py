#!/usr/bin/env python3
"""mock_services: local stand-ins for Odoo (JSON-2 and JSON-RPC), Stripe and Resend, for tools/test_integrations.py.

Never used in production. Keeps everything in memory. Control endpoints:
  GET  /_state   partners, orders, emails, sessions, payment intents
  POST /_config  {"odoo_down": bool, "drop_products": bool}
  POST /_reset   clear recorded state

Run: python3 tools/mock_services.py --port 8791
"""
import argparse
import base64
import json
import struct
import threading
import urllib.parse
import zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ODOO_KEY, ODOO_DB, ODOO_LOGIN, ODOO_UID = "test-odoo-key", "testdb", "api@example.com", 7
STRIPE_KEY = "sk_test_mock"
RESEND_KEY = "re_testkey"


def tiny_png():
    """A valid 1x1 white PNG, built here so the fixture can never be a corrupt pasted string."""
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    header = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    body = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(b"\x00\xff\xff\xff")) + chunk(b"IEND", b"")
    return base64.b64encode(body).decode()


PNG = tiny_png()

PRODUCTS = [
    {"id": 101, "default_code": "TEST-JAW-01", "name": "C130 Fixed Jaw 18% Mn", "categ_id": [11, "All / Manganese / Jaws"], "list_price": 1000.0, "qty_available": 5.0},
    {"id": 102, "default_code": "TEST-CONE-02", "name": "HP300 Mantle STD", "categ_id": [12, "All / Manganese / Concave & Mantle"], "list_price": 2500.0, "qty_available": 1.0},
    {"id": 103, "default_code": "TEST-ROLL-03", "name": "Return Roller 127 x 1000", "categ_id": [21, "All / Rollers / Return"], "list_price": 45.45, "qty_available": 0.0},
    {"id": 104, "default_code": "TEST-QUOTE-04", "name": "Bowl Liner quote only", "categ_id": [12, "All / Manganese / Concave & Mantle"], "list_price": 0.0, "qty_available": 2.0},
    {"id": 105, "default_code": "TEST-NOSALE-05", "name": "Internal spare", "categ_id": [31, "All / Wear Parts"], "list_price": 99.0, "qty_available": 9.0, "sale_ok": False},
    {"id": 106, "default_code": "MMA-EXCL-06", "name": "MMA branch part", "categ_id": [41, "All / MMA / Parts"], "list_price": 10.0, "qty_available": 1.0},
    {"id": 107, "default_code": False, "name": "No internal reference", "categ_id": [31, "All / Wear Parts"], "list_price": 10.0, "qty_available": 1.0},
    {"id": 108, "default_code": "TEST-FILTER-08", "name": "Hydraulic Filter", "categ_id": [51, "All / Filters"], "list_price": 20.0, "qty_available": 100.0},
]
for p in PRODUCTS:
    p.setdefault("sale_ok", True)
    p.update({"active": True, "weight": 0.0, "description_sale": False, "write_date": "2026-09-15 06:00:00", "image_128": PNG})

LOCK = threading.Lock()
STATE = {}


def reset():
    STATE.clear()
    STATE.update({"partners": [], "orders": [], "emails": [], "audience": [], "sessions": {}, "payment_intents": {},
                  "config": {"odoo_down": False, "drop_products": False}, "odoo_calls": 0})


reset()


def match(rec, domain):
    for leaf in domain:
        if not isinstance(leaf, list) or len(leaf) != 3:
            continue
        field, op, value = leaf
        have = rec.get(field)
        if isinstance(have, list) and have and isinstance(have[0], int) and op in ("=", "!="):
            have = have[0]
        if op == "=" and have != value:
            return False
        if op == "!=" and have == value:
            return False
        if op == "=ilike" and str(have or "").lower() != str(value or "").lower():
            return False
        if op == "in" and have not in value:
            return False
    return True


def odoo(model, method, args, kwargs):
    """Tiny Odoo model layer. args and kwargs follow execute_kw conventions."""
    STATE["odoo_calls"] += 1
    products = PRODUCTS[:2] if STATE["config"]["drop_products"] else PRODUCTS
    tables = {"product.product": products, "res.partner": STATE["partners"], "sale.order": STATE["orders"],
              "res.country": [{"id": 13, "code": "AU", "name": "Australia"}],
              "res.country.state": [{"id": 505, "code": "NSW", "country_id": [13, "Australia"], "name": "New South Wales"}]}
    if method == "context_get":
        return {"lang": "en_AU", "uid": ODOO_UID}
    if model == "ir.model.access" and method == "check":
        return True
    if method == "fields_get":
        return {f: {"type": "char", "string": f} for f in ["default_code", "name", "categ_id", "list_price", "qty_available", "weight",
                                                            "description_sale", "sale_ok", "active", "write_date", "image_128"]}
    rows = tables.get(model)
    if rows is None:
        raise ValueError(f"mock has no model {model}")
    pick = lambda r, fields: {k: r.get(k) for k in (["id"] + [f for f in (fields or r.keys()) if f != "id"])}  # noqa: E731
    if method == "search_count":
        return sum(1 for r in rows if match(r, args[0] if args else kwargs.get("domain", [])))
    if method == "search_read":
        domain = args[0] if args else kwargs.get("domain", [])
        found = [r for r in rows if match(r, domain)]
        found.sort(key=lambda r: r["id"])
        off, lim = kwargs.get("offset") or 0, kwargs.get("limit")
        found = found[off: off + lim] if lim else found[off:]
        return [pick(r, kwargs.get("fields")) for r in found]
    if method == "read":
        ids = args[0] if args else kwargs.get("ids", [])
        return [pick(r, kwargs.get("fields")) for r in rows if r["id"] in ids]
    if method == "create":
        vals_list = args[0] if args else kwargs.get("vals_list")
        single = isinstance(vals_list, dict)
        ids = []
        for vals in ([vals_list] if single else vals_list):
            rec = dict(vals, id=len(rows) + 1 + (500 if model == "sale.order" else 900))
            if model == "sale.order":
                rec["name"] = f"S{len(rows) + 1:05d}"
                rec["state"] = "draft"
            rows.append(rec)
            ids.append(rec["id"])
        return ids[0] if single else ids
    if method == "action_confirm":
        for r in rows:
            if r["id"] in (args[0] if args else kwargs.get("ids", [])):
                r["state"] = "sale"
        return True
    raise ValueError(f"mock does not implement {model}.{method}")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):  # quiet
        pass

    def reply(self, status, obj):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n).decode() if n else ""

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        with LOCK:
            if url.path == "/_state":
                return self.reply(200, {k: v for k, v in STATE.items()})
            if url.path.startswith("/v1/"):
                if self.headers.get("Authorization") != f"Bearer {STRIPE_KEY}":
                    return self.reply(401, {"error": {"message": "Invalid API Key"}})
                parts = url.path.strip("/").split("/")
                if parts[1:3] == ["checkout", "sessions"] and len(parts) == 3:
                    return self.reply(200, {"data": [], "has_more": False})
                if parts[1:3] == ["checkout", "sessions"] and len(parts) == 5 and parts[4] == "line_items":
                    form = STATE["sessions"].get(parts[3])
                    if form is None:
                        return self.reply(404, {"error": {"message": "No such session"}})
                    data, i = [], 0
                    while f"line_items[{i}][quantity]" in form:
                        k = f"line_items[{i}]"
                        qty, unit = int(form[f"{k}[quantity]"]), int(form[f"{k}[price_data][unit_amount]"])
                        data.append({"id": f"li_{i}", "quantity": qty, "description": form[f"{k}[price_data][product_data][name]"],
                                     "amount_total": qty * unit,
                                     "price": {"unit_amount": unit, "product": {"name": form[f"{k}[price_data][product_data][name]"],
                                                                                "metadata": {"sku": form[f"{k}[price_data][product_data][metadata][sku]"],
                                                                                             "cart_sku": form[f"{k}[price_data][product_data][metadata][cart_sku]"]}}}})
                        i += 1
                    return self.reply(200, {"data": data, "has_more": False})
                if parts[1] == "payment_intents" and len(parts) == 3:
                    pi = STATE["payment_intents"].setdefault(parts[2], {"id": parts[2], "metadata": {}})
                    return self.reply(200, pi)
            return self.reply(404, {"error": "not found"})

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        raw = self.body()
        with LOCK:
            if url.path == "/_reset":
                reset()
                return self.reply(200, {"ok": True})
            if url.path == "/_config":
                STATE["config"].update(json.loads(raw or "{}"))
                return self.reply(200, STATE["config"])
            if url.path == "/web/webclient/version_info":
                return self.reply(200, {"jsonrpc": "2.0", "id": 1, "result": {"server_version": "19.0"}})
            if url.path.startswith("/json/2/") or url.path == "/jsonrpc":
                if STATE["config"]["odoo_down"]:
                    return self.reply(503, {"error": "maintenance"})
            if url.path.startswith("/json/2/"):
                if self.headers.get("Authorization") != f"bearer {ODOO_KEY}" or self.headers.get("X-Odoo-Database") != ODOO_DB:
                    return self.reply(401, {"name": "werkzeug.exceptions.Unauthorized", "message": "Invalid apikey"})
                _, _, _, model, method = url.path.split("/", 4)
                body = json.loads(raw or "{}")
                args = []
                if method == "create":
                    args = [body.get("vals_list")]
                elif method in ("read", "action_confirm"):
                    args = [body.get("ids", [])]
                try:
                    return self.reply(200, odoo(model, method, args, body))
                except ValueError as e:
                    return self.reply(400, {"name": "ValueError", "message": str(e)})
            if url.path == "/jsonrpc":
                req = json.loads(raw or "{}")
                params = req.get("params", {})
                service, method, args = params.get("service"), params.get("method"), params.get("args", [])
                if service == "common" and method == "authenticate":
                    ok = args[:3] == [ODOO_DB, ODOO_LOGIN, ODOO_KEY]
                    return self.reply(200, {"jsonrpc": "2.0", "id": req.get("id"), "result": ODOO_UID if ok else False})
                if service == "object" and method == "execute_kw":
                    db, uid, key, model, meth = args[:5]
                    if [db, uid, key] != [ODOO_DB, ODOO_UID, ODOO_KEY]:
                        return self.reply(200, {"jsonrpc": "2.0", "id": req.get("id"), "error": {"message": "Access Denied"}})
                    try:
                        result = odoo(model, meth, args[5] if len(args) > 5 else [], args[6] if len(args) > 6 else {})
                        return self.reply(200, {"jsonrpc": "2.0", "id": req.get("id"), "result": result})
                    except ValueError as e:
                        return self.reply(200, {"jsonrpc": "2.0", "id": req.get("id"), "error": {"message": str(e), "data": {"message": str(e)}}})
                return self.reply(200, {"jsonrpc": "2.0", "id": req.get("id"), "error": {"message": "unknown service"}})
            if url.path.startswith("/v1/"):
                if self.headers.get("Authorization") != f"Bearer {STRIPE_KEY}":
                    return self.reply(401, {"error": {"message": "Invalid API Key"}})
                form = dict(urllib.parse.parse_qsl(raw, keep_blank_values=True))
                parts = url.path.strip("/").split("/")
                if parts[1:3] == ["checkout", "sessions"] and len(parts) == 3:
                    sid = f"cs_test_mock{len(STATE['sessions']) + 1:04d}"
                    STATE["sessions"][sid] = form
                    return self.reply(200, {"id": sid, "url": f"https://checkout.stripe.test/c/pay/{sid}"})
                if parts[1] == "payment_intents" and len(parts) == 3:
                    pi = STATE["payment_intents"].setdefault(parts[2], {"id": parts[2], "metadata": {}})
                    for k, v in form.items():
                        if k.startswith("metadata[") and k.endswith("]"):
                            pi["metadata"][k[9:-1]] = v
                    return self.reply(200, pi)
                return self.reply(404, {"error": {"message": "not mocked"}})
            if url.path == "/emails":
                if self.headers.get("Authorization") != f"Bearer {RESEND_KEY}":
                    return self.reply(401, {"message": "API key is invalid"})
                STATE["emails"].append(json.loads(raw or "{}"))
                return self.reply(200, {"id": f"email_{len(STATE['emails'])}"})
            if url.path.startswith("/audiences/"):
                STATE["audience"].append(json.loads(raw or "{}"))
                return self.reply(200, {"id": "contact_1"})
            return self.reply(404, {"error": "not found"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8791)
    args = ap.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"mock services on http://127.0.0.1:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
