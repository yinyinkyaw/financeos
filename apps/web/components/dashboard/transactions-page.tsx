'use client';

import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { TransactionRows } from '@/components/dashboard/overview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tsr } from '@/lib/tsr';

export function TransactionsPage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');
  const accountsQuery = tsr.financeAccounts.list.useQuery({ queryKey: ['finance-accounts'] });
  const transactionsQuery = tsr.transactions.list.useQuery({
    queryKey: ['transactions', accountId ?? 'all', 100],
    queryData: { query: { limit: 100, ...(accountId ? { accountId } : {}) } },
  });
  const accounts = accountsQuery.data?.status === 200 ? accountsQuery.data.body.body : [];
  const selectedAccount = accounts.find((account) => account.id === accountId) ?? null;
  const transactions = transactionsQuery.data?.status === 200 ? transactionsQuery.data.body.body : [];

  return (
    <div className='mx-auto w-full max-w-5xl pb-8'>
      <div className='flex items-center gap-3 border-b pb-4'>
        <Button
          variant='ghost'
          size='icon-lg'
          render={
            <Link
              href={selectedAccount ? `/dashboard?accountId=${encodeURIComponent(selectedAccount.id)}` : '/dashboard'}
            />
          }
        >
          <ArrowLeft aria-hidden='true' />
          <span className='sr-only'>Back to Overview</span>
        </Button>
        <div>
          <h1 className='text-balance text-2xl font-semibold'>Transactions</h1>
          <p className='text-sm text-muted-foreground'>{selectedAccount ? selectedAccount.name : 'All accounts'}</p>
        </div>
      </div>

      {transactionsQuery.isPending || accountsQuery.isPending ? (
        <div className='space-y-3 py-5'>
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className='h-16 w-full rounded-2xl' />
          ))}
        </div>
      ) : transactionsQuery.isError || transactionsQuery.data?.status !== 200 || accountsQuery.data?.status !== 200 ? (
        <div className='flex min-h-64 flex-col items-center justify-center gap-3 text-center'>
          <AlertCircle className='text-destructive' aria-hidden='true' />
          <p className='font-medium'>Transactions could not be loaded.</p>
          <Button variant='outline' onClick={() => void transactionsQuery.refetch()}>
            <RefreshCw aria-hidden='true' />
            Retry
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <p className='py-16 text-center text-sm text-muted-foreground'>No transactions yet.</p>
      ) : (
        <TransactionRows transactions={transactions} selectedAccountId={selectedAccount?.id ?? null} />
      )}
    </div>
  );
}
