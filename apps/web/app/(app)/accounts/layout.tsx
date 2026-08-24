import { financeAccountQueryOptions } from '@/actions/finance-account';
import { getQueryClient } from '@/lib/get-query-client';
import { redirect } from 'next/navigation';

export default async function AccountsLayout({
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
