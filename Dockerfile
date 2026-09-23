FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ENV CI=false GENERATE_SOURCEMAP=false
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.production.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
COPY backend/app /app/backend/app
COPY --from=frontend-build /build/build /app/frontend/build
ENV PYTHONPATH=/app/backend PYTHONUNBUFFERED=1
EXPOSE 8000
HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=4 \
  CMD python -c "import json,urllib.request; r=json.load(urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)); assert r['status']=='healthy'"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
