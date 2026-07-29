# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev          # start dev server (nodemon + tsx, hot-reload on src/)
npm run build        # compile TypeScript to dist/
npm test             # run all tests once
npm run test:watch   # run tests in watch mode
npm run lint         # lint src/ with ESLint
npm run lint:fix     # lint and auto-fix
npm run format       # format src/ with Prettier

npm run db:migrate   # run Prisma migrations (requires running DB)
npm run db:generate  # regenerate Prisma client to src/generated/prisma/
npm run db:studio    # open Prisma Studio
```

Run a single test file:

```sh
npx vitest run src/controllers/auth.controller.test.ts
```

Start the database before running migrations or the dev server:

```sh
docker compose up -d
```

## Architecture

**Layer order:** `routes → controllers → services → prisma`

- **Routes** (`src/routes/`) — register Express routes, define Zod validation schemas inline, apply middleware.
- **Controllers** (`src/controllers/`) — thin HTTP layer: parse request, call service, set cookies/status, call `next(err)` on failure.
- **Services** (`src/services/`) — all business logic and DB access via `prisma` from `src/infra/prisma.ts`.
- **Middlewares** (`src/middlewares/`) — `authMiddleware` (JWT Bearer), `validateMiddleware` (Zod schema, body or query), `requireAdminMiddleware`, `errorMiddleware` (centralised error handler).

**Error handling:** throw `ApiError` (from `src/libs/api-error.ts`) in services/controllers; the global `errorMiddleware` converts `ApiError`, `ZodError`, and known Prisma errors (`P2025` → 404, `P2002` → 400) to JSON responses.

**Authentication:** access token as `Authorization: Bearer <token>` (15 min), refresh token as httpOnly cookie (7 days). Token payload validated with Zod in `tokenService`. One refresh token per user (stored in `Token` table).

**Environment:** `src/env.ts` validates all env vars with Zod at startup and exits if any are missing. Required vars: `POSTGRES_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT` (default 5000).

## Admin

`User.role` (`ADMIN`/`USER`) gates a handful of routes via `requireAdminMiddleware`: `GET /users`, `PATCH /users/:id/role`, and the mutating `/symbols` routes (`POST`/`PUT`/`DELETE`). Deleting a `Symbol` is additionally blocked in `symbolService` if any `Trade` still references it, and symbol names must be unique (checked explicitly in `symbolService.create`, with the DB's `@unique` as a race-condition backstop).

Admin-only endpoints live alongside the regular resource routes in the same Express app — there's no separate admin service. That's fine for this pet/test project; a production system with a dedicated admin surface would more likely isolate these behind a separate deployment or stricter network boundary.

## Prisma

The schema is split into multiple files under `prisma/schema/`. The generated client outputs to `src/generated/prisma/` (not `node_modules`). Import from `../generated/prisma/client`, not from `@prisma/client`. Run `npm run db:generate` after any schema change.

**Never use `prisma db push`.** It updates the database without creating a migration file, which silently drifts the DB away from the migration history and breaks `prisma migrate dev` for everyone. Every schema change must go through `npm run db:migrate` (`prisma migrate dev`) so a migration file is created and committed alongside the schema change. If `prisma migrate dev` cannot be run (e.g. non-interactive terminal), stop and ask the user to run it themselves.

## Testing

Tests use Vitest + supertest against the real Express app. Services are mocked with `vi.mock(...)` — tests do not hit the database. The setup file (`src/test/setup.ts`) provides env vars so Zod env validation passes without a real `.env`.

Test files live alongside the code they test (`*.controller.test.ts`).

**Live server calls require permission:** Never call this server's real endpoints directly — `curl`, `fetch`, a Playwright/browser script driving the client, Postman, etc. — even against `localhost`, without asking the user first. If they approve it for one-off verification, clean up any data it created (delete the test users/rows) before finishing; don't leave throwaway records for the user to discover later.

## Conventions

**No `any`:** Never use `any`. Use proper types, or `unknown` when the type is genuinely unknown and must be narrowed before use.

**No type assertions (`as`):** Avoid `as SomeType` casts. Prefer typing variables and function signatures correctly so assertions are unnecessary. Use assertions only as a last resort when TypeScript cannot infer the type and there is no better alternative.

**README.md:** Update `README.md` whenever you change the architecture, add/remove a major library.

**Package version:** Bump the `version` field in `package.json` on every change (patch for fixes/minor additions, minor for new flows or features, major for breaking changes).
