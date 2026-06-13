# Trading Journal — Server

A REST API backend for tracking personal trading activity. Supports multiple accounts per user, trade logging with PnL/risk/commission tracking, and transaction history. Authentication uses short-lived JWT access tokens plus httpOnly refresh tokens. Built with Express + TypeScript, Prisma 7 (PostgreSQL), and validated with Zod.

## Tech Stack

- **Framework:** Express with TypeScript
- **ORM:** Prisma 7
- **Database:** PostgreSQL (Docker)
- **Validation:** Zod
- **Auth:** JWT — access token (15 min) + refresh token (7 days)
- **Testing:** Vitest + supertest
- **Linter:** ESLint + Prettier
- **Package manager:** pnpm

## Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Setup

### 1. Install dependencies

```sh
pnpm install
```

### 2. Configure environment

```sh
cp .env.example .env
```

### 3. Start the database

```sh
docker compose up -d
```

### 4. Run migrations

```sh
pnpm db:migrate
```

### 5. Seed the database

Copy the seed script into the running container and execute it:

```sh
docker cp prisma/seed.sql server-trading-app-postgres-1:/tmp/seed.sql
docker exec server-trading-app-postgres-1 psql -U admin -d trading_journal -f /tmp/seed.sql
```

This inserts 2 users, 6 accounts, 170 trades, and 80 transactions. All user passwords are `Password123!`.

### 6. Start the dev server

```sh
pnpm dev
```

The server will be available at `http://localhost:5000`.

---

### Resetting and re-seeding

To wipe all data and start fresh:

```sh
docker cp prisma/clean.sql server-trading-app-postgres-1:/tmp/clean.sql
docker exec server-trading-app-postgres-1 psql -U admin -d trading_journal -f /tmp/clean.sql
```

Then re-run the seed command from step 5.

## Database changes

Every schema change follows the same three-step workflow:

### 1. Edit the schema

Make your changes in `prisma/schema/`. This includes adding models, fields, relations, enums, indexes, or `@map` annotations.

### 2. Create and apply a migration

```sh
pnpm db:migrate
```

Prisma compares your schema against the current migration history, generates a `.sql` migration file under `prisma/schema/migrations/`, and applies it to the database. Commit the generated file alongside your schema change.

> **Never use `pnpm db:push`.** It updates the database without writing a migration file, silently drifting the DB away from the migration history and breaking `pnpm db:migrate` for everyone else.

### 3. Regenerate the Prisma client

```sh
pnpm db:generate
```

This rebuilds the TypeScript client in `src/generated/prisma/` to reflect the new schema. Always run this after `db:migrate` so the types stay in sync with your code.

---

## Architecture

**Layer order:** `routes -> controllers → services → prisma`

- **Routes** (`src/routes/`) — register Express routes, define Zod validation schemas inline, apply middleware.
- **Controllers** (`src/controllers/`) — thin HTTP layer: parse request, call service, set cookies/status, pass errors to `next(err)`.
- **Services** (`src/services/`) — all business logic and DB access via `src/infra/prisma.ts`.
- **Middlewares** (`src/middlewares/`).
