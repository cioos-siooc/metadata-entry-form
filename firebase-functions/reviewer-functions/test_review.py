"""review.py against an in-memory RTDB and a stubbed reviewer: `uv run pytest test_review.py`."""

import sys
import types

import pytest
from firebase_functions import https_fn

# --- stub the reviewer package (heavy LLM deps) before importing review -----------------
calls = []


async def _fake_review_record(region, uid, rid, rec):
    calls.append(rid)
    return [{"id": "a"}, {"id": "b"}]


def _fake_to_patch(raw, data):
    (region, tree), = data.items()
    (uid, u), = tree["users"].items()
    (rid, _), = u["records"].items()
    qa = {
        "generated": "now",
        "findings": [{"id": f["id"], "suggested": {"title": f["id"]}} for f in raw],
        "suggested": {"title": "b"},  # record-wide merge, includes the rejected finding's fix
    }
    return {region: {"users": {uid: {"records": {rid: {"qa": qa}}}}}}


for name, attrs in {
    "cioos_metadata_reviewer": {},
    "cioos_metadata_reviewer.agents": {},
    "cioos_metadata_reviewer.agents.cache": {"_default": None},
    "cioos_metadata_reviewer.firebase": {"to_patch": _fake_to_patch},
    "cioos_metadata_reviewer.review": {"review_record": _fake_review_record},
}.items():
    sys.modules[name] = types.SimpleNamespace(**attrs)
sys.modules["cioos_metadata_reviewer.agents"].cache = sys.modules["cioos_metadata_reviewer.agents.cache"]


# --- in-memory RTDB ------------------------------------------------------------------------
class FakeRef:
    def __init__(self, store, path):
        self.store, self.keys = store, [k for k in path.split("/") if k]

    def child(self, path):
        return FakeRef(self.store, "/".join(self.keys) + "/" + path)

    def get(self):
        node = self.store
        for k in self.keys:
            if not isinstance(node, dict) or k not in node:
                return None
            node = node[k]
        return node

    def set(self, value):
        node = self.store
        for k in self.keys[:-1]:
            node = node.setdefault(k, {})
        node[self.keys[-1]] = value

    def update(self, values):
        current = self.get() or {}
        self.set({**current, **{k: v for k, v in values.items()}})

    def delete(self):
        parent = FakeRef(self.store, "/".join(self.keys[:-1])).get()
        if parent:
            parent.pop(self.keys[-1], None)

    def transaction(self, fn):
        value = fn(self.get())
        self.set(value)
        return value


import review  # noqa: E402  (after the stubs)

REC_PATH = "pacific/users/u1/records/r1"


@pytest.fixture
def store(monkeypatch):
    data = {
        "admin": {"pacific": {"permissions": {"admins": "boss@x.ca", "reviewers": "Rev@x.ca, other@x.ca"}}},
        "pacific": {"users": {"u1": {"records": {
            "r1": {"title": "t", "status": "submitted"},
            "r2": {"title": "d", "status": ""},
        }}}},
    }
    monkeypatch.setattr(review.db, "reference", lambda path: FakeRef(data, path))
    calls.clear()
    return data


def _auth(email):
    return types.SimpleNamespace(token={"email": email})


def test_roles(store):
    assert review.require_role("pacific", _auth("rev@x.ca")) == "rev@x.ca"
    with pytest.raises(https_fn.HttpsError):
        review.require_role("pacific", _auth("rev@x.ca"), admin_only=True)
    with pytest.raises(https_fn.HttpsError):
        review.require_role("pacific", _auth("owner@x.ca"))
    with pytest.raises(https_fn.HttpsError):
        review.require_role("pacific", None)


def test_review_one_skips_unchanged_keeps_statuses_drops_rejected(store):
    ref = FakeRef(store, REC_PATH)
    ref.set({**ref.get(), "qa": {"statuses": {"b": {"status": "rejected"}}}})

    qa = review.review_one("pacific", "u1", "r1", ref.get())
    assert [f["id"] for f in qa["findings"]] == ["a"]
    assert qa["findings"][0]["suggested"] == {"title": "a"}
    assert ref.get()["qa"]["suggested"] is None  # rejected "b"'s fix isn't offered record-wide
    assert ref.get()["qa"]["statuses"] == {"b": {"status": "rejected"}}  # update, not set

    review.review_one("pacific", "u1", "r1", ref.get())
    assert calls == ["r1"]  # unchanged hash: skipped
    review.review_one("pacific", "u1", "r1", ref.get(), force=True)
    assert calls == ["r1", "r1"]

    ref.set({**ref.get(), "title": "edited"})
    review.review_one("pacific", "u1", "r1", ref.get())
    assert calls == ["r1", "r1", "r1"]


def test_review_region_one_run_at_a_time(store):
    run_id = review.review_region("pacific", "rev@x.ca")
    assert calls == ["r1"]  # drafts skipped
    run = store["pacific"]["qaRuns"][run_id]
    assert (run["status"], run["total"], run["done"]) == ("done", 1, 1)
    assert (run["reviewed"], run["skipped"]) == (1, 0)
    assert store["pacific"]["qaRuns"]["last"] == run_id
    assert "active" not in store["pacific"]["qaRuns"]

    run_id = review.review_region("pacific", "rev@x.ca")  # unchanged: skipped, not reviewed
    run = store["pacific"]["qaRuns"][run_id]
    assert (run["reviewed"], run["skipped"], calls) == (0, 1, ["r1"])

    store["pacific"]["qaRuns"]["active"] = {"runId": "other", "started": review.time.time()}
    with pytest.raises(https_fn.HttpsError):
        review.review_region("pacific", "rev@x.ca")


def test_count_region(store):
    assert review.count_region("pacific") == {"total": 1, "toReview": 1}
    review.review_one("pacific", "u1", "r1", FakeRef(store, REC_PATH).get())
    assert review.count_region("pacific") == {"total": 1, "toReview": 0}
    assert review.count_region("pacific", force=True) == {"total": 1, "toReview": 1}
    assert "qaRuns" not in store["pacific"]  # a dry run claims nothing


def test_review_region_records_failures(store, monkeypatch):
    async def boom(*_):
        raise ValueError("bad record")

    monkeypatch.setattr(review, "review_record", boom)
    run_id = review.review_region("pacific", "rev@x.ca")
    run = store["pacific"]["qaRuns"][run_id]
    assert (run["status"], run["failed"], run["done"]) == ("done", 1, 1)
    assert run["failedRecords"]["u1_r1"] == {
        "uid": "u1", "rid": "r1", "title": "t", "error": "bad record",
    }


def test_review_region_cancel(store, monkeypatch):
    # Cancel arrives before the first record: nothing is reviewed.
    real_child = FakeRef.child
    monkeypatch.setattr(
        FakeRef, "child",
        lambda self, path: types.SimpleNamespace(get=lambda: True) if path == "cancel"
        else real_child(self, path),
    )
    run_id = review.review_region("pacific", "rev@x.ca")
    run = store["pacific"]["qaRuns"][run_id]
    assert (run["status"], run["done"], calls) == ("cancelled", 0, [])
    assert "active" not in store["pacific"]["qaRuns"]
