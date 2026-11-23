import time

import pytest

import health


def ok():
    pass


def fail():
    raise RuntimeError("secret detail")


def slow():
    time.sleep(0.5)


def test_all_ok():
    code, report = health.run_checks({"a": (ok, True), "b": (ok, False)})
    assert code == 200
    assert report["status"] == "ok"
    assert report["checks"]["a"]["ok"] is True
    assert isinstance(report["checks"]["a"]["ms"], int)


def test_non_critical_failure_is_degraded():
    code, report = health.run_checks({"a": (ok, True), "b": (fail, False)})
    assert code == 200
    assert report["status"] == "degraded"


def test_critical_failure_is_down_and_hides_details():
    code, report = health.run_checks({"a": (fail, True), "b": (ok, False)})
    assert code == 503
    assert report["status"] == "down"
    assert report["checks"]["a"]["error"] == "RuntimeError"
    assert "secret" not in str(report)


def test_timeout_counts_as_failure_without_waiting_for_the_check():
    start = time.monotonic()
    code, report = health.run_checks(
        {"a": (slow, True), "b": (slow, False)}, timeout_s=0.05
    )
    assert time.monotonic() - start < 0.3
    assert code == 503
    assert report["checks"]["a"]["error"] == "timeout"
    assert report["checks"]["b"]["error"] == "timeout"


@pytest.mark.parametrize(
    "project,url",
    [
        ("cioos-metadata-form-8d942", "https://forms.cioos.ca/"),
        ("cioos-metadata-form-dev-258dc", "https://dev.forms.cioos.ca/"),
    ],
)
def test_frontend_url_per_project(monkeypatch, project, url):
    monkeypatch.setenv("GCLOUD_PROJECT", project)
    assert health.frontend_url() == url


def test_frontend_url_unknown_project(monkeypatch):
    monkeypatch.setenv("GCLOUD_PROJECT", "other")
    with pytest.raises(RuntimeError):
        health.frontend_url()


def test_cache_reuses_result_until_ttl(monkeypatch):
    monkeypatch.setattr(health, "_cache", {"at": None, "result": None})
    calls = []
    clock = [1000.0]

    def run():
        calls.append(1)
        return 200, {"status": "ok", "checks": {}}

    def call():
        return health.cached_checks(ttl_s=30, run=run, now=lambda: clock[0])

    code, report = call()
    assert (code, len(calls)) == (200, 1)
    assert report["checkedAt"].startswith("1970-01-01T00:16:40")
    clock[0] += 29
    call()
    assert len(calls) == 1
    clock[0] += 1
    call()
    assert len(calls) == 2
