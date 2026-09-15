#!/usr/bin/env python3
"""odoo_client: the one transport module for the Odoo external API (SOP: architecture/odoo_api_sync.md).

ODOO_TRANSPORT=json2    Odoo 19 and later, POST /json/2/<model>/<method>, bearer API key
ODOO_TRANSPORT=jsonrpc  Odoo 17 and 18, POST /jsonrpc (common.authenticate, object.execute_kw)

Reads ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, ODOO_TRANSPORT from the environment. For local runs the
project-root .env is loaded first (existing environment variables win). Standard library only.
"""
import json
import os
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USER_AGENT = "PartsHubExpress-sync/1.0"
RETRY_STATUS = {429, 502, 503, 504}


def load_env(path=os.path.join(ROOT, ".env")):
    """Minimal .env reader: KEY=value lines, no expansion. Never overrides the real environment."""
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k.strip(), v)


class OdooError(Exception):
    def __init__(self, message, status=None):
        super().__init__(message)
        self.status = status


class Odoo:
    def __init__(self, url=None, db=None, login=None, key=None, transport=None, pause=1.0, timeout=90):
        load_env()
        self.url = (url or os.environ.get("ODOO_URL", "")).rstrip("/")
        self.db = db or os.environ.get("ODOO_DB", "")
        self.login = login or os.environ.get("ODOO_LOGIN", "")
        self.key = key or os.environ.get("ODOO_API_KEY", "")
        self.transport = (transport or os.environ.get("ODOO_TRANSPORT", "json2")).strip().lower()
        self.pause = pause  # Odoo Online fair use: about one request per second
        self.timeout = timeout
        self._uid = None
        self._last = 0.0
        missing = [n for n, v in (("ODOO_URL", self.url), ("ODOO_DB", self.db), ("ODOO_API_KEY", self.key)) if not v]
        if self.transport == "jsonrpc" and not self.login:
            missing.append("ODOO_LOGIN")
        if missing:
            raise OdooError("Missing environment: " + ", ".join(missing))
        if self.transport not in ("json2", "jsonrpc"):
            raise OdooError("ODOO_TRANSPORT must be json2 or jsonrpc")

    # low level ---------------------------------------------------------------
    def _post(self, path, payload, headers=None):
        wait = self.pause - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        body = json.dumps(payload).encode()
        hdrs = {"Content-Type": "application/json", "User-Agent": USER_AGENT}
        hdrs.update(headers or {})
        for attempt in range(4):
            self._last = time.monotonic()
            req = urllib.request.Request(self.url + path, data=body, headers=hdrs, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as res:
                    return json.loads(res.read().decode() or "null")
            except urllib.error.HTTPError as e:
                text = e.read().decode(errors="replace")[:600]
                if e.code in RETRY_STATUS and attempt < 3:
                    time.sleep(2 ** attempt * 2)
                    continue
                raise OdooError(f"HTTP {e.code} on {path}: {text}", e.code) from None
            except urllib.error.URLError as e:
                if attempt < 3:
                    time.sleep(2 ** attempt * 2)
                    continue
                raise OdooError(f"Cannot reach Odoo at {self.url}: {e.reason}") from None
        raise OdooError(f"Gave up on {path}")

    def _jsonrpc(self, service, method, args):
        out = self._post("/jsonrpc", {"jsonrpc": "2.0", "method": "call", "params": {"service": service, "method": method, "args": args}, "id": 1})
        if isinstance(out, dict) and out.get("error"):
            err = out["error"]
            msg = (err.get("data") or {}).get("message") or err.get("message") or str(err)
            raise OdooError(f"Odoo error: {msg}")
        return out.get("result") if isinstance(out, dict) else out

    def _uid_for_jsonrpc(self):
        if self._uid is None:
            uid = self._jsonrpc("common", "authenticate", [self.db, self.login, self.key, {}])
            if not uid:
                raise OdooError("Odoo login failed: check ODOO_DB, ODOO_LOGIN and ODOO_API_KEY", 401)
            self._uid = uid
        return self._uid

    def _call(self, model, method, json2_body, rpc_args, rpc_kwargs=None):
        if self.transport == "json2":
            return self._post(f"/json/2/{model}/{method}", json2_body,
                              {"Authorization": f"bearer {self.key}", "X-Odoo-Database": self.db})
        uid = self._uid_for_jsonrpc()
        return self._jsonrpc("object", "execute_kw", [self.db, uid, self.key, model, method, rpc_args, rpc_kwargs or {}])

    # operations we use (never unlink, never write product data) -------------------------------------
    def version(self):
        out = self._post("/web/webclient/version_info", {"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1})
        result = out.get("result", out) if isinstance(out, dict) else {}
        return result.get("server_version") or str(result.get("server_version_info") or "unknown")

    def whoami(self):
        if self.transport == "json2":
            return self._call("res.users", "context_get", {}, [])
        return {"uid": self._uid_for_jsonrpc()}

    def search_count(self, model, domain):
        return self._call(model, "search_count", {"domain": domain}, [domain])

    def search_read(self, model, domain, fields, limit=None, offset=0, order=None):
        kw = {"fields": fields, "offset": offset}
        if limit:
            kw["limit"] = limit
        if order:
            kw["order"] = order
        return self._call(model, "search_read", dict(kw, domain=domain), [domain], kw)

    def read(self, model, ids, fields):
        return self._call(model, "read", {"ids": ids, "fields": fields}, [ids], {"fields": fields})

    def fields_get(self, model, attributes=("type", "string")):
        return self._call(model, "fields_get", {"attributes": list(attributes)}, [], {"attributes": list(attributes)})

    def can(self, model, mode):
        """True when the API user has model-level access (read, write, create). None when Odoo will not say."""
        try:
            return bool(self._call("ir.model.access", "check", {"model": model, "mode": mode, "raise_exception": False},
                                   [model, mode, False]))
        except OdooError:
            return None
