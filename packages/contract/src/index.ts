import { initContract } from "@ts-rest/core";
import { transactionContract } from "./transactions";
import { categoryContract } from "./category";
import { bankAccountContract } from "./bank_account";

const c = initContract();

export const apiContract = c.router({
  transactions: transactionContract,
  categories: categoryContract,
  bankAccounts: bankAccountContract,
});
