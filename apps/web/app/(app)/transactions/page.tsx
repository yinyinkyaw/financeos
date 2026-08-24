import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { TransactionsPage } from '@/components/dashboard/transactions-page';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

export default function TransactionListPage() {
  return (
    <DashboardShell>
      <Suspense fallback={<Skeleton className='h-64 w-full rounded-2xl' />}>
        <TransactionsPage />
      </Suspense>
    </DashboardShell>
  );
}
