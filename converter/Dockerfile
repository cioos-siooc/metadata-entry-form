FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml ./
COPY converter ./converter
# git is needed at install time only: cioos-metadata-conversion declares
# `metadata-xml @ git+https://...` in its own dependencies, so pip shells out to
# git to fetch it. Removed again in the same layer to keep the image small.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && pip install --no-cache-dir . \
  && apt-get purge -y git && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 8000
CMD ["uvicorn", "converter.main:app", "--host", "0.0.0.0", "--port", "8000"]
