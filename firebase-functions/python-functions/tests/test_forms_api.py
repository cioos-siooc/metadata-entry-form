import base64
import copy
import json
from pathlib import Path

import pytest

import forms_api
from forms_api import FORMATS, FormsApi, hash_token

TOKEN = "waf_secret-token"
SAMPLE = json.loads((Path(__file__).parent / "data" / "record.json").read_text())


def make_record(record_id, status, filename, org="Org A", created="2026-10-01T12:00:00.000Z"):
    record = copy.deepcopy(SAMPLE)
    record.update(
        recordID=record_id, status=status, filename=filename, created=created
    )
    record["contacts"] = [{"role": ["owner"], "orgName": org}] if org else []
    return record


RECORDS = [
    make_record("r1", "published", "alpha", org="Org Ä"),
    make_record("r2", "published", "beta", org=None, created="2026-10-05T08:30:00Z"),
    make_record("r3", "submitted", "gamma"),
    make_record("r4", "", "draft"),
]
REGION_ADMIN = {
    "permissions": {"admins": "admin@example.com", "reviewers": "a@x.ca,Reviewer@example.com"},
    "waf": {
        "formats": ["xml", "yaml", "removed_format"],
        "splitByOwner": True,
        "tokens": {"t1": {"name": "ckan", "hash": hash_token(TOKEN)}},
    },
}


def basic(password):
    return {"Authorization": "Basic " + base64.b64encode(f"h:{password}".encode()).decode()}


BEARER = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture
def api():
    regions = {"pacific": (REGION_ADMIN, RECORDS)}
    emails = {"reviewer-id-token": "reviewer@example.com", "other-id-token": "x@example.com"}
    return FormsApi(
        load_region_admin=lambda region: regions.get(region, ({}, []))[0],
        load_region_records=lambda region: regions.get(region, ({}, []))[1],
        verify_id_token=emails.get,
    )


def get(api, path, headers=None, **args):
    return api.handle("GET", path, args, headers or {})


@pytest.mark.parametrize(
    "headers,status",
    [
        ({}, 401),
        (basic("waf_wrong"), 401),
        (basic(TOKEN), 200),
        (BEARER, 200),
        ({"Authorization": "Bearer reviewer-id-token"}, 200),
        ({"Authorization": "Bearer other-id-token"}, 401),
    ],
)
def test_region_access(api, headers, status):
    assert get(api, "/api/pacific/", headers)[0] == status


def test_unauthorized_asks_for_basic_auth(api):
    status, headers, _ = get(api, "/api/pacific/")
    assert status == 401 and headers["WWW-Authenticate"].startswith("Basic")


def test_token_of_another_region_is_refused(api):
    assert get(api, "/api/atlantic/", BEARER)[0] == 401


@pytest.mark.parametrize(
    "path,status",
    [
        ("/api/", 403),
        ("/api/unpublished/", 403),
        ("/api/pacific/../atlantic/", 404),
        ("/api/Pacific%20x/", 404),
        ("/api/pacific/missing/", 404),
        ("/api/pacific/missing.xml", 404),
    ],
)
def test_paths(api, path, status):
    assert get(api, path, BEARER)[0] == status


def test_directory_without_slash_redirects(api):
    status, headers, _ = get(api, "/api/pacific", BEARER)
    assert status == 301 and headers["Location"] == "/api/pacific/"


def test_region_listing_like_nginx(api):
    status, headers, body = get(api, "/api/pacific/", BEARER)
    assert status == 200 and headers["Content-Type"].startswith("text/html")
    assert "<title>Index of /api/pacific/</title>" in body
    # owner folders first, then files; drafts and submitted records not listed
    assert body.index('href="org-a/"') < body.index('href="beta.xml"')
    assert 'href="beta.yaml"' in body and "gamma" not in body and "draft" not in body
    assert "05-Oct-2026 08:30" in body


def test_owner_folder_and_unpublished_listings(api):
    body = get(api, "/api/pacific/org-a/", BEARER)[2]
    assert 'href="alpha.xml"' in body and 'href="../"' in body
    body = get(api, "/api/unpublished/pacific/org-a/", BEARER)[2]
    assert 'href="gamma.xml"' in body and "alpha" not in body


def test_json_listing(api):
    status, _, body = get(api, "/api/pacific/", BEARER, format="json")
    entries = json.loads(body)
    assert status == 200
    assert entries[0] == {"name": "org-a", "type": "directory", "mtime": "Thu, 01 Oct 2026 12:00:00 GMT"}
    assert {"name": "beta.xml", "type": "file", "mtime": "Mon, 05 Oct 2026 08:30:00 GMT"} in entries


def test_records_index(api):
    index = json.loads(get(api, "/api/pacific/", BEARER, format="records")[2])
    published = {r["basename"]: r for r in index["published"]}
    assert published["alpha"]["owner"] == "org-a"
    assert published["alpha"]["files"] == {"xml": "pacific/org-a/alpha.xml", "yaml": "pacific/org-a/alpha.yaml"}
    assert published["beta"]["owner"] == ""
    assert index["unpublished"][0]["files"]["xml"] == "unpublished/pacific/org-a/gamma.xml"


def test_file_rendered_on_request(api):
    status, headers, body = get(api, "/api/pacific/org-a/alpha.xml", BEARER)
    assert status == 200, body
    assert headers["Content-Type"] == "application/xml; charset=utf-8"
    assert headers["Last-Modified"] == "Thu, 01 Oct 2026 12:00:00 GMT"
    assert body.lstrip().startswith("<")


def test_file_not_modified(api):
    headers = {**BEARER, "If-Modified-Since": "Thu, 01 Oct 2026 12:00:00 GMT"}
    assert get(api, "/api/pacific/org-a/alpha.xml", headers)[0] == 304
    headers["If-Modified-Since"] = "Wed, 30 Sep 2026 12:00:00 GMT"
    assert get(api, "/api/pacific/org-a/alpha.xml", headers)[0] == 200


@pytest.mark.parametrize("output_format", list(FORMATS))
def test_every_format_renders(output_format):
    assert forms_api.render(SAMPLE, output_format)


def test_settings_default_and_unknown_formats():
    assert forms_api.waf_settings({}) == {"formats": ["xml", "yaml"], "splitByOwner": False}
    assert forms_api.waf_settings(REGION_ADMIN)["formats"] == ["xml", "yaml"]


def test_record_basename_without_saved_filename():
    record = {"title": {"en": "Ocean Temp. 2024 / Station-B"}, "language": "en", "identifier": "abc12345"}
    assert forms_api.record_basename(record) == "ocean_temp__2024___station_b_abc12"


@pytest.mark.parametrize(
    "header,expected",
    [
        (None, None),
        ("Basic %%%", None),
        ("Digest abc", None),
        ("Bearer jwt.x.y", ("firebase", "jwt.x.y")),
    ],
)
def test_parse_authorization(header, expected):
    assert forms_api.parse_authorization(header) == expected


def test_ttl_cache_reuses_value():
    calls = []
    cache = forms_api.TTLCache(lambda key: calls.append(key) or key.upper(), ttl=60)
    assert cache.get("a") == "A" and cache.get("a") == "A"
    assert calls == ["a"]
