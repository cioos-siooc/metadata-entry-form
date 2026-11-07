# CIOOS Records Update

This is a basic Flask app to create XML from the metadata form

Requires `key.json` which contains a service account key json
specifically one from [here](https://console.cloud.google.com/iam-admin/serviceaccounts/details/108735728189650899572/keys?authuser=0&hl=en&project=cioos-metadata-form) you can also generate one [here](https://console.firebase.google.com/u/0/project/cioos-metadata-form/settings/serviceaccounts/adminsdk)

Alternatively the same service account key json string can be specified in the FIREBASE_SERVICE_ACCOUNT_KEY environment variable. The app will look for the environment variable first and fall back to the key.json file if ot found.

## Install

Requires [uv](https://docs.astral.sh/uv/getting-started/installation/).

```bash
uv sync
```

This creates a `.venv` and installs all dependencies (including dev tools) from `uv.lock`.

## Run locally

```bash
uv run flask --app app run
```

## Test

```bash
uv run pytest test_app.py -v
```

## Docker

```bash
docker compose up --build
```

The container expects the following environment variables (see `docker-compose.yaml`):

| Variable | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account key JSON string |
| `GH_USERNAME` | GitHub username for pushing metadata files |
| `GH_PAT` | GitHub personal access token |
| `RECORD_API_TOKEN` | Secret token required by the `/record` and `/recordDelete` endpoints |
| `SENTRY_ENVIRONMENT` | Sentry environment tag (e.g. `production`) |
