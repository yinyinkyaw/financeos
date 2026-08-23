## Agent skills

### Issue tracker

Work is tracked in local Markdown. The project completion backlog lives in `tickets.md`; focused future efforts may use `.scratch/<feature>/`. There is no external PR request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Implementation is human-owned. Ready work uses `ready-to-build`; `needs-agent-help` is reserved for explicit requests. See `docs/agents/triage-labels.md`.

### Domain docs

FinanceOS uses a single shared context across the web, server, and contract packages. See `docs/agents/domain.md`.

### Product direction

The ledger is the core of FinanceOS and remains the source of truth for financial transactions. Personal-finance capabilities build on top of it, including budget tracking and planning for future expenses and obligations such as mortgage payments.
