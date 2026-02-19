import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { magicLinks, users, activityLogs, ActivityType } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';

const BASE_URL = process.env.BASE_URL || 'https://agentictribe.ge';

function redirectTo(path: string) {
  return NextResponse.redirect(`${BASE_URL}${path}`);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return redirectTo('/auth/magic?error=invalid');
  }

  // Look up the magic link
  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!magicLink) {
    return redirectTo('/auth/magic?error=invalid');
  }

  if (magicLink.usedAt) {
    return redirectTo('/auth/magic?error=used');
  }

  if (new Date() > magicLink.expiresAt) {
    return redirectTo('/auth/magic?error=expired');
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
    return redirectTo(magicLink.redirectUrl);
  }

  // New user: redirect to registration page with email + redirectUrl
  const params = new URLSearchParams({
    email: magicLink.email,
    redirectUrl: magicLink.redirectUrl,
  });
  return redirectTo(`/auth/magic?${params.toString()}`);
}
