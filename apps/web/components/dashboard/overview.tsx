'use client';

import type { Transaction } from '@financeos/contract/src/transactions';
import { AlertCircle, ArrowLeftRight, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BalanceCard } from '@/components/dashboard/balance-card';
import { CategoryIcon } from '@/components/dashboard/category-icon';
import { TransactionDialog } from '@/components/dashboard/transaction-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tsr } from '@/lib/tsr';
import { cn } from '@/lib/utils';

const THAI_BAHT_FORMATTER = new Intl.NumberFormat('en-TH', {
  style: 'currency',
  currency: 'THB',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const TRANSACTION_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

function formatTransactionDate(transactionDate: string) {
  return TRANSACTION_DATE_FORMATTER.format(new Date(`${transactionDate}T00:00:00+07:00`));
}

function transactionAmount(transaction: Transaction, selectedAccountId: string | null) {
  if (transaction.kind === 'income') return { sign: '+', tone: 'text-positive' };
  if (transaction.kind === 'expense') return { sign: '−', tone: 'text-negative' };
  if (!selectedAccountId) return { sign: '', tone: 'text-muted-foreground' };
  return transaction.sourceAccount?.id === selectedAccountId
    ? { sign: '−', tone: 'text-negative' }
    : { sign: '+', tone: 'text-positive' };
}

export function TransactionRows({
  transactions,
  selectedAccountId,
}: {
  transactions: Transaction[];
  selectedAccountId: string | null;
}) {
  return (
    <div className='divide-y'>
      {transactions.map((transaction) => {
        const amount = transactionAmount(transaction, selectedAccountId);
        const detail =
          transaction.kind === 'transfer'
            ? `${transaction.sourceAccount?.name} → ${transaction.destinationAccount?.name}`
            : transaction.category?.name;

        return (
          <div
            key={transaction.id}
            className='grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-4 transition-colors duration-150 hover:bg-muted/35 sm:grid-cols-[2.5rem_minmax(0,1fr)_8rem_auto]'
          >
            <div className='flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
              {transaction.kind === 'transfer' ? (
                <ArrowLeftRight className='size-4' aria-hidden='true' />
              ) : transaction.category ? (
                <CategoryIcon iconName={transaction.category.iconName} className='size-4' />
              ) : null}
            </div>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-foreground'>{transaction.note}</p>
              <p className='truncate text-xs text-muted-foreground'>{detail}</p>
            </div>
            <time className='hidden text-right text-xs text-muted-foreground sm:block'>
              {formatTransactionDate(transaction.transactionDate)}
            </time>
            <div className='text-right'>
              <p className={cn('font-mono text-sm font-medium tabular-nums', amount.tone)}>
                {amount.sign}
                {THAI_BAHT_FORMATTER.format(transaction.amountSatang / 100)}
              </p>
              <time className='text-xs text-muted-foreground sm:hidden'>
                {formatTransactionDate(transaction.transactionDate)}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className='space-y-6' aria-label='Loading overview'>
      <div className='flex items-center justify-between gap-4'>
        <Skeleton className='h-10 w-52 rounded-2xl' />
        <Skeleton className='h-10 w-36 rounded-2xl' />
      </div>
      <Skeleton className='h-36 w-full rounded-2xl' />
      <div className='space-y-4'>
        <Skeleton className='h-7 w-40 rounded-xl' />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className='h-16 w-full rounded-2xl' />
        ))}
      </div>
    </div>
  );
}

export function Overview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedAccountId = searchParams.get('accountId');
  const [selectionNotice, setSelectionNotice] = useState('');
  const accountsQuery = tsr.financeAccounts.list.useQuery({ queryKey: ['finance-accounts'] });
  const categoriesQuery = tsr.categories.list.useQuery({ queryKey: ['categories'] });
  const accounts = accountsQuery.data?.status === 200 ? accountsQuery.data.body.body : [];
  const selectedAccount = accounts.find(({ id }) => id === requestedAccountId) ?? null;
  const hasInvalidSelection = Boolean(requestedAccountId && !selectedAccount && accountsQuery.data?.status === 200);
  const selectedAccountId = selectedAccount?.id ?? null;
  const transactionsQuery = tsr.transactions.list.useQuery({
    queryKey: ['transactions', selectedAccountId ?? 'all', 10],
    queryData: { query: { limit: 10, ...(selectedAccountId ? { accountId: selectedAccountId } : {}) } },
    enabled: accountsQuery.data?.status === 200 && !hasInvalidSelection,
  });

  useEffect(() => {
    if (!hasInvalidSelection) return;
    setSelectionNotice('Financial account not available. Showing all accounts.');
    window.history.replaceState(null, '', '/dashboard');
  }, [hasInvalidSelection]);

  const totalBalanceSatang = accounts.reduce((total, account) => total + account.currentBalanceSatang, 0);

  if (accountsQuery.isPending) return <OverviewSkeleton />;
  if (accountsQuery.isError || accountsQuery.data?.status !== 200) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
        <div className='flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'>
          <AlertCircle aria-hidden='true' />
        </div>
        <div>
          <h1 className='text-balance text-xl font-semibold'>Overview could not be loaded</h1>
          <p className='mt-1 text-pretty text-sm text-muted-foreground'>Your balance is unavailable. Try again.</p>
        </div>
        <Button variant='outline' onClick={() => void accountsQuery.refetch()}>
          <RefreshCw aria-hidden='true' />
          Retry
        </Button>
      </div>
    );
  }

  const transactions = transactionsQuery.data?.status === 200 ? transactionsQuery.data.body.body : [];
  const categories = categoriesQuery.data?.status === 200 ? categoriesQuery.data.body.body : [];
  const categoriesUnavailable = categoriesQuery.isError || (categoriesQuery.data?.status ?? 200) !== 200;
  const balanceSatang = selectedAccount?.currentBalanceSatang ?? totalBalanceSatang;
  const balanceLabel = selectedAccount ? `${selectedAccount.name} balance` : 'Total current balance';
  const viewAllHref = selectedAccountId
    ? `/transactions?accountId=${encodeURIComponent(selectedAccountId)}`
    : '/transactions';

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 pb-8'>
      {selectionNotice ? (
        <div className='rounded-2xl bg-notice-subtle px-4 py-3 text-sm text-foreground' role='status'>
          {selectionNotice}
        </div>
      ) : null}
      <section className='flex flex-col gap-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Overview</p>
            <select
              aria-label='Financial account'
              className='mt-1 min-h-10 max-w-full rounded-2xl bg-transparent pr-8 text-2xl font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/30'
              value={selectedAccountId ?? ''}
              onChange={(event) => {
                setSelectionNotice('');
                router.push(
                  event.target.value ? `/dashboard?accountId=${encodeURIComponent(event.target.value)}` : '/dashboard'
                );
              }}
            >
              <option value=''>All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <TransactionDialog
            accounts={accounts}
            categories={categories}
            categoriesUnavailable={categoriesUnavailable}
            selectedAccountId={selectedAccountId}
          />
        </div>
        <BalanceCard balanceSatang={balanceSatang} label={balanceLabel} />
      </section>
      <section aria-labelledby='recent-activity-heading'>
        <div className='flex min-h-10 items-center justify-between gap-4 border-b pb-3'>
          <div>
            <h2 id='recent-activity-heading' className='text-balance text-lg font-semibold'>
              Recent activity
            </h2>
            <p className='text-xs text-muted-foreground'>Latest entries by transaction date</p>
          </div>
          <Button variant='ghost' render={<Link href={viewAllHref} />}>
            View all
          </Button>
        </div>
        {transactionsQuery.isPending ? (
          <div className='space-y-3 py-4'>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className='h-16 w-full rounded-2xl' />
            ))}
          </div>
        ) : transactionsQuery.isError || transactionsQuery.data?.status !== 200 ? (
          <div className='flex flex-col items-start gap-3 py-8'>
            <p className='text-sm font-medium'>Recent activity could not be loaded.</p>
            <Button variant='outline' size='sm' onClick={() => void transactionsQuery.refetch()}>
              <RefreshCw aria-hidden='true' />
              Retry history
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-14 text-center'>
            <div className='flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
              <Plus aria-hidden='true' />
            </div>
            <div>
              <p className='font-medium'>No transactions yet</p>
              <p className='text-sm text-muted-foreground'>Add the first entry to this view.</p>
            </div>
            <TransactionDialog
              accounts={accounts}
              categories={categories}
              categoriesUnavailable={categoriesUnavailable}
              selectedAccountId={selectedAccountId}
            />
          </div>
        ) : (
          <TransactionRows transactions={transactions} selectedAccountId={selectedAccountId} />
        )}
      </section>
    </div>
  );
}
