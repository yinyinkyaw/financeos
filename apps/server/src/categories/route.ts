import { createExpressEndpoints, initServer } from "@ts-rest/express";
import {
  categoryContract,
  type Category,
} from "@financeos/contract/src/category";
import { requireSession } from "@/middleware/require-session";
import type { IRouter } from "express";
import { getCategories } from "./service";

const s = initServer();

const categoriesRouter = s.router(categoryContract, {
  list: {
    middleware: [requireSession()],
    handler: async ({ req }) => {
      const categories = await getCategories({ user: req.user });
      return {
        status: 200,
        body: categories,
      };
    },
  },
  create: {
    middleware: [requireSession()],
    handler: async ({ req, res }) => {
      const category: Category = {
        id: "1111",
        name: "shopping",
        type: "expense",
        color: null,
        parent: null,
      };
      return {
        status: 200,
        body: category,
      };
    },
  },
  update: {
    middleware: [requireSession()],
    handler: async ({ req, res }) => {
      const category: Category = {
        id: "1111",
        name: "shopping",
        type: "expense",
        color: null,
        parent: null,
      };
      return {
        status: 200,
        body: category,
      };
    },
  },
});

export const registerCategoryRoutes = (app: IRouter) =>
  createExpressEndpoints(categoryContract, categoriesRouter, app);
