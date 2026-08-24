import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getQueryClient } from '@/lib/get-query-client';
import { serverSessionQueryOptions } from '@/actions/server-session';
import { PRODUCT_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Sign in',
  description: `Sign in to ${PRODUCT_NAME} to manage your personal ledger and plan your cash flow.`,
  robots: {
    index: false,
    follow: false,
  },
};

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
