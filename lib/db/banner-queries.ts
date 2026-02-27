import { db } from './drizzle';
import { sidebarBanners } from './schema';
import { eq, asc, desc } from 'drizzle-orm';

// ─── Active Banners (public) ────────────────────────────────────────────────

export async function getActiveBanners() {
  return await db
    .select()
    .from(sidebarBanners)
    .where(eq(sidebarBanners.isActive, true))
    .orderBy(asc(sidebarBanners.sortOrder));
}

// ─── All Banners (admin) ────────────────────────────────────────────────────

export async function getAllBanners() {
  return await db
    .select()
    .from(sidebarBanners)
    .orderBy(asc(sidebarBanners.sortOrder), desc(sidebarBanners.createdAt));
}

// ─── Get By ID ──────────────────────────────────────────────────────────────

export async function getBannerById(id: number) {
  const [banner] = await db
    .select()
    .from(sidebarBanners)
    .where(eq(sidebarBanners.id, id))
    .limit(1);

  return banner ?? null;
}

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createBanner(data: {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  showButton?: boolean;
  buttonText?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const [banner] = await db
    .insert(sidebarBanners)
    .values({
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      showButton: data.showButton ?? false,
      buttonText: data.buttonText ?? 'Learn More',
      isActive: data.isActive ?? false,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  return banner;
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateBanner(
  id: number,
  data: {
    title?: string | null;
    subtitle?: string | null;
    imageUrl?: string | null;
    linkUrl?: string | null;
    showButton?: boolean;
    buttonText?: string;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.subtitle !== undefined) updateFields.subtitle = data.subtitle;
  if (data.imageUrl !== undefined) updateFields.imageUrl = data.imageUrl;
  if (data.linkUrl !== undefined) updateFields.linkUrl = data.linkUrl;
  if (data.showButton !== undefined) updateFields.showButton = data.showButton;
  if (data.buttonText !== undefined) updateFields.buttonText = data.buttonText;
  if (data.isActive !== undefined) updateFields.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateFields.sortOrder = data.sortOrder;

  await db
    .update(sidebarBanners)
    .set(updateFields)
    .where(eq(sidebarBanners.id, id));

  return getBannerById(id);
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteBanner(id: number) {
  await db.delete(sidebarBanners).where(eq(sidebarBanners.id, id));
}
