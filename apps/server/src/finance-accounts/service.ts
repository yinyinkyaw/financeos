import { db } from '@/db';
import { financeAccounts } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import type { FinanceAccountRequestSchema } from '@financeos/contract/src/finance-account';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export async function getFinanceAccounts({ user }: { user: AuthUser }) {
  return db.query.financeAccounts.findMany({
    where: eq(financeAccounts.userId, user.id),
    columns: {
      id: true,
      name: true,
      balance: true,
      createdAt: true,
    },
  });
}

export async function createFinanceAccount({ user, body }: { user: AuthUser; body: FinanceAccountRequestSchema }) {
  return db
    .insert(financeAccounts)
    .values({ id: randomUUID(), userId: user.id, ...body })
    .returning({
      id: financeAccounts.id,
      name: financeAccounts.name,
      balance: financeAccounts.balance,
    })
    .get();
}
