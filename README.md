# Trading Journal — Server

Node.js REST API server for the Trading Journal application.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express 5
- **ORM:** Prisma
- **Database:** PostgreSQL (Docker)
- **Dev server:** Nodemon + tsx
- **Linter:** OXC (`oxlint`)
- **Package manager:** pnpm

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
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

The server will be available at `http://localhost:3000`.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled server |
| `pnpm lint` | Lint `src/` with oxlint |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:push` | Push schema changes without migration |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   └── index.ts          # Entry point
├── .env                  # Environment variables (git-ignored)
├── .env.example          # Environment variable template
├── .oxlintrc.json        # OXC linter config
├── docker-compose.yml    # PostgreSQL service
├── nodemon.json          # Nodemon config
└── tsconfig.json         # TypeScript config
```
