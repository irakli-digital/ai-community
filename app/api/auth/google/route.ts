import { NextRequest, NextResponse } from 'next/server';
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
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieFlags = `HttpOnly; SameSite=Lax; Path=/; Max-Age=600${isProduction ? '; Secure' : ''}`;

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

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Build redirect response and set cookies directly on it
  // (cookies().set() is silently dropped on NextResponse.redirect() in standalone mode)
  const response = NextResponse.redirect(googleUrl);

  response.headers.append('Set-Cookie', `google_oauth_state=${state}; ${cookieFlags}`);

  const returnTo = request.nextUrl.searchParams.get('returnTo');
  if (returnTo) {
    response.headers.append('Set-Cookie', `google_oauth_return_to=${encodeURIComponent(returnTo)}; ${cookieFlags}`);
  }

  return response;
}
