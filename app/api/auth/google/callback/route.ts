import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { signToken } from '@/lib/auth/session';
import { sendEmailAsync } from '@/lib/email/mailgun';
import { welcomeEmail } from '@/lib/email/templates';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';

interface GoogleUserInfo {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  // Rate limit by IP
  const ip = getClientIp(request.headers);
  if (isRateLimited(`oauth:${ip}`)) {
    console.log('[Auth] Rate limited OAuth callback from IP:', ip);
    return NextResponse.redirect(`${baseUrl}/sign-in?message=rate-limited`);
  }

  // User denied consent or other Google error
  if (error) {
    console.log('[Auth] Google OAuth denied or errored:', error);
    return NextResponse.redirect(`${baseUrl}/sign-in?message=oauth-failed`);
  }

  if (!code || !state) {
    console.log('[Auth] Google OAuth callback missing code or state');
    return NextResponse.redirect(`${baseUrl}/sign-in?message=oauth-failed`);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get('google_oauth_state')?.value;

  if (!savedState || savedState !== state) {
    console.log('[Auth] Google OAuth state mismatch - savedState:', savedState ? 'present' : 'MISSING', 'state:', state ? 'present' : 'MISSING');
    return NextResponse.redirect(`${baseUrl}/sign-in?message=oauth-state-error`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.log('[Auth] Google OAuth token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${baseUrl}/sign-in?message=oauth-failed`);
    }

    const tokens = await tokenResponse.json();

    // Fetch user profile
    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    if (!profileResponse.ok) {
      console.log('[Auth] Google OAuth profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(`${baseUrl}/sign-in?message=oauth-failed`);
    }

    const profile: GoogleUserInfo = await profileResponse.json();

    if (!profile.email) {
      console.log('[Auth] Google OAuth profile missing email');
      return NextResponse.redirect(`${baseUrl}/sign-in?message=oauth-failed`);
    }

    // Look up existing user by email (case-insensitive)
    const normalizedEmail = profile.email.toLowerCase();
    const existingUsers = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    let user;

    if (existingUsers.length > 0) {
      // Existing user — link Google ID if not already set
      user = existingUsers[0];
      if (!user.googleId) {
        await db
          .update(users)
          .set({ googleId: profile.id })
          .where(eq(users.id, user.id));
      }

      await db.insert(activityLogs).values({
        userId: user.id,
        action: ActivityType.SIGN_IN,
        ipAddress: request.headers.get('x-forwarded-for') || '',
      });
    } else {
      // New user — admin bootstrap logic
      const userCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
      const isFirstUser = (userCount[0]?.count ?? 0) === 0;

      const [createdUser] = await db
        .insert(users)
        .values({
          name: profile.given_name || '',
          lastName: profile.family_name || '',
          email: normalizedEmail,
          googleId: profile.id,
          passwordHash: null,
          avatarUrl: profile.picture || null,
          role: isFirstUser ? 'admin' : 'member',
        })
        .returning();

      user = createdUser;

      await db.insert(activityLogs).values({
        userId: user.id,
        action: ActivityType.SIGN_UP,
        ipAddress: request.headers.get('x-forwarded-for') || '',
      });

      // Fire-and-forget welcome email
      const emailTemplate = welcomeEmail({ email: user.email });
      sendEmailAsync({ to: user.email, ...emailTemplate });
    }

    // Build session token manually (cookies().set() is silently dropped
    // when returning NextResponse.redirect() in Route Handlers)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const token = await signToken({
      user: { id: user.id, role: user.role },
      expires: expires.toISOString(),
    });

    // Redirect via client-side auth-callback page to avoid server redirect race condition
    const returnTo = cookieStore.get('google_oauth_return_to')?.value;
    const finalDestination = returnTo && returnTo.startsWith('/') ? returnTo : '/community';

    console.log('[Auth] Google OAuth success for user:', user.id, user.email);

    const callbackUrl = new URL('/auth-callback', baseUrl);
    callbackUrl.searchParams.set('returnTo', finalDestination);
    const response = NextResponse.redirect(callbackUrl);
    response.cookies.set('session', token, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    response.cookies.delete('google_oauth_state');
    response.cookies.delete('google_oauth_return_to');

    return response;
  } catch (error) {
    console.error('[Auth] Google OAuth callback error:', error);
    return NextResponse.redirect(`${baseUrl}/sign-in?message=oauth-failed`);
  }
}
