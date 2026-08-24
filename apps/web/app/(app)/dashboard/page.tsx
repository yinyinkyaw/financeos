'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { BalanceCard } from '@/components/dashboard/balance-card';

export default function DashboardPage() {
  return (
    <DashboardShell>
      <BalanceCard balance={5_000} />
    </DashboardShell>
  );
}
