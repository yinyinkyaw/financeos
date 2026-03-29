import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import { getServerEnv } from "./env";

const { DB_FILE_NAME } = getServerEnv();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: DB_FILE_NAME,
  },
});
