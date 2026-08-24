import { seedStarterCategories } from '@/categories/starter-categories';
import { db } from '@/db';

const users = await db.query.user.findMany({ columns: { id: true } });
const insertedCategoryCounts = await Promise.all(users.map(({ id }) => seedStarterCategories(id)));
const insertedCategoryCount = insertedCategoryCounts.reduce((total, count) => total + count, 0);

console.log(`Seeded ${insertedCategoryCount} starter categories for ${users.length} users.`);
