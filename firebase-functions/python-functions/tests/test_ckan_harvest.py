import pytest
import requests

from ckan_harvest import HarvestError, ckan_settings, start_harvest

SETTINGS = {"url": "https://catalogue.example", "harvestSource": "forms-waf"}


def test_ckan_settings():
    assert ckan_settings({"url": "https://c.example/", "harvestSource": " waf "}) == {
        "url": "https://c.example",
        "harvestSource": "waf",
    }
    assert ckan_settings(None) is None
    assert ckan_settings({"url": "https://c.example"}) is None
    # the token must not travel in clear
    assert ckan_settings({"url": "http://c.example", "harvestSource": "waf"}) is None
    assert ckan_settings({"url": "file:///etc/passwd", "harvestSource": "waf"}) is None


class FakeResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self.ok = status_code < 400
        self._body = body
        self.text = str(body)

    def json(self):
        if self._body is None:
            raise ValueError
        return self._body


class FakeSession:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def test_start_harvest_resolves_the_source_and_runs_a_job():
    session = FakeSession(
        FakeResponse(200, {"success": True, "result": {"id": "source-uuid"}}),
        FakeResponse(200, {"success": True, "result": {"id": "job-1"}}),
    )
    assert start_harvest(SETTINGS, "ckan-token", session) == "job-1"

    (show_method, show_url, show), (create_method, create_url, create) = session.calls
    assert (show_method, show_url) == (
        "GET",
        "https://catalogue.example/api/3/action/harvest_source_show",
    )
    assert show["params"] == {"id": "forms-waf"}
    assert (create_method, create_url) == (
        "POST",
        "https://catalogue.example/api/3/action/harvest_job_create",
    )
    assert create["json"] == {"source_id": "source-uuid", "run": True}
    assert create["headers"] == {"Authorization": "ckan-token"}


@pytest.mark.parametrize(
    "response, message",
    [
        (FakeResponse(403, {"success": False, "error": {"message": "Access denied"}}), "HTTP 403"),
        (FakeResponse(404, {"success": False, "error": {"message": "Not found"}}), "HTTP 404"),
        (requests.ConnectionError("unreachable"), "unreachable"),
    ],
)
def test_start_harvest_errors(response, message):
    session = FakeSession(response)
    with pytest.raises(HarvestError, match=message):
        start_harvest(SETTINGS, "ckan-token", session)


def test_start_harvest_while_a_job_is_running():
    # ckanext-harvest refuses a new job while one of the source is new or running
    session = FakeSession(
        FakeResponse(200, {"success": True, "result": {"id": "source-uuid"}}),
        FakeResponse(500, None),
    )
    with pytest.raises(HarvestError, match="already be running"):
        start_harvest(SETTINGS, "ckan-token", session)
