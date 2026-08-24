import type { CreateTransactionBody } from '@financeos/contract/src/transactions';

type TransactionEndpoints = Pick<CreateTransactionBody, 'sourceAccountId' | 'destinationAccountId' | 'categoryId'>;

export class TransactionRuleError extends Error {}

export function parseTransactionEndpoints({ sourceAccountId, destinationAccountId, categoryId }: TransactionEndpoints) {
  if (!sourceAccountId && !destinationAccountId) {
    throw new TransactionRuleError('A transaction requires valid account endpoints.');
  }

  if (sourceAccountId && destinationAccountId) {
    if (sourceAccountId === destinationAccountId) {
      throw new TransactionRuleError('A transfer requires different source and destination accounts.');
    }

    if (categoryId) {
      throw new TransactionRuleError('A transfer cannot have a category.');
    }

    return { kind: 'transfer' as const };
  }

  if (!categoryId) {
    throw new TransactionRuleError('Income and expense require a category.');
  }

  return { kind: sourceAccountId ? ('expense' as const) : ('income' as const) };
}
