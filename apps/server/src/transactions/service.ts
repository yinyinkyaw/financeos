import { db } from '@/db';
import { categories, financeAccounts, transactions } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import { categoryIconNameSchema } from '@financeos/contract/src/category';
import type { CreateTransactionBody, ListTransactionsQuery, Transaction } from '@financeos/contract/src/transactions';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { randomUUID } from 'node:crypto';

import { parseTransactionEndpoints, TransactionRuleError } from './rules';

const sourceAccounts = alias(financeAccounts, 'source_accounts');
const destinationAccounts = alias(financeAccounts, 'destination_accounts');

const transactionListSelection = {
  id: transactions.id,
  amountSatang: transactions.amountSatang,
  note: transactions.note,
  transactionDate: transactions.transactionDate,
  createdAt: transactions.createdAt,
  sourceAccountId: sourceAccounts.id,
  sourceAccountName: sourceAccounts.name,
  destinationAccountId: destinationAccounts.id,
  destinationAccountName: destinationAccounts.name,
  categoryId: categories.id,
  categoryName: categories.name,
  categoryIconName: categories.iconName,
};

type TransactionListRow = Awaited<ReturnType<typeof selectTransactions>>[number];

export type TransactionServiceError = {
  status: 400 | 404;
  message: string;
};

function selectTransactions({
  userId,
  accountId,
  transactionId,
  limit = 100,
}: {
  userId: string;
  accountId?: string;
  transactionId?: string;
  limit?: number;
}) {
  const accountFilter = accountId
    ? or(eq(transactions.sourceAccountId, accountId), eq(transactions.destinationAccountId, accountId))
    : undefined;

  return db
    .select(transactionListSelection)
    .from(transactions)
    .leftJoin(
      sourceAccounts,
      and(eq(transactions.sourceAccountId, sourceAccounts.id), eq(sourceAccounts.userId, userId))
    )
    .leftJoin(
      destinationAccounts,
      and(eq(transactions.destinationAccountId, destinationAccounts.id), eq(destinationAccounts.userId, userId))
    )
    .leftJoin(categories, and(eq(transactions.categoryId, categories.id), eq(categories.userId, userId)))
    .where(
      and(
        eq(transactions.userId, userId),
        accountFilter,
        transactionId ? eq(transactions.id, transactionId) : undefined
      )
    )
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt), desc(transactions.id))
    .limit(limit);
}

function toTransactionListItem(row: TransactionListRow): Transaction {
  const { kind } = parseTransactionEndpoints({
    sourceAccountId: row.sourceAccountId,
    destinationAccountId: row.destinationAccountId,
    categoryId: row.categoryId,
  });

  return {
    id: row.id,
    kind,
    amountSatang: row.amountSatang,
    note: row.note,
    transactionDate: row.transactionDate,
    createdAt: row.createdAt.toISOString(),
    sourceAccount:
      row.sourceAccountId && row.sourceAccountName ? { id: row.sourceAccountId, name: row.sourceAccountName } : null,
    destinationAccount:
      row.destinationAccountId && row.destinationAccountName
        ? { id: row.destinationAccountId, name: row.destinationAccountName }
        : null,
    category:
      row.categoryId && row.categoryName
        ? {
            id: row.categoryId,
            name: row.categoryName,
            iconName: categoryIconNameSchema.catch('tag').parse(row.categoryIconName),
          }
        : null,
  };
}

async function ownsFinancialAccount(userId: string, accountId: string) {
  const [account] = await db
    .select({ id: financeAccounts.id })
    .from(financeAccounts)
    .where(and(eq(financeAccounts.userId, userId), eq(financeAccounts.id, accountId)))
    .limit(1);

  return Boolean(account);
}

async function referencesOnlyOwnedRecords(userId: string, body: CreateTransactionBody) {
  const accountIds = [...new Set([body.sourceAccountId, body.destinationAccountId].filter((id) => id !== null))];
  const ownedAccounts = await db
    .select({ id: financeAccounts.id })
    .from(financeAccounts)
    .where(and(eq(financeAccounts.userId, userId), inArray(financeAccounts.id, accountIds)));

  if (ownedAccounts.length !== accountIds.length) {
    return false;
  }

  if (!body.categoryId) {
    return true;
  }

  const [ownedCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, body.categoryId)))
    .limit(1);

  return Boolean(ownedCategory);
}

export async function listTransactions({
  user,
  query,
}: {
  user: AuthUser;
  query: ListTransactionsQuery;
}): Promise<Transaction[] | null> {
  if (query.accountId && !(await ownsFinancialAccount(user.id, query.accountId))) {
    return null;
  }

  const rows = await selectTransactions({ userId: user.id, accountId: query.accountId, limit: query.limit });
  return rows.map(toTransactionListItem);
}

export async function createTransaction({
  user,
  body,
}: {
  user: AuthUser;
  body: CreateTransactionBody;
}): Promise<Transaction | TransactionServiceError> {
  try {
    parseTransactionEndpoints(body);
  } catch (error) {
    if (error instanceof TransactionRuleError) {
      return { status: 400, message: error.message };
    }
    throw error;
  }

  if (!(await referencesOnlyOwnedRecords(user.id, body))) {
    return { status: 404, message: 'A referenced financial account or category was not found.' };
  }

  const transactionId = randomUUID();
  await db.insert(transactions).values({ id: transactionId, userId: user.id, ...body });
  const [createdTransaction] = await selectTransactions({ userId: user.id, transactionId });

  if (!createdTransaction) {
    throw new Error('Created transaction could not be loaded.');
  }

  return toTransactionListItem(createdTransaction);
}
