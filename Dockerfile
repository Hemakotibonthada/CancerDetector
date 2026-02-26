# ==========================================
# Cancer Detection Platform - Dockerfile
# Multi-stage build for production deployment
# ==========================================

# ---- Stage 1: Frontend Build ----
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# ---- Stage 2: Mobile Build ----
FROM node:18-alpine AS mobile-build

WORKDIR /app/mobile
COPY mobile/package.json mobile/package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY mobile/ .
RUN npx expo export --platform web 2>/dev/null || echo "Mobile web build skipped"

# ---- Stage 3: Backend Dependencies ----
FROM python:3.11-slim AS python-deps

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Stage 4: AI Model Dependencies ----
FROM python:3.11-slim AS ai-deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY ai_models/ ./ai_models/
RUN pip install --no-cache-dir --prefix=/install \
    numpy>=1.24.0 \
    scikit-learn>=1.3.0 \
    pandas>=2.0.0 \
    joblib>=1.3.0 \
    Pillow>=10.0.0 \
    scipy>=1.11.0

# ---- Stage 5: Production Image ----
FROM python:3.11-slim AS production

# Labels
LABEL maintainer="cancer-detection-team"
LABEL version="1.0.0"
LABEL description="Cancer Detection Platform - Full Stack Application"

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_ENV=production \
    PORT=8000

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgomp1 \
    curl \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --gid 1001 --system appgroup \
    && adduser --uid 1001 --system --ingroup appgroup appuser

# Copy Python packages from builder stages
COPY --from=python-deps /install /usr/local
COPY --from=ai-deps /install /usr/local

# Copy application code
COPY backend/ ./backend/
COPY ai_models/ ./ai_models/
COPY data/ ./data/
COPY scripts/ ./scripts/

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create necessary directories
RUN mkdir -p \
    /app/uploads/medical_images \
    /app/uploads/lab_reports \
    /app/uploads/blood_reports \
    /app/uploads/prescriptions \
    /app/uploads/profile_photos \
    /app/logs \
    /app/exports \
    /app/temp \
    /app/ai_models/saved_models \
    && chown -R appuser:appgroup /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Switch to non-root user
USER appuser

# Expose port
EXPOSE ${PORT}

# Use tini as init process
ENTRYPOINT ["tini", "--"]

# Start command
CMD ["python", "-m", "uvicorn", "backend.app.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "4", "--proxy-headers", \
     "--forwarded-allow-ips", "*", \
     "--access-log", "--log-level", "info"]
