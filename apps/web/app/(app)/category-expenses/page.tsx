import { CategoryExpensesPage } from '@/components/dashboard/category-expenses-page';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function AnnualCategoryExpensesPage() {
  return (
    <DashboardShell>
      <CategoryExpensesPage />
    </DashboardShell>
  );
}
