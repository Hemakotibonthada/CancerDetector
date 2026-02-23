# CancerGuard AI — Setup & Deployment Guide

## Prerequisites

| Component | Version | Purpose |
|-----------|---------|---------|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| npm | 9+ | Package management |
| Git | 2.40+ | Version control |
| PostgreSQL | 15+ | Production database (optional) |

---

## 1. Quick Start (Development)

### 1.1 Clone Repository

```bash
git clone https://github.com/Hemakotibonthada/CancerDetector.git
cd "Cancer detection"
```

### 1.2 Backend Setup

```bash
# Create Python virtual environment (recommended)
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 1.3 Start Backend Server

```bash
python run.py
```

This will:
- Initialize SQLite database (`cancerguard.db`)
- Create all 239 tables
- Seed demo data automatically
- Start server on http://localhost:8000
- Swagger docs available at http://localhost:8000/docs

### 1.4 Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend starts on http://localhost:3000.

### 1.5 Mobile App (Optional)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go app on your phone.

---

## 2. Configuration

### 2.1 Environment Variables

Create a `.env` file in the project root:

```env
# Application
APP_NAME=CancerGuard AI
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=true

# Database (SQLite for development)
USE_SQLITE=true
SQLITE_PATH=cancerguard.db

# Database (PostgreSQL for production)
# USE_SQLITE=false
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=cancerguard
# DATABASE_USER=postgres
# DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3005

# File Uploads
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=uploads
```

### 2.2 Frontend Environment

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

---

## 3. Database Management

### 3.1 Initialize Database

```bash
python run.py                    # Auto-creates and seeds on first run
```

### 3.2 Seed Sample Data

```bash
python run.py --seed
```

### 3.3 Reset Database

```bash
python run.py --reset-db
```

### 3.4 Manual Database Reset (Windows)

```powershell
Remove-Item cancerguard.db -Force -ErrorAction SilentlyContinue
python run.py
```

---

## 4. Demo Accounts

After seeding, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| User (Patient) | patient@cancerguard.ai | Patient@123456 |
| Doctor | doctor@cancerguard.ai | Doctor@123456 |
| Hospital Admin | hospital.admin@cancerguard.ai | Hospital@123456 |
| System Admin | admin@cancerguard.ai | Admin@123456 |

---

## 5. Production Deployment

### 5.1 PostgreSQL Setup

```sql
CREATE DATABASE cancerguard;
CREATE USER cancerguard_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cancerguard TO cancerguard_user;
```

Update `.env`:
```env
USE_SQLITE=false
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=cancerguard
DATABASE_USER=cancerguard_user
DATABASE_PASSWORD=secure_password
ENVIRONMENT=production
DEBUG=false
RELOAD=false
```

### 5.2 Frontend Build

```bash
cd frontend
npm run build
```

The build output is in `frontend/build/`. FastAPI serves it automatically.

### 5.3 Run with Gunicorn (Linux)

```bash
pip install gunicorn
gunicorn backend.app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### 5.4 Nginx Configuration

```nginx
server {
    listen 80;
    server_name cancerguard.example.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name cancerguard.example.com;

    ssl_certificate /etc/ssl/certs/cancerguard.crt;
    ssl_certificate_key /etc/ssl/private/cancerguard.key;

    # Frontend static files
    location / {
        root /var/www/cancerguard/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
    }

    # File uploads
    client_max_body_size 50M;
}
```

### 5.5 Docker (Optional)

```dockerfile
# Dockerfile
FROM python:3.13-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY frontend/build/ ./frontend/build/
COPY run.py .

EXPOSE 8000

CMD ["python", "run.py"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - USE_SQLITE=false
      - DATABASE_HOST=db
      - DATABASE_PORT=5432
      - DATABASE_NAME=cancerguard
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=postgres
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=cancerguard
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 6. SSL/TLS Setup

For production, use Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cancerguard.example.com
```

---

## 7. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Ensure virtual env is activated and dependencies installed |
| Port 8000 in use | Kill existing process or change PORT in `.env` |
| Database locked | Stop other processes accessing `cancerguard.db` |
| CORS errors | Add your frontend URL to `CORS_ORIGINS` |
| Token expired | Frontend auto-redirects to login on 401 |
| Upload failed | Check file size (max 50MB) and file type |

### Logs

Logs are written to `logs/` directory. Set log level in `.env`:

```env
LOG_LEVEL=INFO    # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

---

## 8. Development Tools

| Tool | URL | Description |
|------|-----|-------------|
| Swagger UI | http://localhost:8000/docs | Interactive API docs |
| ReDoc | http://localhost:8000/redoc | Alternative API docs |
| Frontend | http://localhost:3000 | React dev server |
| Health Check | http://localhost:8000/health | Server status |
