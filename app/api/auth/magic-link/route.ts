import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, magicLinks } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email/mailgun';
import { magicLinkEmail } from '@/lib/email/templates';
import { isRateLimited } from '@/lib/auth/rate-limit';

const bodySchema = z.object({
  email: z.string().email().max(255),
  redirectUrl: z.string().min(1).max(2000),
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

    const { email, redirectUrl } = parsed.data;

    // Rate limit: 3 requests per email per 10 minutes
    if (isRateLimited(`magic:${email}`, { maxAttempts: 3, windowMs: 10 * 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    const isNewUser = existingUser.length === 0;

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Insert magic link record
    await db.insert(magicLinks).values({
      email,
      token,
      redirectUrl,
      isNewUser,
      expiresAt,
    });

    // Send email
    const template = magicLinkEmail({ token, redirectUrl });
    await sendEmail({ to: email, ...template });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MagicLink] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
