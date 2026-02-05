import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
});

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (data.name !== undefined) updates.name = data.name;
    if (data.bio !== undefined) updates.bio = data.bio || null;
    if (data.location !== undefined) updates.location = data.location || null;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl || null;
    if (data.websiteUrl !== undefined) updates.websiteUrl = data.websiteUrl || null;
    if (data.facebookUrl !== undefined) updates.facebookUrl = data.facebookUrl || null;
    if (data.linkedinUrl !== undefined) updates.linkedinUrl = data.linkedinUrl || null;
    if (data.twitterUrl !== undefined) updates.twitterUrl = data.twitterUrl || null;

    await db.update(users).set(updates).where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'რაღაც არასწორად წავიდა.' },
      { status: 500 }
    );
  }
}
