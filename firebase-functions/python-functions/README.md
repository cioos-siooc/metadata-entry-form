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