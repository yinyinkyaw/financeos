import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["income", "expense"]),
  color: z.string().nullable(),
  parent: z
    .object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["income", "expense"]),
      color: z.string().nullable(),
    })
    .nullable(), // null = top-level category, set = child category
});

export type Category = z.infer<typeof categorySchema>;

export const categoryContract = c.router({
  list: {
    method: "GET",
    path: "/categories",
    responses: {
      200: z.array(categorySchema),
      401: z.object({ message: z.string() }),
    },
  },
  create: {
    method: "POST",
    path: "/categories",
    body: z.object({
      name: z.string(),
      type: z.enum(["income", "expense"]),
      color: z.string().optional(),
      parentId: z.string().nullable(),
    }),
    responses: {
      200: categorySchema,
      400: z.object({ message: z.string() }),
      401: z.object({ message: z.string() }),
    },
  },
  update: {
    method: "PUT",
    path: "/categories/:id",
    body: z.object({
      name: z.string(),
      type: z.enum(["income", "expense"]),
      color: z.string().optional(),
      parentId: z.string().nullable(),
    }),
    responses: {
      200: categorySchema,
      400: z.object({ message: z.string() }),
      401: z.object({ message: z.string() }),
    },
  },
});
