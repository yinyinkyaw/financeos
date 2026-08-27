import { getServerEnv } from '../../env';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const { DB_URL } = getServerEnv();
const poolConnection = mysql.createPool({
  uri: DB_URL,
});

export const db = drizzle({ client: poolConnection, schema, mode: 'default' });
