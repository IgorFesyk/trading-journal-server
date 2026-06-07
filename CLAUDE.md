# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm dev          # start dev server (nodemon + tsx, hot-reload on src/)
pnpm build        # compile TypeScript to dist/
pnpm test         # run all tests once
pnpm test:watch   # run tests in watch mode
pnpm lint         # lint src/ with ESLint
pnpm lint:fix     # lint and auto-fix
pnpm format       # format src/ with Prettier

pnpm db:migrate   # run Prisma migrations (requires running DB)
pnpm db:generate  # regenerate Prisma client to src/generated/prisma/
pnpm db:push      # push schema without creating a migration
pnpm db:studio    # open Prisma Studio
```

Run a single test file:

```sh
pnpm vitest run src/controllers/auth.controller.test.ts
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

## Prisma

The schema is split into multiple files under `prisma/schema/`. The generated client outputs to `src/generated/prisma/` (not `node_modules`). Import from `../generated/prisma/client`, not from `@prisma/client`. Run `pnpm db:generate` after any schema change.

## Testing

Tests use Vitest + supertest against the real Express app. Services are mocked with `vi.mock(...)` — tests do not hit the database. The setup file (`src/test/setup.ts`) provides env vars so Zod env validation passes without a real `.env`.

Test files live alongside the code they test (`*.controller.test.ts`).

## Conventions

**No `any`:** Never use `any`. Use proper types, or `unknown` when the type is genuinely unknown and must be narrowed before use.

**No type assertions (`as`):** Avoid `as SomeType` casts. Prefer typing variables and function signatures correctly so assertions are unnecessary. Use assertions only as a last resort when TypeScript cannot infer the type and there is no better alternative.

**README.md:** Update `README.md` whenever you change the architecture, add/remove a major library.

**Package version:** Bump the `version` field in `package.json` on every change (patch for fixes/minor additions, minor for new flows or features, major for breaking changes).
