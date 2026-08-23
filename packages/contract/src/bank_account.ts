import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const bankAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["checking", "savings", "wallet", "cash"]),
  balance: z.number(),
  currency: z.string().default("THB"),
  createdAt: z.string(),
});

export const bankAccountContract = c.router({
  list: {
    method: "GET",
    path: "/bank-accounts",
    responses: {
      200: z.array(bankAccountSchema),
      401: z.object({ message: z.string() }),
    },
  },
  create: {
    method: "POST",
    path: "/bank-accounts",
    body: z.object({
      name: z.string(),
      type: z.enum(["checking", "savings", "wallet", "cash"]),
      balance: z.number(),
      currency: z.string().optional().default("THB"),
    }),
    responses: {
      200: bankAccountSchema,
      400: z.object({ message: z.string() }),
      401: z.object({ message: z.string() }),
    },
  },
  update: {
    method: "PUT",
    path: "/bank-accounts/:id",
    body: z.object({
      name: z.string(),
      type: z.enum(["checking", "savings", "wallet", "cash"]),
      balance: z.number(),
      currency: z.string().optional().default("THB"),
    }),
    responses: {
      200: bankAccountSchema,
      400: z.object({ message: z.string() }),
      401: z.object({ message: z.string() }),
    },
  },
});
