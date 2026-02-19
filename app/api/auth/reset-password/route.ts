import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';

const bodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
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
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (!existingUser) {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
