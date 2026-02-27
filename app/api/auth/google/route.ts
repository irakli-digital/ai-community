import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 }
    );
  }

  // Rate limit by IP
  const ip = getClientIp(request.headers);
  if (isRateLimited(`oauth-init:${ip}`)) {
    console.log('[Auth] Rate limited OAuth initiation from IP:', ip);
    return NextResponse.redirect(
      new URL('/sign-in?message=rate-limited', request.url)
    );
  }

  // Generate CSRF state
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store return URL so callback can redirect back to the original page
  const returnTo = request.nextUrl.searchParams.get('returnTo');
  if (returnTo) {
    cookieStore.set('google_oauth_return_to', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });
  }

  const redirectUri = `${process.env.BASE_URL}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
