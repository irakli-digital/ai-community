import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, magicLinks } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email/mailgun';
import { passwordResetEmail } from '@/lib/email/templates';
import { isRateLimited } from '@/lib/auth/rate-limit';

const bodySchema = z.object({
  email: z.string().email().max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Rate limit: 3 requests per email per 10 minutes
    const normalizedEmail = email.toLowerCase();

    if (
      isRateLimited(`reset:${normalizedEmail}`, {
        maxAttempts: 3,
        windowMs: 10 * 60 * 1000,
      })
    ) {
      console.log('[Auth] Rate limited password reset for email:', normalizedEmail);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Always return success to prevent email enumeration
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`LOWER(${users.email}) = ${normalizedEmail}`, isNull(users.deletedAt)))
      .limit(1);

    if (existingUser) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(magicLinks).values({
        email: normalizedEmail,
        token,
        type: 'password_reset',
        redirectUrl: '/auth/reset-password',
        expiresAt,
      });

      const template = passwordResetEmail({ token });
      await sendEmail({ to: normalizedEmail, ...template });
      console.log('[Auth] Password reset email sent to:', normalizedEmail);
    } else {
      console.log('[Auth] Password reset requested for unknown email:', normalizedEmail);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
