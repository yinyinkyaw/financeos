import { db } from '@/db';
import { categories } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import { categoryIconNameSchema, type CreateCategoryBody } from '@financeos/contract/src/category';
import { and, asc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

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
    orderBy: [asc(categories.name)],
  });

  return ownedCategories.map(toCategoryReference);
}

export async function createCategory({ user, body }: { user: AuthUser; body: CreateCategoryBody }) {
  const [duplicate] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, user.id), eq(categories.name, body.name)))
    .limit(1);

  if (duplicate) {
    return null;
  }

  const [createdCategory] = await db
    .insert(categories)
    .values({ id: randomUUID(), userId: user.id, name: body.name, iconName: body.iconName })
    .returning({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      iconName: categories.iconName,
    });

  return createdCategory ? toCategoryReference(createdCategory) : null;
}
