"""Automated metadata review (cioos-metadata-reviewer) of form records, reviewers/admins only.

Results live at `{region}/users/{uid}/records/{rid}/qa`:
  findings, inputHash, generated, checked — written here only (rules block clients); each finding
                                  carries its own `suggested` fix, applied one at a time in the UI
  statuses/{findingId}                       — {status, note}, written by reviewers in the UI
A record whose inputHash is unchanged is skipped; rejected findings are never written back.
The hash covers what the reviewer reads (`to_package`) and the reviewer's shipped code, so
saves that only touch bookkeeping, and reviewer commits outside the package, re-review nothing.
"""

import asyncio
import functools
import logging
import hashlib
import json
import time
import uuid
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, distribution

from firebase_admin import db
from firebase_functions import https_fn

from cioos_metadata_reviewer.agents import cache as llm_cache
from cioos_metadata_reviewer.firebase import to_package, to_patch
from cioos_metadata_reviewer.review import review_record

REVIEWED_STATUSES = ("submitted", "published")
STALE_RUN_SECONDS = (
    3600  # a run older than the function timeout crashed; let a new one start
)


class RtdbLLMCache:
    """Same get/set as the reviewer's SQLite LLMCache, kept in RTDB so cold instances share it."""

    def get(self, key):
        return db.reference(f"reviewerCache/{key}").get()

    def set(self, key, value):
        db.reference(f"reviewerCache/{key}").set(value)


llm_cache._default = RtdbLLMCache()


# Shipped files that never affect a review: reporting and offline benchmarking. Nothing on the
# review path imports them (checked against 75ea737); err towards hashing a file, not skipping it.
_NOT_REVIEW_CODE = {
    "cioos_metadata_reviewer/report.py",
    "cioos_metadata_reviewer/report_template.html",
    "cioos_metadata_reviewer/agents/benchmark.py",
    "cioos_metadata_reviewer/agents/feedback_study.py",
}


@functools.cache
def _reviewer_fingerprint():
    """Hash of the installed reviewer's code, prompts and rule data.

    Not its git commit: that changes on every docs/test/CI commit, and each change would mark
    every record in every region for a paid re-review.
    """
    try:
        dist = distribution("cioos-metadata-reviewer")
    except PackageNotFoundError:
        return ""
    h = hashlib.sha256()
    for f in sorted(dist.files or [], key=str):
        name = str(f)
        if (
            not name.startswith("cioos_metadata_reviewer/")
            or "__pycache__" in name
            or name in _NOT_REVIEW_CODE
            or name.startswith("cioos_metadata_reviewer/assets/")
        ):
            continue
        h.update(name.encode() + b"\0" + f.read_binary() + b"\0")
    return h.hexdigest()


def _emails(value):
    return [e.strip().lower() for e in (value or "").split(",") if e.strip()]


def require_role(region, auth, admin_only=False):
    """Raise unless the caller is a region admin (or reviewer, unless admin_only)."""
    email = ((auth.token or {}).get("email") or "").lower() if auth else ""
    perms = db.reference(f"admin/{region}/permissions").get() or {}
    allowed = _emails(perms.get("admins"))
    if not admin_only:
        allowed += _emails(perms.get("reviewers"))
    if not email or email not in allowed:
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            "Only region admins can do this."
            if admin_only
            else "Only region reviewers and admins can run the review.",
        )
    return email


def input_hash(region, uid, rid, rec):
    """Changes only when the review could: what the specialists see, or the reviewer itself.

    `to_package` drops bookkeeping (`created`, `lastEditedBy`, `sharedWith`, qa…), so a save
    that changes no content keeps the hash; a field the reviewer starts reading joins it.
    """
    package = json.dumps(to_package(region, uid, rid, rec), sort_keys=True, default=str)
    return hashlib.sha256((package + _reviewer_fingerprint()).encode()).hexdigest()


def needs_review(region, uid, rid, rec, force=False):
    """False if the record (and reviewer) is unchanged since its last review."""
    return force or (rec.get("qa") or {}).get("inputHash") != input_hash(
        region, uid, rid, rec
    )


def _now():
    return datetime.now(timezone.utc).isoformat()


def mark_checked(region, uid, rid):
    """The record was found unchanged: its findings are current as of now. The UI flags results
    as outdated against the later of `generated` and `checked`, so saves that changed no content
    don't leave a stale flag that a re-run (which skips) could never clear."""
    checked = _now()
    db.reference(f"{region}/users/{uid}/records/{rid}/qa/checked").set(checked)
    return checked


def review_one(region, uid, rid, rec, force=False):
    """Review one record and write its qa node; returns the qa node (cached one if skipped)."""
    qa = rec.get("qa") or {}
    if not needs_review(region, uid, rid, rec, force):
        return {**qa, "checked": mark_checked(region, uid, rid)}
    h = input_hash(region, uid, rid, rec)
    raw = asyncio.run(review_record(region, uid, rid, rec))
    data = {region: {"users": {uid: {"records": {rid: rec}}}}}
    patched = (
        to_patch(raw, data)
        .get(region, {})
        .get("users", {})
        .get(uid, {})
        .get("records", {})
        .get(rid, {})
        .get("qa", {})
    )
    rejected = {
        fid
        for fid, s in (qa.get("statuses") or {}).items()
        if (s or {}).get("status") == "rejected"
    }
    update = {
        "findings": [f for f in patched.get("findings", []) if f["id"] not in rejected],
        # Record-wide merge would include rejected/ignored findings' fixes; each finding
        # carries its own `suggested` instead. None also clears one left by older runs.
        "suggested": None,
        "inputHash": h,
        "generated": patched.get("generated") or _now(),
    }
    # update, not set: qa/statuses (the reviewers' decisions) must survive a re-run
    db.reference(f"{region}/users/{uid}/records/{rid}/qa").update(update)
    return {**qa, **update}


def review_on_submit(region, uid, rid, before, after):
    """Status trigger: review a record as it becomes submitted, so findings are ready when a
    reviewer opens it. True if a review ran. Unchanged content is skipped by the hash, so
    unsubmit/resubmit costs nothing. Never raises: a failed review must not affect the submit,
    and reviewers can still run it by hand."""
    if after != "submitted" or before == "submitted":
        return False
    rec = db.reference(f"{region}/users/{uid}/records/{rid}").get()
    if not rec or rec.get("status") != "submitted":  # changed again since the event
        return False
    if not needs_review(region, uid, rid, rec):
        mark_checked(region, uid, rid)
        return False
    try:
        review_one(region, uid, rid, rec)
    except Exception:  # pylint: disable=broad-except
        logging.exception("review_on_submit: %s/%s/%s failed", region, uid, rid)
        return False
    return True


def _claim_run(region, run_id):
    """One active run per region: True if this run took the slot."""
    now = time.time()

    def claim(current):
        if current and now - current.get("started", 0) < STALE_RUN_SECONDS:
            return current
        return {"runId": run_id, "started": now}

    result = db.reference(f"{region}/qaRuns/active").transaction(claim)
    return (result or {}).get("runId") == run_id


def _region_records(region):
    users = db.reference(f"{region}/users").get() or {}
    return [
        (uid, rid, rec)
        for uid, u in users.items()
        for rid, rec in ((u or {}).get("records") or {}).items()
        if (rec or {}).get("status") in REVIEWED_STATUSES
    ]


def count_region(region, force=False):
    """What review_region would do, without doing it: {total, toReview}."""
    todo = _region_records(region)
    return {
        "total": len(todo),
        "toReview": sum(
            needs_review(region, uid, rid, rec, force) for uid, rid, rec in todo
        ),
    }


def review_region(region, email, force=False):
    """Progress, failures and the outcome go to {region}/qaRuns/{runId}; `last` points at it.
    A reviewer stops a run by setting its `cancel` (checked between records)."""
    run_id = uuid.uuid4().hex
    if not _claim_run(region, run_id):
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.ALREADY_EXISTS,
            "A review is already running for this region.",
        )
    run = db.reference(f"{region}/qaRuns/{run_id}")
    try:
        todo = _region_records(region)
        run.set(
            {
                "status": "running",
                "total": len(todo),
                "done": 0,
                "failed": 0,
                "reviewed": 0,
                "skipped": 0,
                "startedBy": email,
                "started": datetime.now(timezone.utc).isoformat(),
            }
        )
        done = failed = reviewed = skipped = 0
        status = "done"
        for uid, rid, rec in todo:
            # ponytail: one RTDB read per record; fine at region scale
            if run.child("cancel").get():
                status = "cancelled"
                break
            if not needs_review(region, uid, rid, rec, force):
                mark_checked(region, uid, rid)
                skipped += 1
            else:
                run.update(
                    {"current": {"uid": uid, "rid": rid, "title": rec.get("title")}}
                )
                try:
                    review_one(region, uid, rid, rec, force)
                    reviewed += 1
                except Exception as e:  # pylint: disable=broad-except
                    logging.exception(
                        "review_region: %s/%s/%s failed", region, uid, rid
                    )
                    failed += 1  # one bad record shouldn't stop the region
                    run.child(f"failedRecords/{uid}_{rid}").set(
                        {
                            "uid": uid,
                            "rid": rid,
                            "title": rec.get("title"),
                            "error": str(e)[:200],
                        }
                    )
            done += 1
            run.update(
                {
                    "done": done,
                    "failed": failed,
                    "reviewed": reviewed,
                    "skipped": skipped,
                }
            )
        run.update(
            {
                "status": status,
                "current": None,
                "finished": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception:
        run.update({"status": "error", "current": None})
        raise
    finally:
        db.reference(f"{region}/qaRuns/last").set(run_id)
        db.reference(f"{region}/qaRuns/active").delete()
    return run_id
