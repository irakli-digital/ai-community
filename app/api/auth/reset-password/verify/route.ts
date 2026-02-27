import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { magicLinks } from '@/lib/db/schema';

const BASE_URL = process.env.BASE_URL || 'https://agentictribe.ge';

function redirectTo(path: string) {
  return NextResponse.redirect(`${BASE_URL}${path}`);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    console.log('[Auth] Password reset verify: missing token');
    return redirectTo('/auth/reset-password?error=invalid');
  }

  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!magicLink || magicLink.type !== 'password_reset') {
    console.log('[Auth] Password reset verify: invalid token');
    return redirectTo('/auth/reset-password?error=invalid');
  }

  if (magicLink.usedAt) {
    console.log('[Auth] Password reset verify: token already used');
    return redirectTo('/auth/reset-password?error=used');
  }

  if (new Date() > magicLink.expiresAt) {
    console.log('[Auth] Password reset verify: token expired for email:', magicLink.email);
    return redirectTo('/auth/reset-password?error=expired');
  }

  // Mark token as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, magicLink.id));

  console.log('[Auth] Password reset token verified for email:', magicLink.email);

  // Redirect to the reset form with the email
  const params = new URLSearchParams({ email: magicLink.email });
  return redirectTo(`/auth/reset-password?${params.toString()}`);
}
