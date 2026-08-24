import { db } from '@/db';
import { categories } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import { categoryIconNameSchema } from '@financeos/contract/src/category';
import { asc, eq } from 'drizzle-orm';

type CategoryReferenceSource = Pick<typeof categories.$inferSelect, 'id' | 'name' | 'color' | 'iconName'>;

function toCategoryReference(category: CategoryReferenceSource) {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    iconName: categoryIconNameSchema.catch('tag').parse(category.iconName),
  };
}

export async function getCategories({ user }: { user: AuthUser }) {
  const ownedCategories = await db.query.categories.findMany({
    where: eq(categories.userId, user.id),
    with: {
      parent: true,
    },
    orderBy: [asc(categories.name)],
  });

  return ownedCategories.map((category) => ({
    ...toCategoryReference(category),
    parent: category.parent?.userId === user.id ? toCategoryReference(category.parent) : null,
  }));
}
