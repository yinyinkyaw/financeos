import type { Express } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";

const authHandler = toNodeHandler(auth);

export const registerAuthRoutes = (app: Express) => {
  app.all(/^\/api\/auth(?:\/.*)?$/, authHandler);
};
