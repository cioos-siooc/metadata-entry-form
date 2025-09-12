## Python Cloud Functions

Server-side metadata conversion utilities implemented as Firebase (Google Cloud) Functions in Python 3.11.

### Contents
1. Quick start
2. Directory layout
3. Environment & virtualenv (`.venv` + `venv` symlink)
4. Install / update dependencies
5. Run the Firebase Emulator (Python functions)
6. `convert_metadata` HTTP function contract & examples
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