# FinFlow

A financial operations dashboard demonstrating the **GraphQL BFF (Backend for Frontend)** pattern with a microservices backend.

**Docs:** [Interface Reference](docs/INTERFACES.md) · [Deployment Guide](DEPLOY.md)

---

## Architecture

```
Browser (Next.js 16)
    │
    │  GraphQL (Apollo Client v4)
    ▼
BFF — Apollo Server 5 + Express 5  (Port 4000)
    │
    ├── Accounts Service  (Port 3001) ─── accounts_db
    ├── Transactions Service  (Port 3002) ─── transactions_db
    └── Loans Service  (Port 3003) ─── loans_db
```

| Layer | Stack |
|---|---|
| Frontend | Next.js 16, React 19, Apollo Client v4, Tailwind CSS v4 |
| BFF | Apollo Server 5, Express 5, jose v6 JWT, Zod v4 |
| Microservices | Express 5, pg 8.20, Zod v4 |
| Database | PostgreSQL 18 (3 logical databases) |
| Monorepo | npm workspaces + Turborepo |

---

## Project Structure

```
FinFlow/
├── apps/
│   ├── web/              # Next.js 16 frontend (App Router)
│   └── bff/              # Apollo Server 5 GraphQL BFF
├── services/
│   ├── accounts-service/
│   ├── transactions-service/
│   └── loans-service/
├── shared/               # Shared TypeScript types (future)
├── infra/
│   └── azure/            # Bicep IaC templates
├── scripts/
│   └── init-db.sh        # One-time DB initialisation
├── docker-compose.yml
└── turbo.json
```

---

## Getting Started

### Prerequisites

- Node.js 24 LTS
- Docker Desktop
- npm 10+

### Local Development

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/garydev-1/finflow.git
   cd finflow
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env if needed — defaults work for local Docker setup
   ```

3. **Start the database**

   ```bash
   docker compose up postgres -d
   ```

4. **Run migrations**

   ```bash
   npm run migrate --workspace=@finflow/accounts-service
   npm run migrate --workspace=@finflow/transactions-service
   npm run migrate --workspace=@finflow/loans-service
   ```

5. **Seed data (optional)**

   ```bash
   npm run seed --workspace=@finflow/accounts-service
   npm run seed --workspace=@finflow/transactions-service
   npm run seed --workspace=@finflow/loans-service
   ```

6. **Start all services**

   ```bash
   npm run dev
   ```

   | Service | URL |
   |---|---|
   | Frontend | http://localhost:3000 |
   | BFF (GraphQL) | http://localhost:4000/graphql |
   | Accounts Service | http://localhost:3001 |
   | Transactions Service | http://localhost:3002 |
   | Loans Service | http://localhost:3003 |

7. **Login**

   Use the demo credentials: `demo` / `demo123`

---

## Running Tests

```bash
# All workspaces
npm run test

# Single workspace
npm run test --workspace=@finflow/accounts-service
npm run test --workspace=@finflow/bff
```

## Building

```bash
npm run build
```

---

## Docker

### Build all images locally

```bash
docker compose build
```

### Run the full stack

```bash
docker compose up
```

This starts postgres, all three microservices, the BFF, and the frontend.

---

## API Reference

### Microservice Health Checks

```
GET /health
→ { "status": "ok", "service": "<service-name>" }
```

### Accounts Service (`localhost:3001`)

| Method | Path | Description |
|---|---|---|
| GET | `/accounts?userId=<id>` | List accounts for a user |
| GET | `/accounts/:id` | Get account by ID |
| POST | `/accounts` | Create account |
| PATCH | `/accounts/:id/balance` | Update balance |

### Transactions Service (`localhost:3002`)

| Method | Path | Description |
|---|---|---|
| GET | `/transactions?accountId=<id>` | List transactions (paginated) |
| GET | `/transactions/:id` | Get transaction by ID |
| POST | `/transactions` | Create transaction |
| GET | `/transactions/summary?accountId=<id>` | Monthly summary |

### Loans Service (`localhost:3003`)

| Method | Path | Description |
|---|---|---|
| GET | `/loans?userId=<id>` | List loans for a user |
| GET | `/loans/:id` | Get loan by ID |
| POST | `/loans` | Create loan |
| PATCH | `/loans/:id/status` | Update loan status |
| GET | `/loans/:id/repayments` | Get repayments for a loan |

### GraphQL (BFF — `localhost:4000/graphql`)

Key queries:

```graphql
query Dashboard($userId: String!) {
  dashboard(userId: $userId) {
    totalBalance
    activeLoans
    monthlySpend
    accounts { id name type balance status }
    recentTransactions { id description amount transactionDate }
    loanSummary { activeCount totalOwing nextPaymentDue nextPaymentAmount }
  }
}

query Accounts($userId: String!) {
  accounts(userId: $userId) {
    accounts { id name type balance status }
    pageInfo { total page limit }
  }
}

query Transactions($accountId: String!, $page: Int, $limit: Int) {
  transactions(accountId: $accountId, page: $page, limit: $limit) {
    transactions { id description amount type transactionDate }
    summary { totalCredits totalDebits netAmount transactionCount }
    pageInfo { total page limit }
  }
}

query Loans($userId: String!) {
  loans(userId: $userId) {
    loans { id type amount balance interestRate status startDate endDate }
    pageInfo { total page limit }
  }
}
```

---

## Deployment (Azure)

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AZURE_CREDENTIALS` | Service principal JSON from `az ad sp create-for-rbac` |
| `ACR_LOGIN_SERVER` | e.g. `finflowprodacr.azurecr.io` |
| `ACR_USERNAME` | ACR admin username |
| `ACR_PASSWORD` | ACR admin password |
| `NEXT_PUBLIC_BFF_URL` | Public BFF GraphQL URL |

### Provision Infrastructure

```bash
# Create resource group
az group create --name rg-finflow-prod --location australiaeast

# Deploy Bicep template
az deployment group create \
  --resource-group rg-finflow-prod \
  --template-file infra/azure/main.bicep \
  --parameters @infra/azure/main.parameters.json \
  --parameters postgresAdminPassword="<password>" jwtSecret="<secret>"
```

### CI/CD

- **CI** (`.github/workflows/ci.yml`): Runs on every push to `main`/`develop` and PRs to `main`. Spins up a postgres service container, runs migrations, tests, and builds.
- **CD** (`.github/workflows/cd.yml`): Runs on every merge to `main`. Builds Docker images, pushes to ACR, deploys to Azure Container Apps.

---

## Data Model

### Monetary Values

All monetary values are stored and transmitted as **integers in cents** (e.g. `$150.00` = `15000`). Formatting is the frontend's responsibility.

### Timestamps

All timestamps are **ISO 8601 strings** in UTC (e.g. `2025-01-15T09:30:00.000Z`).

### UUIDs

All IDs are **UUID v4**, generated by PostgreSQL's `uuid-ossp` extension.

---

## Seed Data

The seed data creates users `user-001`, `user-002`, and `user-003`:

| User | Accounts | Loans |
|---|---|---|
| `user-001` | Cheque (R12,450), Savings (R45,200), Credit (-R3,200) | Active home loan + 3 others |
| `user-002` | Frozen account, Closed account | None |
| `user-003` | Business Cheque | None |
