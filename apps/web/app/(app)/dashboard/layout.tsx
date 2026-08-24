import type { Metadata } from 'next';

import { financeAccountQueryOptions } from '@/actions/finance-account';
import { getQueryClient } from '@/lib/get-query-client';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Review your balances and recent ledger activity in FinanceOS.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  const financeAccounts = await queryClient.query(financeAccountQueryOptions());

  if (financeAccounts.length === 0) {
    redirect('/finance-account/create');
  }

  return children;
}
