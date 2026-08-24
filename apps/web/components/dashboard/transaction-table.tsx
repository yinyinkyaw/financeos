import type { Transaction } from '@financeos/contract/src/transactions';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CircleHelp,
  FileText,
  Landmark,
  Shapes,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { CategoryIcon } from '@/components/dashboard/category-icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatBaht } from '@/lib/money';
import { cn } from '@/lib/utils';

const TRANSACTION_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

const TRANSACTION_KIND_PRESENTATION = {
  income: { label: 'Income', icon: ArrowDownLeft, className: 'text-positive' },
  expense: { label: 'Expense', icon: ArrowUpRight, className: 'text-negative' },
  transfer: { label: 'Transfer', icon: ArrowLeftRight, className: 'text-muted-foreground' },
} as const;

function formatTransactionDate(transactionDate: string) {
  return TRANSACTION_DATE_FORMATTER.format(new Date(`${transactionDate}T00:00:00+07:00`));
}

function TransactionKind({ kind }: { kind: Transaction['kind'] }) {
  const presentation = TRANSACTION_KIND_PRESENTATION[kind];
  const Icon = presentation.icon;

  return (
    <span className={cn('inline-flex items-center gap-2 font-medium', presentation.className)}>
      <Icon className='size-4 shrink-0' aria-hidden='true' />
      {presentation.label}
    </span>
  );
}

function ColumnLabel({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className='inline-flex items-center gap-2'>
      <Icon className='size-4 text-muted-foreground' aria-hidden='true' />
      {children}
    </span>
  );
}

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Table className='min-w-[70rem]' aria-label='Detailed transaction history'>
      <TableHeader>
        <TableRow className='bg-muted/35 hover:bg-muted/35'>
          <TableHead className='h-11 pl-4'>
            <ColumnLabel icon={CalendarDays}>Transaction date</ColumnLabel>
          </TableHead>
          <TableHead>
            <ColumnLabel icon={FileText}>Transaction note</ColumnLabel>
          </TableHead>
          <TableHead>
            <ColumnLabel icon={Shapes}>Category</ColumnLabel>
          </TableHead>
          <TableHead>
            <ColumnLabel icon={CircleHelp}>Kind</ColumnLabel>
          </TableHead>
          <TableHead>
            <ColumnLabel icon={Landmark}>Source account</ColumnLabel>
          </TableHead>
          <TableHead>
            <ColumnLabel icon={Landmark}>Destination account</ColumnLabel>
          </TableHead>
          <TableHead className='pr-4 text-right [&>span]:w-full [&>span]:justify-end'>
            <ColumnLabel icon={Banknote}>Amount</ColumnLabel>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
              No transactions yet.
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((transaction) => (
            <TableRow key={transaction.id} className='h-14'>
              <TableCell className='pl-4 text-muted-foreground'>
                <time dateTime={transaction.transactionDate}>{formatTransactionDate(transaction.transactionDate)}</time>
              </TableCell>
              <TableCell className='max-w-72 font-medium'>
                <span className='block truncate' title={transaction.note}>
                  {transaction.note}
                </span>
              </TableCell>
              <TableCell>
                {transaction.category ? (
                  <span className='inline-flex items-center gap-2'>
                    <CategoryIcon iconName={transaction.category.iconName} className='size-4 text-muted-foreground' />
                    {transaction.category.name}
                  </span>
                ) : (
                  <span className='text-muted-foreground' aria-label='No category'>
                    —
                  </span>
                )}
              </TableCell>
              <TableCell>
                <TransactionKind kind={transaction.kind} />
              </TableCell>
              <TableCell>
                {transaction.sourceAccount?.name ?? <span className='text-muted-foreground'>—</span>}
              </TableCell>
              <TableCell>
                {transaction.destinationAccount?.name ?? <span className='text-muted-foreground'>—</span>}
              </TableCell>
              <TableCell className='pr-4 text-right font-mono font-medium tabular-nums'>
                {formatBaht(transaction.amountSatang)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
