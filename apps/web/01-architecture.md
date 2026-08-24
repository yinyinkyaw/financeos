# Architecture Documentation

> **Historical reference:** This document predates the approved core-ledger flow. Where it conflicts with [`docs/product/user-flow.md`](../../docs/product/user-flow.md) or [the focused Overview spec](../../.scratch/dashboard-overview/spec.md), those newer documents are authoritative.

**Project:** FinanceOS
**Author:** Solo developer
**Stack:** Next.js · Hono · ts-rest · better-auth · Drizzle ORM · SQLite · Turborepo + pnpm

---

## Overview

FinanceOS is a personal budget tracking web application built as a monorepo with two separate apps — a Next.js frontend and a Hono backend — sharing a typed API contract package in the middle. The architecture is intentionally explicit: every middleware, every status code, and every database query is written by hand. This makes it a great project to learn how a full-stack application actually works under the hood.

---

## Monorepo structure

The entire project lives in a single Turborepo managed with pnpm workspaces.

```
financeos/
  apps/
    web/                  ← Next.js frontend (port 3000)
    server/               ← Hono backend (port 4000)
  packages/
    contract/             ← ts-rest contract + Zod schemas (shared)
  turbo.json
  package.json            ← root workspace config
  pnpm-workspace.yaml
```

### Why Turborepo?

Turborepo is a task runner that understands the dependency graph between your packages. When you run `pnpm dev` at the root, it starts all apps in parallel. When you run `pnpm build`, it builds `contract` first (since both apps depend on it), then builds the apps. You never have to manage build order manually.

### Why pnpm?

pnpm is the most popular package manager for Turborepo projects. It is faster than npm, uses less disk space, and handles workspace linking (the `@financeos/contract` package available inside `apps/web` without publishing it to npm) cleanly.

---

## Root configuration

**`package.json` (root):**
```json
{
  "name": "financeos",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5"
  }
}
```

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "persistent": true,
      "cache": false
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

The `"dependsOn": ["^build"]` line is the key — it tells Turborepo that before building an app, build all of its dependencies first. So `contract` always builds before `web` and `server`.

---

## Layer 1 — Shared contract (`packages/contract`)

This is the most important architectural piece. It is a plain TypeScript package that both the frontend and backend import. It defines every API endpoint — its HTTP method, path, request body shape, and response shape — using ts-rest and Zod.

**Package name:** `@financeos/contract`

```
packages/contract/
  src/
    transactions.ts
    accounts.ts
    categories.ts
    budgets.ts
    goals.ts
    index.ts          ← re-exports all contracts
  package.json
  tsconfig.json
```

**`package.json`:**
```json
{
  "name": "@financeos/contract",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "dependencies": {
    "@ts-rest/core": "latest",
    "zod": "latest"
  }
}
```

**Example — transaction contract:**
```ts
// packages/contract/src/transactions.ts
import { initContract } from '@ts-rest/core'
import { z } from 'zod'

const c = initContract()

const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fromAccountId: z.string().nullable(), // null for income
  toAccountId: z.string().nullable(),   // null for expense
  categoryId: z.string().nullable(),    // null for transfers
  amount: z.number(),
  note: z.string(),
  date: z.string(),
  status: z.enum(['completed', 'pending']),
  createdAt: z.string(),
})

export const transactionContract = c.router({
  list: {
    method: 'GET',
    path: '/transactions',
    query: z.object({
      limit: z.coerce.number().optional(),
      offset: z.coerce.number().optional(),
      kind: z.enum(['income', 'expense', 'transfer']).optional(),
    }),
    responses: {
      200: z.array(transactionSchema),
      401: z.object({ message: z.string() }),
    },
  },
  create: {
    method: 'POST',
    path: '/transactions',
    body: z.object({
      amount: z.number(),
      note: z.string(),
      fromAccountId: z.string().nullable(),
      toAccountId: z.string().nullable(),
      categoryId: z.string().nullable(),
      date: z.string(),
      status: z.enum(['completed', 'pending']).default('completed'),
    }),
    responses: {
      201: transactionSchema,
      400: z.object({ message: z.string() }),
      401: z.object({ message: z.string() }),
    },
  },
})
```

**Why this matters:** TypeScript enforces the contract at compile time. If the Hono server returns a field the contract does not define, or the Next.js client sends a field with the wrong type, you get a type error in your editor before you even run the code.

---

## Layer 2 — Frontend (`apps/web`)

A Next.js application using the App Router. All UI components are built with shadcn/ui and styled with Tailwind CSS.

**Package name:** `@financeos/web`

```
apps/web/
  app/
    (auth)/
      sign-in/page.tsx
      sign-up/page.tsx
      reset-password/page.tsx
    (dashboard)/
      page.tsx                  ← overview
      transactions/page.tsx
      budgets/page.tsx
      goals/page.tsx
  components/
    ui/                         ← shadcn/ui components
    transaction-table.tsx
    balance-card.tsx
    budget-card.tsx
  lib/
    auth-client.ts              ← better-auth client instance
    api-client.ts               ← ts-rest client instance
  package.json
```

**`package.json`:**
```json
{
  "name": "@financeos/web",
  "dependencies": {
    "@financeos/contract": "*",
    "@ts-rest/react-query": "latest",
    "better-auth": "latest",
    "next": "latest"
  }
}
```

**ts-rest client setup:**
```ts
// apps/web/lib/api-client.ts
import { initClient } from '@ts-rest/core'
import { contract } from '@financeos/contract'

export const api = initClient(contract, {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  baseHeaders: {},
  credentials: 'include',  // send session cookie with every request
})
```

**Using the client in a component:**
```ts
// Expense: source account only, with a category
const { body } = await api.transactions.create({
  body: {
    amount: 124.85,
    note: 'Whole Foods Market',
    fromAccountId: 'bank-id',
    toAccountId: null,
    categoryId: 'groceries-category-id',
    date: '2026-03-21',
    status: 'completed',
  }
})

// Transfer: different source and destination accounts, without a category
const { body } = await api.transactions.create({
  body: {
    amount: 1000,
    note: 'Transfer to wallet',
    fromAccountId: 'bank-id',
    toAccountId: 'wallet-id',
    categoryId: null,
    date: '2026-03-21',
    status: 'completed',
  }
})
```

---

## Layer 3 — Backend (`apps/server`)

A Hono application running on Node.js. This is where you write real backend code — middleware, route handlers, validation, and database queries — with nothing hidden from you.

**Package name:** `@financeos/server`

```
apps/server/
  src/
    index.ts              ← entry point, registers all routes and middleware
    auth.ts               ← better-auth server instance
    db/
      index.ts            ← Drizzle client (connects to SQLite)
      schema.ts           ← all table definitions
      migrations/         ← SQL files generated by Drizzle Kit
    routes/
      transactions.ts
      accounts.ts
      categories.ts
      budgets.ts
      goals.ts
    middleware/
      session.ts          ← verifies session cookie on every request
  package.json
  drizzle.config.ts
```

**`package.json`:**
```json
{
  "name": "@financeos/server",
  "dependencies": {
    "@financeos/contract": "*",
    "@ts-rest/hono": "latest",
    "better-auth": "latest",
    "drizzle-orm": "latest",
    "hono": "latest",
    "zod": "latest"
  }
}
```

**Entry point:**
```ts
// apps/server/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './auth'
import { sessionMiddleware } from './middleware/session'
import { transactionRouter } from './routes/transactions'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: 'http://localhost:3000', credentials: true }))

app.on(['GET', 'POST'], '/auth/**', (c) => auth.handler(c.req.raw))

app.use('/api/*', sessionMiddleware)
app.route('/api', transactionRouter)

export default app
```

**Session middleware:**
```ts
// apps/server/src/middleware/session.ts
import type { Context, Next } from 'hono'
import { auth } from '../auth'

export async function sessionMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ message: 'Unauthorized' }, 401)
  }
  c.set('userId', session.user.id)
  await next()
}
```

**Route handler using ts-rest:**
```ts
// apps/server/src/routes/transactions.ts
import { createHonoEndpoints } from '@ts-rest/hono'
import { transactionContract } from '@financeos/contract'
import { db } from '../db'
import { transactions } from '../db/schema'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'

export const transactionRouter = createHonoEndpoints(transactionContract, {
  list: async ({ query }, c) => {
    const userId = c.get('userId')
    const conditions = [eq(transactions.userId, userId)]
    if (query.kind === 'expense') {
      conditions.push(isNotNull(transactions.fromAccountId), isNull(transactions.toAccountId))
    }
    if (query.kind === 'income') {
      conditions.push(isNull(transactions.fromAccountId), isNotNull(transactions.toAccountId))
    }
    if (query.kind === 'transfer') {
      conditions.push(isNotNull(transactions.fromAccountId), isNotNull(transactions.toAccountId))
    }
    const rows = await db.select().from(transactions)
      .where(and(...conditions))
      .limit(query.limit ?? 10)
      .offset(query.offset ?? 0)
    return { status: 200, body: rows }
  },
  create: async ({ body }, c) => {
    const userId = c.get('userId')

    const hasSourceAccount = body.fromAccountId !== null
    const hasDestinationAccount = body.toAccountId !== null

    if (!hasSourceAccount && !hasDestinationAccount) {
      return { status: 400, body: { message: 'A source or destination account is required' } }
    }
    const isTransfer = hasSourceAccount && hasDestinationAccount
    if (isTransfer && body.fromAccountId === body.toAccountId) {
      return { status: 400, body: { message: 'Source and destination accounts must differ' } }
    }
    if (isTransfer && body.categoryId) {
      return { status: 400, body: { message: 'Transfers cannot have a category' } }
    }
    if (!isTransfer && !body.categoryId) {
      return { status: 400, body: { message: 'Category is required' } }
    }

    const insertedTransactions = await db.insert(transactions)
      .values({ ...body, userId })
      .returning()
    return { status: 201, body: insertedTransactions[0] }
  },
})
```

---

## Layer 4 — Authentication (better-auth)

better-auth runs as part of the Hono server. It handles sign up, sign in, password reset, and session management. It exposes its own routes at `/auth/*` which the Next.js client SDK calls directly.

```ts
// apps/server/src/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  trustedOrigins: ['http://localhost:3000'],
})
```

The session cookie is set by better-auth on the Hono server and sent to the browser. Every subsequent API request from Next.js includes that cookie, which the session middleware verifies before any route handler runs.

---

## Layer 5 — Storage (SQLite + Drizzle ORM)

SQLite is a single file on disk. Zero infrastructure — no database server, no Docker, no connection string. Drizzle ORM sits on top and gives you a TypeScript-first query builder that closely mirrors SQL.

```ts
// apps/server/src/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('./financeos.db')
export const db = drizzle(sqlite, { schema })
```

---

## Request lifecycle

1. User submits the transaction form on the Next.js dashboard
2. The ts-rest client sends `POST http://localhost:4000/api/transactions` with the session cookie
3. The Hono CORS middleware allows the request from `localhost:3000`
4. The Hono logger middleware logs the request
5. The session middleware reads the cookie, calls better-auth, gets `userId` back
6. The ts-rest Hono adapter validates the request body against the Zod schema in the contract
7. The route handler inserts the transaction into SQLite via Drizzle
8. Hono returns `201 Created` with the new transaction row
9. The ts-rest client on the Next.js side receives a typed response
10. The UI updates the transaction list

---

## Common commands

```bash
# Install all dependencies across all apps and packages
pnpm install

# Run everything in development (Next.js + Hono + watches contract)
pnpm dev

# Run only one app
pnpm dev --filter @financeos/web
pnpm dev --filter @financeos/server

# Build everything in the correct order
pnpm build

# Add a dependency to a specific app or package
pnpm add hono --filter @financeos/server
pnpm add next --filter @financeos/web
pnpm add zod --filter @financeos/contract

# Generate and run database migrations
pnpm --filter @financeos/server drizzle-kit generate
pnpm --filter @financeos/server drizzle-kit migrate
```

---

## Technology decisions summary

| Concern | Choice | Why |
|---|---|---|
| Monorepo | Turborepo + pnpm | Task orchestration, workspace linking, fast |
| Frontend framework | Next.js App Router | Industry standard, TypeScript-first |
| UI components | shadcn/ui + Tailwind | Accessible, you own the code |
| Backend framework | Hono | Lightweight, explicit, great for learning |
| Shared contract | ts-rest + Zod | Type-safe REST, readable, Hono adapter exists |
| Authentication | better-auth (email + password) | Modern, Drizzle adapter, sessions built in |
| ORM | Drizzle | SQL-first, thin, great TypeScript inference |
| Database | SQLite | Zero infra, single file, perfect for solo use |
