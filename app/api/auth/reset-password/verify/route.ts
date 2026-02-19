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
    return redirectTo('/auth/reset-password?error=invalid');
  }

  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!magicLink || magicLink.type !== 'password_reset') {
    return redirectTo('/auth/reset-password?error=invalid');
  }

  if (magicLink.usedAt) {
    return redirectTo('/auth/reset-password?error=used');
  }

  if (new Date() > magicLink.expiresAt) {
    return redirectTo('/auth/reset-password?error=expired');
  }

  // Mark token as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, magicLink.id));

  // Redirect to the reset form with the email
  const params = new URLSearchParams({ email: magicLink.email });
  return redirectTo(`/auth/reset-password?${params.toString()}`);
}
