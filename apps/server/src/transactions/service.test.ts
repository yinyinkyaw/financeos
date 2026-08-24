import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { AuthUser } from '@/lib/auth';

const testDirectory = await mkdtemp(join(tmpdir(), 'financeos-ledger-test-'));
process.env.DB_FILE_NAME = `file:${join(testDirectory, 'ledger.sqlite3')}`;

const { db } = await import('@/db');
const { categories, financeAccounts, transactions, user } = await import('@/db/schema');
const { seedStarterCategories } = await import('@/categories/starter-categories');
const { getCategories } = await import('@/categories/service');
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

before(async () => {
  const schemaStatements = [
    `PRAGMA foreign_keys = ON`,
    `CREATE TABLE user (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      email_verified integer NOT NULL,
      image text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`,
    `CREATE TABLE categories (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL REFERENCES user(id),
      name text NOT NULL,
      color text,
      icon_name text DEFAULT 'tag' NOT NULL,
      parent_id text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`,
    `CREATE TABLE finance_accounts (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      currency text DEFAULT 'THB' NOT NULL,
      opening_balance_satang integer DEFAULT 0 NOT NULL,
      user_id text NOT NULL REFERENCES user(id),
      created_at integer NOT NULL,
      updated_at integer NOT NULL,
      UNIQUE(user_id, name)
    )`,
    `CREATE TABLE transactions (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL REFERENCES user(id),
      source_account_id text REFERENCES finance_accounts(id),
      destination_account_id text REFERENCES finance_accounts(id),
      category_id text REFERENCES categories(id),
      amount_satang integer NOT NULL,
      note text NOT NULL,
      transaction_date text NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`,
  ];

  for (const statement of schemaStatements) {
    await db.run(statement);
  }
});

beforeEach(async () => {
  await db.delete(transactions);
  await db.delete(categories);
  await db.delete(financeAccounts);
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
  await rm(testDirectory, { recursive: true, force: true });
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
});
