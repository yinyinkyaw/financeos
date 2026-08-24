import { financeAccountQueryOptions } from '@/actions/finance-account';
import { getQueryClient } from '@/lib/get-query-client';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  const financeAccounts = await queryClient.query(financeAccountQueryOptions());

  if (!financeAccounts) {
    redirect('/finance-account/create');
  }

  return children;
}
