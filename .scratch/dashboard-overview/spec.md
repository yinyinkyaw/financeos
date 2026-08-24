# Account-filtered Overview

**Status:** Approved for implementation planning
**Approved:** 24 August 2026
**Source context:** [`docs/product/user-flow.md`](../../docs/product/user-flow.md) and [`CONTEXT.md`](../../CONTEXT.md)

## Objective

Replace the fabricated dashboard with a trustworthy, account-filtered view of the authenticated user's shared ledger. Overview is the whole-ledger home by default and can become a statement-like view for one selected financial account.

The implementation must not begin at the UI seam until the schema, contract, and server prerequisites in this spec are complete. The active Ticket 3 work and migration `0005` finish first; this feature adds a subsequent migration rather than rewriting work in progress.

## Product model

FinanceOS has one shared ledger. Financial accounts are places where money is held and lenses through which the user can inspect that ledger; they are not separate ledgers.

Authentication/session data remains separate from financial data:

- `GET /session` returns identity and session state.
- `GET /finance-accounts` returns the authenticated user's financial accounts and server-derived balances.
- No profile payload or dedicated `/overview` endpoint contains ledger aggregates.

## Overview routes and selection

- `/dashboard` selects **All accounts**.
- `/dashboard?accountId=<id>` selects one owned financial account.
- The financial-account selector contains **All accounts** first, followed by the user's named financial accounts.
- **All accounts** shows the sum of every returned `currentBalanceSatang` and recent activity across the ledger.
- A selected financial account shows only its current balance and transactions in which it is the source or destination.
- The selected name is prominent, and the balance label changes from **Total current balance** to **{Financial account name} balance**.

If the query parameter is malformed, stale, deleted, or does not identify an owned financial account, the UI removes it, returns to **All accounts**, and shows: “Financial account not available. Showing all accounts.” The API returns `404` for an invalid or unowned filter without revealing whether another user owns it.

## Page composition

Phase 1 Overview contains only:

1. The current balance for All accounts or the selected financial account.
2. One prominent **Add transaction** action.
3. The latest 10 relevant transactions.
4. A **View all** action that opens `/transactions` and preserves `accountId` when one is selected.

Income/expense summary metrics, period filters, comparisons, export controls, per-account summary cards, and fabricated data are not shown.

## Add transaction experience

**Add transaction** opens a centered dialog on desktop and a full-height sheet on mobile, preserving the user's Overview context.

The first control is a required **Transaction kind** dropdown with an unselected placeholder and the values Expense, Income, and Transfer. Conditional fields remain hidden until the user chooses a kind.

The form always contains:

- Positive amount in satang at the API boundary, formatted as THB in the UI.
- Transaction date, defaulted to today's calendar date in Bangkok.
- Required non-empty transaction note.

Kind-specific fields are:

- Expense: source account and category; no destination account.
- Income: destination account and category; no source account.
- Transfer: different source and destination accounts; no category.

Transfer is unavailable when the user owns fewer than two financial accounts.

### Financial-account preselection

- With All accounts and multiple financial accounts, no account is preselected.
- With only one financial account, it may be preselected for income or expense.
- From a selected account view, income preselects it as destination; expense and transfer preselect it as source.
- Preselection is editable and does not create a persisted default preference.

### Changing transaction kind

When the user changes kind:

- Preserve amount and transaction date.
- Clear the transaction note.
- Clear incompatible source/destination fields and reapply the Overview-selected financial account where appropriate.
- Preserve category when switching between income and expense, but clear it for a transfer.
- Change the submit label to the selected action, such as **Save expense**.

After a successful save, close the dialog, show success feedback, and invalidate/refetch the financial-account and recent-transaction queries. Do not show optimistic financial totals that have not been confirmed by the server.

## Recent transaction history

`GET /transactions` applies ownership and optional financial-account filtering before applying `limit=10`.

Rows are ordered by:

1. `transactionDate` descending.
2. `createdAt` descending.
3. `id` descending.

A backdated entry therefore appears in its historical position.

Each row displays:

- Category icon for income/expense; a generic transfer icon for transfers.
- Required transaction note as the primary label.
- Category name beneath income/expense notes.
- `Source account → Destination account` beneath transfer notes.
- Transaction date only; no time.
- Context-sensitive amount.

Amount presentation is:

- Income: positive.
- Expense: negative.
- Transfer in All accounts: neutral, because its total effect is zero.
- Transfer in its source-account view: negative.
- Transfer in its destination-account view: positive.

Phase 1 rows have no status or edit/delete action menu.

## Loading, empty, and failure states

- Never show `฿0` or an empty list while data is still unknown; use stable skeletons.
- A financial-account query failure is a page-level retry state because neither selection nor balance can be trusted.
- A transaction query failure leaves balance and Add transaction available and renders an inline retry in recent history.
- A valid empty history shows “No transactions yet” and an Add transaction action.
- No state displays sample financial data.

## API contracts

### `GET /finance-accounts`

The authenticated response contains:

```ts
type FinancialAccountSummary = {
  id: string;
  name: string;
  currency: 'THB';
  openingBalanceSatang: number;
  currentBalanceSatang: number;
};
```

`currentBalanceSatang` is derived by the server. The UI may sum returned current balances for All accounts but does not reconstruct an individual balance from transactions.

Financial-account names use a composite uniqueness rule on `(user_id, name)`. Creation rejects an exact duplicate for the same user with a useful conflict response; names belonging to different users do not conflict.

### `GET /transactions`

Supported Overview query parameters:

```ts
type ListTransactionsQuery = {
  limit?: number;     // Overview sends 10
  accountId?: string; // source or destination involvement
};
```

The response is display-ready while retaining canonical ledger semantics:

```ts
type TransactionListItem = {
  id: string;
  kind: 'income' | 'expense' | 'transfer'; // derived, never stored
  amountSatang: number;
  note: string;
  transactionDate: string; // YYYY-MM-DD
  createdAt: string;
  sourceAccount: { id: string; name: string } | null;
  destinationAccount: { id: string; name: string } | null;
  category: { id: string; name: string; iconName: string } | null;
};
```

The response does not expose `userId`. Account and category joins remain scoped to the authenticated owner.

### `GET /categories`

Category responses include validated `iconName`. The transaction dialog can load categories independently; a category failure must not invalidate already loaded Overview balance/history.

### `POST /transactions`

The request accepts positive `amountSatang`, required `note`, `transactionDate`, nullable canonical account endpoints, and a nullable category. It does not accept or store transaction kind or status. The server derives kind from the submitted endpoints and rejects invalid combinations or cross-owner references.

The create response uses the same display-ready transaction shape as the list endpoint.

## Database prerequisite

SQLite ledger money follows [ADR 0001](../../docs/adr/0001-store-thb-as-integer-satang.md).

### Financial accounts

Required fields:

- `id`
- `user_id`
- `name`
- `currency`, fixed to `THB`
- `opening_balance_satang`, integer and default `0`
- timestamps

Enforce a composite unique constraint on `(user_id, name)` and mirror it with server validation for a useful error response. There is no financial-account `type` and no persisted current balance. Opening and derived current balances may be negative.

### Categories

Add `icon_name` as non-null text with fallback `tag`:

- Existing categories are backfilled to `tag`.
- Starter categories receive curated Lucide icon names.
- Create-category requests may omit the field and receive `tag`.
- Supplied names are validated against a curated allowlist.
- The database stores the icon name, never a Lucide/CDN URL.
- The web app renders allowlisted names through explicitly imported `lucide-react` components and falls back to `tag`.
- Lucide's [dynamic React icon guidance](https://lucide.dev/guide/react/advanced/dynamic-icon-component) explicitly supports database-backed names; its [static CDN guidance](https://lucide.dev/guide/static/link-as-image) warns that names can change between versions, reinforcing the decision not to persist URLs.

### Transactions

Required fields:

- `id`
- `user_id`
- nullable `source_account_id` foreign key
- nullable `destination_account_id` foreign key
- nullable `category_id` foreign key
- positive integer `amount_satang`
- required non-empty `note`
- `transaction_date` as `YYYY-MM-DD`
- timestamps

There is no stored transaction kind, status, description, or current-balance mutation.

Valid endpoint/category combinations are:

| Derived kind | Source | Destination | Category |
|---|---|---|---|
| Expense | Required | Absent | Required |
| Income | Absent | Required | Required |
| Transfer | Required | Required and different | Absent |

Foreign keys and indexes cover user ownership, source account, destination account, category, and recent ordering. Database checks enforce positive amounts and valid null combinations where SQLite permits; the service additionally enforces ownership and cross-row rules.

## Balance derivation

For one financial account:

```text
opening balance
+ incoming income
+ incoming transfers
- outgoing expenses
- outgoing transfers
```

All persisted Phase 1 transactions are ledger entries immediately. There is no pending state. Transaction amounts are always positive; account endpoints supply direction.

## Implementation sequence

1. Complete Ticket 3 and migration `0005` without rewriting the active work.
2. Add the next migration for satang money, canonical transaction fields, foreign keys/constraints, and category icons.
3. Align shared contracts with the schema and response shapes above.
4. Implement protected server creation, listing, balance derivation, ownership, filtering, and deterministic ordering.
5. Implement the account-filtered Overview and responsive transaction entry dialog/sheet.
6. Remove fabricated dashboard controls and data.
7. Verify through contract/server tests and an authenticated UI-to-SQLite integration scenario.

## Acceptance criteria

- All accounts displays the exact sum of server-derived account balances.
- Financial-account creation rejects an exact `(user_id, name)` duplicate while allowing the same name for a different user.
- Selecting an owned financial account updates the URL, label, balance, recent history, transfer signs, and transaction-form preselection.
- Invalid or unowned selections recover to All accounts without leaking ownership.
- Recent history contains at most 10 persisted entries after server-side account filtering and deterministic date-first ordering.
- Add transaction creates valid income, expense, and transfer records through account endpoints without persisting kind or status.
- Transaction-kind changes preserve only amount and transaction date among shared form fields.
- Notes are required and become the primary recent-row label.
- Category icon names are persisted and validated; CDN URLs are not stored.
- Current balances include opening balance and all incoming/outgoing ledger effects without a mutable balance column.
- Loading, empty, partial-failure, and page-failure states never display fabricated or misleading amounts.
- View all preserves the optional financial-account filter.
- Desktop uses a dialog and mobile uses a full-height sheet.

## Out of scope

- Income/expense summary metrics and reporting periods.
- Date filters, comparisons, exports, and dashboard analytics.
- A dedicated Overview aggregation endpoint.
- Financial data in profile/session responses.
- Financial-account classification/type.
- Persisted default financial account.
- Pending, scheduled, or failed transaction states.
- Transaction times.
- Editing and deleting transactions.
- Category-icon CDN URLs or arbitrary unvalidated icon names.
- Embedding the exploratory design image in this spec.
