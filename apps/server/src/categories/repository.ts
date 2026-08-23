import { db } from '@/db';
import { categories } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

type ListCategoryFilter = {
  userId: string;
};
export function listCategories({ userId }: ListCategoryFilter) {
  return db.query.categories.findMany({
    where: eq(categories.userId, userId),
    with: {
      parent: true,
    },
    orderBy: [asc(categories.name)],
  });
}
