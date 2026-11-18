FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Pinned rather than :latest - an unpinned tag is neither reproducible nor something
# you can audit after the fact. Matches the uv_build floor in the root pyproject.toml.
COPY --from=ghcr.io/astral-sh/uv:0.13.9 /uv /uvx /bin/

WORKDIR /usr/src/app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    VIRTUAL_ENV=/usr/src/app/.venv \
    PATH="/usr/src/app/.venv/bin:$PATH"

# Cache dependency installation separately from application source changes.
# --locked fails if uv.lock is out of date with pyproject.toml.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

EXPOSE 8000

COPY . .

RUN mkdir ./xml && git clone --depth 1 --branch main --single-branch https://github.com/HakaiInstitute/hakai-metadata-entry-form-files.git ./xml

CMD ["gunicorn", "--access-logfile", "-", "-b", "0.0.0.0:8000", "app:app"]
