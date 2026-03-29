import { createClient } from "@libsql/client";
import { getServerEnv } from "../../env";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/libsql/sqlite3";

const { DB_FILE_NAME } = getServerEnv();
const client = createClient({
  url: DB_FILE_NAME,
});

export const db = drizzle({ client, schema });
