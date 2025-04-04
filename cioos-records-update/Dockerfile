FROM python:3.12-bookworm

WORKDIR /usr/src/app

COPY cioos-records-update/pyproject.toml  cioos-records-update/uv.lock ./
COPY firebase_to_xml ../firebase_to_xml
RUN pip install uv
RUN uv pip install . --system
EXPOSE 8000
COPY cioos-records-update/ .

CMD ["gunicorn"  , "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]