# Fuse Finance Stock Trading Backend

## Overview

This service provides a backend for stock trading operations, integrating with a mock vendor API to:

- List available stocks
- Get user portfolios (list of their stocks and quantities)
- Execute stock purchase transactions
- Generate and send daily email reports (including successful and failed transactions)

**Only these 3 endpoints and the daily email report process are required.**

---

## Features

- REST API for stock listing, portfolio retrieval, and stock purchase
- Scheduled daily report generation and email delivery
- Robust error handling and distributed locking for scheduled jobs
- Modular, production-ready NestJS architecture
- PostgreSQL database with TypeORM
- Docker and docker-compose support for local development
- Health checks and monitoring endpoints

---

## Quickstart

### Prerequisites

- Node.js v22+
- npm v10+
- Docker & docker-compose (for DB and pgAdmin)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd fuse-home-task
```

### 2. Configure Environment Variables

Create a `.env` file in the root with the following variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fuse_finance

# Vendor API
VENDOR_API_URL=https://api.challenge.fusefinance.com
VENDOR_API_KEY=nSbPbFJfe95BFZufiDwF32UhqZLEVQ5K4wdtJI2e
VENDOR_API_TIMEOUT=10000
VENDOR_API_MAX_RETRIES=3
VENDOR_API_RETRY_DELAY=1000

# Email (for report delivery)
EMAIL_HOST=<smtp-host>
EMAIL_PORT=<smtp-port>
EMAIL_USER=<smtp-user>
EMAIL_PASS=<smtp-pass>
EMAIL_FROM=<from-address>
EMAIL_TO=<recipient-address>

# App
PORT=3000
```

### 3. Start Services (Recommended: Docker Compose)

```bash
docker-compose up -d
```

- Postgres: available on `${DB_PORT}`

### 4. Install Dependencies & Run App

```bash
npm install
npm run migration:run
nom run seed
npm run start:dev
```

Or run in production mode:

```bash
npm run start:prod
```

Or use Docker:

```bash
docker build -t fuse-finance-be .
docker run --env-file .env -p 3000:3000 fuse-finance-be
```

---

## API Endpoints

- `GET /stocks` — List available stocks (with pagination)
- `POST /stocks/:symbol/buy` — Buy a stock (price must be within 2% of current price)
- `GET /portfolios/:userId` — Get a user's portfolio
- `GET /reports/daily` — Trigger daily report generation (admin/test only)

See OpenAPI/Swagger docs (if enabled) or controller files for details.

---

## Testing

- **Unit tests:**
  ```bash
  npm run test
  ```
- **E2E tests:**
  ```bash
  npm run test:e2e
  ```

---

## Additional Notes

- The service uses distributed locking for scheduled jobs to prevent duplicate report generation.
- All configuration is managed via environment variables and `@nestjs/config`.
- For more details, see [REPORT.md](./REPORT.md).
