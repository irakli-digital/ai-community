import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { hasAdminRole } from '@/lib/auth/roles';

const protectedRoutes = ['/community', '/community-post', '/classroom', '/members', '/leaderboard', '/settings', '/notifications', '/search'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect public pages to /waitinglist while the site is in pre-launch mode
  // Allow /sign-in, /admin, /api, and static assets through so admins can log in
  if (process.env.PRE_LAUNCH === 'true') {
    const allowedInPreLaunch =
      pathname === '/waitinglist' ||
      pathname.startsWith('/sign-in') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api') ||
      pathname.includes('.');

    if (!allowedInPreLaunch) {
      // If user is logged in as admin, let them through
      const session = request.cookies.get('session');
      if (session) {
        try {
          const parsed = await verifyToken(session.value);
          if (hasAdminRole(parsed.user.role)) {
            // Admin — skip pre-launch redirect
          } else {
            return NextResponse.redirect(new URL('/waitinglist', request.url));
          }
        } catch {
          return NextResponse.redirect(new URL('/waitinglist', request.url));
        }
      } else {
        return NextResponse.redirect(new URL('/waitinglist', request.url));
      }
    }
  }

  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isPublicPostRoute = /^\/community\/\d+$/.test(pathname) || /^\/community-post\/[^/]+\/[^/]+$/.test(pathname);

  if ((isProtectedRoute || isAdminRoute) && !sessionCookie && !isPublicPostRoute) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);

      // Redirect logged-in users from homepage to community
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/community', request.url));
      }

      // Admin route protection
      if (isAdminRoute && !hasAdminRole(parsed.user.role)) {
        return NextResponse.redirect(new URL('/community', request.url));
      }

      const expiresInOneDay = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresInOneDay,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute || isAdminRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
