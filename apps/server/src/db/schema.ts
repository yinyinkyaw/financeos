import { relations, sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, unique, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
);

export const authAccounts = sqliteTable(
  'auth_accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
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

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    iconName: text('icon_name').notNull().default('tag'),
    parentId: text('parent_id').references((): AnySQLiteColumn => categories.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @_PURE_ */ new Date())
      .notNull(),
  },
  (table) => [index('categories_userId_idx').on(table.userId)]
);

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_parent',
  }),
  children: many(categories, {
    relationName: 'category_parent',
  }),
}));

export const financeAccounts = sqliteTable(
  'finance_accounts',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    currency: text('currency', { enum: ['THB'] })
      .notNull()
      .default('THB'),
    openingBalanceSatang: integer('opening_balance_satang').notNull().default(0),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @_PURE_ */ new Date())
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

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sourceAccountId: text('source_account_id').references(() => financeAccounts.id, { onDelete: 'no action' }),
    destinationAccountId: text('destination_account_id').references(() => financeAccounts.id, {
      onDelete: 'no action',
    }),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'no action' }),
    amountSatang: integer('amount_satang').notNull(),
    note: text('note').notNull(),
    transactionDate: text('transaction_date').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
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
