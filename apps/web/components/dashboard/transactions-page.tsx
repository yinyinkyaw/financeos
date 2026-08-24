'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { TransactionTable } from '@/components/dashboard/transaction-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tsr } from '@/lib/tsr';

const TRANSACTION_COLUMNS = [
  'Transaction date',
  'Transaction note',
  'Category',
  'Kind',
  'Source account',
  'Destination account',
  'Amount',
] as const;

function TransactionTableSkeleton() {
  return (
    <Table className='min-w-[70rem]' aria-label='Loading detailed transaction history'>
      <TableHeader>
        <TableRow className='bg-muted/35 hover:bg-muted/35'>
          {TRANSACTION_COLUMNS.map((column) => (
            <TableHead key={column} className='h-11 first:pl-4 last:pr-4 last:text-right'>
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[0, 1, 2, 3].map((row) => (
          <TableRow key={row} className='h-14'>
            {TRANSACTION_COLUMNS.map((column) => (
              <TableCell key={column}>
                <Skeleton className='h-4 w-24 rounded-md' />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TransactionsPage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');
  const transactionsQuery = tsr.transactions.list.useQuery({
    queryKey: ['transactions', accountId ?? 'all', 100],
    queryData: { query: { limit: 100, ...(accountId ? { accountId } : {}) } },
  });
  const transactions = transactionsQuery.data?.status === 200 ? transactionsQuery.data.body.body : [];

  return (
    <div className='mx-auto w-full max-w-[90rem] pb-8'>
      {transactionsQuery.isPending ? (
        <div className='overflow-hidden rounded-xl border'>
          <TransactionTableSkeleton />
        </div>
      ) : transactionsQuery.isError || transactionsQuery.data?.status !== 200 ? (
        <div className='flex min-h-64 flex-col items-center justify-center gap-3 text-center'>
          <AlertCircle className='text-destructive' aria-hidden='true' />
          <p className='font-medium'>Transaction history could not be loaded.</p>
          <Button variant='outline' onClick={() => void transactionsQuery.refetch()}>
            <RefreshCw aria-hidden='true' />
            Retry
          </Button>
        </div>
      ) : (
        <div className='overflow-hidden rounded-xl border'>
          <TransactionTable transactions={transactions} />
        </div>
      )}
    </div>
  );
}
