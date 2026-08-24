'use client';

import type { CreateTransactionBody, Transaction } from '@financeos/contract/src/transactions';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { tsr } from '@/lib/tsr';

type FinancialAccount = {
  id: string;
  name: string;
};

type Category = NonNullable<Transaction['category']>;
type TransactionKind = Transaction['kind'] | '';

const SELECT_CLASS_NAME =
  'h-9 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50';

function bangkokCalendarDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function preselectedAccountId(accounts: FinancialAccount[], selectedAccountId: string | null) {
  return selectedAccountId ?? (accounts.length === 1 ? (accounts[0]?.id ?? '') : '');
}

function createBody({
  kind,
  amountBaht,
  note,
  transactionDate,
  sourceAccountId,
  destinationAccountId,
  categoryId,
}: {
  kind: Exclude<TransactionKind, ''>;
  amountBaht: string;
  note: string;
  transactionDate: string;
  sourceAccountId: string;
  destinationAccountId: string;
  categoryId: string;
}): CreateTransactionBody {
  const amountSatang = Math.round(Number(amountBaht) * 100);

  if (!Number.isInteger(amountSatang) || amountSatang <= 0) {
    throw new Error('Enter a positive amount.');
  }

  if (!note.trim()) {
    throw new Error('Enter a transaction note.');
  }

  if (!transactionDate) {
    throw new Error('Choose a transaction date.');
  }

  if (kind === 'expense') {
    if (!sourceAccountId || !categoryId) throw new Error('Choose a source account and category.');
    return { amountSatang, note, transactionDate, sourceAccountId, destinationAccountId: null, categoryId };
  }

  if (kind === 'income') {
    if (!destinationAccountId || !categoryId) throw new Error('Choose a destination account and category.');
    return { amountSatang, note, transactionDate, sourceAccountId: null, destinationAccountId, categoryId };
  }

  if (!sourceAccountId || !destinationAccountId || sourceAccountId === destinationAccountId) {
    throw new Error('Choose different source and destination accounts.');
  }

  return { amountSatang, note, transactionDate, sourceAccountId, destinationAccountId, categoryId: null };
}

export function TransactionDialog({
  accounts,
  categories,
  categoriesUnavailable,
  selectedAccountId,
}: {
  accounts: FinancialAccount[];
  categories: Category[];
  categoriesUnavailable: boolean;
  selectedAccountId: string | null;
}) {
  const queryClient = useQueryClient();
  const createTransactionMutation = tsr.transactions.create.useMutation({});
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TransactionKind>('');
  const [amountBaht, setAmountBaht] = useState('');
  const [transactionDate, setTransactionDate] = useState(bangkokCalendarDate);
  const [note, setNote] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function changeKind(nextKind: TransactionKind) {
    const accountId = preselectedAccountId(accounts, selectedAccountId);
    setKind(nextKind);
    setNote('');
    setErrorMessage('');
    setSourceAccountId(nextKind === 'expense' || nextKind === 'transfer' ? accountId : '');
    setDestinationAccountId(nextKind === 'income' ? accountId : '');
    if (nextKind === 'transfer') setCategoryId('');
  }

  function resetForm() {
    setKind('');
    setAmountBaht('');
    setTransactionDate(bangkokCalendarDate());
    setNote('');
    setSourceAccountId('');
    setDestinationAccountId('');
    setCategoryId('');
    setErrorMessage('');
  }

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    try {
      if (!kind) throw new Error('Choose a transaction kind.');
      const body = createBody({
        kind,
        amountBaht,
        note,
        transactionDate,
        sourceAccountId,
        destinationAccountId,
        categoryId,
      });
      const response = await createTransactionMutation.mutateAsync({ body });

      if (response.status !== 201) {
        throw new Error(response.body.message);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['finance-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ]);
      setOpen(false);
      resetForm();
      toast.success(response.body.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save the transaction.');
    }
  }

  const actionLabel = kind ? `Save ${kind}` : 'Save transaction';

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <SheetTrigger render={<Button size='lg' className='h-10 active:scale-[0.96]' />}>
        <Plus aria-hidden='true' />
        Add transaction
      </SheetTrigger>
      <SheetContent
        side='bottom'
        className='inset-x-0 bottom-0 h-[100svh] w-full overflow-y-auto rounded-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:h-auto sm:max-h-[90svh] sm:w-[min(38rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:shadow-2xl'
      >
        <SheetHeader className='border-b px-5 py-5 sm:px-6'>
          <SheetTitle className='text-lg'>Add transaction</SheetTitle>
          <SheetDescription>Record an entry in your shared ledger.</SheetDescription>
        </SheetHeader>
        <form id='transaction-form' onSubmit={submitTransaction} className='flex-1 px-5 py-6 sm:px-6'>
          <FieldGroup className='gap-5'>
            <Field>
              <FieldLabel htmlFor='transaction-kind'>Transaction kind</FieldLabel>
              <select
                id='transaction-kind'
                className={SELECT_CLASS_NAME}
                value={kind}
                onChange={(event) => changeKind(event.target.value as TransactionKind)}
                required
              >
                <option value=''>Choose a kind</option>
                <option value='expense'>Expense</option>
                <option value='income'>Income</option>
                <option value='transfer' disabled={accounts.length < 2}>
                  Transfer{accounts.length < 2 ? ' — needs two accounts' : ''}
                </option>
              </select>
            </Field>

            {kind ? (
              <>
                <div className='grid gap-5 sm:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor='transaction-amount'>Amount (THB)</FieldLabel>
                    <Input
                      id='transaction-amount'
                      type='number'
                      min='0.01'
                      step='0.01'
                      inputMode='decimal'
                      value={amountBaht}
                      onChange={(event) => setAmountBaht(event.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='transaction-date'>Transaction date</FieldLabel>
                    <Input
                      id='transaction-date'
                      type='date'
                      value={transactionDate}
                      onChange={(event) => setTransactionDate(event.target.value)}
                      required
                    />
                  </Field>
                </div>

                {(kind === 'expense' || kind === 'transfer') && (
                  <Field>
                    <FieldLabel htmlFor='source-account'>Source account</FieldLabel>
                    <select
                      id='source-account'
                      className={SELECT_CLASS_NAME}
                      value={sourceAccountId}
                      onChange={(event) => setSourceAccountId(event.target.value)}
                      required
                    >
                      <option value=''>Choose an account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {(kind === 'income' || kind === 'transfer') && (
                  <Field>
                    <FieldLabel htmlFor='destination-account'>Destination account</FieldLabel>
                    <select
                      id='destination-account'
                      className={SELECT_CLASS_NAME}
                      value={destinationAccountId}
                      onChange={(event) => setDestinationAccountId(event.target.value)}
                      required
                    >
                      <option value=''>Choose an account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id} disabled={account.id === sourceAccountId}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {kind !== 'transfer' && (
                  <Field>
                    <FieldLabel htmlFor='transaction-category'>Category</FieldLabel>
                    <select
                      id='transaction-category'
                      className={SELECT_CLASS_NAME}
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      required
                    >
                      <option value=''>Choose a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoriesUnavailable ? (
                      <FieldError>Categories could not be loaded. Close this form and try again.</FieldError>
                    ) : null}
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor='transaction-note'>Transaction note</FieldLabel>
                  <Input
                    id='transaction-note'
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={200}
                    placeholder={kind === 'transfer' ? 'Move to everyday spending' : 'What was this for?'}
                    required
                  />
                </Field>
              </>
            ) : null}

            {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          </FieldGroup>
        </form>
        <SheetFooter className='border-t bg-background px-5 py-4 sm:px-6'>
          <Button
            type='submit'
            form='transaction-form'
            size='lg'
            className='h-10 active:scale-[0.96]'
            disabled={!kind || createTransactionMutation.isPending}
          >
            {createTransactionMutation.isPending ? <Loader2 className='animate-spin' aria-hidden='true' /> : null}
            {kind === 'transfer' && !createTransactionMutation.isPending ? <ArrowLeftRight aria-hidden='true' /> : null}
            {createTransactionMutation.isPending ? 'Saving…' : actionLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
