"""Health checks behind the `health` HTTP function.

Each check is a no-argument callable that returns normally when the dependency
works and raises otherwise. Critical checks decide the HTTP status (503 when one
fails); the others only mark the report as degraded, so an outage of a third-party
service we don't own doesn't page anyone as if the form itself were down.
"""

import logging
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout
from datetime import UTC, datetime

import requests
from firebase_admin import db

TIMEOUT_S = 5
# A cached report is served for this long, so polling or a flood of requests costs
# at most one round of checks per instance per CACHE_TTL_S.
CACHE_TTL_S = 30


def check_database():
    # shallow: only the top-level keys (the regions), never the records under them
    if not db.reference("/").get(shallow=True):
        raise RuntimeError("database root is empty")


# Production's frontend is on GitHub Pages, dev's on Firebase Hosting: check the
# public domain users actually reach, so DNS and certificate problems show up too.
FRONTEND_URLS = {
    "cioos-metadata-form-8d942": "https://forms.cioos.ca/",
    "cioos-metadata-form-dev-258dc": "https://dev.forms.cioos.ca/",
}


def frontend_url():
    project = os.environ.get("GCLOUD_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    if project not in FRONTEND_URLS:
        raise RuntimeError(f"no frontend URL for project {project}")
    return FRONTEND_URLS[project]


def check_frontend():
    response = requests.get(frontend_url(), timeout=TIMEOUT_S)
    response.raise_for_status()
    if '<div id="root"' not in response.text:
        raise RuntimeError("index.html has no app root")


def check_datacite():
    response = requests.get("https://api.datacite.org/heartbeat", timeout=TIMEOUT_S)
    response.raise_for_status()


# name -> (check, critical)
CHECKS = {
    "database": (check_database, True),
    "frontend": (check_frontend, True),
    "datacite": (check_datacite, False),
}


def _timed(check):
    start = time.monotonic()
    check()
    return round((time.monotonic() - start) * 1000)


def run_checks(checks=CHECKS, timeout_s=TIMEOUT_S + 1):
    """Run every check in parallel; return (http_status, report)."""
    results = {}
    pool = ThreadPoolExecutor(max_workers=len(checks))
    futures = {name: pool.submit(_timed, check) for name, (check, _) in checks.items()}
    # don't wait for a hung check: leave its thread behind and answer on time
    pool.shutdown(wait=False)
    deadline = time.monotonic() + timeout_s
    for name, future in futures.items():
        critical = checks[name][1]
        try:
            remaining = max(0, deadline - time.monotonic())
            results[name] = {
                "ok": True,
                "critical": critical,
                "ms": future.result(timeout=remaining),
            }
        except FutureTimeout:
            logging.error("Health check %s timed out", name)
            results[name] = {"ok": False, "critical": critical, "error": "timeout"}
        except Exception as e:
            logging.exception("Health check %s failed", name)
            # public endpoint: report the error type, keep details in the logs
            results[name] = {
                "ok": False,
                "critical": critical,
                "error": type(e).__name__,
            }

    if any(not r["ok"] and r["critical"] for r in results.values()):
        status, code = "down", 503
    elif any(not r["ok"] for r in results.values()):
        status, code = "degraded", 200
    else:
        status, code = "ok", 200
    return code, {"status": status, "checks": results}


_cache = {"at": None, "result": None}
_cache_lock = threading.Lock()


def cached_checks(ttl_s=CACHE_TTL_S, run=run_checks, now=time.time):
    """run_checks(), reusing this instance's last result while it is under ttl_s old.

    Concurrent requests wait on the lock rather than each starting their own round.
    """
    with _cache_lock:
        if _cache["at"] is None or now() - _cache["at"] >= ttl_s:
            _cache["result"] = run()
            _cache["at"] = now()
        code, report = _cache["result"]
        checked_at = _cache["at"]
    return code, {
        **report,
        "checkedAt": datetime.fromtimestamp(checked_at, UTC).isoformat(),
    }
