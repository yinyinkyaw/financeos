import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseTransactionEndpoints } from './rules';

describe('parseTransactionEndpoints', () => {
  it('derives expense from a source account and category', () => {
    assert.equal(
      parseTransactionEndpoints({
        sourceAccountId: 'checking',
        destinationAccountId: null,
        categoryId: 'food',
      }).kind,
      'expense'
    );
  });

  it('derives income from a destination account and category', () => {
    assert.equal(
      parseTransactionEndpoints({
        sourceAccountId: null,
        destinationAccountId: 'checking',
        categoryId: 'income',
      }).kind,
      'income'
    );
  });

  it('derives transfer from different source and destination accounts', () => {
    assert.equal(
      parseTransactionEndpoints({
        sourceAccountId: 'checking',
        destinationAccountId: 'cash',
        categoryId: null,
      }).kind,
      'transfer'
    );
  });

  it('rejects a transfer to the same account', () => {
    assert.throws(
      () =>
        parseTransactionEndpoints({
          sourceAccountId: 'checking',
          destinationAccountId: 'checking',
          categoryId: null,
        }),
      /different source and destination accounts/
    );
  });

  it('rejects entries without an account endpoint', () => {
    assert.throws(
      () =>
        parseTransactionEndpoints({
          sourceAccountId: null,
          destinationAccountId: null,
          categoryId: 'food',
        }),
      /valid account endpoints/
    );
  });

  it('rejects income or expense without a category', () => {
    assert.throws(
      () =>
        parseTransactionEndpoints({
          sourceAccountId: 'checking',
          destinationAccountId: null,
          categoryId: null,
        }),
      /require a category/
    );
  });

  it('rejects a transfer with a category', () => {
    assert.throws(
      () =>
        parseTransactionEndpoints({
          sourceAccountId: 'checking',
          destinationAccountId: 'cash',
          categoryId: 'food',
        }),
      /cannot have a category/
    );
  });
});
