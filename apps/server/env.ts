import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, ".env") });

export const getServerEnv = () =>
  createEnv({
    server: {
      BETTER_AUTH_SECRET: z.string(),
      BETTER_AUTH_URL: z.url(),
      DB_FILE_NAME: z.string(),
      FRONTEND_URL: z.url(),
      GOOGLE_CLIENT_ID: z.string(),
      GOOGLE_CLIENT_SECRET: z.string(),
    },
    runtimeEnv: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      DB_FILE_NAME: process.env.DB_FILE_NAME,
      FRONTEND_URL: process.env.FRONTEND_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    },
  });
