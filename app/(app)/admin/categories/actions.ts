'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/utils/slugify';

async function requireAdmin() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  const { hasAdminRole } = await import('@/lib/auth/roles');
  if (!hasAdminRole(user.role)) throw new Error('Access denied.');
  return user;
}

// ─── Get All Categories ─────────────────────────────────────────────────────

export async function getCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder, categories.name);
}

// ─── Create Category ────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().optional(),
});

export async function createCategory(
  input: z.infer<typeof createCategorySchema>
) {
  await requireAdmin();
  const data = createCategorySchema.parse(input);

  const slug = slugify(data.name);

  const [category] = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: slug || `cat-${Date.now()}`,
      description: data.description ?? null,
      color: data.color ?? '#6B7280',
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath('/admin/categories');
  revalidatePath('/community');
  return { categoryId: category.id };
}

// ─── Update Category ────────────────────────────────────────────────────────

const updateCategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().optional(),
});

export async function updateCategory(
  input: z.infer<typeof updateCategorySchema>
) {
  await requireAdmin();
  const data = updateCategorySchema.parse(input);

  await db
    .update(categories)
    .set({
      name: data.name,
      slug: slugify(data.name) || `cat-${Date.now()}`,
      description: data.description ?? null,
      color: data.color ?? '#6B7280',
      sortOrder: data.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, data.id));

  revalidatePath('/admin/categories');
  revalidatePath('/community');
  return { success: true };
}

// ─── Delete Category ────────────────────────────────────────────────────────

export async function deleteCategory(id: number) {
  await requireAdmin();

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath('/admin/categories');
  revalidatePath('/community');
  return { success: true };
}
