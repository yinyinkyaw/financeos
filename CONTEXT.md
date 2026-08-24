# FinanceOS Ledger

FinanceOS records a user's financial activity in one ledger shared by the web application, server, and API contract.

## Language

**Financial account**:
A place where the user keeps money tracked by FinanceOS, such as a checking account, savings account, wallet, or cash.
_Avoid_: Wallet when referring to every supported account

**Transaction**:
A ledger record describing money entering, leaving, or moving between financial accounts.

**Transaction note**:
Required user-entered text that identifies or adds context to a transaction.
_Avoid_: Description

**Transaction date**:
The calendar date on which the user records that a transaction occurred.
_Avoid_: Date when the meaning could be ambiguous

**Source account**:
The financial account money leaves. It is absent for income.
_Avoid_: From account in product copy

**Destination account**:
The financial account money enters. It is absent for an expense.
_Avoid_: To account in product copy

**Transaction kind**:
The classification of a transaction as income, expense, or transfer, determined solely by which account endpoints are present.
_Avoid_: Transaction type

**Income**:
A transaction with no source account and one destination account.

**Expense**:
A transaction with one source account and no destination account.

**Transfer**:
A transaction with different source and destination accounts.

**Category**:
A user-owned label describing the purpose of an income or expense. A category is not restricted to a transaction kind, and transfers do not have categories.

**Opening balance**:
The financial account's balance when the user begins tracking it in FinanceOS. It establishes an initial position and is not income.

**Current balance**:
The balance derived from an account's opening balance and its incoming and outgoing transactions.
