import { db } from '@/db';
import { financeAccounts, transactions } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import type { CreateFinancialAccountBody } from '@financeos/contract/src/finance-account';
import { and, asc, eq, or, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export async function getFinanceAccounts({ user }: { user: AuthUser }) {
  const currentBalanceSatang = sql<number>`
    ${financeAccounts.openingBalanceSatang}
    + coalesce(sum(case when ${transactions.destinationAccountId} = ${financeAccounts.id} then ${transactions.amountSatang} else 0 end), 0)
    - coalesce(sum(case when ${transactions.sourceAccountId} = ${financeAccounts.id} then ${transactions.amountSatang} else 0 end), 0)
  `.mapWith(Number);

  return db
    .select({
      id: financeAccounts.id,
      name: financeAccounts.name,
      currency: financeAccounts.currency,
      openingBalanceSatang: financeAccounts.openingBalanceSatang,
      currentBalanceSatang,
    })
    .from(financeAccounts)
    .leftJoin(
      transactions,
      and(
        eq(transactions.userId, user.id),
        or(
          eq(transactions.sourceAccountId, financeAccounts.id),
          eq(transactions.destinationAccountId, financeAccounts.id)
        )
      )
    )
    .where(eq(financeAccounts.userId, user.id))
    .groupBy(financeAccounts.id)
    .orderBy(asc(financeAccounts.name));
}

export async function createFinanceAccount({ user, body }: { user: AuthUser; body: CreateFinancialAccountBody }) {
  const [account] = await db
    .insert(financeAccounts)
    .values({ id: randomUUID(), userId: user.id, ...body })
    .onConflictDoNothing()
    .returning({
      id: financeAccounts.id,
      name: financeAccounts.name,
      currency: financeAccounts.currency,
      openingBalanceSatang: financeAccounts.openingBalanceSatang,
    })
    .all();

  if (!account) {
    return null;
  }

  return {
    ...account,
    currentBalanceSatang: account.openingBalanceSatang,
  };
}
