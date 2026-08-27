import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

expand(config());

export const getServerEnv = () =>
  createEnv({
    server: {
      BETTER_AUTH_SECRET: z.string(),
      BETTER_AUTH_URL: z.url(),
      DB_URL: z.url(),
      FRONTEND_URL: z.url(),
      GOOGLE_CLIENT_ID: z.string(),
      GOOGLE_CLIENT_SECRET: z.string(),
    },
    runtimeEnv: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      DB_URL: process.env.DB_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    },
  });
