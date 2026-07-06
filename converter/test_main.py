"""Tests for the converter service's /record + /recordDelete file lifecycle
and the /convert proxy endpoint.

The heavy cioos-metadata-conversion library is NOT required: conversion is
monkeypatched with a stub so these tests only exercise routing, filename
handling, and WAF file placement.
"""

import pytest
from fastapi.testclient import TestClient

from converter import main


@pytest.fixture()
def waf_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "WAF_DIR", str(tmp_path))
    return tmp_path


@pytest.fixture()
def client(waf_dir, monkeypatch):
    monkeypatch.setattr(
        main,
        "convert_record",
        lambda record_data, output_format: f"converted-{output_format}",
    )
    return TestClient(main.app)


RECORD = {
    "title": {"en": "Test dataset", "fr": ""},
    "language": "en",
    "identifier": "abcde-12345",
    "status": "submitted",
}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_convert_returns_converted_payload(client):
    response = client.post(
        "/convert", json={"record_data": RECORD, "output_format": "xml"}
    )
    assert response.status_code == 200
    assert response.json() == {"data": "converted-xml"}


def test_convert_requires_fields(client):
    response = client.post("/convert", json={"record_data": RECORD})
    assert response.status_code == 422


def test_record_writes_xml_and_yaml_for_submitted(client, waf_dir):
    response = client.post(
        "/record",
        json={
            "record": RECORD,
            "filename": "My File",
            "status": "submitted",
            "region": "pacific",
        },
    )
    assert response.status_code == 200

    xml_path = waf_dir / "pacific" / "my_file.xml"
    yaml_path = waf_dir / "pacific" / "my_file.yaml"
    assert xml_path.read_text(encoding="utf-8") == "converted-xml"
    assert yaml_path.read_text(encoding="utf-8") == "converted-yaml"


def test_record_draft_deletes_existing_files(client, waf_dir):
    payload = {
        "record": RECORD,
        "filename": "my_file",
        "status": "published",
        "region": "pacific",
    }
    assert client.post("/record", json=payload).status_code == 200
    assert (waf_dir / "pacific" / "my_file.xml").is_file()

    # demote to draft: files must be removed
    payload["status"] = ""
    response = client.post("/record", json=payload)
    assert response.status_code == 200
    assert not (waf_dir / "pacific" / "my_file.xml").exists()
    assert not (waf_dir / "pacific" / "my_file.yaml").exists()


def test_record_derives_filename_when_missing(client, waf_dir):
    response = client.post(
        "/record",
        json={"record": RECORD, "filename": "", "status": "submitted", "region": "hakai"},
    )
    assert response.status_code == 200
    # title[:30] + "_" + identifier[:5], sanitized
    assert (waf_dir / "hakai" / "test_dataset_abcde.xml").is_file()


def test_record_delete_removes_files(client, waf_dir):
    client.post(
        "/record",
        json={
            "record": RECORD,
            "filename": "gone_soon",
            "status": "submitted",
            "region": "atlantic",
        },
    )
    assert (waf_dir / "atlantic" / "gone_soon.xml").is_file()

    response = client.post(
        "/recordDelete", json={"filename": "gone_soon", "region": "atlantic"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "record deleted"
    assert len(response.json()["deleted"]) == 2
    assert not (waf_dir / "atlantic" / "gone_soon.xml").exists()
    assert not (waf_dir / "atlantic" / "gone_soon.yaml").exists()


def test_record_delete_missing_files_is_ok(client):
    response = client.post(
        "/recordDelete", json={"filename": "never_existed", "region": "atlantic"}
    )
    assert response.status_code == 200
    assert response.json()["deleted"] == []


def test_record_rejects_path_traversal_region(client):
    response = client.post(
        "/recordDelete", json={"filename": "x", "region": "../escape"}
    )
    assert response.status_code == 400


def test_convert_degrades_gracefully_without_library(waf_dir, monkeypatch):
    # Simulate the conversion library being unavailable.
    monkeypatch.setattr(main, "Record", None)
    monkeypatch.setattr(main, "CONVERSION_IMPORT_ERROR", ImportError("nope"))
    client = TestClient(main.app)

    response = client.post(
        "/convert", json={"record_data": RECORD, "output_format": "xml"}
    )
    assert response.status_code == 503

    # deletion paths still work without the library
    response = client.post(
        "/recordDelete", json={"filename": "whatever", "region": "pacific"}
    )
    assert response.status_code == 200
