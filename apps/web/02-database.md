# Database Documentation

> **Historical reference:** This document predates the approved core-ledger flow. Where it conflicts with [`docs/product/user-flow.md`](../../docs/product/user-flow.md) or [the focused Overview spec](../../.scratch/dashboard-overview/spec.md), those newer documents are authoritative.

**Project:** FinanceOS
**Database:** SQLite
**ORM:** Drizzle ORM
**Location:** `apps/server/financeos.db`

---

## Overview

FinanceOS uses a single SQLite file as its database. All tables live in one file — both the tables managed by better-auth (authentication) and the tables you own (finance data). SQLite requires zero infrastructure: no database server, no Docker container, no environment variables beyond a file path. It is the right choice for a solo personal app.

SQLite uses loose typing. Where Postgres would use `uuid`, `timestamp`, or `numeric`, SQLite stores everything as `text` or `real`. Drizzle ORM enforces the correct TypeScript types on top so your application code remains fully type-safe regardless.

---

## Table ownership

**Managed by better-auth** — do not write or edit these schemas yourself. better-auth creates and migrates them automatically via the Drizzle adapter.

| Table | Purpose |
|---|---|
| `user` | The single user account |
| `session` | Active login sessions |
| `account` | Credential storage (hashed password) |

**Owned by you** — you define, migrate, and query these with Drizzle.

| Table | Purpose |
|---|---|
| `bank_account` | Named places where the user keeps money |
| `category` | Hierarchical transaction categories (parent + child) |
| `transaction` | Income, expense, and transfer transactions |
| `budget` | Monthly or weekly spending limits per category |
| `goal` | Savings goals with a target amount and deadline |

---

## Drizzle client setup

```ts
// apps/server/src/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('./financeos.db')
export const db = drizzle(sqlite, { schema })
```

```ts
// apps/server/drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: { url: './financeos.db' },
})
```

---

## Schema reference

### `user` (better-auth managed)

```ts
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
})
```

---

### `session` (better-auth managed)

```ts
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: text('expiresAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
})
```

Sessions are deleted when the user signs out. When the `user` row is deleted, all sessions cascade-delete automatically.

---

### `account` (better-auth managed)

```ts
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  providerId: text('providerId').notNull(),
  accountId: text('accountId').notNull(),
  password: text('password'),
})
```

Since this project uses email and password, `providerId` is always `"credential"`. The bcrypt-hashed password is stored in the `password` field. You never handle the raw password yourself — better-auth does this.

---

### `bank_account`

```ts
export const bankAccount = sqliteTable('bank_account', {
  id: text('id').primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  balance: real('balance').notNull().default(0),
  currency: text('currency').notNull().default('THB'),
  createdAt: text('createdAt').notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type BankAccount = typeof bankAccount.$inferSelect
export type NewBankAccount = typeof bankAccount.$inferInsert
```

Based on your hledger file, you have three named accounts to seed: `assets:bank`, `assets:wallet`, and `assets:cash`. Their names identify where money is held; FinanceOS does not persist a separate account classification.

---

### `category`

```ts
export const category = sqliteTable('category', {
  id: text('id').primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  parentId: text('parentId'),   // null = top-level category, set = child category
  name: text('name').notNull(),
  color: text('color'),
  createdAt: text('createdAt').notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type Category = typeof category.$inferSelect
export type NewCategory = typeof category.$inferInsert
```

`parentId` is a self-reference that enables one level of hierarchy — matching the colon-separated hierarchy in your hledger file (`expenses:shopping:clothes` becomes a `Shopping` parent with a `Clothes` child). Top-level categories have `parentId = null`. Child categories point to their parent's `id`.

Categories are neutral labels and can be reused for either income or expense. Transaction kind is determined by account endpoints, so storing a second classification on the category would create an unnecessary consistency rule.

Your hledger categories seed as:

| `name` | `parentId` |
|---|---|
| Food | null |
| Meal | food-id |
| Shopping | null |
| Clothes | shopping-id |
| Meat | shopping-id |
| Veges | shopping-id |
| Utilities | shopping-id |
| Bodycare | null |
| Softener | bodycare-id |
| Healthcare | null |
| Laundry | healthcare-id |
| Bills | null |
| Home | bills-id |
| Rent & Utilities | null |
| Income | null |

---

### `transaction`

```ts
export const transaction = sqliteTable('transaction', {
  id: text('id').primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  fromAccountId: text('fromAccountId')
    .references(() => bankAccount.id),
  toAccountId: text('toAccountId')
    .references(() => bankAccount.id),
  categoryId: text('categoryId')
    .references(() => category.id),      // null for transfers
  amount: real('amount').notNull(),
  note: text('note').notNull(),
  date: text('date').notNull(),
  status: text('status', {
    enum: ['completed', 'pending']
  }).notNull().default('completed'),
  createdAt: text('createdAt').notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type Transaction = typeof transaction.$inferSelect
export type NewTransaction = typeof transaction.$inferInsert
```

Transaction kind is derived from the nullable account endpoints:

**Expense** — money leaves an account to pay for something. `fromAccountId` and `categoryId` are set, and `toAccountId` is null.

**Income** — money arrives into an account. `fromAccountId` is null, and `toAccountId` and `categoryId` are set.

**Transfer** — money moves between your own accounts with no external party. Different `fromAccountId` and `toAccountId` values are set, and `categoryId` is null.

Amounts are always stored as positive values. Direction comes exclusively from the account endpoints.

---

### `budget`

```ts
export const budget = sqliteTable('budget', {
  id: text('id').primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  categoryId: text('categoryId').notNull()
    .references(() => category.id),
  limitAmount: real('limitAmount').notNull(),
  period: text('period', {
    enum: ['weekly', 'monthly', 'yearly']
  }).notNull().default('monthly'),
  startDate: text('startDate').notNull(),
  createdAt: text('createdAt').notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type Budget = typeof budget.$inferSelect
export type NewBudget = typeof budget.$inferInsert
```

A budget is a spending cap for one category in a given period. To calculate remaining budget, sum all transactions in that category since `startDate` and subtract from `limitAmount`.

---

### `goal`

```ts
export const goal = sqliteTable('goal', {
  id: text('id').primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAmount: real('targetAmount').notNull(),
  currentAmount: real('currentAmount').notNull().default(0),
  deadline: text('deadline'),
  status: text('status', {
    enum: ['active', 'completed', 'paused']
  }).notNull().default('active'),
  createdAt: text('createdAt').notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type Goal = typeof goal.$inferSelect
export type NewGoal = typeof goal.$inferInsert
```

Goals track progress toward a savings target. `currentAmount` is updated by a dedicated "add to goal" action — it is not automatically derived from transactions.

---

## Relationships

```
user ──< session                  one user → many sessions
user ──< account                  one user → one credential account
user ──< bank_account             one user → many accounts (bank, wallet, cash)
user ──< category                 one user → many categories
user ──< budget                   one user → many budgets
user ──< goal                     one user → many goals

category ──< category             one parent category → many child categories (via parentId)

bank_account ──< transaction      one account → many outgoing transactions (via fromAccountId)
bank_account ──< transaction      one account → many incoming transactions (via toAccountId)
category     ──< transaction      one category → many income/expense transactions
category     ──< budget           one category → many budgets over time
```

All foreign keys referencing `user.id` include `ON DELETE CASCADE`. If the user account is deleted, all their data is deleted automatically.

`fromAccountId`, `toAccountId`, and `categoryId` on `transaction` are nullable so one record shape can represent every transaction kind. The valid combinations are:

| `fromAccountId` | `toAccountId` | `categoryId` | Derived kind |
|---|---|---|---|
| set | null | set | Expense |
| null | set | set | Income |
| set | different account | null | Transfer |

Both accounts absent, matching source and destination accounts, a missing category on income or expense, and a category on a transfer are invalid.

---

## Migrations

Drizzle Kit manages migrations. The workflow is:

```bash
# After editing schema.ts, generate a new migration SQL file
pnpm --filter @financeos/server drizzle-kit generate

# Apply all pending migrations to the SQLite file
pnpm --filter @financeos/server drizzle-kit migrate

# Open Drizzle Studio to inspect the database in a browser UI
pnpm --filter @financeos/server drizzle-kit studio
```

Migration files live in `apps/server/src/db/migrations/` and are committed to version control. Each file is prefixed with a timestamp so they always run in the correct order.

---

## Common queries

**Total balance across all accounts:**
```ts
const result = await db
  .select({ total: sum(bankAccount.balance) })
  .from(bankAccount)
  .where(eq(bankAccount.userId, userId))
```

**This month's income and expenses (excluding transfers):**
```ts
const txns = await db
  .select()
  .from(transaction)
  .where(
    and(
      eq(transaction.userId, userId),
      gte(transaction.date, '2026-02-01'),
      lte(transaction.date, '2026-02-28')
    )
  )

const income = txns
  .filter((transaction) => transaction.fromAccountId === null && transaction.toAccountId !== null)
  .reduce((sum, transaction) => sum + transaction.amount, 0)

const expenses = txns
  .filter((transaction) => transaction.fromAccountId !== null && transaction.toAccountId === null)
  .reduce((sum, transaction) => sum + transaction.amount, 0)
```

**Recent transactions with category and subcategory name:**
```ts
const parent = aliasedTable(category, 'parent')
const child  = aliasedTable(category, 'child')

const txns = await db
  .select({
    id:             transaction.id,
    note:           transaction.note,
    amount:         transaction.amount,
    fromAccountId:  transaction.fromAccountId,
    toAccountId:    transaction.toAccountId,
    date:           transaction.date,
    status:         transaction.status,
    categoryName:   child.name,
    parentName:     parent.name,
  })
  .from(transaction)
  .leftJoin(child,   eq(transaction.categoryId, child.id))
  .leftJoin(parent,  eq(child.parentId, parent.id))
  .where(eq(transaction.userId, userId))
  .orderBy(desc(transaction.date))
  .limit(10)
```

**All transfers between accounts:**
```ts
const transfers = await db
  .select({
    id:          transaction.id,
    note:        transaction.note,
    amount:      transaction.amount,
    date:        transaction.date,
    fromAccount: bankAccount.name,
    toAccount:   toAccount.name,
  })
  .from(transaction)
  .leftJoin(bankAccount, eq(transaction.fromAccountId, bankAccount.id))
  .leftJoin(toAccount,   eq(transaction.toAccountId, toAccount.id))
  .where(
    and(
      eq(transaction.userId, userId),
      isNotNull(transaction.fromAccountId),
      isNotNull(transaction.toAccountId)
    )
  )
```

**Budget usage for the current month:**
```ts
const budgets = await db
  .select()
  .from(budget)
  .where(eq(budget.userId, userId))

for (const budget of budgets) {
  const [spent] = await db
    .select({ total: sum(transaction.amount) })
    .from(transaction)
    .where(
      and(
        eq(transaction.categoryId, budget.categoryId),
        isNotNull(transaction.fromAccountId),
        isNull(transaction.toAccountId),
        gte(transaction.date, budget.startDate)
      )
    )
}
```

---

## Design decisions

**Why SQLite over Postgres?** SQLite is a single file with zero infrastructure. For a solo personal app on a single machine there is no benefit to running a Postgres server. Switching from SQLite to Postgres with Drizzle later is a one-line config change.

**Why store dates as text?** SQLite has no native date type. ISO 8601 strings (`2026-02-06`) sort correctly lexicographically, so `ORDER BY date` and range queries with `>=` and `<=` work without any special handling.

**Why derive transaction kind from account endpoints?** Source and destination accounts already express money direction without relying on amount signs. Deriving income, expense, or transfer from those endpoints avoids a stored `type` value that could contradict the accounts. It also keeps every amount positive and makes balance effects explicit.

**Why `parentId` on category instead of a separate table?** One level of hierarchy is all you need to match hledger's structure (e.g. `expenses:shopping:clothes` = Shopping → Clothes). A self-referencing `parentId` handles this with no extra joins beyond what you already write. A separate junction table would be over-engineering for this case.

**Why `$inferSelect` and `$inferInsert` types?** Drizzle infers TypeScript types directly from your schema. `$inferSelect` is the shape of a row you read from the database. `$inferInsert` is the shape for inserting — fields like `id` and `createdAt` are optional because they have defaults. Export these from `schema.ts` and import them everywhere — they are your single source of truth for data shapes across the whole app.
