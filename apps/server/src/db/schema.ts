import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  datetime,
  index,
  mysqlTable,
  text,
  unique,
  varchar,
  date,
} from 'drizzle-orm/mysql-core';

export const user = mysqlTable('user', {
  id: varchar('id', { length: 128 }).primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  updatedAt: datetime('updated_at', {
    mode: 'date',
    fsp: 3,
  })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = mysqlTable(
  'session',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', {
      mode: 'date',
      fsp: 3,
    })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
);

export const authAccounts = mysqlTable(
  'auth_accounts',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: datetime('access_token_expires_at', {
      mode: 'date',
    }),
    refreshTokenExpiresAt: datetime('refresh_token_expires_at', {
      mode: 'date',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', {
      mode: 'date',
      fsp: 3,
    })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = mysqlTable(
  'verification',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', {
      mode: 'date',
      fsp: 3,
    })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  authAccounts: many(authAccounts),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const authAccountRelations = relations(authAccounts, ({ one }) => ({
  user: one(user, {
    fields: [authAccounts.userId],
    references: [user.id],
  }),
}));

export const categories = mysqlTable(
  'categories',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    iconName: text('icon_name').notNull().default('tag'),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', {
      mode: 'date',
      fsp: 3,
    })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('categories_userId_idx').on(table.userId)]
);

export const categoryRelations = relations(categories, ({ one }) => ({
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
}));

export const financeAccounts = mysqlTable(
  'finance_accounts',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    currency: text('currency', { enum: ['THB'] })
      .notNull()
      .default('THB'),
    openingBalanceSatang: bigint('opening_balance_satang', { mode: 'number' }).notNull().default(0),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', {
      mode: 'date',
      fsp: 3,
    })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('finance_accounts_name_idx').on(table.name),
    unique('finance_accounts_user_name_unique').on(table.userId, table.name),
    check('finance_accounts_currency_thb_check', sql`${table.currency} = 'THB'`),
  ]
);

export const financeAccountRelations = relations(financeAccounts, ({ one }) => ({
  user: one(user, {
    fields: [financeAccounts.userId],
    references: [user.id],
  }),
}));

export const transactions = mysqlTable(
  'transactions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sourceAccountId: varchar('source_account_id', { length: 128 }).references(() => financeAccounts.id, {
      onDelete: 'no action',
    }),
    destinationAccountId: varchar('destination_account_id', { length: 128 }).references(() => financeAccounts.id, {
      onDelete: 'no action',
    }),
    categoryId: varchar('category_id', { length: 128 }).references(() => categories.id, { onDelete: 'no action' }),
    amountSatang: bigint('amount_satang', { mode: 'number' }).notNull(),
    note: text('note').notNull(),
    transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', {
      mode: 'date',
      fsp: 3,
    })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_source_account_id_idx').on(table.sourceAccountId),
    index('transactions_destination_account_id_idx').on(table.destinationAccountId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_recent_idx').on(table.userId, table.transactionDate, table.createdAt, table.id),
    check('transactions_positive_amount_check', sql`${table.amountSatang} > 0`),
    check('transactions_nonempty_note_check', sql`length(trim(${table.note})) > 0`),
    check(
      'transactions_valid_endpoints_check',
      sql`(
        (${table.sourceAccountId} is not null and ${table.destinationAccountId} is null and ${table.categoryId} is not null)
        or (${table.sourceAccountId} is null and ${table.destinationAccountId} is not null and ${table.categoryId} is not null)
        or (
          ${table.sourceAccountId} is not null
          and ${table.destinationAccountId} is not null
          and ${table.sourceAccountId} <> ${table.destinationAccountId}
          and ${table.categoryId} is null
        )
      )`
    ),
  ]
);

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(user, {
    fields: [transactions.userId],
    references: [user.id],
  }),
  sourceAccount: one(financeAccounts, {
    fields: [transactions.sourceAccountId],
    references: [financeAccounts.id],
    relationName: 'transaction_source_account',
  }),
  destinationAccount: one(financeAccounts, {
    fields: [transactions.destinationAccountId],
    references: [financeAccounts.id],
    relationName: 'transaction_destination_account',
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
