import "server-only";

import { headers } from "next/headers";
import { env } from "@/env";

type ServerSession = {
  session: Record<string, unknown>;
  user: Record<string, unknown>;
};

export const getServerSession = async (): Promise<ServerSession | null> => {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");

  if (!cookie) {
    return null;
  }

  const response = await fetch(
    `${env.NEXT_PUBLIC_BACKEND_URL}/api/auth/get-session`,
    {
      cache: "no-store",
      headers: {
        cookie,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ServerSession | null;
};
