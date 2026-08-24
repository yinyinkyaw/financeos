'use client';

import type { CreateTransactionBody, Transaction } from '@financeos/contract';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Loader2, Plus } from 'lucide-react';
import { useReducer, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tsr } from '@/lib/tsr';

type FinancialAccount = {
  id: string;
  name: string;
};

type Category = NonNullable<Transaction['category']>;
type TransactionKind = Transaction['kind'] | '';

const BANGKOK_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function bangkokCalendarDate() {
  return BANGKOK_DATE_FORMATTER.format(new Date());
}

function createTransactionDraft() {
  return {
    kind: '' as TransactionKind,
    amountBaht: '',
    transactionDate: bangkokCalendarDate(),
    note: '',
    sourceAccountId: '',
    destinationAccountId: '',
    categoryId: '',
    errorMessage: '',
  };
}

type TransactionDraft = ReturnType<typeof createTransactionDraft>;

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
  const [draft, updateDraft] = useReducer(
    (current: TransactionDraft, updates: Partial<TransactionDraft>) => ({ ...current, ...updates }),
    undefined,
    createTransactionDraft
  );
  const submitInProgress = useRef(false);
  const { kind, amountBaht, transactionDate, note, sourceAccountId, destinationAccountId, categoryId, errorMessage } =
    draft;
  const transactionKindOptions = [
    { label: 'Expense', value: 'expense' },
    { label: 'Income', value: 'income' },
    {
      label: `Transfer${accounts.length < 2 ? ' — needs two accounts' : ''}`,
      value: 'transfer',
    },
  ];
  const accountOptions = accounts.map((account) => ({ label: account.name, value: account.id }));
  const categoryOptions = categories.map((category) => ({ label: category.name, value: category.id }));

  function changeKind(nextKind: TransactionKind) {
    const accountId = preselectedAccountId(accounts, selectedAccountId);
    updateDraft({
      kind: nextKind,
      note: '',
      errorMessage: '',
      sourceAccountId: nextKind === 'expense' || nextKind === 'transfer' ? accountId : '',
      destinationAccountId: nextKind === 'income' ? accountId : '',
      ...(nextKind === 'transfer' ? { categoryId: '' } : {}),
    });
  }

  function resetForm() {
    updateDraft(createTransactionDraft());
  }

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitInProgress.current) return;
    submitInProgress.current = true;
    updateDraft({ errorMessage: '' });

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
        queryClient.invalidateQueries({ queryKey: ['category-expense-summaries'] }),
      ]);
      setOpen(false);
      resetForm();
      toast.success(response.body.message);
    } catch (error) {
      updateDraft({ errorMessage: error instanceof Error ? error.message : 'Could not save the transaction.' });
    } finally {
      submitInProgress.current = false;
    }
  }

  const actionLabel = kind ? `Save ${kind}` : 'Save transaction';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger render={<Button size='lg' className='h-10 active:scale-[0.96]' />}>
        <Plus aria-hidden='true' />
        Add transaction
      </DialogTrigger>
      <DialogContent className='flex max-h-[calc(100svh-2rem)] max-w-[38rem] flex-col gap-0 overflow-hidden p-0'>
        <DialogHeader className='border-b px-5 py-5 pr-16 sm:px-6 sm:pr-16'>
          <DialogTitle className='text-lg'>Add transaction</DialogTitle>
          <DialogDescription>Record an entry in your shared ledger.</DialogDescription>
        </DialogHeader>
        <form
          id='transaction-form'
          onSubmit={submitTransaction}
          className='min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6'
        >
          <FieldGroup className='gap-5'>
            <Field>
              <FieldLabel htmlFor='transaction-kind'>Transaction kind</FieldLabel>
              <Select
                items={transactionKindOptions}
                value={kind || null}
                onValueChange={(value) => changeKind((value ?? '') as TransactionKind)}
              >
                <SelectTrigger id='transaction-kind' className='h-9 w-full'>
                  <SelectValue placeholder='Choose a kind' />
                </SelectTrigger>
                <SelectContent>
                  {transactionKindOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.value === 'transfer' && accounts.length < 2}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {kind ? (
              <>
                <div className='grid gap-5 sm:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor='transaction-amount'>Amount (฿)</FieldLabel>
                    <Input
                      id='transaction-amount'
                      type='number'
                      min='0.01'
                      step='0.01'
                      inputMode='decimal'
                      value={amountBaht}
                      onChange={(event) => updateDraft({ amountBaht: event.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='transaction-date'>Transaction date</FieldLabel>
                    <Input
                      id='transaction-date'
                      type='date'
                      value={transactionDate}
                      onChange={(event) => updateDraft({ transactionDate: event.target.value })}
                      required
                    />
                  </Field>
                </div>

                {(kind === 'expense' || kind === 'transfer') && (
                  <Field>
                    <FieldLabel htmlFor='source-account'>Source account</FieldLabel>
                    <Select
                      items={accountOptions}
                      value={sourceAccountId || null}
                      onValueChange={(value) => updateDraft({ sourceAccountId: value ?? '' })}
                    >
                      <SelectTrigger id='source-account' className='h-9 w-full'>
                        <SelectValue placeholder='Choose an account' />
                      </SelectTrigger>
                      <SelectContent>
                        {accountOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {(kind === 'income' || kind === 'transfer') && (
                  <Field>
                    <FieldLabel htmlFor='destination-account'>Destination account</FieldLabel>
                    <Select
                      items={accountOptions}
                      value={destinationAccountId || null}
                      onValueChange={(value) => updateDraft({ destinationAccountId: value ?? '' })}
                    >
                      <SelectTrigger id='destination-account' className='h-9 w-full'>
                        <SelectValue placeholder='Choose an account' />
                      </SelectTrigger>
                      <SelectContent>
                        {accountOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.value === sourceAccountId}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {kind !== 'transfer' && (
                  <Field>
                    <FieldLabel htmlFor='transaction-category'>Category</FieldLabel>
                    <Select
                      items={categoryOptions}
                      value={categoryId || null}
                      onValueChange={(value) => updateDraft({ categoryId: value ?? '' })}
                    >
                      <SelectTrigger id='transaction-category' className='h-9 w-full'>
                        <SelectValue placeholder='Choose a category' />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    onChange={(event) => updateDraft({ note: event.target.value })}
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
        <DialogFooter className='border-t bg-background px-5 py-4 sm:px-6'>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
