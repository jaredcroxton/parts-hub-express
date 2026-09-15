#!/usr/bin/env python3
"""handshake_resend: confirm email is ready (Express Link phase; SOP architecture/payments_and_email.md).

Checks the Resend variables. With --send it emails ENQUIRY_TO_EMAIL one test message (the only side effect).
Run: python3 tools/handshake_resend.py [--send] [--env site/.env.local]
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from odoo_client import ROOT, load_env  # noqa: E402

EMAIL = re.compile(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--send", action="store_true")
    ap.add_argument("--env", default=os.path.join(ROOT, "site", ".env.local"))
    args = ap.parse_args()
    load_env(args.env)
    load_env()
    key = os.environ.get("RESEND_API_KEY", "")
    sender = os.environ.get("ORDER_FROM_EMAIL", "")
    to = os.environ.get("ENQUIRY_TO_EMAIL", "")
    base = os.environ.get("RESEND_API_BASE", "https://api.resend.com").rstrip("/")
    failures = 0

    def check(label, ok, detail=""):
        nonlocal failures
        print(("PASS  " if ok else "FAIL  ") + label + (f": {detail}" if detail else ""))
        if not ok:
            failures += 1

    check("RESEND_API_KEY set", key.startswith("re_"), "expected re_...")
    check("ORDER_FROM_EMAIL has an address", bool(EMAIL.search(sender)), sender or "missing")
    check("ENQUIRY_TO_EMAIL has an address", bool(EMAIL.search(to)), to or "missing")
    if os.environ.get("ORDER_NOTIFY_EMAIL"):
        print(f"INFO  order notices go to ORDER_NOTIFY_EMAIL={os.environ['ORDER_NOTIFY_EMAIL']}")
    if args.send and not failures:
        payload = {"from": sender, "to": [to], "subject": "Parts Hub Express email test",
                   "text": "This is a test from tools/handshake_resend.py. If it arrived, quote, order and alert emails will too."}
        req = urllib.request.Request(base + "/emails", data=json.dumps(payload).encode(), method="POST",
                                     headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                check("test email accepted", True, json.loads(res.read()).get("id", ""))
        except urllib.error.HTTPError as e:
            check("test email accepted", False, f"HTTP {e.code}: {e.read().decode(errors='replace')[:300]}")
    elif not args.send:
        print("INFO  add --send to email a test message to ENQUIRY_TO_EMAIL")
    print(f"\n{'All checks passed' if not failures else str(failures) + ' check(s) failed'}.")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
