FROM python:3.12

WORKDIR /usr/src/app

COPY pyproject.toml .
RUN pip install uv && uv pip install -r pyproject.toml --system
EXPOSE 8000
COPY . .

CMD ["gunicorn"  , "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]