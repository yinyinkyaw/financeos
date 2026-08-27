import assert from 'node:assert/strict';
import { after, beforeEach, describe, it } from 'node:test';
import { createHmac } from 'node:crypto';

import type { AuthUser } from '@/lib/auth';

function getTestDatabaseUrl(): string {
  const testDatabaseUrl = process.env.TEST_DB_URL;

  if (!testDatabaseUrl) {
    throw new Error('TEST_DB_URL must point to an isolated MySQL test database.');
  }

  const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error('TEST_DB_URL database name must end with "_test".');
  }

  return testDatabaseUrl;
}

process.env.DB_URL = getTestDatabaseUrl();

const { db } = await import('@/db');
const { categories, financeAccounts, session: sessions, transactions, user } = await import('@/db/schema');
const { categoryContract } = await import('@financeos/contract');
const { seedStarterCategories } = await import('@/categories/starter-categories');
const { createCategory, getCategories } = await import('@/categories/service');
const { createFinanceAccount, getFinanceAccounts } = await import('@/finance-accounts/service');
const { createTransaction, listTransactions } = await import('./service');

const primaryUser: AuthUser = {
  id: 'user-primary',
  name: 'Primary User',
  email: 'primary@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2026-08-24T00:00:00.000Z'),
  updatedAt: new Date('2026-08-24T00:00:00.000Z'),
};

const otherUser: AuthUser = {
  ...primaryUser,
  id: 'user-other',
  name: 'Other User',
  email: 'other@example.com',
};

beforeEach(async () => {
  await db.delete(transactions);
  await db.delete(categories);
  await db.delete(financeAccounts);
  await db.delete(sessions);
  await db.delete(user);

  await db.insert(user).values([primaryUser, otherUser]);
  await db.insert(financeAccounts).values([
    { id: 'checking', userId: primaryUser.id, name: 'Checking', openingBalanceSatang: 10_000 },
    { id: 'cash', userId: primaryUser.id, name: 'Cash', openingBalanceSatang: 500 },
    { id: 'other-account', userId: otherUser.id, name: 'Checking', openingBalanceSatang: 999_999 },
  ]);
  await db.insert(categories).values([
    { id: 'food', userId: primaryUser.id, name: 'Food', iconName: 'utensils' },
    { id: 'other-category', userId: otherUser.id, name: 'Other', iconName: 'tag' },
  ]);
  await db.insert(transactions).values([
    {
      id: 'income',
      userId: primaryUser.id,
      destinationAccountId: 'checking',
      categoryId: 'food',
      amountSatang: 5_000,
      note: 'Income',
      transactionDate: '2026-08-23',
    },
    {
      id: 'expense',
      userId: primaryUser.id,
      sourceAccountId: 'checking',
      categoryId: 'food',
      amountSatang: 2_000,
      note: 'Expense',
      transactionDate: '2026-08-22',
    },
    {
      id: 'transfer',
      userId: primaryUser.id,
      sourceAccountId: 'checking',
      destinationAccountId: 'cash',
      categoryId: null,
      amountSatang: 1_000,
      note: 'Transfer',
      transactionDate: '2026-08-24',
    },
  ]);
});

after(async () => {
  await db.$client.end();
});

describe('ledger services', () => {
  it('derives current balances from opening balances and ledger entries', async () => {
    const balances = await getFinanceAccounts({ user: primaryUser });
    assert.deepEqual(
      balances.map(({ name, currentBalanceSatang }) => ({ name, currentBalanceSatang })),
      [
        { name: 'Cash', currentBalanceSatang: 1_500 },
        { name: 'Checking', currentBalanceSatang: 12_000 },
      ]
    );
  });

  it('filters before limiting and orders transaction date first', async () => {
    const result = await listTransactions({ user: primaryUser, query: { accountId: 'checking', limit: 2 } });
    assert.deepEqual(
      result?.map(({ id }) => id),
      ['transfer', 'income']
    );
  });

  it('does not reveal whether an unowned account exists', async () => {
    const result = await listTransactions({ user: primaryUser, query: { accountId: 'other-account' } });
    assert.equal(result, null);
  });

  it('rejects cross-owner references during creation', async () => {
    const result = await createTransaction({
      user: primaryUser,
      body: {
        amountSatang: 100,
        note: 'Invalid transfer',
        transactionDate: '2026-08-24',
        sourceAccountId: 'checking',
        destinationAccountId: 'other-account',
        categoryId: null,
      },
    });
    assert.deepEqual(result, { status: 404, message: 'A referenced financial account or category was not found.' });
  });

  it('enforces account-name uniqueness per user', async () => {
    const first = await createFinanceAccount({
      user: otherUser,
      body: { name: 'Cash', openingBalanceSatang: 0 },
    });
    const duplicate = await createFinanceAccount({
      user: otherUser,
      body: { name: 'Cash', openingBalanceSatang: 0 },
    });

    assert.deepEqual({ firstName: first?.name, duplicate }, { firstName: 'Cash', duplicate: null });
  });

  it('creates categories with a validated fallback icon and rejects duplicates', async () => {
    const created = await createCategory({
      user: primaryUser,
      body: categoryContract.create.body.parse({ name: 'Travel' }),
    });
    const duplicate = await createCategory({ user: primaryUser, body: { name: 'Travel', iconName: 'bus' } });

    assert.deepEqual(
      { created: created && { name: created.name, iconName: created.iconName }, duplicate },
      { created: { name: 'Travel', iconName: 'tag' }, duplicate: null }
    );
  });

  it('runs the account, category, income, expense, transfer, filter, and balance scenario', async () => {
    const savings = await createFinanceAccount({
      user: primaryUser,
      body: { name: 'Savings', openingBalanceSatang: 0 },
    });
    const wallet = await createFinanceAccount({
      user: primaryUser,
      body: { name: 'Wallet', openingBalanceSatang: 0 },
    });
    await seedStarterCategories(primaryUser.id);
    const [foodCategory] = (await getCategories({ user: primaryUser })).filter(({ name }) => name === 'Food');

    if (!savings || !wallet || !foodCategory) throw new Error('Integration fixture creation failed.');

    const createdEntries = await Promise.all([
      createTransaction({
        user: primaryUser,
        body: {
          amountSatang: 1_000,
          note: 'Payday',
          transactionDate: '2026-08-24',
          sourceAccountId: null,
          destinationAccountId: savings.id,
          categoryId: foodCategory.id,
        },
      }),
      createTransaction({
        user: primaryUser,
        body: {
          amountSatang: 200,
          note: 'Lunch',
          transactionDate: '2026-08-24',
          sourceAccountId: savings.id,
          destinationAccountId: null,
          categoryId: foodCategory.id,
        },
      }),
      createTransaction({
        user: primaryUser,
        body: {
          amountSatang: 300,
          note: 'Pocket money',
          transactionDate: '2026-08-24',
          sourceAccountId: savings.id,
          destinationAccountId: wallet.id,
          categoryId: null,
        },
      }),
    ]);
    const filteredEntries = await listTransactions({ user: primaryUser, query: { accountId: savings.id } });
    const balances = await getFinanceAccounts({ user: primaryUser });

    assert.deepEqual(
      {
        createdKinds: createdEntries.map((entry) => ('kind' in entry ? entry.kind : 'error')).sort(),
        filteredNotes: filteredEntries?.map(({ note }) => note).sort(),
        balances: balances
          .filter(({ id }) => id === savings.id || id === wallet.id)
          .map(({ name, currentBalanceSatang }) => ({ name, currentBalanceSatang })),
      },
      {
        createdKinds: ['expense', 'income', 'transfer'],
        filteredNotes: ['Lunch', 'Payday', 'Pocket money'],
        balances: [
          { name: 'Savings', currentBalanceSatang: 500 },
          { name: 'Wallet', currentBalanceSatang: 300 },
        ],
      }
    );
  });

  it('runs the authenticated HTTP contract through SQLite', async () => {
    const sessionToken = 'authenticated-http-session';
    const sessionDate = new Date('2026-08-24T00:00:00.000Z');
    await db.insert(sessions).values({
      id: 'http-session',
      token: sessionToken,
      userId: primaryUser.id,
      expiresAt: new Date('2026-08-25T00:00:00.000Z'),
      createdAt: sessionDate,
      updatedAt: sessionDate,
    });

    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('BETTER_AUTH_SECRET is required for the authenticated integration test.');
    const signature = createHmac('sha256', secret).update(sessionToken).digest('base64');
    const cookie = `better-auth.session_token=${encodeURIComponent(`${sessionToken}.${signature}`)}`;
    const { createApp } = await import('@/app');
    const server = createApp().listen(0);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Integration server did not bind to a TCP port.');
    const baseUrl = `http://127.0.0.1:${address.port}/api`;

    async function request(path: string, init?: RequestInit) {
      return fetch(`${baseUrl}${path}`, {
        ...init,
        headers: { cookie, 'content-type': 'application/json', ...init?.headers },
      });
    }

    try {
      const unauthorizedStatus = await fetch(`${baseUrl}/finance-accounts`).then(({ status }) => status);
      const savingsResponse = await request('/finance-accounts', {
        method: 'POST',
        body: JSON.stringify({ name: 'HTTP Savings', openingBalanceSatang: 0 }),
      });
      const walletResponse = await request('/finance-accounts', {
        method: 'POST',
        body: JSON.stringify({ name: 'HTTP Wallet', openingBalanceSatang: 0 }),
      });
      const categoryResponse = await request('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'HTTP Category' }),
      });
      const salaryCategoryResponse = await request('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Salary', iconName: 'circle-dollar-sign' }),
      });
      const savings = (await savingsResponse.json()).body;
      const wallet = (await walletResponse.json()).body;
      const category = (await categoryResponse.json()).body;

      const creationStatuses = await Promise.all([
        request('/transactions', {
          method: 'POST',
          body: JSON.stringify({
            amountSatang: 1_000,
            note: 'HTTP income',
            transactionDate: '2026-08-24',
            sourceAccountId: null,
            destinationAccountId: savings.id,
            categoryId: category.id,
          }),
        }).then(({ status }) => status),
        request('/transactions', {
          method: 'POST',
          body: JSON.stringify({
            amountSatang: 200,
            note: 'HTTP expense',
            transactionDate: '2026-08-24',
            sourceAccountId: savings.id,
            destinationAccountId: null,
            categoryId: category.id,
          }),
        }).then(({ status }) => status),
        request('/transactions', {
          method: 'POST',
          body: JSON.stringify({
            amountSatang: 300,
            note: 'HTTP transfer',
            transactionDate: '2026-08-24',
            sourceAccountId: savings.id,
            destinationAccountId: wallet.id,
            categoryId: null,
          }),
        }).then(({ status }) => status),
      ]);
      const accountList = (await (await request('/finance-accounts')).json()).body;
      const filteredList = (
        await (await request(`/transactions?limit=10&accountId=${encodeURIComponent(savings.id)}`)).json()
      ).body;
      const categoryExpenseSummaryResponse = await request('/category-expense-summaries?year=2026');
      const categoryExpenseSummaryBody = (await categoryExpenseSummaryResponse.json()).body;
      const defaultCategoryExpenseSummaryResponse = await request('/category-expense-summaries');
      const defaultCategoryExpenseSummaryBody = (await defaultCategoryExpenseSummaryResponse.json()).body;

      assert.deepEqual(
        {
          unauthorizedStatus,
          setupStatuses: [
            savingsResponse.status,
            walletResponse.status,
            categoryResponse.status,
            salaryCategoryResponse.status,
          ],
          creationStatuses,
          createdCategoryFields: Object.keys(category).sort(),
          balances: accountList
            .filter(({ id }: { id: string }) => id === savings.id || id === wallet.id)
            .map(({ name, currentBalanceSatang }: { name: string; currentBalanceSatang: number }) => ({
              name,
              currentBalanceSatang,
            })),
          filteredNotes: filteredList.map(({ note }: { note: string }) => note).sort(),
          categoryExpenseSummary:
            categoryExpenseSummaryResponse.status === 200
              ? {
                  year: categoryExpenseSummaryBody.year,
                  categories: categoryExpenseSummaryBody.categories.map(
                    ({ category: summaryCategory, months }: { category: { name: string }; months: unknown[] }) => ({
                      name: summaryCategory.name,
                      monthCount: months.length,
                      monthRange: [
                        (months as Array<{ month: string }>)[0]?.month,
                        (months as Array<{ month: string }>)[11]?.month,
                      ],
                      augustExpenseSatang: (months as Array<{ month: string; expenseSatang: number }>).find(
                        ({ month }) => month === '2026-08'
                      )?.expenseSatang,
                    })
                  ),
                }
              : { status: categoryExpenseSummaryResponse.status },
          defaultCategoryExpenseYear: defaultCategoryExpenseSummaryBody.year,
        },
        {
          unauthorizedStatus: 401,
          setupStatuses: [200, 200, 200, 200],
          creationStatuses: [201, 201, 201],
          createdCategoryFields: ['color', 'iconName', 'id', 'name'],
          balances: [
            { name: 'HTTP Savings', currentBalanceSatang: 500 },
            { name: 'HTTP Wallet', currentBalanceSatang: 300 },
          ],
          filteredNotes: ['HTTP expense', 'HTTP income', 'HTTP transfer'],
          categoryExpenseSummary: {
            year: 2026,
            categories: [
              {
                name: 'Food',
                monthCount: 12,
                monthRange: ['2026-01', '2026-12'],
                augustExpenseSatang: 2_000,
              },
              {
                name: 'HTTP Category',
                monthCount: 12,
                monthRange: ['2026-01', '2026-12'],
                augustExpenseSatang: 200,
              },
              {
                name: 'Salary',
                monthCount: 12,
                monthRange: ['2026-01', '2026-12'],
                augustExpenseSatang: 0,
              },
            ],
          },
          defaultCategoryExpenseYear: Number(
            new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date())
          ),
        }
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
