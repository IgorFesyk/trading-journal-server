# Trading Journal — Server

Node.js REST API server for the Trading Journal application.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express 5
- **ORM:** Prisma 7 (schema split across `prisma/schema/`, client generated to `src/generated/prisma/`)
- **Database:** PostgreSQL (Docker)
- **Validation:** Zod 4
- **Auth:** JWT — access token (Bearer, 15 min) + refresh token (httpOnly cookie, 7 days)
- **Testing:** Vitest + supertest
- **Linter:** ESLint + Prettier
- **Package manager:** pnpm

## Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Getting Started

### 1. Install dependencies

```sh
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and adjust values if needed:

```sh
cp .env.example .env
```

Required variables: `POSTGRES_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`.

### 3. Start the database

```sh
docker compose up -d
```

### 4. Run database migrations

```sh
pnpm db:migrate
```

### 5. Start the dev server

```sh
pnpm dev
```

The server will be available at `http://localhost:5000`.

## Architecture

**Layer order:** `routes -> controllers → services → prisma`

- **Routes** (`src/routes/`) — register Express routes, define Zod validation schemas inline, apply middleware.
- **Controllers** (`src/controllers/`) — thin HTTP layer: parse request, call service, set cookies/status, pass errors to `next(err)`.
- **Services** (`src/services/`) — all business logic and DB access via `src/infra/prisma.ts`.
- **Middlewares** (`src/middlewares/`) — `authMiddleware`, `validateMiddleware`, `requireAdminMiddleware`, `errorMiddleware`.
