# Store THB amounts as integer satang

FinanceOS stores opening balances and transaction amounts as integer satang rather than SQLite `REAL` values. Current balances remain derived rather than persisted; this keeps ledger arithmetic exact and avoids floating-point rounding drift, at the cost of converting between satang and formatted THB at system boundaries.
