'use client';

import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { tsr } from '@/lib/tsr';

const financeAccountSchema = z.object({
  name: z.string().trim().min(1, 'Enter an account name.').max(100, 'Account name must be 100 characters or fewer.'),
  openingBalanceBaht: z.number().finite('Enter a valid starting balance.'),
});

const ONBOARDING_FORM_ID = 'finance-account-onboarding-form';
const DIALOG_FORM_ID = 'finance-account-dialog-form';

function useFinanceAccountForm(onAccountCreated: () => void) {
  const queryClient = useQueryClient();
  const createAccountMutation = tsr.financeAccounts.create.useMutation({
    onSuccess: async (response) => {
      if (response.status === 200) {
        await queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
      }
    },
  });
  return useForm({
    defaultValues: {
      name: '',
      openingBalanceBaht: 0,
    },
    validators: {
      onSubmit: financeAccountSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const account = financeAccountSchema.parse(value);
        const response = await createAccountMutation.mutateAsync({
          body: {
            name: account.name,
            openingBalanceSatang: Math.round(account.openingBalanceBaht * 100),
          },
        });

        if (response.status !== 200) {
          toast.error(response.body.message);
          return;
        }

        toast.success(response.body.message);
        onAccountCreated();
      } catch {
        toast.error('Could not create the account. Please try again.');
      }
    },
  });
}

type FinanceAccountFormApi = ReturnType<typeof useFinanceAccountForm>;

function FinanceAccountFields({ form }: { form: FinanceAccountFormApi }) {
  return (
    <FieldGroup>
      <form.Field name='name'>
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Account Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={isInvalid}
                autoComplete='off'
                maxLength={100}
                placeholder='Savings'
                required
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
      <form.Field name='openingBalanceBaht'>
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Starting Balance</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type='number'
                value={Number.isNaN(field.state.value) ? '' : field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.valueAsNumber)}
                aria-invalid={isInvalid}
                inputMode='decimal'
                step='0.01'
                required
              />
              <FieldDescription>
                Enter the account&apos;s opening balance in ฿. Use a negative value for debt.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
    </FieldGroup>
  );
}

function FinanceAccountSubmit({ form, label }: { form: FinanceAccountFormApi; label: string }) {
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button type='submit' className='w-full' disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? <Loader2 className='animate-spin' aria-hidden='true' /> : null}
          {isSubmitting ? 'Creating account…' : label}
        </Button>
      )}
    </form.Subscribe>
  );
}

function submitFinanceAccountForm(event: FormEvent<HTMLFormElement>, form: FinanceAccountFormApi) {
  event.preventDefault();
  void form.handleSubmit();
}

export function FinanceAccountForm() {
  const router = useRouter();
  const form = useFinanceAccountForm(() => {
    router.replace('/dashboard');
    router.refresh();
  });

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle>Set up where you keep your money</CardTitle>
        <CardDescription>FinanceOS needs an account before it can record transactions.</CardDescription>
      </CardHeader>
      <form id={ONBOARDING_FORM_ID} onSubmit={(event) => submitFinanceAccountForm(event, form)}>
        <CardContent>
          <FinanceAccountFields form={form} />
        </CardContent>
        <CardFooter className='mt-5 flex-col gap-2'>
          <FinanceAccountSubmit form={form} label='Create account & continue' />
        </CardFooter>
      </form>
    </Card>
  );
}

export function FinanceAccountDialog() {
  const [open, setOpen] = useState(false);
  const form = useFinanceAccountForm(() => {
    form.reset();
    setOpen(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) form.reset();
      }}
    >
      <DialogTrigger
        render={
          <Button
            size='lg'
            className='h-10 self-start transition-transform duration-150 active:scale-[0.96] sm:self-auto'
          />
        }
      >
        <Plus aria-hidden='true' />
        Add account
      </DialogTrigger>
      <DialogContent className='gap-0 overflow-hidden p-0'>
        <DialogHeader className='border-b px-6 py-5 pr-16'>
          <DialogTitle className='text-lg'>Add financial account</DialogTitle>
          <DialogDescription>Track another place where you keep money.</DialogDescription>
        </DialogHeader>
        <form id={DIALOG_FORM_ID} onSubmit={(event) => submitFinanceAccountForm(event, form)}>
          <div className='px-6 py-6'>
            <FinanceAccountFields form={form} />
          </div>
          <DialogFooter className='border-t px-6 py-4'>
            <FinanceAccountSubmit form={form} label='Create account' />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
