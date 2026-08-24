import { cn } from '@/lib/utils';

export function BrandMark({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'inline-flex size-9 shrink-0 select-none items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10',
        className
      )}
      {...props}
    >
      F
    </span>
  );
}
