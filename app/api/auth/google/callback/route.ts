import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { sendEmailAsync } from '@/lib/email/mailgun';
import { welcomeEmail } from '@/lib/email/templates';

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

  // User denied consent or other Google error
  if (error) {
    return NextResponse.redirect(`${baseUrl}/sign-in`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/sign-in`);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get('google_oauth_state')?.value;
  cookieStore.delete('google_oauth_state');

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/sign-in`);
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
      console.error('[Google OAuth] Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    const tokens = await tokenResponse.json();

    // Fetch user profile
    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    if (!profileResponse.ok) {
      console.error('[Google OAuth] Profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    const profile: GoogleUserInfo = await profileResponse.json();

    if (!profile.email) {
      return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    // Look up existing user by email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.email))
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
          email: profile.email,
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

    // Set JWT session
    await setSession({ id: user.id, role: user.role });

    return NextResponse.redirect(`${baseUrl}/community`);
  } catch (error) {
    console.error('[Google OAuth] Callback error:', error);
    return NextResponse.redirect(`${baseUrl}/sign-in`);
  }
}
