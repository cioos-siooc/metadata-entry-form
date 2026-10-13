## Python Cloud Functions

Server-side metadata conversion utilities implemented as Firebase (Google Cloud) Functions in Python 3.11.

### Contents
1. Quick start
2. Directory layout
3. Environment & virtualenv (`.venv` + `venv` symlink)
4. Install / update dependencies
5. Run the Firebase Emulator (Python functions)
6. `convert_metadata` HTTP function contract & examples
6b. `create_record_from_source` HTTP function contract & examples
7. Helper script: `test-converter-endpoint.sh`
8. Dependency notes (git repos, local path)
9. Deployment (real vs emulator)
10. Troubleshooting

---
### 1. Quick start
```bash
cd firebase-functions/python-functions
uv venv venv  # create virtual environment in venv folder
source venv/bin/activate
uv sync --active

# From repo root (or here):
firebase emulators:start
```

---
### 6b. `create_record_from_source`

Builds a **new, unsaved** metadata record from a record that already exists in
DataCite, OBIS or the Polar Data Catalogue. Backs the "New Record ▾" menu on the
Submissions page; the frontend calls it from `src/utils/createRecordFromSource.js`.

**Request**
```jsonc
{ "data": {
    "source_type": "doi" | "obis" | "pdc",
    "identifier": "10.5281/zenodo.19077076"   // DOI, OBIS dataset UUID, or PDC CCIN
} }
```

**Response** — `{ "data": { <firebase record> } }`, the shape the entry form stores.

```bash
curl -X POST http://localhost:5001/<projectId>/us-central1/create_record_from_source \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{"data":{"source_type":"pdc","identifier":"13172"}}'
```

| Status | Meaning |
|---|---|
| 200 | Record retrieved and mapped |
| 400 | Unknown `source_type`, or missing `identifier` |
| 404 | The source catalogue has no such record |
| 500 | Retrieval or mapping broke |

`source_type` is required and validated against the three known loaders. It is
deliberately **not** inferred server-side: `Record(source).load()` in
cioos-metadata-conversion falls back to reading local files and fetching arbitrary
URLs for strings it doesn't recognise, so the caller-supplied identifier is never
handed to it. Detection happens in the browser (`detectSourceType`).

Note that **only DataCite DOIs resolve** — a Crossref-registered DOI (e.g. most
`10.1002/…` journal DOIs) will come back as a 404, because the loader queries the
DataCite REST API.

This function requests a 180s timeout: OBIS makes up to three follow-up API calls
(taxonomy facets, plus occurrence samples used to infer EOVs and platforms) and PDC
probes doi.org to resolve a CCIN's DOI.

---
### `forms`: records served like a WAF

`forms` (`forms_api.py`) serves the submitted and published records of each region as files rendered on request, laid out like the former WAF of `cioos-records-update`. It is reached through the `forms` Hosting target of `firebase-functions/firebase.json` at `https://forms.cioos.ca/api/`:

| Path | Content |
|---|---|
| `/api/<region>/[<owner>/]` | Listing of the published records (nginx autoindex HTML; `?format=json` for nginx JSON) |
| `/api/unpublished/<region>/[<owner>/]` | Same for submitted records |
| `/api/<region>/[<owner>/]<name>.xml` | A record rendered in a format (`.xml` ISO 19115-3, `.yaml`, `.json`, `_erddap.xml`, `_dataCite.json`, `_dataCite.xml`, `_citation.cff`) |
| `/api/<region>/?format=records` | Every record of the region with its files, for the form's WAF page |

Formats and owner folders follow `admin/<region>/waf` (Admin page). Access needs either a WAF token of the region (Admin page), as `Authorization: Bearer waf_...` or as the Basic auth password, e.g. `https://harvester:waf_...@forms.cioos.ca/api/<region>/`, or the Firebase ID token of an admin or reviewer of the region. Permissions, tokens and records are cached 60 seconds per instance, and files carry `Last-Modified` (the record's last save) and answer `If-Modified-Since`.

One-time setup per Firebase project, before the first deploy of the `forms` Hosting target:

```bash
cd firebase-functions
firebase hosting:sites:create cioos-metadata-forms-api --project default      # dev: cioos-metadata-forms-api-dev --project dev
# then add the custom domain forms.cioos.ca to that site in the Firebase console (Hosting)
```

Tests: `uv run pytest tests`
