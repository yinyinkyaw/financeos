import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return children;
}
