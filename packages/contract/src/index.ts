import { initContract } from "@ts-rest/core";
import { transactionContract } from "./transactions";
import z from "zod";

const c = initContract();

export const apiContract = c.router(
  {
    transactions: transactionContract,
  },
  {
    baseHeaders: {
      Authentication: z.string(),
    },
  },
);
