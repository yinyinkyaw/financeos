# Annual category expense summary

Add a read-only annual category-expense view to the authenticated FinanceOS ledger.

## Domain and persistence

- Categories are flat. Remove the parent/child relationship from the category contract, server behavior, and database schema while preserving every category row.
- Keep the existing optional category color field elsewhere, but omit color from the annual category-expense response and UI.
- Category Expense includes only expenses. Income and transfers never contribute amounts.

## API contract

- Add authenticated `GET /category-expense-summaries`.
- Accept an optional integer `year` query parameter. When omitted, use the current calendar year in `Asia/Bangkok`.
- Return the resolved `year` and all categories owned by the authenticated user, ordered by category name ascending.
- Include categories with no expenses as zero-valued rows.
- Each category response contains only `id`, `name`, and `iconName` plus exactly twelve ordered month buckets from `YYYY-01` through `YYYY-12`.
- Each month bucket contains a non-negative integer `expenseSatang`.
- Do not return an annual total or currency field; the UI derives the total from monthly integer-satang values.

## Web application

- Add a flat **Category Expense** sidebar item immediately below **Accounts**, linking to `/category-expenses`.
- Title the page **This year's category expenses** and explain that it covers January through December of the resolved year. Do not expose a year filter.
- Show a read-only table with category icon and name, a `{year} total` column, and January through December columns.
- Derive each annual total in the UI by summing the twelve monthly values.
- Keep the category column sticky and allow horizontal table scrolling on narrow screens.
- Show understandable loading, failure, and no-category states.
- Use the `฿` symbol in every user-facing amount display across the web application, including balances, transaction history, recent activity, and amount-entry labels.
- Invalidate cached category-expense summaries after a transaction is created.
