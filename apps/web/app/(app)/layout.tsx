import { dehydrate } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import Providers from '@/components/providers';
import { getQueryClient } from '@/lib/get-query-client';
import { serverSessionQueryOptions } from '@/actions/server-session';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  const session = await queryClient.query(serverSessionQueryOptions());

  if (!session) {
    redirect('/sign-in');
  }

  return <Providers dehydratedState={dehydrate(queryClient)}>{children}</Providers>;
}
