'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { tsr } from '@/lib/tsr';

const financeAccountSchema = z.object({
  name: z.string().trim().min(1, 'Enter an account name.').max(100, 'Account name must be 100 characters or fewer.'),
  balance: z.number().finite('Enter a valid starting balance.'),
});

const FORM_ID = 'finance-account-form';

export function FinanceAccountForm() {
  const router = useRouter();
  const createAccountMutation = tsr.financeAccounts.create.useMutation({});
  const form = useForm({
    defaultValues: {
      name: '',
      balance: 0,
    },
    validators: {
      onSubmit: financeAccountSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const account = financeAccountSchema.parse(value);
        const response = await createAccountMutation.mutateAsync({ body: account });

        if (response.status !== 200) {
          toast.error(response.body.message);
          return;
        }

        toast.success(response.body.message);
        router.replace('/dashboard');
        router.refresh();
      } catch {
        toast.error('Could not create the account. Please try again.');
      }
    },
  });

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle>Set up where you keep your money</CardTitle>
        <CardDescription>FinanceOS needs an account before it can record transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
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
            <form.Field name='balance'>
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
                      step='any'
                      required
                    />
                    <FieldDescription>
                      Enter the account&apos;s current balance. Use a negative value for debt.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type='submit' form={FORM_ID} className='w-full' disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Loader2 className='animate-spin' aria-hidden='true' /> : null}
              {isSubmitting ? 'Creating account…' : 'Create account & continue'}
            </Button>
          )}
        </form.Subscribe>
      </CardFooter>
    </Card>
  );
}
