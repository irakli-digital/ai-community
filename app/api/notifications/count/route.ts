import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { notifications } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, user.id),
        eq(notifications.isRead, false)
      )
    );

  return NextResponse.json({ count: result?.count ?? 0 });
}
