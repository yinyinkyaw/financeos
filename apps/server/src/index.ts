import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { registerAuthRoutes } from "@/auth";
import { auth } from "@/lib/auth";

export const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

registerAuthRoutes(app);

app.get("/health-check", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
