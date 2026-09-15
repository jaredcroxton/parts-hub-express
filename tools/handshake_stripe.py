#!/usr/bin/env python3
"""handshake_stripe: confirm the Stripe keys before going live (Express Link phase; SOP architecture/payments_and_email.md).

Checks: key present and its mode (test or live), the key can list Checkout Sessions, the webhook signing secret looks
right, automatic tax setting. Read only: creates nothing. Run: python3 tools/handshake_stripe.py [--env site/.env.local]
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from odoo_client import ROOT, load_env  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", default=os.path.join(ROOT, "site", ".env.local"))
    args = ap.parse_args()
    load_env(args.env)
    load_env()
    key = os.environ.get("STRIPE_SECRET_KEY", "")
    whsec = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    base = os.environ.get("STRIPE_API_BASE", "https://api.stripe.com").rstrip("/")
    failures = 0

    def check(label, ok, detail=""):
        nonlocal failures
        print(("PASS  " if ok else "FAIL  ") + label + (f": {detail}" if detail else ""))
        if not ok:
            failures += 1

    check("STRIPE_SECRET_KEY set", bool(key))
    if key:
        mode = "live" if "_live_" in key else "test" if "_test_" in key else "unknown"
        kind = "restricted" if key.startswith("rk_") else "secret" if key.startswith("sk_") else "unknown"
        check("key mode", mode != "unknown", f"{mode} mode, {kind} key")
        req = urllib.request.Request(base + "/v1/checkout/sessions?limit=1",
                                     headers={"Authorization": f"Bearer {key}"})
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                json.loads(res.read())
                check("list Checkout Sessions", True)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            try:
                msg = json.loads(body).get("error", {}).get("message", body[:200])
            except ValueError:
                msg = body[:200]
            check("list Checkout Sessions", False, f"HTTP {e.code}: {msg}")
        except urllib.error.URLError as e:
            check("reach Stripe", False, str(e.reason))
    check("STRIPE_WEBHOOK_SECRET looks like whsec_", whsec.startswith("whsec_"))
    tax = os.environ.get("STRIPE_AUTOMATIC_TAX", "0")
    print(f"INFO  STRIPE_AUTOMATIC_TAX={tax} ({'Stripe Tax must be set up for GST' if tax == '1' else 'prices charged as GST inclusive'})")
    print(f"\n{'All checks passed' if not failures else str(failures) + ' check(s) failed'}.")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
