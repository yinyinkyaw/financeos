"use client";

import { authClient } from "@/lib/auth-client";
import { Button, FieldGroup } from "@financeos/ui";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function Home() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session } = authClient.useSession();

  const handleLogout = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.replace("/sign-in");
      router.refresh();
    });
  };

  return (
    <main className="p-6">
      <FieldGroup>
        <h1 className="font-bold">
          Hello, <span className="text-primary">{session?.user.name}</span>
        </h1>
        <Button
          disabled={isPending}
          aria-disabled={isPending}
          onClick={handleLogout}
          aria-label="logout"
        >
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Logout
        </Button>
      </FieldGroup>
    </main>
  );
}
