FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

WORKDIR /srv
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY seed_profile.json ./seed_profile.json

RUN useradd --create-home --uid 10001 mentor && mkdir -p /data && chown mentor /data
USER mentor

ENV DB_PATH=/data/mentor.db SEED_PATH=/srv/seed_profile.json
EXPOSE 8000
HEALTHCHECK --interval=60s --timeout=5s --start-period=30s \
	CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz').status == 200 else 1)"

# One worker on purpose: the scheduler lives in-process and must run exactly once.
CMD ["uvicorn", "app.main:build", "--factory", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--forwarded-allow-ips", "*"]
