import type { AuthSession, AuthUser } from "@/lib/auth";

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
      session: AuthSession;
    }
  }
}

export {};
