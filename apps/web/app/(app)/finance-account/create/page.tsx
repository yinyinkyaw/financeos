import { FinanceAccountForm } from '@/components/finance-account/account-form';

export default function FinanceAccountCreatePage() {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <FinanceAccountForm />
      </div>
    </div>
  );
}
