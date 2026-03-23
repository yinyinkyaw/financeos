import { initContract } from "@ts-rest/core";
import z from "zod";

const c = initContract();

const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bankAccountId: z.string(),
  toAccountId: z.string().nullable(), // only popualated for transfers
  categoryId: z.string().nullable(), // null for transfers
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number(),
  description: z.string(),
  date: z.string(),
  status: z.enum(["completed", "pending"]),
  createdAt: z.string(),
});

export const transactionContract = c.router({
  list: {
    method: "GET",
    path: "/transactions",
    query: z.object({
      limit: z.coerce.number().optional(),
      offset: z.coerce.number().optional(),
      type: z.enum(["income", "expense", "transfer"]).optional(),
      bank_account: z.enum(["checking", "savings", "wallet", "cash"]),
    }),
    responses: {
      200: z.array(transactionSchema),
      401: z.object({ message: z.string() }),
    },
  },
  create: {
    method: "POST",
    path: "/transactions",
    body: z.object({
      type: z.enum(["income", "expense", "transfer"]),
      amount: z.number(),
      description: z.string(),
      bankAccountId: z.string(),
      toAccountId: z.string().optional(), // required when type is 'transfer'
      categoryId: z.string().optional(), // required when type is 'income' or 'expense'
      date: z.string(),
      status: z.enum(["completed", "pending"]).default("completed"),
    }),
    responses: {
      201: transactionSchema,
      400: z.object({ message: z.string() }),
      401: z.object({ message: z.string() }),
    },
  },
});
