import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/index';
import * as schema from '@/db/schema';
import { getServerEnv } from '../../env';
import { seedStarterCategories } from '@/categories/starter-categories';

const { BETTER_AUTH_URL, FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getServerEnv();
export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  trustedOrigins: [FRONTEND_URL],
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      accessType: 'offline',
      prompt: 'select_account consent',
    },
  },
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      ...schema,
      account: schema.authAccounts,
      user: schema.user,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        after: async ({ id }) => {
          await seedStarterCategories(id);
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
