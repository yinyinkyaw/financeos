# FinanceOS Server (`@financeos/server`)

Backend service for FinanceOS, built with Hono + Better Auth + Drizzle ORM.

## Stack

- Runtime: Node.js
- HTTP framework: Hono
- Auth: better-auth
- Database: SQLite (via `@libsql/client`)
- ORM: Drizzle ORM
- Build: tsup (bundler-based)

## Project Structure

```txt
apps/server
├─ src/
│  ├─ index.ts          # Hono app entry
│  ├─ lib/
│  │  └─ auth.ts        # better-auth setup
│  └─ db/
│     ├─ index.ts       # Drizzle client
│     └─ schema.ts      # Drizzle schema
├─ env.ts               # environment validation (t3-env core + zod)
├─ .env
├─ tsconfig.json
└─ package.json
```

## Prerequisites

- Node.js 20+
- pnpm 9+

## Install

From repository root:

```bash
pnpm install
```

## Environment Variables

Set these in `apps/server/.env`:

```env
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3001
DB_FILE_NAME=file:./financeos.sqlite3
```

Notes:

- `BETTER_AUTH_URL` should match the server origin.
- `DB_FILE_NAME` is the SQLite URL consumed by `@libsql/client`.

## Run The Server

From repository root:

```bash
pnpm --filter @financeos/server dev
```

Server default URL:

- `http://localhost:3001`

Health check (current route):

- `GET /` -> `Hello Hono!`

## Build And Start

```bash
pnpm --filter @financeos/server check-types
pnpm --filter @financeos/server build
pnpm --filter @financeos/server start
```

## Database And Migrations (Drizzle)

This app already has:

- `drizzle-orm` + `drizzle-kit` installed
- Drizzle DB instance in `src/db/index.ts`

To generate migrations, add `apps/server/drizzle.config.ts` if you do not have one yet:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_FILE_NAME ?? "file:./financeos.sqlite3",
  },
});
```

Then run:

```bash
pnpm --filter @financeos/server exec drizzle-kit generate
pnpm --filter @financeos/server exec drizzle-kit migrate
```

## Auth Integration

- Auth setup lives in `src/lib/auth.ts`
- It uses `drizzleAdapter(db, { provider: "sqlite" })`
- Keep `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` set in `.env`

