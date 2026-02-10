'use server';

import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function changeUserRole(userId: number, newRole: string) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Access denied.');
  }

  if (!['admin', 'moderator', 'member'].includes(newRole)) {
    throw new Error('Invalid role.');
  }

  // Prevent changing own role (safety)
  if (currentUser.id === userId) {
    throw new Error('Cannot change your own role.');
  }

  await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath('/admin/members');
  return { success: true };
}
