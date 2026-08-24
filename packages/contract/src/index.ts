import { initContract } from '@ts-rest/core';
import { authContract } from './auth';
import { transactionContract } from './transactions';
import { categoryContract } from './category';
import { financeAccountContract } from './finance-account';

export * from './api-response';

const c = initContract();

export const apiContract = c.router({
  auth: authContract,
  transactions: transactionContract,
  categories: categoryContract,
  financeAccounts: financeAccountContract,
});
