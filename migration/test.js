"use strict";

// Unit tests for transform.js against the hand-written fixture export.
// Run: npm test  (node --test test.js)

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const { transform } = require("./transform");

const rtdb = require("./fixtures/sample-rtdb-export.json");
const auth = require("./fixtures/sample-auth-export.json");

const { data, warnings } = transform(rtdb, auth);

const byKey = (key) => data.records.find((r) => r.firebase_key === key);

test("users: extracted, normalized, auth-export emails merged", () => {
  assert.equal(data.users.length, 3);

  const alice = data.users.find((u) => u.firebase_uid === "fixture-uid-alice");
  assert.equal(alice.email, "alice@fixture.example"); // trimmed + lowercased
  assert.equal(alice.display_name, "Alice Fixture");
  assert.deepEqual(alice.extra_emails, ["alice.alt@fixture.example"]);
  assert.deepEqual(alice.regions, ["test"]);

  const bob = data.users.find((u) => u.firebase_uid === "fixture-uid-bob");
  assert.equal(bob.email, "bob@fixture.example");
  assert.deepEqual(bob.extra_emails, []); // primary email not duplicated
});

test("user without email is flagged, not dropped", () => {
  const noEmail = data.users.find((u) => u.firebase_uid === "fixture-uid-noemail");
  assert.ok(noEmail, "user kept in output");
  assert.equal(noEmail.email, null);
  assert.equal(warnings.users_without_email.length, 1);
  assert.equal(warnings.users_without_email[0].firebase_uid, "fixture-uid-noemail");
});

test("records: keys, owners, created preserved; status mapped", () => {
  assert.equal(data.records.length, 3);

  const rec1 = byKey("fixture-rec-1");
  assert.equal(rec1.region, "test");
  assert.equal(rec1.firebase_uid_owner, "fixture-uid-alice");
  assert.equal(rec1.columns.status, "published");
  assert.equal(rec1.columns.title_en, "Fixture Published Record");
  assert.equal(rec1.columns.created, "2021-05-04T12:00:00.000Z"); // not re-stamped
  assert.equal(rec1.columns.time_first_published, "2021-06-01T00:00:00.000Z");
  // uuid lowercased for the uuid column
  assert.equal(rec1.columns.identifier, "3f2504e0-4f89-11d3-9a0c-0305e82c3301");
  assert.equal(rec1.columns.dataset_identifier, "https://doi.org/10.99999/fixture");
  assert.equal(rec1.columns.filename, "fixture_published_record_3f250");

  // missing status -> draft
  const rec2 = byKey("fixture-rec-2");
  assert.equal(rec2.columns.status, "draft");
  assert.equal(rec2.columns.created, "2022-01-15T08:30:00.000Z");

  const rec3 = byKey("fixture-rec-3");
  assert.equal(rec3.columns.status, "submitted");
  assert.equal(rec3.firebase_uid_owner, "fixture-uid-bob");
});

test("index-keyed RTDB objects become real arrays", () => {
  const rec1 = byKey("fixture-rec-1");
  assert.deepEqual(rec1.data.eov, ["oxygen", "seaSurfaceTemperature"]);
  assert.deepEqual(rec1.data.keywords, {
    en: ["oceans", "fixture"],
    fr: ["oceans-fr"],
  });
  assert.ok(Array.isArray(rec1.data.distribution));
  assert.equal(rec1.data.distribution[0].url.en, "https://example.org/erddap");
  assert.ok(Array.isArray(rec1.data.contacts));
  assert.deepEqual(rec1.data.contacts[0].role, ["custodian", "owner"]);
});

test("column fields are stripped from data (fromApi split)", () => {
  const rec1 = byKey("fixture-rec-1");
  for (const field of [
    "title",
    "status",
    "created",
    "identifier",
    "datasetIdentifier",
    "filename",
    "timeFirstPublished",
    "lastEditedBy",
    "sharedWith",
    "recordID",
  ]) {
    assert.ok(!(field in rec1.data), `${field} must not be in data jsonb`);
  }
});

test("sharedWith is the union of record.sharedWith and the /shares index", () => {
  // rec-1: bob via BOTH record.sharedWith and the shares index (deduped),
  // ghost via record.sharedWith only.
  assert.deepEqual(byKey("fixture-rec-1").shared_with_firebase_uids, [
    "fixture-uid-bob",
    "fixture-uid-ghost",
  ]);
  // rec-3: alice via the shares index ONLY
  assert.deepEqual(byKey("fixture-rec-3").shared_with_firebase_uids, [
    "fixture-uid-alice",
  ]);
  // share pointing at a record that no longer exists -> warning
  assert.equal(warnings.shares_for_missing_record.length, 1);
  assert.equal(warnings.shares_for_missing_record[0].record_key, "fixture-rec-gone");
});

test("invalid (non-uuid) identifier is nulled with a warning", () => {
  assert.equal(byKey("fixture-rec-2").columns.identifier, null);
  assert.equal(warnings.invalid_identifiers.length, 1);
  assert.equal(warnings.invalid_identifiers[0].identifier, "not-a-uuid");
});

test("standardization changes are logged per record", () => {
  const keys = warnings.records_standardized.map((w) => w.firebase_key);
  // rec-2 is sparse: standardizeRecord fills in many defaults
  assert.ok(keys.includes("fixture-rec-2"));
  const rec2Warn = warnings.records_standardized.find(
    (w) => w.firebase_key === "fixture-rec-2",
  );
  assert.ok(rec2Warn.defaulted_fields.includes("status"));
  assert.ok(rec2Warn.defaulted_fields.includes("contacts"));
  // nothing silently dropped on any record
  for (const w of warnings.records_standardized)
    assert.deepEqual(w.dropped_fields, []);
});

test("saved entities keep pushKeys and get array-normalized", () => {
  assert.equal(data.contacts.length, 1);
  assert.equal(data.contacts[0].firebase_key, "fixture-contact-1");
  assert.deepEqual(data.contacts[0].data.role, ["custodian"]);

  assert.equal(data.platforms.length, 1);
  assert.equal(data.platforms[0].firebase_uid_owner, "fixture-uid-noemail");

  assert.equal(data.instruments.length, 1);
  assert.equal(data.instruments[0].data.manufacturer, "Fixture Instruments Inc");
});

test("CSV permissions split, trimmed, lowercased", () => {
  assert.deepEqual(
    data.permissions.sort((a, b) => (a.email + a.role).localeCompare(b.email + b.role)),
    [
      { region: "test", email: "admin2@fixture.example", role: "admin" },
      { region: "test", email: "alice@fixture.example", role: "admin" },
      { region: "test", email: "bob@fixture.example", role: "reviewer" },
    ],
  );
});

test("projects, credentials, generator URL", () => {
  assert.deepEqual(
    data.projects.map((p) => p.name).sort(),
    ["Fixture Project A", "Fixture Project B"],
  );

  const dc = data.credentials.find((c) => c.kind === "datacite");
  assert.deepEqual(dc.config, { prefix: "10.99999", apiDomain: "api.test.datacite.org" });
  assert.equal(dc.secret, "Zml4dHVyZTpkYXRhY2l0ZS1oYXNo");

  const gh = data.credentials.find((c) => c.kind === "github");
  assert.deepEqual(gh.config, { owner: "fixture-org", repo: "fixture-repo", branch: "main" });
  assert.equal(gh.secret, "ghp_fixturetoken123");

  assert.deepEqual(data.region_urls, [
    { region: "test", record_generator_url: "https://fixture.example/recordGenerator" },
  ]);
});

test("unknown top-level and admin keys are logged, not fatal", () => {
  assert.ok(warnings.unknown_top_level_keys.includes("someLegacyKey"));
  assert.ok(warnings.unknown_top_level_keys.includes("admin/notaregion"));
});
