FROM python:3

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
COPY . .

CMD ["gunicorn"  , "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]