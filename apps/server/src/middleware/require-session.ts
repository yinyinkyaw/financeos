import type { AppRoute } from "@ts-rest/core";
import type { TsRestRequestHandler } from "@ts-rest/express";
import { auth } from "@/lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const requireSession = <
  TRoute extends AppRoute,
>(): TsRestRequestHandler<TRoute> =>
  (async (req, res, next) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    req.user = session.user;
    req.session = session.session;
    next();
  }) as TsRestRequestHandler<TRoute>;
