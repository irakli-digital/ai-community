import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql, isNull, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { hashPassword, setSession } from '@/lib/auth/session';
import { sendEmailAsync } from '@/lib/email/mailgun';
import { welcomeEmail } from '@/lib/email/templates';

const bodySchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
  redirectUrl: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input. Please fill all fields correctly.' },
        { status: 400 }
      );
    }

    const { email, name, lastName, password } = parsed.data;

    // Check user doesn't already exist
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [createdUser] = await db
      .insert(users)
      .values({
        name,
        lastName,
        email,
        passwordHash,
        role: 'member',
      })
      .returning();

    if (!createdUser) {
      return NextResponse.json(
        { error: 'Failed to create account.' },
        { status: 500 }
      );
    }

    await Promise.all([
      setSession({ id: createdUser.id, role: createdUser.role }),
      db.insert(activityLogs).values({
        userId: createdUser.id,
        action: ActivityType.SIGN_UP,
      }),
    ]);

    // Fire-and-forget welcome email
    const emailTemplate = welcomeEmail({ email: createdUser.email });
    sendEmailAsync({ to: createdUser.email, ...emailTemplate });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MagicLink Register] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
