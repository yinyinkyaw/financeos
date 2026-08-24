# FinanceOS

FinanceOS is an authenticated personal-finance ledger. It records income, expenses, and transfers across a user’s financial accounts, then derives account balances and expense views from the ledger.

The ledger is the source of truth for financial activity. Money is stored as integer Thai satang values, and the web application displays amounts with the `฿` symbol.

## Features

- Google-authenticated access to a private ledger
- User-owned financial accounts with THB opening balances and derived current balances
- Flat, reusable categories with validated Lucide icon names
- Income, expense, and account-transfer transactions
- Account-filtered dashboard and recent transaction history
- Annual category expense reporting at `/category-expenses`

### Annual category expenses

The **Category Expense** page is a read-only view covering January through December of the resolved calendar year. It shows every category owned by the authenticated user, including categories with no expenses, with a monthly amount and a UI-derived annual total.

Only expenses contribute to the report. Income and transfers are excluded. The page keeps the category column visible while the month columns can scroll horizontally on narrow screens. It does not expose a year filter.

The authenticated API endpoint is:

```http
GET /api/category-expense-summaries?year=2026
```

The `year` query parameter is optional. When omitted, the server resolves the current calendar year in `Asia/Bangkok`. The response contains the resolved year and twelve ordered monthly buckets (`YYYY-01` through `YYYY-12`) for each category. Amounts are non-negative integer satang values; annual totals and currency are derived or presented by the client.

## Repository layout

```text
apps/
  server/   Express API, Better Auth, Drizzle ORM, and SQLite
  web/      Next.js application
packages/
  contract/ Shared ts-rest and Zod API contracts
  eslint-config/
  typescript-config/
docs/       Product flows and architecture decisions
```

The shared domain vocabulary is documented in [`CONTEXT.md`](./CONTEXT.md). The integer-satang storage decision is recorded in [`docs/adr/0001-store-thb-as-integer-satang.md`](./docs/adr/0001-store-thb-as-integer-satang.md).

## Prerequisites

- Node.js 20 or newer
- pnpm 9

Install dependencies from the repository root:

```sh
pnpm install
```

## Local environment

Create `apps/server/.env` with the server settings required by Better Auth and SQLite:

```env
BETTER_AUTH_SECRET=replace-with-a-local-secret
BETTER_AUTH_URL=http://localhost:3001
DB_FILE_NAME=file:./financeos.sqlite3
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Configure the Google OAuth client to use the local Better Auth callback URL required by the authentication setup before testing Google sign-in.

## Development

Run the web application and API together:

```sh
pnpm dev
```

The default local URLs are:

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)
- Health check: `GET http://localhost:3001/health-check`

Useful workspace commands:

```sh
pnpm build
pnpm lint
pnpm check-types
pnpm test
```

Server-specific commands:

```sh
pnpm --filter @financeos/server db:migrate
pnpm --filter @financeos/server db:seed
pnpm --filter @financeos/server test
```

## API conventions

First-party API responses use a common envelope with `status`, `body`, and `message` fields. Authenticated ledger endpoints include session, category, financial-account, transaction, and category-expense-summary routes under `/api`.

Transaction kind is derived from account endpoints rather than stored independently:

| Kind     | Source account | Destination account    | Category |
| -------- | -------------- | ---------------------- | -------- |
| Expense  | Required       | Absent                 | Required |
| Income   | Absent         | Required               | Required |
| Transfer | Required       | Required and different | Absent   |

Transaction amounts are positive at the API boundary. Account direction determines whether an amount increases or decreases a derived balance. Creating a transaction invalidates cached annual category expense summaries so the report reflects the confirmed ledger.

## Verification

Run the full checks before submitting changes:

```sh
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

More detailed setup and implementation notes are available in [`apps/server/README.md`](./apps/server/README.md) and [`docs/product/user-flow.md`](./docs/product/user-flow.md).
