# FinFlow — Deployment Guide

Complete guide for running FinFlow locally, with Docker Compose, and on Azure Container Apps.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Local Development (bare metal)](#local-development-bare-metal)
4. [Docker Compose (recommended for local)](#docker-compose)
5. [Database Operations](#database-operations)
6. [Testing](#testing)
7. [Production Build](#production-build)
8. [Azure Deployment](#azure-deployment)
9. [CI/CD Pipelines](#cicd-pipelines)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 24 LTS | https://nodejs.org/en/download |
| npm | 10+ | Bundled with Node.js |
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop/ |
| Azure CLI | 2.x | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli |
| `psql` (optional) | 16+ | For manual DB operations |

---

## Environment Variables

Copy the template and fill in values before starting any service:

```bash
cp .env.example .env
```

### Full Variable Reference

| Variable | Used By | Default | Description |
|---|---|---|---|
| `POSTGRES_USER` | docker-compose | `finflow` | PostgreSQL superuser |
| `POSTGRES_PASSWORD` | docker-compose | — | PostgreSQL password **(change in prod)** |
| `ACCOUNTS_DATABASE_URL` | accounts-service | — | Full connection string for accounts_db |
| `TRANSACTIONS_DATABASE_URL` | transactions-service | — | Full connection string for transactions_db |
| `LOANS_DATABASE_URL` | loans-service | — | Full connection string for loans_db |
| `ACCOUNTS_SERVICE_URL` | bff | `http://localhost:3001` | Internal URL to accounts-service |
| `TRANSACTIONS_SERVICE_URL` | bff | `http://localhost:3002` | Internal URL to transactions-service |
| `LOANS_SERVICE_URL` | bff | `http://localhost:3003` | Internal URL to loans-service |
| `JWT_SECRET` | bff | — | HS256 signing key **(minimum 32 chars)** |
| `JWT_EXPIRY` | bff | `8h` | Token lifetime (e.g. `1h`, `8h`, `24h`) |
| `FRONTEND_URL` | bff | `http://localhost:3000` | Allowed CORS origin |
| `NEXT_PUBLIC_BFF_URL` | web | `http://localhost:4000/graphql` | BFF GraphQL endpoint (public) |

> **Security**: Never commit `.env` to git. The `.gitignore` excludes it. For production, use Azure Key Vault — see [Azure Deployment](#azure-deployment).

---

## Local Development (bare metal)

Run each service directly with `tsx` (hot reload). Requires PostgreSQL running separately.

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
# Easiest: spin up only the postgres container
docker compose up postgres -d
```

Or use an existing local PostgreSQL instance (adjust the DATABASE_URL values in `.env` accordingly).

### 3. Create databases

```bash
# If using the Docker postgres on port 5433 (default in docker-compose.yml)
PGPASSWORD=<your_password> psql -h localhost -p 5433 -U finflow -d postgres \
  -c "CREATE DATABASE accounts_db;" \
  -c "CREATE DATABASE transactions_db;" \
  -c "CREATE DATABASE loans_db;"
```

### 4. Run migrations

```bash
npm run migrate --workspace=@finflow/accounts-service
npm run migrate --workspace=@finflow/transactions-service
npm run migrate --workspace=@finflow/loans-service
```

### 5. (Optional) Seed demo data

```bash
npm run seed --workspace=@finflow/accounts-service
npm run seed --workspace=@finflow/transactions-service
npm run seed --workspace=@finflow/loans-service
```

This creates users `user-001`, `user-002`, `user-003` with accounts, transactions, and loans.

### 6. Start all services

```bash
# All services in parallel via Turborepo
npm run dev
```

Or start individually:

```bash
# Terminal 1
npm run dev --workspace=@finflow/accounts-service

# Terminal 2
npm run dev --workspace=@finflow/transactions-service

# Terminal 3
npm run dev --workspace=@finflow/loans-service

# Terminal 4
npm run dev --workspace=@finflow/bff

# Terminal 5
npm run dev --workspace=@finflow/web
```

### Service URLs

| Service | URL | Notes |
|---|---|---|
| Web (Next.js) | http://localhost:3000 | Dashboard home |
| BFF (GraphQL) | http://localhost:4000/graphql | Apollo Sandbox available |
| Accounts Service | http://localhost:3001 | REST API |
| Transactions Service | http://localhost:3002 | REST API |
| Loans Service | http://localhost:3003 | REST API |

### Windows — lightningcss binary fix

On Windows, Turbopack cannot resolve the `lightningcss` native binary from within a monorepo. After every `npm install`, run:

```bash
node -e "require('fs').copyFileSync('node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node', 'node_modules/lightningcss/lightningcss.win32-x64-msvc.node')"
```

This copies the native `.node` file to the fallback path that Turbopack can resolve.

---

## Docker Compose

The `docker-compose.yml` runs the full stack with a single command. This is the recommended local setup.

```bash
# Build all images and start everything
docker compose up --build

# Detached (background)
docker compose up --build -d

# Stop and remove containers (keep volumes)
docker compose down

# Stop and remove containers + volumes (clean slate)
docker compose down -v
```

### First-run migrations

The containers do NOT run migrations automatically. After `docker compose up -d`:

```bash
docker compose exec accounts-service node dist/db/migrate.js
docker compose exec transactions-service node dist/db/migrate.js
docker compose exec loans-service node dist/db/migrate.js
```

Or run them from your host (requires the DBs to be reachable):

```bash
ACCOUNTS_DATABASE_URL=postgresql://finflow:<pw>@localhost:5433/accounts_db \
  npm run migrate --workspace=@finflow/accounts-service
```

### Docker Compose service topology

```
postgres (port 5433)
    ├── accounts-service (port 3001)
    ├── transactions-service (port 3002)
    └── loans-service (port 3003)
            └── bff (port 4000)
                    └── web (port 3000)
```

All services wait for `postgres` to pass its healthcheck before starting. The BFF waits for all three services to be healthy.

### Inspecting containers

```bash
# View logs for a specific service
docker compose logs -f bff

# Execute a shell in a container
docker compose exec accounts-service sh

# Check health status
docker compose ps
```

---

## Database Operations

### Migrations

Each service has a `migrate` script that reads SQL files from `src/db/migrations/` and applies them in order.

```bash
# Run migrations for a specific service
npm run migrate --workspace=@finflow/accounts-service
npm run migrate --workspace=@finflow/transactions-service
npm run migrate --workspace=@finflow/loans-service
```

Migration files:

| Service | File |
|---|---|
| accounts-service | [services/accounts-service/src/db/migrations/001_init.sql](services/accounts-service/src/db/migrations/001_init.sql) |
| transactions-service | [services/transactions-service/src/db/migrations/001_init.sql](services/transactions-service/src/db/migrations/001_init.sql) |
| loans-service | [services/loans-service/src/db/migrations/001_init.sql](services/loans-service/src/db/migrations/001_init.sql) |

### Seeding

```bash
npm run seed --workspace=@finflow/accounts-service
npm run seed --workspace=@finflow/transactions-service
npm run seed --workspace=@finflow/loans-service
```

**Seed data summary:**

| User | Accounts | Transactions | Loans |
|---|---|---|---|
| `user-001` | Cheque (R12,450), Savings (R45,200), Credit (-R3,200) | 32 across 3 months | 4 (ACTIVE home loan + SETTLED + PENDING + DEFAULTED) |
| `user-002` | Frozen account, Closed account | None | None |
| `user-003` | Business Cheque | 10 business transactions | None |

### Direct PostgreSQL access

```bash
# Docker Compose postgres (host port 5433)
PGPASSWORD=<pw> psql -h localhost -p 5433 -U finflow -d accounts_db

# List all tables
\dt

# Check accounts
SELECT id, user_id, account_number, account_type, balance FROM accounts;
```

---

## Testing

### Run all tests

```bash
npm run test
```

### Run tests for a specific workspace

```bash
npm run test --workspace=@finflow/accounts-service
npm run test --workspace=@finflow/transactions-service
npm run test --workspace=@finflow/loans-service
npm run test --workspace=@finflow/bff
```

### Coverage reports

Each service is configured with Vitest v8 coverage with a **70% line threshold**. Coverage reports are written to `coverage/` in each workspace.

```bash
npm run test --workspace=@finflow/bff -- --coverage
```

Open `apps/bff/coverage/index.html` in a browser to view the HTML report.

### Test summary

| Workspace | Tests | Coverage Threshold |
|---|---|---|
| accounts-service | ~15 | 70% |
| transactions-service | ~11 | 70% |
| loans-service | ~12 | 70% |
| bff | 41 (auth: 8, datasources: 21, resolvers: 12) | 70% |

---

## Production Build

```bash
# Build all workspaces (outputs to dist/ per service, .next/ for web)
npm run build

# Build a single workspace
npm run build --workspace=@finflow/bff
npm run build --workspace=@finflow/web
```

Turborepo caches build outputs — subsequent builds for unchanged workspaces are instant.

### Docker image builds (local)

```bash
# Build a single image
docker build -t finflow/accounts-service:local services/accounts-service
docker build -t finflow/bff:local apps/bff
docker build -t finflow/web:local apps/web

# Build all via Compose
docker compose build
```

---

## Azure Deployment

### Architecture on Azure

```
Internet
    │
    ▼
Azure Container Apps — web (external ingress, port 3000)
    │  NEXT_PUBLIC_BFF_URL
    ▼
Azure Container Apps — bff (internal ingress, port 4000)
    │  ACCOUNTS/TRANSACTIONS/LOANS_SERVICE_URL
    ├──▶ accounts-service (internal, port 3001)
    ├──▶ transactions-service (internal, port 3002)
    └──▶ loans-service (internal, port 3003)

All services → Azure Database for PostgreSQL Flexible Server
```

### 1. Create infrastructure prerequisites

```bash
# Log in to Azure
az login

# Create resource group
az group create \
  --name rg-finflow-prod \
  --location australiaeast

# Create Key Vault
az keyvault create \
  --name finflow-kv \
  --resource-group rg-finflow-prod \
  --location australiaeast

# Store secrets in Key Vault
az keyvault secret set \
  --vault-name finflow-kv \
  --name postgres-admin-password \
  --value "$(openssl rand -base64 32)"

az keyvault secret set \
  --vault-name finflow-kv \
  --name jwt-secret \
  --value "$(openssl rand -base64 48)"
```

### 2. Deploy Bicep template

```bash
# Update the subscription ID placeholder in main.parameters.json first:
# Replace <subscription-id> with: az account show --query id -o tsv

az deployment group create \
  --resource-group rg-finflow-prod \
  --template-file infra/azure/main.bicep \
  --parameters @infra/azure/main.parameters.json \
  --name finflow-deploy-$(date +%Y%m%d%H%M)
```

### 3. After deployment — run migrations

Once PostgreSQL is provisioned, run migrations against the Azure DB. Get the connection strings from the Azure portal or Key Vault output, then:

```bash
ACCOUNTS_DATABASE_URL="postgresql://finflow:<pw>@finflow-prod-postgres.postgres.database.azure.com/accounts_db?sslmode=require" \
  npm run migrate --workspace=@finflow/accounts-service

TRANSACTIONS_DATABASE_URL="..." npm run migrate --workspace=@finflow/transactions-service
LOANS_DATABASE_URL="..." npm run migrate --workspace=@finflow/loans-service
```

### 4. Configure GitHub Actions secrets

Navigate to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | How to obtain |
|---|---|
| `AZURE_CREDENTIALS` | See below |
| `ACR_LOGIN_SERVER` | e.g. `finflowprodacr.azurecr.io` (from Bicep output or portal) |
| `ACR_USERNAME` | ACR admin username (portal: Container Registry → Access keys) |
| `ACR_PASSWORD` | ACR admin password (portal: Container Registry → Access keys) |
| `NEXT_PUBLIC_BFF_URL` | BFF Container App URL + `/graphql` (from Bicep output `bffUrl`) |

**Creating the `AZURE_CREDENTIALS` service principal:**

```bash
# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal with contributor access to the resource group
az ad sp create-for-rbac \
  --name "finflow-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-finflow-prod \
  --sdk-auth
```

Copy the entire JSON output as the value of `AZURE_CREDENTIALS`.

### 5. Deploy via CD pipeline

Once secrets are configured, push to `main`:

```bash
git push origin main
```

This triggers `.github/workflows/cd.yml` which:
1. Builds all 5 Docker images with layer caching
2. Tags each image with the git short SHA + `latest`
3. Pushes to ACR
4. Deploys each Container App sequentially

Monitor the deployment in the **GitHub Actions** tab.

### Bicep template summary

The `infra/azure/main.bicep` template provisions:

| Resource | SKU/Tier | Purpose |
|---|---|---|
| Log Analytics Workspace | PerGB2018, 30-day retention | Container Apps logging |
| Container Apps Environment | — | Shared network + logging |
| Azure Container Registry | Basic | Image storage |
| PostgreSQL Flexible Server | Burstable B1ms, 32GB, v16 | Shared database server |
| 3× databases | — | accounts_db, transactions_db, loans_db |
| accounts-service Container App | 0.25 CPU / 0.5GB, 1-3 replicas | Accounts microservice |
| transactions-service Container App | 0.25 CPU / 0.5GB, 1-3 replicas | Transactions microservice |
| loans-service Container App | 0.25 CPU / 0.5GB, 1-3 replicas | Loans microservice |
| bff Container App | 0.5 CPU / 1GB, 1-5 replicas | GraphQL BFF (internal ingress) |
| web Container App | 0.5 CPU / 1GB, 1-5 replicas | Next.js frontend (external ingress) |

> **Note:** PostgreSQL v18 is not yet available as an Azure managed service. The Bicep template uses v16.

### Estimated cost (australiaeast, sustained)

| Resource | Approx. monthly cost |
|---|---|
| PostgreSQL B1ms | ~USD $14 |
| Container Apps (5 services, minimal traffic) | ~USD $5–15 |
| ACR Basic | ~USD $5 |
| Log Analytics (light volume) | ~USD $2 |
| **Total** | **~USD $26–36/month** |

Use `az cost management` or the Azure Cost Management portal for exact figures.

---

## CI/CD Pipelines

### CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:** Push to `main` or `develop`; pull requests targeting `main`

```
checkout → setup Node 24 → npm ci → create DBs → migrate → test → build
```

The CI job spins up a `postgres:18-alpine` service container and creates all three databases before running migrations and tests. All workspace tests must pass before the build step runs.

**Environment variables injected by CI:**

```
ACCOUNTS_DATABASE_URL=postgresql://finflow:finflow_dev@localhost:5432/accounts_db
TRANSACTIONS_DATABASE_URL=postgresql://finflow:finflow_dev@localhost:5432/transactions_db
LOANS_DATABASE_URL=postgresql://finflow:finflow_dev@localhost:5432/loans_db
ACCOUNTS_SERVICE_URL=http://localhost:3001
TRANSACTIONS_SERVICE_URL=http://localhost:3002
LOANS_SERVICE_URL=http://localhost:3003
JWT_SECRET=ci-test-secret-minimum-32-characters-long
JWT_EXPIRY=8h
NEXT_PUBLIC_BFF_URL=http://localhost:4000/graphql
```

### CD Pipeline (`.github/workflows/cd.yml`)

**Triggers:** Push to `main` only

**Job 1: `build-and-push`**

```
git short SHA → Docker Buildx → build 5 images (GHA layer cache) → push to ACR
```

Each image is tagged `:<sha>` and `:latest`. The SHA is passed as a job output to the deploy job for exact version traceability.

**Job 2: `deploy`** (requires `build-and-push`, uses `production` environment)

```
az login → deploy accounts-service → deploy transactions-service → deploy loans-service → deploy bff → deploy web
```

Deployments are sequential to avoid race conditions. Each step uses `azure/container-apps-deploy-action@v1`.

---

## Troubleshooting

### `lightningcss.win32-x64-msvc.node` not found (Windows)

Turbopack bundles the PostCSS worker and loses native module context. Fix:

```bash
node -e "require('fs').copyFileSync('node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node', 'node_modules/lightningcss/lightningcss.win32-x64-msvc.node')"
```

Must be re-run after every `npm install`.

### `Failed to fetch` on Transactions page

The Transactions page is a client component that fetches directly from the BFF. If CORS is not configured:

1. Ensure `FRONTEND_URL=http://localhost:3000` is set in the BFF's environment.
2. Verify the `cors` middleware is applied in `apps/bff/src/index.ts` **before** `express.json()`.

### `ECONNREFUSED` in BFF logs

The BFF cannot reach a microservice. Check:

1. The target service is running: `curl http://localhost:3001/health`
2. `ACCOUNTS_SERVICE_URL` / `TRANSACTIONS_SERVICE_URL` / `LOANS_SERVICE_URL` are set correctly.
3. In Docker Compose, service names (`accounts-service`) resolve correctly — these are used as hostnames.

### PostgreSQL `FATAL: password authentication failed`

1. Check the `POSTGRES_PASSWORD` in `.env` matches the connection URL.
2. The Docker Compose postgres uses `md5` auth — `POSTGRES_HOST_AUTH_METHOD=md5`.
3. The `init-db.sh` script runs once on the first postgres start. If databases already exist, it will error harmlessly.

### `Cannot find module '@/...'`

Path aliases (`@/*` → `src/*`) are configured in `apps/web/tsconfig.json`. If your IDE doesn't pick them up, restart the TypeScript language server.

### GraphQL `Cannot query field X on type Y`

The BFF schema files (`.graphql`) are loaded from disk at runtime. In Docker, they are copied to `dist/schema/` in the Dockerfile. Locally, they are read from `src/schema/`. If you add a new schema file, restart the BFF.

### Tests fail with `ECONNREFUSED` or DB errors

Tests mock all external dependencies — no real DB or HTTP connections. If tests fail with connection errors:

1. Ensure `vi.mock('node-fetch')` is at the top of datasource tests.
2. Ensure `vi.mock('../db/client')` is at the top of controller tests.
3. Check that `vitest.config.ts` has `globals: true` and `environment: 'node'`.

### Azure deployment: `The image cannot be pulled`

1. Verify `ACR_USERNAME` and `ACR_PASSWORD` GitHub secrets are set correctly.
2. Check the Container App has the registry secret configured in its `registries` block (done by Bicep).
3. Confirm the image tag exists in ACR: `az acr repository show-tags --name <acr-name> --repository accounts-service`.
