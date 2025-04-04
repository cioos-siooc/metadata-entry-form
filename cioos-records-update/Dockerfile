FROM ghcr.io/astral-sh/uv:python3.12-bookworm

WORKDIR /usr/src/app

COPY cioos-records-update/pyproject.toml  cioos-records-update/uv.lock ./
COPY firebase_to_xml ../firebase_to_xml
RUN uv pip install . --system
EXPOSE 8000
COPY cioos-records-update/ .

ADD cioos-records-update .

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

EXPOSE 8000


CMD ["uv", "run", "gunicorn" , "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]