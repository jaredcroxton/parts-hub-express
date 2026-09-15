#!/usr/bin/env python3
"""test_integrations: end to end test of the Odoo sync, Stripe checkout, webhook order push and Resend emails,
against tools/mock_services.py. No real keys, no real emails, nothing leaves this machine.

Run from the project root: python3 tools/test_integrations.py [--skip-build]
Writes only to .tmp/itest. Exit code 0 when every check passes.
"""
import argparse
import hashlib
import hmac
import json
import os
import shutil
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(ROOT, ".tmp", "itest")
MOCK_PORT, SITE_PORTS = 8791, {"json2": 3107, "jsonrpc": 3108}
MOCK = f"http://127.0.0.1:{MOCK_PORT}"
WHSEC = "whsec_testsecret"
RESULTS = []


def check(label, ok, detail=""):
    RESULTS.append(ok)
    print(("PASS  " if ok else "FAIL  ") + label + (f"  [{detail}]" if detail and not ok else ""))


def http(method, url, body=None, headers=None, raw=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    hdrs = {"Content-Type": "application/json"} if body is not None else {}
    hdrs.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            text = res.read().decode()
            return res.status, (json.loads(text) if text else None)
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try:
            return e.code, json.loads(text)
        except ValueError:
            return e.code, text


def wait_for(url, seconds=60):
    end = time.time() + seconds
    while time.time() < end:
        try:
            urllib.request.urlopen(url, timeout=2)
            return True
        except urllib.error.HTTPError:
            return True
        except Exception:  # noqa: BLE001
            time.sleep(0.4)
    return False


def odoo_env(transport):
    return dict(os.environ, ODOO_URL=MOCK, ODOO_DB="testdb", ODOO_LOGIN="api@example.com", ODOO_API_KEY="test-odoo-key",
                ODOO_TRANSPORT=transport, ODOO_PRICES_INCLUDE_GST="0")


def run(cmd, env):
    return subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True)


def pull_and_build(transport, tag, extra_build=None):
    base = os.path.join(TMP, tag)
    env = odoo_env(transport)
    p = run([sys.executable, "tools/odoo_pull.py", "--out", f"{base}/pull", "--images-dir", f"{base}/img",
             "--previous-manifest", f"{base}/data/manifest.json", "--pause", "0"], env)
    b = run([sys.executable, "tools/build_catalogue.py", "--source", "odoo", "--pull-dir", f"{base}/pull", "--out-data", f"{base}/data",
             "--out-img", f"{base}/img", "--out-machines", f"{base}/machines"] + (extra_build or []), env)
    return p, b, base


def load(base, name):
    with open(os.path.join(base, "data", name)) as f:
        return json.load(f)


def signed(payload):
    t = str(int(time.time()))
    sig = hmac.new(WHSEC.encode(), f"{t}.{payload}".encode(), hashlib.sha256).hexdigest()
    return {"Stripe-Signature": f"t={t},v1={sig}", "Content-Type": "application/json"}


def webhook_event(session_id, pi, total, event_type="checkout.session.completed"):
    return json.dumps({"id": f"evt_{session_id}", "type": event_type, "data": {"object": {
        "id": session_id, "object": "checkout.session", "payment_status": "paid", "payment_intent": pi, "amount_total": total, "currency": "aud",
        "customer_details": {"email": "buyer@example.com", "name": "Pat Buyer", "phone": "+61400000000",
                             "address": {"line1": "1 Quarry Rd", "line2": None, "city": "Sydney", "state": "NSW", "postal_code": "2000", "country": "AU"}},
        "collected_information": {"shipping_details": {"name": "Pat Buyer", "address": {"line1": "1 Quarry Rd", "city": "Sydney", "state": "NSW", "postal_code": "2000", "country": "AU"}}},
    }}})


def site_tests(transport, data_dir):
    port = SITE_PORTS[transport]
    site = f"http://127.0.0.1:{port}"
    env = dict(odoo_env(transport), STRIPE_SECRET_KEY="sk_test_mock", STRIPE_WEBHOOK_SECRET=WHSEC, STRIPE_API_BASE=MOCK,
               RESEND_API_KEY="re_testkey", RESEND_API_BASE=MOCK, ORDER_FROM_EMAIL="Parts Hub Express <orders@example.com>",
               ENQUIRY_TO_EMAIL="sales@example.com", CATALOGUE_DIR=data_dir, NEXT_PUBLIC_SITE_URL=site, PORT=str(port))
    for k in ("STRIPE_AUTOMATIC_TAX", "STRIPE_SHIPPING_RATE_IDS", "ALLOW_BACKORDER", "ODOO_CONFIRM_PAID_ORDERS", "ORDER_NOTIFY_EMAIL"):
        env.pop(k, None)
    server = subprocess.Popen(["npx", "next", "start", "-p", str(port)], cwd=os.path.join(ROOT, "site"), env=env,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        if not wait_for(site + "/robots.txt", 90):
            check(f"[{transport}] site starts", False, "next start did not answer")
            return
        http("POST", MOCK + "/_reset", {})
        t = f"[{transport}]"

        s, d = http("POST", site + "/api/checkout", {"items": [{"sku": "TEST-JAW-01", "qty": 2}]})
        state = http("GET", MOCK + "/_state")[1]
        sid = next(iter(state["sessions"]), None)
        form = state["sessions"].get(sid, {})
        check(f"{t} checkout in stock returns a Stripe URL", s == 200 and d.get("ok") and "checkout.stripe.test" in d.get("url", ""), f"{s} {d}")
        check(f"{t} checkout charges the GST inclusive catalogue price", form.get("line_items[0][price_data][unit_amount]") == "110000" and form.get("line_items[0][quantity]") == "2", str(form)[:200])
        check(f"{t} checkout marks prices tax inclusive, collects AU shipping and phone", form.get("line_items[0][price_data][tax_behavior]") == "inclusive"
              and form.get("shipping_address_collection[allowed_countries][0]") == "AU" and form.get("phone_number_collection[enabled]") == "true")
        check(f"{t} checkout leaves Stripe Tax off by default", "automatic_tax[enabled]" not in form)

        s, d = http("POST", site + "/api/checkout", {"items": [{"sku": "TEST-CONE-02", "qty": 3}]})
        check(f"{t} checkout blocks a short line and names it", s == 409 and "TEST-CONE-02 (only 1 in stock)" in (d or {}).get("error", ""), f"{s} {d}")
        s, d = http("POST", site + "/api/checkout", {"items": [{"sku": "TEST-ROLL-03", "qty": 1}]})
        check(f"{t} checkout blocks an out of stock line", s == 409 and "out of stock" in (d or {}).get("error", ""), f"{s} {d}")
        s, d = http("POST", site + "/api/checkout", {"items": [{"sku": "TEST-QUOTE-04", "qty": 1}]})
        check(f"{t} unpriced parts never reach Stripe", s == 400 and (d or {}).get("error") == "No priced items", f"{s} {d}")

        payload = webhook_event(sid, "pi_mock_1", 220000)
        s, d = http("POST", site + "/api/stripe/webhook", raw=payload.encode(), headers={"Stripe-Signature": "t=1,v1=bad", "Content-Type": "application/json"})
        check(f"{t} webhook rejects a bad signature", s == 400, f"{s} {d}")

        s, d = http("POST", site + "/api/stripe/webhook", raw=payload.encode(), headers=signed(payload))
        state = http("GET", MOCK + "/_state")[1]
        orders, partners, emails = state["orders"], state["partners"], state["emails"]
        check(f"{t} paid webhook creates one sale order", s == 200 and len(orders) == 1 and (d or {}).get("order") == "S00001", f"{s} {d} orders={len(orders)}")
        if orders:
            o = orders[0]
            check(f"{t} sale order carries the session ref and origin", o.get("client_order_ref") == sid and o.get("origin") == "partshubexpress.com")
            check(f"{t} order line maps SKU to Odoo product, qty and ex GST price", o.get("order_line") == [[0, 0, {"product_id": 101, "product_uom_qty": 2, "price_unit": 1000}]], str(o.get("order_line")))
            check(f"{t} order stays a quotation unless auto confirm is on", o.get("state") == "draft")
        check(f"{t} customer created with Australian address", len(partners) == 1 and partners[0].get("country_id") == 13 and partners[0].get("state_id") == 505 and partners[0].get("email") == "buyer@example.com", str(partners)[:200])
        to_buyer = [e for e in emails if e.get("to") == ["buyer@example.com"]]
        to_acbg = [e for e in emails if e.get("to") == ["sales@example.com"]]
        check(f"{t} buyer confirmation and ACBG notice sent once each", len(to_buyer) == 1 and len(to_acbg) == 1, f"{len(emails)} emails")
        if to_buyer:
            text = to_buyer[0].get("text", "")
            check(f"{t} confirmation shows order, total, GST and no placeholder phone", "S00001" in text and "$2,200.00" in text and "GST of $200.00" in text and "1300 000 000" not in text, text[:300])
            check(f"{t} no em dashes in emails", all("—" not in (e.get("text", "") + e.get("html", "")) for e in emails))
        check(f"{t} confirmation flag stored on the PaymentIntent", state["payment_intents"].get("pi_mock_1", {}).get("metadata", {}).get("phx_confirmation_sent") == "1")

        s, d = http("POST", site + "/api/stripe/webhook", raw=payload.encode(), headers=signed(payload))
        state = http("GET", MOCK + "/_state")[1]
        check(f"{t} replayed event creates no duplicate order and no second email", s == 200 and len(state["orders"]) == 1 and len(state["emails"]) == 2, f"{s} orders={len(state['orders'])} emails={len(state['emails'])}")

        s, d = http("POST", site + "/api/checkout", {"items": [{"sku": "TEST-JAW-01", "qty": 1}]})
        state = http("GET", MOCK + "/_state")[1]
        sid2 = [k for k in state["sessions"] if k != sid][-1]
        http("POST", MOCK + "/_config", {"odoo_down": True})
        payload2 = webhook_event(sid2, "pi_mock_2", 110000)
        s1, _ = http("POST", site + "/api/stripe/webhook", raw=payload2.encode(), headers=signed(payload2))
        s2, _ = http("POST", site + "/api/stripe/webhook", raw=payload2.encode(), headers=signed(payload2))
        state = http("GET", MOCK + "/_state")[1]
        alerts = [e for e in state["emails"] if e.get("subject", "").startswith("Order not yet in Odoo")]
        check(f"{t} Odoo down: webhook returns 500 so Stripe retries", s1 == 500 and s2 == 500, f"{s1} {s2}")
        check(f"{t} Odoo down: one alert per payment, not per retry", len(alerts) == 1, f"{len(alerts)} alerts")
        http("POST", MOCK + "/_config", {"odoo_down": False})
        s3, d3 = http("POST", site + "/api/stripe/webhook", raw=payload2.encode(), headers=signed(payload2))
        state = http("GET", MOCK + "/_state")[1]
        check(f"{t} Odoo back: the retry creates the order and emails", s3 == 200 and len(state["orders"]) == 2 and len(state["emails"]) == 5, f"{s3} {d3} orders={len(state['orders'])} emails={len(state['emails'])}")

        other = json.dumps({"id": "evt_x", "type": "payment_intent.created", "data": {"object": {"id": "pi_x"}}})
        s, _ = http("POST", site + "/api/stripe/webhook", raw=other.encode(), headers=signed(other))
        check(f"{t} other event types are acknowledged and ignored", s == 200)

        s, d = http("POST", site + "/api/quote", {"type": "quote", "company": "Test Quarry", "email": "q@example.com", "parts": "TEST-JAW-01 x2"})
        state = http("GET", MOCK + "/_state")[1]
        quote_mail = [e for e in state["emails"] if e.get("subject") == "Quote request: Test Quarry"]
        check(f"{t} quote request emails ACBG with reply-to the buyer", s == 200 and len(quote_mail) == 1 and quote_mail[0].get("reply_to") == "q@example.com", f"{s} {d}")
    finally:
        os.killpg(os.getpgid(server.pid), signal.SIGTERM)
        server.wait(timeout=15)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-build", action="store_true")
    args = ap.parse_args()
    shutil.rmtree(TMP, ignore_errors=True)
    os.makedirs(TMP)
    mock = subprocess.Popen([sys.executable, "tools/mock_services.py", "--port", str(MOCK_PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not wait_for(MOCK + "/_state", 20):
            print("mock services did not start")
            sys.exit(2)

        # Catalogue sync, JSON-2
        p, b, base = pull_and_build("json2", "json2")
        check("pull and build succeed (json2)", p.returncode == 0 and b.returncode == 0, (p.stderr + b.stderr)[-400:])
        cat = {r["sku"]: r for r in load(base, "catalogue.json")}
        check("excluded group and missing SKU are left out", "MMA-EXCL-06" not in cat and len(cat) == 6, sorted(cat))
        check("list prices ex GST become GST inclusive prices", cat.get("TEST-JAW-01", {}).get("price_aud_inc_gst") == 1100.0 and cat.get("TEST-ROLL-03", {}).get("price_aud_inc_gst") == 50.0)
        check("zero price and not-for-sale stay Price on request", cat.get("TEST-QUOTE-04", {}).get("price_aud_inc_gst") is None and cat.get("TEST-NOSALE-05", {}).get("price_aud_inc_gst") is None)
        check("stock status mapping", [cat[s]["stock_status"] for s in ("TEST-JAW-01", "TEST-CONE-02", "TEST-ROLL-03")] == ["in_stock", "low_stock", "made_to_order"])
        check("images written for new products", os.path.exists(os.path.join(base, "img", "TEST-JAW-01.jpg")))
        man = load(base, "manifest.json")
        check("manifest records source and counts", man.get("source") == "odoo" and man.get("created") == 6 and man.get("odoo_count") == 8, str(man)[:200])

        # Same result over JSON-RPC (Odoo 17 and 18)
        p2, b2, base2 = pull_and_build("jsonrpc", "jsonrpc")
        strip = lambda rows: [{k: v for k, v in r.items() if k != "synced_at"} for r in rows]  # noqa: E731
        check("JSON-RPC transport builds the same catalogue", p2.returncode == 0 and b2.returncode == 0 and strip(load(base2, "catalogue.json")) == strip(load(base, "catalogue.json")), (p2.stderr + b2.stderr)[-300:])

        # Renamed product keeps its URL; product gone from Odoo stays, inactive and tagged
        pull_file = os.path.join(base, "pull", "products.json")
        with open(pull_file) as f:
            pulled = json.load(f)
        old_slug = cat["TEST-JAW-01"]["slug"]
        for r in pulled:
            if r["default_code"] == "TEST-JAW-01":
                r["name"] = "C130 Fixed Jaw 18% Mn renamed in Odoo"
        pulled = [r for r in pulled if r["default_code"] != "TEST-FILTER-08"]
        with open(pull_file, "w") as f:
            json.dump(pulled, f)
        b3 = run([sys.executable, "tools/build_catalogue.py", "--source", "odoo", "--pull-dir", f"{base}/pull", "--out-data", f"{base}/data",
                  "--out-img", f"{base}/img", "--out-machines", f"{base}/machines"], odoo_env("json2"))
        cat3 = {r["sku"]: r for r in load(base, "catalogue.json")}
        check("renamed product keeps its URL", b3.returncode == 0 and cat3["TEST-JAW-01"]["slug"] == old_slug and "renamed" in cat3["TEST-JAW-01"]["name"], b3.stderr[-300:])
        gone = cat3.get("TEST-FILTER-08", {})
        check("product missing from Odoo stays, inactive and tagged odoo-missing", gone.get("active") is False and "odoo-missing" in gone.get("tags", []) and gone.get("price_aud_inc_gst") is None)
        check("inactive product drops out of search and category counts", all(r["sku"] != "TEST-FILTER-08" for r in load(base, "search-index.json"))
              and not any(c["name"] == "Filters" for c in load(base, "categories.json")))

        # Guardrail: a pull that loses most products writes nothing
        before = open(os.path.join(base, "data", "catalogue.json")).read()
        http("POST", MOCK + "/_config", {"drop_products": True})
        p4, b4, _ = pull_and_build("json2", "json2")
        http("POST", MOCK + "/_config", {"drop_products": False})
        check("guardrail stops a build that would drop active products by more than 20 percent", b4.returncode != 0 and "Guardrail" in b4.stderr + b4.stdout
              and open(os.path.join(base, "data", "catalogue.json")).read() == before, (b4.stderr + b4.stdout)[-300:])

        # Site: checkout, webhook, emails (JSON-2 and JSON-RPC)
        if not args.skip_build:
            print("building the site (next build)...", flush=True)
            nb = subprocess.run(["npx", "next", "build"], cwd=os.path.join(ROOT, "site"), capture_output=True, text=True)
            check("next build", nb.returncode == 0, nb.stdout[-500:] + nb.stderr[-500:])
        # restore the catalogue with every product active for the site tests
        p5, b5, site_base = pull_and_build("json2", "site-data")
        check("site test catalogue built", b5.returncode == 0, b5.stderr[-300:])
        for transport in ("json2", "jsonrpc"):
            site_tests(transport, os.path.join(site_base, "data"))
    finally:
        mock.terminate()
        mock.wait(timeout=10)

    passed, total = sum(RESULTS), len(RESULTS)
    print(f"\n{passed} of {total} checks passed.")
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
