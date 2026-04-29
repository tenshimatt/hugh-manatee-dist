"""
Shared Frappe HTTP client with rate limiting, idempotent upserts,
payload hashing, and dry-run mode.

Usage:
    from _frappe import FrappeClient
    fc = FrappeClient.from_env()
    fc.upsert("Customer", {"customer_name": "ACME"}, key_field="customer_name")
"""
from __future__ import annotations
import os
import json
import time
import hashlib
import logging
import pathlib
from typing import Any, Optional, Iterable

import requests
from dotenv import load_dotenv

load_dotenv()

LOG = logging.getLogger("jwm.import")


class FrappeError(Exception):
    pass


class FrappeClient:
    def __init__(
        self,
        base_url: str,
        host_header: str,
        api_key: str,
        api_secret: str,
        rate_rps: float = 10.0,
        dry_run: bool = True,
        log_path: Optional[str] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.host_header = host_header
        self.rate_rps = max(float(rate_rps), 0.5)
        self.dry_run = dry_run
        self._last = 0.0
        self._sess = requests.Session()
        # Allow session-cookie auth as a fallback when token doesn't validate
        # (Frappe API key/secret encryption can desync after restores). Set
        # FRAPPE_USR + FRAPPE_PWD to use admin/admin login → sid cookie.
        usr = os.getenv("FRAPPE_USR")
        pwd = os.getenv("FRAPPE_PWD")
        if usr and pwd:
            r = self._sess.post(
                f"{base_url.rstrip('/')}/api/method/login",
                data={"usr": usr, "pwd": pwd},
                headers={"Host": host_header},
                timeout=20,
            )
            r.raise_for_status()
            self._sess.headers.update({"Host": host_header, "Accept": "application/json", "Content-Type": "application/json"})
        else:
            self._sess.headers.update(
                {
                    "Host": host_header,
                    "Authorization": f"token {api_key}:{api_secret}",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            )
        self.log_path = log_path
        # counters
        self.stats = {
            "get": 0,
            "create": 0,
            "update": 0,
            "noop": 0,
            "skip_foreign": 0,
            "error": 0,
            "dry_create": 0,
            "dry_update": 0,
        }

    @classmethod
    def from_env(cls) -> "FrappeClient":
        mode = os.getenv("IMPORT_MODE", "dry").lower()
        dry = mode != "live"
        return cls(
            base_url=os.environ["FRAPPE_BASE_URL"],
            host_header=os.environ["FRAPPE_HOST_HEADER"],
            api_key=os.environ["FRAPPE_API_KEY"],
            api_secret=os.environ["FRAPPE_API_SECRET"],
            rate_rps=float(os.getenv("RATE_LIMIT_RPS", "10")),
            dry_run=dry,
        )

    # ---------- low-level ----------
    def _throttle(self):
        delay = 1.0 / self.rate_rps
        elapsed = time.monotonic() - self._last
        if elapsed < delay:
            time.sleep(delay - elapsed)
        self._last = time.monotonic()

    def _request(self, method: str, path: str, **kw) -> requests.Response:
        self._throttle()
        url = f"{self.base_url}{path}"
        r = self._sess.request(method, url, timeout=60, **kw)
        if r.status_code >= 500:
            raise FrappeError(f"{method} {path} -> {r.status_code}: {r.text[:500]}")
        return r

    # ---------- basic CRUD ----------
    def ping(self) -> str:
        r = self._request("GET", "/api/method/frappe.auth.get_logged_user")
        r.raise_for_status()
        return r.json()["message"]

    def get(self, doctype: str, name: str) -> Optional[dict]:
        self.stats["get"] += 1
        r = self._request(
            "GET",
            f"/api/resource/{doctype}/{requests.utils.quote(name, safe='')}",
        )
        if r.status_code == 404:
            return None
        if not r.ok:
            raise FrappeError(f"GET {doctype}/{name}: {r.status_code} {r.text[:300]}")
        return r.json().get("data")

    def get_list(
        self,
        doctype: str,
        filters: Optional[list] = None,
        fields: Iterable[str] = ("name",),
        limit: int = 500,
    ) -> list[dict]:
        params = {
            "fields": json.dumps(list(fields)),
            "limit_page_length": str(limit),
        }
        if filters:
            params["filters"] = json.dumps(filters)
        r = self._request(
            "GET", f"/api/resource/{doctype}", params=params
        )
        if r.status_code == 404:
            # DocType may not exist yet (common in dry-run before bootstrap)
            return []
        r.raise_for_status()
        return r.json().get("data", [])

    def create(self, doctype: str, payload: dict) -> dict:
        if self.dry_run:
            self.stats["dry_create"] += 1
            LOG.info("[DRY] CREATE %s: %s", doctype, _short(payload))
            return {**payload, "name": payload.get("name") or payload.get(_primary_field(doctype)) or "DRY-NEW"}
        self.stats["create"] += 1
        r = self._request(
            "POST", f"/api/resource/{doctype}", data=json.dumps(payload)
        )
        if not r.ok:
            self.stats["error"] += 1
            raise FrappeError(f"CREATE {doctype}: {r.status_code} {r.text[:500]}")
        return r.json()["data"]

    def update(self, doctype: str, name: str, payload: dict) -> dict:
        if self.dry_run:
            self.stats["dry_update"] += 1
            LOG.info("[DRY] UPDATE %s/%s: %s", doctype, name, _short(payload))
            return {**payload, "name": name}
        self.stats["update"] += 1
        r = self._request(
            "PUT",
            f"/api/resource/{doctype}/{requests.utils.quote(name, safe='')}",
            data=json.dumps(payload),
        )
        if not r.ok:
            self.stats["error"] += 1
            raise FrappeError(
                f"UPDATE {doctype}/{name}: {r.status_code} {r.text[:500]}"
            )
        return r.json()["data"]

    # ---------- idempotent upsert ----------
    def upsert(
        self,
        doctype: str,
        payload: dict,
        key_field: str = "name",
        key_value: Optional[str] = None,
    ) -> dict:
        """
        Idempotent upsert:
          1. Find existing by key_field.
          2. If exists and modified_by != Administrator -> skip (return existing).
          3. If exists -> compare hash; PUT only if changed.
          4. Else -> POST create.
        """
        kv = key_value if key_value is not None else payload.get(key_field)
        if not kv:
            raise ValueError(f"upsert {doctype}: missing key ({key_field})")

        # Name lookup: if key_field is 'name', GET directly; else filter
        existing = None
        if key_field == "name":
            existing = self.get(doctype, kv)
        else:
            rows = self.get_list(
                doctype,
                filters=[[key_field, "=", kv]],
                fields=("name", "modified_by"),
                limit=1,
            )
            if rows:
                existing = self.get(doctype, rows[0]["name"])

        if existing:
            mb = existing.get("modified_by") or ""
            if mb and mb != "Administrator":
                self.stats["skip_foreign"] += 1
                LOG.warning(
                    "SKIP %s/%s: modified_by=%s (not Administrator)",
                    doctype,
                    existing["name"],
                    mb,
                )
                return existing
            # compare hashes (only fields we are setting)
            h_new = _hash_payload(payload)
            h_old = _hash_payload({k: existing.get(k) for k in payload})
            if h_new == h_old:
                self.stats["noop"] += 1
                return existing
            return self.update(doctype, existing["name"], payload)
        else:
            return self.create(doctype, payload)

    def attach_comment(self, doctype: str, name: str, content: str, comment_by: str = "Administrator"):
        """Attach a Comment to any doc."""
        payload = {
            "comment_type": "Comment",
            "reference_doctype": doctype,
            "reference_name": name,
            "content": content,
            "comment_email": comment_by,
            "comment_by": comment_by,
        }
        return self.upsert(
            "Comment",
            payload,
            key_field="content",  # pseudo-dedup; Comment has no natural key
            key_value=f"{doctype}|{name}|{hashlib.sha1(content.encode()).hexdigest()[:12]}",
        ) if False else self.create("Comment", payload)


def _hash_payload(d: dict) -> str:
    s = json.dumps(_normalize(d), sort_keys=True, default=str)
    return hashlib.sha1(s.encode()).hexdigest()


def _normalize(v):
    if isinstance(v, dict):
        return {k: _normalize(x) for k, x in v.items() if x is not None}
    if isinstance(v, list):
        return [_normalize(x) for x in v]
    return v


def _short(d: dict, n: int = 120) -> str:
    s = json.dumps(d, default=str)
    return s if len(s) <= n else s[: n - 3] + "..."


def _primary_field(doctype: str) -> str:
    return {
        "Customer": "customer_name",
        "Item": "item_code",
        "Workstation": "workstation_name",
        "Operation": "name",
        "Work Order": "name",
        "Quotation": "name",
    }.get(doctype, "name")


def map_status_emoji(cell: Any) -> tuple[str, str]:
    """Map JWM status emoji cell -> (enum, raw)."""
    if cell is None:
        return ("Unknown", "")
    raw = str(cell)
    u = raw.upper()
    if "🟢" in raw or "ON TIME" in u or "ON TRACK" in u:
        return ("On Track", raw)
    if "🔴" in raw or "LATE" in u or "OVERDUE" in u:
        return ("Overdue", raw)
    if "🟡" in raw or "WARNING" in u:
        return ("Warning", raw)
    if "❌" in raw or "NOT FOUND" in u:
        return ("Not Found", raw)
    if "✅" in raw or "FOUND" in u:
        return ("On Track", raw)
    return ("Unknown", raw)


def setup_logging(log_dir: str, script_name: str):
    pathlib.Path(log_dir).mkdir(parents=True, exist_ok=True)
    p = pathlib.Path(log_dir) / f"{script_name}.log"
    fmt = "%(asctime)s %(levelname)s %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=fmt,
        handlers=[logging.FileHandler(p, mode="a"), logging.StreamHandler()],
    )
    return LOG
