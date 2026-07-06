"""Tests for topic category mapping in record_json_to_yaml."""

from firebase_to_xml.record_json_to_yaml import (
    normalize_topic_categories,
    record_json_to_yaml,
)


def test_resource_type_array_passed_through():
    record = {"resourceType": ["biota", "oceans"]}
    assert normalize_topic_categories(record) == ["biota", "oceans"]


def test_legacy_values_normalized_to_iso():
    record = {"resourceType": ["oceanographic", "biological"]}
    assert normalize_topic_categories(record) == ["oceans", "biota"]


def test_falls_back_to_deprecated_category_field():
    record = {"category": "oceanographic"}
    assert normalize_topic_categories(record) == ["oceans"]


def test_empty_returns_empty_list():
    # An empty list lets metadata-xml apply its "oceans" default downstream.
    assert normalize_topic_categories({}) == []
    assert normalize_topic_categories({"resourceType": []}) == []


def test_record_json_to_yaml_includes_topic_category():
    record = {
        "resourceType": ["biota", "oceans"],
        "map": {"west": "0", "south": "0", "east": "1", "north": "1"},
        "noVerticalExtent": True,
        "contacts": [],
        "keywords": {"en": [], "fr": []},
    }
    result = record_json_to_yaml(record)
    assert result["identification"]["topic_category"] == ["biota", "oceans"]


def test_record_json_to_yaml_omits_empty_topic_category():
    record = {
        "map": {"west": "0", "south": "0", "east": "1", "north": "1"},
        "noVerticalExtent": True,
        "contacts": [],
        "keywords": {"en": [], "fr": []},
    }
    result = record_json_to_yaml(record)
    # An empty list is falsy, so metadata-xml's `topic_category or "oceans"`
    # template logic applies the "oceans" default downstream.
    assert result["identification"]["topic_category"] == []
