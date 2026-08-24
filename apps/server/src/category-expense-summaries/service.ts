import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import { categoryIconNameSchema } from '@financeos/contract/src/category';
import type {
  AnnualCategoryExpenseSummary,
  CategoryExpenseMonth,
} from '@financeos/contract/src/category-expense-summary';
import { and, asc, eq, gte, isNotNull, isNull, lte, sql } from 'drizzle-orm';

const MONTH_COUNT = 12;

function formatMonth(year: number, monthNumber: number): string {
  return `${year}-${String(monthNumber).padStart(2, '0')}`;
}

function createEmptyMonths(year: number): CategoryExpenseMonth[] {
  return Array.from({ length: MONTH_COUNT }, (_, index) => ({
    month: formatMonth(year, index + 1),
    expenseSatang: 0,
  }));
}

export async function getCategoryExpenseSummaries({
  user,
  year,
}: {
  user: AuthUser;
  year: number;
}): Promise<AnnualCategoryExpenseSummary> {
  const expenseMonth = sql<string>`substr(${transactions.transactionDate}, 1, 7)`;
  const [ownedCategories, expenseRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, iconName: categories.iconName })
      .from(categories)
      .where(eq(categories.userId, user.id))
      .orderBy(asc(categories.name)),
    db
      .select({
        categoryId: transactions.categoryId,
        month: expenseMonth,
        expenseSatang: sql<number>`sum(${transactions.amountSatang})`.mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          isNotNull(transactions.sourceAccountId),
          isNull(transactions.destinationAccountId),
          isNotNull(transactions.categoryId),
          gte(transactions.transactionDate, `${year}-01-01`),
          lte(transactions.transactionDate, `${year}-12-31`)
        )
      )
      .groupBy(transactions.categoryId, expenseMonth),
  ]);

  const expensesByCategory = new Map<string, Map<string, number>>();
  for (const row of expenseRows) {
    if (!row.categoryId) continue;
    const monthlyExpenses = expensesByCategory.get(row.categoryId) ?? new Map<string, number>();
    monthlyExpenses.set(row.month, row.expenseSatang);
    expensesByCategory.set(row.categoryId, monthlyExpenses);
  }

  return {
    year,
    categories: ownedCategories.map((category) => ({
      category: {
        id: category.id,
        name: category.name,
        iconName: categoryIconNameSchema.catch('tag').parse(category.iconName),
      },
      months: createEmptyMonths(year).map((month) => ({
        ...month,
        expenseSatang: expensesByCategory.get(category.id)?.get(month.month) ?? 0,
      })),
    })),
  };
}
