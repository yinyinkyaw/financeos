import { AccountsPage } from '@/components/dashboard/accounts-page';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function FinancialAccountsPage() {
  return (
    <DashboardShell>
      <AccountsPage />
    </DashboardShell>
  );
}
