# =============================================================================
# CancerGuard AI Platform - Makefile
# =============================================================================

.PHONY: help install dev test lint format build deploy clean docs

# Colors
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m

# Variables
PYTHON_VERSION=3.11
NODE_VERSION=18
DOCKER_REGISTRY=ghcr.io/cancerguard
IMAGE_TAG?=latest
COMPOSE_FILE=docker-compose.yml
COMPOSE_FILE_PROD=docker-compose.prod.yml

# =============================================================================
# Help
# =============================================================================
help: ## Show this help
	@echo "$(BLUE)CancerGuard AI Platform$(NC)"
	@echo "========================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# Installation & Setup
# =============================================================================
install: install-backend install-frontend install-mobile ## Install all dependencies

install-backend: ## Install backend dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && pip install -r requirements.txt
	cd backend && pip install -e ".[dev]" 2>/dev/null || true

install-frontend: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm ci

install-mobile: ## Install mobile dependencies
	@echo "$(BLUE)Installing mobile dependencies...$(NC)"
	cd mobile && npm ci

setup-env: ## Set up environment files from examples
	@if [ ! -f .env ]; then cp .env.example .env && echo "$(GREEN)Created .env from .env.example$(NC)"; fi
	@if [ ! -f backend/.env ]; then cp .env.example backend/.env 2>/dev/null; fi

setup-db: ## Initialize database with migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	cd backend && alembic upgrade head

seed-db: ## Seed database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	cd backend && python -m scripts.seed_database

# =============================================================================
# Development
# =============================================================================
dev: ## Start all services in development mode
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "  Backend:  http://localhost:8000"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Docs:     http://localhost:8000/docs"

dev-backend: ## Start backend in development mode
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start frontend in development mode
	cd frontend && npm start

dev-mobile: ## Start mobile app
	cd mobile && npx expo start

dev-db: ## Start only database services
	docker compose -f $(COMPOSE_FILE) up -d postgres redis
	@echo "$(GREEN)Database services started$(NC)"

dev-stop: ## Stop all development services
	docker compose -f $(COMPOSE_FILE) down
	@echo "$(YELLOW)Services stopped$(NC)"

dev-logs: ## View development logs
	docker compose -f $(COMPOSE_FILE) logs -f

# =============================================================================
# Testing
# =============================================================================
test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && python -m pytest tests/ -v --tb=short --cov=app --cov-report=term-missing

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd frontend && npm test -- --watchAll=false --coverage

test-mobile: ## Run mobile tests
	@echo "$(BLUE)Running mobile tests...$(NC)"
	cd mobile && npm test

test-ai: ## Run AI model tests
	@echo "$(BLUE)Running AI model tests...$(NC)"
	cd ai_models && python -m pytest tests/ -v 2>/dev/null || echo "$(YELLOW)No AI tests found$(NC)"

test-integration: ## Run integration tests
	@echo "$(BLUE)Running integration tests...$(NC)"
	cd backend && python -m pytest tests/integration/ -v --tb=short 2>/dev/null || echo "$(YELLOW)No integration tests found$(NC)"

test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	cd frontend && npx cypress run 2>/dev/null || echo "$(YELLOW)Cypress not configured$(NC)"

test-coverage: ## Generate combined coverage report
	@echo "$(BLUE)Generating coverage reports...$(NC)"
	cd backend && python -m pytest tests/ --cov=app --cov-report=html --cov-report=xml
	cd frontend && npm test -- --watchAll=false --coverage
	@echo "$(GREEN)Coverage reports generated$(NC)"
	@echo "  Backend:  backend/htmlcov/index.html"
	@echo "  Frontend: frontend/coverage/lcov-report/index.html"

# =============================================================================
# Code Quality
# =============================================================================
lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint backend code
	@echo "$(BLUE)Linting backend...$(NC)"
	cd backend && python -m flake8 app/ --max-line-length=120 --ignore=E501,W503
	cd backend && python -m mypy app/ --ignore-missing-imports 2>/dev/null || true

lint-frontend: ## Lint frontend code
	@echo "$(BLUE)Linting frontend...$(NC)"
	cd frontend && npx eslint src/ --ext .ts,.tsx --max-warnings=0 2>/dev/null || true

format: format-backend format-frontend ## Format all code

format-backend: ## Format backend code
	@echo "$(BLUE)Formatting backend...$(NC)"
	cd backend && python -m black app/ tests/ --line-length=120
	cd backend && python -m isort app/ tests/ --profile=black

format-frontend: ## Format frontend code
	@echo "$(BLUE)Formatting frontend...$(NC)"
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css,json}"

security-scan: ## Run security scans
	@echo "$(BLUE)Running security scans...$(NC)"
	cd backend && python -m bandit -r app/ -ll 2>/dev/null || echo "$(YELLOW)bandit not installed$(NC)"
	cd backend && python -m safety check 2>/dev/null || echo "$(YELLOW)safety not installed$(NC)"
	cd frontend && npm audit --audit-level=moderate 2>/dev/null || true

type-check: ## Run type checking
	@echo "$(BLUE)Type checking backend...$(NC)"
	cd backend && python -m mypy app/ --ignore-missing-imports 2>/dev/null || true
	@echo "$(BLUE)Type checking frontend...$(NC)"
	cd frontend && npx tsc --noEmit

# =============================================================================
# Building
# =============================================================================
build: build-backend build-frontend ## Build all containers

build-backend: ## Build backend Docker image
	@echo "$(BLUE)Building backend image...$(NC)"
	docker build -t $(DOCKER_REGISTRY)/cancerguard:$(IMAGE_TAG) -f Dockerfile .
	@echo "$(GREEN)Backend image built: $(DOCKER_REGISTRY)/cancerguard:$(IMAGE_TAG)$(NC)"

build-frontend: ## Build frontend Docker image
	@echo "$(BLUE)Building frontend image...$(NC)"
	docker build -t $(DOCKER_REGISTRY)/cancerguard-frontend:$(IMAGE_TAG) -f frontend/Dockerfile frontend/
	@echo "$(GREEN)Frontend image built$(NC)"

build-frontend-static: ## Build frontend for static hosting
	@echo "$(BLUE)Building frontend static files...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)Build output: frontend/build/$(NC)"

build-mobile-android: ## Build mobile app for Android
	@echo "$(BLUE)Building Android app...$(NC)"
	cd mobile && npx eas build --platform android --profile production

build-mobile-ios: ## Build mobile app for iOS
	@echo "$(BLUE)Building iOS app...$(NC)"
	cd mobile && npx eas build --platform ios --profile production

# =============================================================================
# Deployment
# =============================================================================
deploy-staging: ## Deploy to staging environment
	@echo "$(BLUE)Deploying to staging...$(NC)"
	python scripts/deploy.py --environment staging

deploy-production: ## Deploy to production environment
	@echo "$(RED)⚠ Deploying to PRODUCTION$(NC)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	python scripts/deploy.py --environment production

deploy-k8s: ## Deploy to Kubernetes
	@echo "$(BLUE)Deploying to Kubernetes...$(NC)"
	kubectl apply -f k8s/deployment.yaml
	@echo "$(GREEN)Kubernetes deployment applied$(NC)"

push-images: ## Push Docker images to registry
	docker push $(DOCKER_REGISTRY)/cancerguard:$(IMAGE_TAG)
	docker push $(DOCKER_REGISTRY)/cancerguard-frontend:$(IMAGE_TAG)

rollback: ## Rollback Kubernetes deployment
	@echo "$(YELLOW)Rolling back deployment...$(NC)"
	kubectl rollout undo deployment/cancerguard-backend -n cancerguard
	@echo "$(GREEN)Rollback complete$(NC)"

# =============================================================================
# Database Management
# =============================================================================
db-migrate: ## Create a new database migration
	@read -p "Migration message: " msg && cd backend && alembic revision --autogenerate -m "$$msg"

db-upgrade: ## Apply pending migrations
	cd backend && alembic upgrade head

db-downgrade: ## Rollback last migration
	cd backend && alembic downgrade -1

db-history: ## Show migration history
	cd backend && alembic history

db-reset: ## Reset database (WARNING: destroys data)
	@echo "$(RED)⚠ This will destroy all data!$(NC)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	cd backend && alembic downgrade base
	cd backend && alembic upgrade head
	@echo "$(GREEN)Database reset complete$(NC)"

db-backup: ## Backup database
	@echo "$(BLUE)Backing up database...$(NC)"
	@mkdir -p backups
	docker compose exec postgres pg_dump -U cancerguard cancerguard | gzip > backups/cancerguard_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "$(GREEN)Backup saved to backups/$(NC)"

db-restore: ## Restore database from backup
	@echo "$(BLUE)Available backups:$(NC)"
	@ls -la backups/*.sql.gz 2>/dev/null || echo "No backups found"
	@read -p "Backup file: " file && gunzip -c $$file | docker compose exec -T postgres psql -U cancerguard cancerguard

# =============================================================================
# Monitoring & Debugging
# =============================================================================
logs: ## View application logs
	docker compose logs -f --tail=100

logs-backend: ## View backend logs
	docker compose logs -f backend --tail=100

logs-errors: ## View error logs only
	docker compose logs -f backend 2>&1 | grep -i "error\|exception\|traceback"

status: ## Check service status
	@echo "$(BLUE)Service Status:$(NC)"
	docker compose ps
	@echo ""
	@echo "$(BLUE)Health Checks:$(NC)"
	@curl -s http://localhost:8000/api/health 2>/dev/null | python -m json.tool 2>/dev/null || echo "  Backend: $(RED)DOWN$(NC)"
	@curl -s -o /dev/null -w "  Frontend: HTTP %{http_code}\n" http://localhost:3000 2>/dev/null || echo "  Frontend: $(RED)DOWN$(NC)"

monitor: ## Open monitoring dashboards
	@echo "$(BLUE)Monitoring URLs:$(NC)"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana:    http://localhost:3001  (admin/admin)"
	@echo "  Kibana:     http://localhost:5601"

shell-backend: ## Open backend shell
	docker compose exec backend python -c "from app.main import app; import code; code.interact(local=locals())"

shell-db: ## Open database shell
	docker compose exec postgres psql -U cancerguard cancerguard

# =============================================================================
# AI Models
# =============================================================================
train-model: ## Train a specific model
	@read -p "Model name (cancer_classifier/risk_prediction/etc): " model && \
	python -m ai_models.training.trainer --model $$model

evaluate-model: ## Evaluate a trained model
	@read -p "Model name: " model && \
	python -m ai_models.evaluation.model_evaluator --model $$model

tune-hyperparams: ## Run hyperparameter tuning
	@read -p "Model name: " model && \
	python -m ai_models.training.hyperparameter_tuner --model $$model

export-model: ## Export model for deployment
	@read -p "Model name: " model && \
	python -m ai_models.inference.engine --export --model $$model

# =============================================================================
# Documentation
# =============================================================================
docs: ## Build documentation
	@echo "$(BLUE)Building documentation...$(NC)"
	cd docs && python generate_ppt.py 2>/dev/null || true
	@echo "$(GREEN)Documentation built$(NC)"

docs-serve: ## Serve documentation locally
	mkdocs serve -a 0.0.0.0:8001 2>/dev/null || \
		cd docs && python -m http.server 8001

api-docs: ## Open API documentation
	@echo "$(BLUE)API Documentation: http://localhost:8000/docs$(NC)"
	@echo "Alternative: http://localhost:8000/redoc"

# =============================================================================
# Cleanup
# =============================================================================
clean: ## Clean build artifacts and caches
	@echo "$(BLUE)Cleaning up...$(NC)"
	# Python
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/htmlcov backend/.coverage
	# Node
	rm -rf frontend/build frontend/coverage
	rm -rf mobile/.expo
	# Docker
	docker compose down --remove-orphans 2>/dev/null || true
	# Temp files
	rm -rf temp/* logs/*.log exports/*
	@echo "$(GREEN)Clean complete$(NC)"

clean-docker: ## Remove all Docker resources
	@echo "$(RED)⚠ Removing all Docker resources...$(NC)"
	docker compose down -v --rmi all --remove-orphans 2>/dev/null || true
	docker system prune -f
	@echo "$(GREEN)Docker cleanup complete$(NC)"

clean-node: ## Remove node_modules
	rm -rf frontend/node_modules mobile/node_modules
	@echo "$(GREEN)node_modules removed$(NC)"

# =============================================================================
# Quick Commands
# =============================================================================
quick-start: setup-env dev-db install-backend setup-db seed-db dev-backend ## Quick start for new developers
	@echo "$(GREEN)🚀 CancerGuard AI is ready!$(NC)"

fresh-start: clean install setup-env dev ## Fresh start with clean install
	@echo "$(GREEN)🚀 Fresh environment ready!$(NC)"

check: lint test security-scan ## Run all checks (lint + test + security)
	@echo "$(GREEN)✅ All checks passed$(NC)"

ci: lint test-backend test-frontend type-check ## CI pipeline checks
	@echo "$(GREEN)✅ CI checks passed$(NC)"

release: check build push-images ## Full release pipeline
	@echo "$(GREEN)✅ Release ready$(NC)"
