FROM python:3.12-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /usr/src/app

# Install dependencies
ADD firebase_to_xml ../firebase_to_xml
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=cioos-records-update/uv.lock,target=uv.lock \
    --mount=type=bind,source=cioos-records-update/pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

ADD cioos-records-update .

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

EXPOSE 8000


CMD ["uv", "run", "gunicorn" , "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]