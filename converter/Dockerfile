FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml ./
COPY converter ./converter
# cioos-metadata-conversion (main) declares `metadata-xml @ git+https://...`, so
# a plain `pip install .` shells out to a git binary this image does not have.
# uv resolves the same dependency from GitHub's tarball instead — installing git
# is the obvious alternative, but apt pulls in perl and 30 other packages, which
# took ~20 minutes on the deploy host and timed the deployment out.
RUN pip install --no-cache-dir uv \
  && echo 'metadata-xml @ https://github.com/cioos-siooc/metadata-xml/archive/refs/heads/master.tar.gz' > /tmp/overrides.txt \
  && uv pip install --system --no-cache --override /tmp/overrides.txt . \
  && pip uninstall -y uv \
  && rm /tmp/overrides.txt

EXPOSE 8000
CMD ["uvicorn", "converter.main:app", "--host", "0.0.0.0", "--port", "8000"]
