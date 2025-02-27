FROM python:3.12-bookworm

WORKDIR /usr/src/app

COPY pyproject.toml ./
COPY ../firebase_to_xml ../firebase_to_xml
RUN pip install uv
RUN uv pip install . --system
EXPOSE 8000
COPY . .

CMD ["gunicorn"  , "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]