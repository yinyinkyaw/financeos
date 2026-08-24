import { db } from '@/db';
import { categories } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

const STARTER_CATEGORY_NAMES = [
  'Income',
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Housing',
  'Health',
  'Other',
] as const;

function createStarterCategoryId(userId: string, categoryName: string): string {
  return `starter-category:${userId}:${categoryName.toLowerCase()}`;
}

export async function seedStarterCategories(userId: string): Promise<number> {
  const existingCategories = await db.query.categories.findMany({
    where: and(eq(categories.userId, userId), isNull(categories.parentId)),
    columns: { name: true },
  });
  const existingNames = new Set(existingCategories.map(({ name }) => name));
  const missingCategoryNames = STARTER_CATEGORY_NAMES.filter((name) => !existingNames.has(name));

  if (missingCategoryNames.length === 0) {
    return 0;
  }

  const insertedCategories = await db
    .insert(categories)
    .values(
      missingCategoryNames.map((name) => ({
        id: createStarterCategoryId(userId, name),
        userId,
        name,
      }))
    )
    .onConflictDoNothing()
    .returning({ id: categories.id });

  return insertedCategories.length;
}
