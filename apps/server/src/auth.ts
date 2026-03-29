import type { Env, Hono } from "hono";
import { getServerEnv } from "../env";
import { cors } from "hono/cors";
import { auth } from "@/lib/auth";

const { FRONTEND_URL } = getServerEnv();

export const registerAuthRoutes = <T extends Env>(app: Hono<T>) => {
  app.use(
    "/api/auth/*",
    cors({
      origin: FRONTEND_URL,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    }),
  );

  app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  });
};
