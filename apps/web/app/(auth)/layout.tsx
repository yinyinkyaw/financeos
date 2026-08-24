import { redirect } from 'next/navigation';

import { getQueryClient } from '@/lib/get-query-client';
import { serverSessionQueryOptions } from '@/actions/server-session';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  const session = await queryClient.query(serverSessionQueryOptions());
  if (session) {
    redirect('/');
  }

  return children;
}
