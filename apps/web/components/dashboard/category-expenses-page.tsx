'use client';

import type { AnnualCategoryExpenseSummary } from '@financeos/contract';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { CategoryIcon } from '@/components/dashboard/category-icon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatBaht } from '@/lib/money';
import { tsr } from '@/lib/tsr';
import { cn } from '@/lib/utils';

const MONTH_COUNT = 12;
const CATEGORY_COLUMN_WIDTH_CLASS_NAMES = 'w-48 min-w-48 max-w-48';
const STICKY_COLUMN_RIGHT_EDGE_CLASS_NAMES =
  'shadow-[2px_0_3px_-2px_rgb(0_0_0/0.12),5px_0_10px_-8px_rgb(0_0_0/0.18)] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-0 after:outline-1 after:outline-solid after:outline-border';
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
});

type CategoryExpenseRow = AnnualCategoryExpenseSummary['categories'][number];

function getMonthLabels(year: number): string[] {
  return Array.from({ length: MONTH_COUNT }, (_, monthIndex) =>
    MONTH_LABEL_FORMATTER.format(new Date(Date.UTC(year, monthIndex, 1)))
  );
}

function getAnnualExpenseSatang({ months }: CategoryExpenseRow): number {
  return months.reduce((total, month) => total + month.expenseSatang, 0);
}

function AmountCell({ amountSatang }: { amountSatang: number }) {
  return (
    <TableCell
      className={cn(
        'min-w-32 text-right font-mono font-normal tabular-nums',
        amountSatang === 0 && 'text-muted-foreground'
      )}
    >
      {formatBaht(amountSatang)}
    </TableCell>
  );
}

function CategoryExpenseTable({ summary }: { summary: AnnualCategoryExpenseSummary }) {
  const monthLabels = getMonthLabels(summary.year);

  return (
    <div className='overflow-hidden rounded-xl border'>
      <Table className='min-w-448' aria-label={`Category expenses for ${summary.year}`}>
        <TableCaption className='sr-only'>
          Expense totals for every category from January through December {summary.year}.
        </TableCaption>
        <TableHeader>
          <TableRow className='bg-muted/35 hover:bg-muted/35'>
            <TableHead
              className={cn(
                CATEGORY_COLUMN_WIDTH_CLASS_NAMES,
                STICKY_COLUMN_RIGHT_EDGE_CLASS_NAMES,
                'sticky left-0 z-20 h-11 bg-muted pl-4'
              )}
            >
              Category
            </TableHead>
            <TableHead className='min-w-32 text-right'>{summary.year} total</TableHead>
            {monthLabels.map((month) => (
              <TableHead key={month} className='min-w-32 text-right'>
                {month}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.categories.length === 0 ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell colSpan={14} className='h-32 text-center text-muted-foreground'>
                No categories yet.
              </TableCell>
            </TableRow>
          ) : (
            summary.categories.map((row) => (
              <TableRow key={row.category.id} className='h-14 hover:bg-transparent'>
                <TableCell
                  className={cn(
                    CATEGORY_COLUMN_WIDTH_CLASS_NAMES,
                    STICKY_COLUMN_RIGHT_EDGE_CLASS_NAMES,
                    'sticky left-0 z-10 bg-background pl-4'
                  )}
                >
                  <span className='flex min-w-0 items-center gap-2 font-medium'>
                    <CategoryIcon iconName={row.category.iconName} className='size-4 shrink-0 text-muted-foreground' />
                    <span className='truncate' title={row.category.name}>
                      {row.category.name}
                    </span>
                  </span>
                </TableCell>
                <AmountCell amountSatang={getAnnualExpenseSatang(row)} />
                {row.months.map((month) => (
                  <AmountCell key={month.month} amountSatang={month.expenseSatang} />
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CategoryExpensePageSkeleton() {
  return (
    <div className='space-y-8' aria-label='Loading category expenses'>
      <div className='space-y-3'>
        <Skeleton className='h-4 w-28 rounded-lg' />
        <Skeleton className='h-9 w-72 max-w-full rounded-xl' />
        <Skeleton className='h-5 w-96 max-w-full rounded-lg' />
      </div>
      <Skeleton className='h-80 w-full rounded-xl' />
    </div>
  );
}

export function CategoryExpensesPage() {
  const summaryQuery = tsr.categoryExpenseSummaries.list.useQuery({
    queryKey: ['category-expense-summaries', 'current-year'],
    queryData: { query: {} },
  });

  if (summaryQuery.isPending) return <CategoryExpensePageSkeleton />;

  if (summaryQuery.isError || summaryQuery.data?.status !== 200) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
        <div className='flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'>
          <AlertCircle aria-hidden='true' />
        </div>
        <div>
          <h1 className='text-balance text-xl font-semibold'>Category expenses could not be loaded</h1>
          <p className='mt-1 text-pretty text-sm text-muted-foreground'>
            This year&apos;s expenses are unavailable. Try again.
          </p>
        </div>
        <Button variant='outline' onClick={() => void summaryQuery.refetch()}>
          <RefreshCw aria-hidden='true' />
          Retry
        </Button>
      </div>
    );
  }

  const summary = summaryQuery.data.body.body;

  return (
    <div className='mx-auto flex w-full max-w-[100rem] flex-col gap-8 pb-8'>
      <header className='max-w-2xl'>
        <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Category Expense</p>
        <h1 className='mt-1 text-balance text-3xl font-semibold tracking-tight'>This year&apos;s category expenses</h1>
        <p className='mt-2 text-pretty text-sm text-muted-foreground'>
          Expenses by category from January through December {summary.year}.
        </p>
      </header>

      <CategoryExpenseTable summary={summary} />
    </div>
  );
}
