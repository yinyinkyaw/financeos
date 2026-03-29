import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index";
import * as schema from "@/db/schema";
import { getServerEnv } from "env";

const {
  BETTER_AUTH_URL,
  FRONTEND_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} =
  getServerEnv();
export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  trustedOrigins: [FRONTEND_URL],
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...schema,
      user: schema.user,
    },
  }),
});
