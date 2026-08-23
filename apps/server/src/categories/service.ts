import type { AuthUser } from '@/lib/auth';
import { listCategories } from './repository';

export async function getCategories({ user }: { user: AuthUser }) {
  return await listCategories({ userId: user.id });
}
