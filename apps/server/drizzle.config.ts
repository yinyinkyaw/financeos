import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import { getServerEnv } from './env';

const { DB_URL } = getServerEnv();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: DB_URL,
  },
  strict: true,
});
