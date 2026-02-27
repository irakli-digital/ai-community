'use server';

import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import {
  getAllBanners as dbGetAllBanners,
  getBannerById as dbGetBannerById,
  createBanner as dbCreateBanner,
  updateBanner as dbUpdateBanner,
  deleteBanner as dbDeleteBanner,
} from '@/lib/db/banner-queries';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  const { hasAdminRole } = await import('@/lib/auth/roles');
  if (!hasAdminRole(user.role)) throw new Error('Access denied.');
  return user;
}

// ─── Get All Banners ────────────────────────────────────────────────────────

export async function getAdminBanners() {
  await requireAdmin();
  return dbGetAllBanners();
}

// ─── Get Single Banner ──────────────────────────────────────────────────────

export async function getAdminBanner(bannerId: number) {
  await requireAdmin();
  return dbGetBannerById(bannerId);
}

// ─── Create Banner ──────────────────────────────────────────────────────────

const createBannerSchema = z.object({
  title: z.string().max(300).optional(),
  subtitle: z.string().max(5000).optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().max(2000).optional(),
  showButton: z.boolean().optional(),
  buttonText: z.string().max(100).optional(),
});

export async function createBanner(
  input: z.infer<typeof createBannerSchema>
) {
  await requireAdmin();
  const data = createBannerSchema.parse(input);

  const banner = await dbCreateBanner({
    title: data.title,
    subtitle: data.subtitle,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl,
    showButton: data.showButton,
    buttonText: data.buttonText,
  });

  revalidatePath('/admin/banners');
  return { bannerId: banner?.id };
}

// ─── Update Banner ──────────────────────────────────────────────────────────

const updateBannerSchema = z.object({
  id: z.number(),
  title: z.string().max(300).nullable().optional(),
  subtitle: z.string().max(5000).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  linkUrl: z.string().max(2000).nullable().optional(),
  showButton: z.boolean().optional(),
  buttonText: z.string().max(100).optional(),
});

export async function updateBanner(
  input: z.infer<typeof updateBannerSchema>
) {
  await requireAdmin();
  const data = updateBannerSchema.parse(input);

  await dbUpdateBanner(data.id, {
    title: data.title,
    subtitle: data.subtitle,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl,
    showButton: data.showButton,
    buttonText: data.buttonText,
  });

  revalidatePath('/admin/banners');
  revalidatePath(`/admin/banners/${data.id}/edit`);
  return { success: true };
}

// ─── Toggle Active ──────────────────────────────────────────────────────────

export async function toggleBannerActive(bannerId: number, isActive: boolean) {
  await requireAdmin();
  await dbUpdateBanner(bannerId, { isActive: !isActive });
  revalidatePath('/admin/banners');
  return { success: true };
}

// ─── Reorder Banners ────────────────────────────────────────────────────────

export async function reorderBanners(
  items: { id: number; sortOrder: number }[]
) {
  await requireAdmin();
  for (const item of items) {
    await dbUpdateBanner(item.id, { sortOrder: item.sortOrder });
  }
  revalidatePath('/admin/banners');
  return { success: true };
}

// ─── Delete Banner ──────────────────────────────────────────────────────────

export async function deleteBanner(bannerId: number) {
  await requireAdmin();
  await dbDeleteBanner(bannerId);
  revalidatePath('/admin/banners');
  return { success: true };
}
