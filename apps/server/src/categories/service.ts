import { db } from '@/db';
import { categories } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import { asc, eq } from 'drizzle-orm';

export async function getCategories({ user }: { user: AuthUser }) {
  return db.query.categories.findMany({
    where: eq(categories.userId, user.id),
    with: {
      parent: true,
    },
    orderBy: [asc(categories.name)],
  });
}
