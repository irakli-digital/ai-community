'use server';

import { db } from '@/lib/db/drizzle';
import { communitySettings } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateCommunitySettings(data: {
  name: string;
  description: string;
  aboutContent: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
}) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    throw new Error('წვდომა აკრძალულია.');
  }

  if (!data.name || data.name.trim().length === 0) {
    throw new Error('სახელი აუცილებელია.');
  }

  // Check if settings exist
  const existing = await db.select().from(communitySettings).limit(1);

  if (existing.length > 0) {
    await db
      .update(communitySettings)
      .set({
        name: data.name.trim(),
        description: data.description.trim() || null,
        aboutContent: data.aboutContent.trim() || null,
        logoUrl: data.logoUrl || null,
        coverImageUrl: data.coverImageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(communitySettings.id, existing[0].id));
  } else {
    await db.insert(communitySettings).values({
      name: data.name.trim(),
      description: data.description.trim() || null,
      aboutContent: data.aboutContent.trim() || null,
      logoUrl: data.logoUrl || null,
      coverImageUrl: data.coverImageUrl || null,
      adminUserId: user.id,
    });
  }

  revalidatePath('/');
  revalidatePath('/admin/community-settings');
  return { success: true };
}

export async function uploadAndSetImage(
  type: 'logo' | 'cover',
  url: string
) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    throw new Error('წვდომა აკრძალულია.');
  }

  const existing = await db.select().from(communitySettings).limit(1);
  const field = type === 'logo' ? 'logoUrl' : 'coverImageUrl';

  if (existing.length > 0) {
    await db
      .update(communitySettings)
      .set({ [field]: url, updatedAt: new Date() })
      .where(eq(communitySettings.id, existing[0].id));
  }

  revalidatePath('/');
  return { success: true };
}
