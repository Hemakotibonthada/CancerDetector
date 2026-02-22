# CancerGuard AI Start Script for Windows
# Run: .\start.ps1

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CancerGuard AI - Cancer Detection Platform" -ForegroundColor Cyan
Write-Host "  Starting application..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "Python not found! Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Push-Location backend
pip install fastapi uvicorn[standard] sqlalchemy aiosqlite python-jose[cryptography] passlib[bcrypt] pydantic pydantic-settings python-multipart email-validator python-dateutil scikit-learn numpy pandas --quiet 2>$null
Pop-Location

# Check if frontend build exists
$frontendBuild = "frontend\build"
if (-not (Test-Path $frontendBuild)) {
    Write-Host "Frontend build not found. Checking for Node.js..." -ForegroundColor Yellow
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
        Write-Host "Building frontend..." -ForegroundColor Yellow
        Push-Location frontend
        if (-not (Test-Path "node_modules")) {
            npm install --silent 2>$null
        }
        npm run build 2>$null
        Pop-Location
    } else {
        Write-Host "Node.js not found. Running backend only (API mode)." -ForegroundColor Yellow
        Write-Host "Install Node.js to build the frontend." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Starting CancerGuard AI server..." -ForegroundColor Green
Write-Host ""
Write-Host "  API Server:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend:    http://localhost:3000 (if running separately)" -ForegroundColor White
Write-Host ""
Write-Host "  Demo Accounts:" -ForegroundColor Gray
Write-Host "  Patient:        patient@cancerguard.ai / Patient@123456" -ForegroundColor Gray
Write-Host "  Doctor:         doctor@cancerguard.ai / Doctor@123456" -ForegroundColor Gray  
Write-Host "  Hospital Admin: hospital.admin@cancerguard.ai / Hospital@123456" -ForegroundColor Gray
Write-Host "  System Admin:   admin@cancerguard.ai / Admin@123456" -ForegroundColor Gray
Write-Host ""

python run.py
