import { Card, CardContent } from '@/components/ui/card';

const THAI_BAHT_FORMATTER = new Intl.NumberFormat('en-TH', {
  style: 'currency',
  currency: 'THB',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BANGKOK_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

interface BalanceCardProps {
  balanceSatang: number;
  label: string;
  date?: Date;
}

export function BalanceCard({ balanceSatang, label, date = new Date() }: BalanceCardProps) {
  return (
    <Card className='gap-0 rounded-2xl bg-muted/40 py-0 shadow-none ring-0'>
      <CardContent className='flex flex-col gap-3 px-5 py-5 sm:px-6'>
        <p className='font-heading text-3xl font-semibold tracking-[-0.035em] text-card-foreground tabular-nums sm:text-4xl'>
          {THAI_BAHT_FORMATTER.format(balanceSatang / 100)}
        </p>

        <div className='flex items-center justify-between gap-4 text-sm'>
          <p className='font-medium text-muted-foreground'>{label}</p>
          <time className='text-xs text-muted-foreground'>As of {BANGKOK_DATE_FORMATTER.format(date)}</time>
        </div>
      </CardContent>
    </Card>
  );
}
