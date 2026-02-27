import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';

const bodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request.headers);
    if (isRateLimited(`resetpw:${ip}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 })) {
      console.log('[Auth] Rate limited password reset submission from IP:', ip);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`LOWER(${users.email}) = LOWER(${email})`, isNull(users.deletedAt)))
      .limit(1);

    if (!existingUser) {
      console.log('[Auth] Password reset failed: user not found for email:', email);
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(password);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, existingUser.id));

    console.log('[Auth] Password reset success for user:', existingUser.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] Password reset error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
