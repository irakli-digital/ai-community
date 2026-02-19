import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { magicLinks, users, activityLogs, ActivityType } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/magic?error=invalid', request.url));
  }

  // Look up the magic link
  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!magicLink) {
    return NextResponse.redirect(new URL('/auth/magic?error=invalid', request.url));
  }

  if (magicLink.usedAt) {
    return NextResponse.redirect(new URL('/auth/magic?error=used', request.url));
  }

  if (new Date() > magicLink.expiresAt) {
    return NextResponse.redirect(new URL('/auth/magic?error=expired', request.url));
  }

  // Mark token as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, magicLink.id));

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, magicLink.email), isNull(users.deletedAt)))
    .limit(1);

  if (existingUser) {
    // Existing user: create session and redirect to article
    await setSession({ id: existingUser.id, role: existingUser.role });
    await db.insert(activityLogs).values({
      userId: existingUser.id,
      action: ActivityType.SIGN_IN,
    });
    return NextResponse.redirect(new URL(magicLink.redirectUrl, request.url));
  }

  // New user: redirect to registration page with email + redirectUrl
  const params = new URLSearchParams({
    email: magicLink.email,
    redirectUrl: magicLink.redirectUrl,
  });
  return NextResponse.redirect(new URL(`/auth/magic?${params.toString()}`, request.url));
}
