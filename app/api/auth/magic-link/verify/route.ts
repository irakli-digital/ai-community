import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { magicLinks, users, activityLogs, ActivityType } from '@/lib/db/schema';
import { signToken } from '@/lib/auth/session';

const BASE_URL = process.env.BASE_URL || 'https://agentictribe.ge';

function redirectTo(path: string) {
  return NextResponse.redirect(`${BASE_URL}${path}`);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    console.log('[Auth] Magic link verify: missing token');
    return redirectTo('/auth/magic?error=invalid');
  }

  // Look up the magic link
  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!magicLink) {
    console.log('[Auth] Magic link verify: token not found');
    return redirectTo('/auth/magic?error=invalid');
  }

  if (magicLink.usedAt) {
    console.log('[Auth] Magic link verify: token already used');
    return redirectTo('/auth/magic?error=used');
  }

  if (new Date() > magicLink.expiresAt) {
    console.log('[Auth] Magic link verify: token expired for email:', magicLink.email);
    return redirectTo('/auth/magic?error=expired');
  }

  // Mark token as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, magicLink.id));

  // Check if user exists (case-insensitive)
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(sql`LOWER(${users.email}) = LOWER(${magicLink.email})`, isNull(users.deletedAt)))
    .limit(1);

  if (existingUser) {
    // Existing user: set session cookie on the redirect response
    // (cookies().set() is silently dropped with NextResponse.redirect() in Route Handlers)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const sessionToken = await signToken({
      user: { id: existingUser.id, role: existingUser.role },
      expires: expires.toISOString(),
    });

    await db.insert(activityLogs).values({
      userId: existingUser.id,
      action: ActivityType.SIGN_IN,
    });

    console.log('[Auth] Magic link sign-in success for user:', existingUser.id, magicLink.email);

    // Redirect via auth-callback page to ensure cookie is processed
    const callbackUrl = new URL('/auth-callback', BASE_URL);
    callbackUrl.searchParams.set('returnTo', magicLink.redirectUrl);
    const response = NextResponse.redirect(callbackUrl);
    response.cookies.set('session', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return response;
  }

  // New user: redirect to registration page with email + redirectUrl
  const params = new URLSearchParams({
    email: magicLink.email,
    redirectUrl: magicLink.redirectUrl,
  });
  return redirectTo(`/auth/magic?${params.toString()}`);
}
