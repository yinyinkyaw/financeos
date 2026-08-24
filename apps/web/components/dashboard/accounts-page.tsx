'use client';

import type { FinancialAccountSummary } from '@financeos/contract/src/finance-account';
import { AlertCircle, ArrowUpRight, Landmark, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinanceAccountDialog } from '@/components/finance-account/account-form';
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

const ACCOUNT_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

function formatBalance(balanceSatang: number) {
  return THAI_BAHT_FORMATTER.format(balanceSatang / 100);
}

function formatAccountDate(createdAt: string) {
  return ACCOUNT_DATE_FORMATTER.format(new Date(createdAt));
}

function AccountCard({ account }: { account: FinancialAccountSummary }) {
  const overviewHref = `/dashboard?accountId=${encodeURIComponent(account.id)}`;

  return (
    <Card className='relative min-h-52 shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-3 focus-within:ring-ring/30'>
      <CardHeader className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3'>
        <div className='flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
          <Landmark className='size-4' aria-hidden='true' />
        </div>
        <CardTitle className='truncate text-base' title={account.name}>
          {account.name}
        </CardTitle>
        <ArrowUpRight
          className='size-4 text-muted-foreground transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5'
          aria-hidden='true'
        />
      </CardHeader>
      <CardContent className='mt-auto space-y-4'>
        <div>
          <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Current balance</p>
          <p
            className={cn(
              'mt-1 font-mono text-2xl font-semibold tracking-tight tabular-nums',
              account.currentBalanceSatang < 0 && 'text-negative'
            )}
          >
            {formatBalance(account.currentBalanceSatang)}
          </p>
        </div>
        <div className='flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground'>
          <span>Created</span>
          <time dateTime={account.createdAt}>{formatAccountDate(account.createdAt)}</time>
        </div>
      </CardContent>
      <Link href={overviewHref} className='absolute inset-0 rounded-3xl' aria-label={`View ${account.name} overview`} />
    </Card>
  );
}

function AccountsPageSkeleton() {
  return (
    <div className='space-y-8' aria-label='Loading financial accounts'>
      <div className='flex items-end justify-between gap-4'>
        <div className='space-y-3'>
          <Skeleton className='h-4 w-20 rounded-lg' />
          <Skeleton className='h-9 w-64 rounded-xl' />
          <Skeleton className='h-5 w-80 max-w-full rounded-lg' />
        </div>
        <Skeleton className='hidden h-10 w-32 rounded-2xl sm:block' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {[0, 1, 2].map((card) => (
          <Skeleton key={card} className='h-52 rounded-3xl' />
        ))}
      </div>
    </div>
  );
}

export function AccountsPage() {
  const accountsQuery = tsr.financeAccounts.list.useQuery({ queryKey: ['finance-accounts'] });

  if (accountsQuery.isPending) return <AccountsPageSkeleton />;

  if (accountsQuery.isError || accountsQuery.data?.status !== 200) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
        <div className='flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'>
          <AlertCircle aria-hidden='true' />
        </div>
        <div>
          <h1 className='text-balance text-xl font-semibold'>Accounts could not be loaded</h1>
          <p className='mt-1 text-pretty text-sm text-muted-foreground'>
            Your financial accounts are unavailable. Try again.
          </p>
        </div>
        <Button variant='outline' onClick={() => void accountsQuery.refetch()}>
          <RefreshCw aria-hidden='true' />
          Retry
        </Button>
      </div>
    );
  }

  const accounts = accountsQuery.data.body.body;

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 pb-8'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='max-w-xl'>
          <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Accounts</p>
          <h1 className='mt-1 text-balance text-3xl font-semibold tracking-tight'>Your financial accounts</h1>
          <p className='mt-2 text-pretty text-sm text-muted-foreground'>
            Current balances across every place you keep money.
          </p>
        </div>
        <FinanceAccountDialog />
      </header>

      <section aria-labelledby='account-list-heading'>
        <h2 id='account-list-heading' className='sr-only'>
          Financial accounts
        </h2>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </section>
    </div>
  );
}
