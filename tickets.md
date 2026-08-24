# Tickets: Personal transaction ledger

Build a simple authenticated ledger that can create and read transactions across multiple accounts and categories. The product requirements are inferred from `apps/web/01-architecture.md`, `apps/web/02-database.md`, and `apps/web/03-sequence.md`, narrowed to the user-approved one-day scope.

Work the **frontier**: start any `ready-to-build` ticket whose blockers are complete. Phase 1 is today's basic ledger; Phase 2 completes update and delete behavior later.

## Phase 1 — Basic ledger

## Finish the authenticated ledger shell

**Status:** `ready-to-build`

**What to build:** Give the user one honest, reliable authentication path into their private ledger. Google sign-in should establish the session, protected pages and APIs should reject unauthenticated access, and signing out from the dashboard should end the session. Do not present simulated email/password submission as a working feature.

**Blocked by:** None — can start immediately.

- [ ] Google sign-in redirects the authenticated user into the ledger.
- [ ] An unauthenticated browser is redirected to sign-in when opening the ledger.
- [ ] Protected finance endpoints return an unauthorized response without a valid session.
- [ ] The dashboard logout action ends the session and returns the user to sign-in.
- [ ] The sign-in screen exposes no email/password action that only simulates success.
- [ ] Authentication behavior is covered by proportionate automated or repeatable integration checks.

## Create and list categories

**Status:** `ready-to-build`

**What to build:** Let an authenticated user create and view their own flat categories. Categories are neutral labels reusable by income and expense transactions.

**Blocked by:** Finish the authenticated ledger shell.

- [ ] The user can create a category with a non-empty name; a category has no income or expense type.
- [ ] A newly created category persists and appears after reloading the application.
- [ ] The list contains only categories owned by the authenticated user.
- [ ] Duplicate or otherwise invalid input produces a useful validation response.
- [ ] Parent/child category management is not exposed in this phase.
- [ ] The real category creation and listing path is covered by automated tests.

## Create and list financial accounts

**Status:** `ready-to-build`

**What to build:** Let an authenticated user create and view checking, savings, wallet, and cash accounts. Each account starts with a THB opening balance and exposes a current balance that later ledger entries can affect.

**Blocked by:** Finish the authenticated ledger shell.

- [ ] The user can create an account with a name, supported account type, and numeric opening balance.
- [ ] THB is the only exposed currency for this phase.
- [ ] A newly created account persists and appears after reloading the application.
- [ ] The account list contains only accounts owned by the authenticated user.
- [ ] Before transactions exist, current balance equals opening balance.
- [ ] Account creation and listing work through the shared contract, protected server behavior, persistent storage, and real UI.
- [ ] The real account creation and listing path is covered by automated tests.

## Record and list income and expenses

**Status:** `ready-to-build`

**What to build:** Let the user record completed income and expense entries against their real accounts and categories, then view the persisted entries in the ledger with correct account balances.

**Blocked by:** Create and list categories; Create and list financial accounts.

- [ ] The transaction form uses the authenticated user's real account and category lists.
- [ ] The user enters a positive amount; income adds that amount and expense subtracts it when calculating balances.
- [ ] Income has no source account and requires a destination account and category.
- [ ] Expense requires a source account and category and has no destination account.
- [ ] Transaction kind is derived from the account endpoints and is not stored independently.
- [ ] The server rejects accounts or categories that do not belong to the authenticated user.
- [ ] A valid entry persists and appears in the ledger after reloading.
- [ ] Current account balance is derived from opening balance plus income minus expenses, without mutating a second balance source that can drift.
- [ ] The transaction list contains only the authenticated user's entries in a deterministic recent-first order.
- [ ] Income and expense creation, validation, ownership, listing, and balance effects are covered by automated tests.

## Record account transfers

**Status:** `ready-to-build`

**What to build:** Let the user record money moving between two of their own accounts as one transfer entry. A transfer changes both account balances but never changes income or expense totals.

**Blocked by:** Create and list financial accounts; Record and list income and expenses.

- [ ] The user can choose different source and destination accounts and enter a positive transfer amount.
- [ ] The server rejects a transfer whose source and destination are the same.
- [ ] Both accounts must belong to the authenticated user.
- [ ] A transfer has different source and destination accounts and no category.
- [ ] The source balance decreases and destination balance increases by the same amount.
- [ ] Transfers are excluded from income and expense totals.
- [ ] A valid transfer persists as one ledger entry and appears after reloading.
- [ ] Transfer validation, ownership, listing, and balance effects are covered by automated tests.

## Show the real ledger dashboard

**Status:** `ready-to-build`

**What to build:** Replace the dashboard's sample financial data with the authenticated user's real ledger, giving them a trustworthy summary of their accounts and completed entries.

**Blocked by:** Record and list income and expenses; Record account transfers.

- [ ] Total balance equals the sum of all derived account balances.
- [ ] Income and expense totals use real entries and exclude transfers.
- [ ] The account summary displays each real account and its current balance.
- [ ] Recent transactions display real income, expenses, and transfers in recent-first order.
- [ ] Empty, loading, and failure states are understandable and do not show fabricated financial data.
- [ ] Controls for unsupported filters, exports, or actions are removed, hidden, or clearly disabled.
- [ ] An integration check demonstrates account creation, category creation, income, expense, transfer, and the resulting dashboard totals.

## Phase 2 — Complete CRUD

## Edit and delete transactions safely

**Status:** `ready-to-build`

**What to build:** Let the user view, modify, convert, and delete their own ledger entries without corrupting account balances or financial totals.

**Blocked by:** Record and list income and expenses; Record account transfers.

- [ ] The user can open one transaction and see its persisted details.
- [ ] The user can edit the amount, date, description, source account, destination account, and category where valid.
- [ ] Converting between income, expense, and transfer changes the account endpoints and enforces the category rules of the resulting transaction kind.
- [ ] The user can delete a transaction only after an explicit confirmation.
- [ ] Balances and dashboard totals are correct after every edit, conversion, or deletion.
- [ ] A user cannot view, edit, or delete another user's transaction.
- [ ] Edit, conversion, deletion, ownership, and recalculation behavior are covered by automated tests.

## Edit and delete accounts and categories safely

**Status:** `ready-to-build`

**What to build:** Let the user maintain account and category details after the basic ledger is working, while protecting the referential integrity of existing transaction history.

**Blocked by:** Show the real ledger dashboard; Edit and delete transactions safely.

- [ ] The user can rename and update supported details of an owned account.
- [ ] The user can rename an owned category.
- [ ] An unreferenced owned account or category can be deleted after confirmation.
- [ ] Deletion is rejected when the account or category is referenced by transaction history.
- [ ] A user cannot view, edit, or delete another user's account or category.
- [ ] Account/category updates, deletion guards, and ownership behavior are covered by automated tests.
