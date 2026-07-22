FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml ./
COPY converter ./converter
RUN pip install --no-cache-dir .

EXPOSE 8000
CMD ["uvicorn", "converter.main:app", "--host", "0.0.0.0", "--port", "8000"]
