import { db } from '@/db';
import { categories } from '@/db/schema';
import type { CategoryIconName } from '@financeos/contract/src/category';
import { and, eq, isNull } from 'drizzle-orm';

const STARTER_CATEGORIES = [
  { name: 'Income', iconName: 'circle-dollar-sign' },
  { name: 'Food', iconName: 'utensils' },
  { name: 'Transport', iconName: 'bus' },
  { name: 'Shopping', iconName: 'shopping-bag' },
  { name: 'Bills', iconName: 'receipt-text' },
  { name: 'Housing', iconName: 'house' },
  { name: 'Health', iconName: 'heart-pulse' },
  { name: 'Other', iconName: 'shapes' },
] as const satisfies readonly { name: string; iconName: CategoryIconName }[];

function createStarterCategoryId(userId: string, categoryName: string): string {
  return `starter-category:${userId}:${categoryName.toLowerCase()}`;
}

export async function seedStarterCategories(userId: string): Promise<number> {
  const existingCategories = await db.query.categories.findMany({
    where: and(eq(categories.userId, userId), isNull(categories.parentId)),
    columns: { name: true },
  });
  const existingNames = new Set(existingCategories.map(({ name }) => name));
  const missingCategories = STARTER_CATEGORIES.filter(({ name }) => !existingNames.has(name));

  await Promise.all(
    STARTER_CATEGORIES.map(({ name, iconName }) =>
      db
        .update(categories)
        .set({ iconName })
        .where(and(eq(categories.userId, userId), eq(categories.id, createStarterCategoryId(userId, name))))
    )
  );

  if (missingCategories.length === 0) {
    return 0;
  }

  const insertedCategories = await db
    .insert(categories)
    .values(
      missingCategories.map(({ name, iconName }) => ({
        id: createStarterCategoryId(userId, name),
        userId,
        name,
        iconName,
      }))
    )
    .onConflictDoNothing()
    .returning({ id: categories.id });

  return insertedCategories.length;
}
