import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Mark individual notification as read
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { notificationId } = body;

  if (notificationId) {
    // Mark single notification as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id)
        )
      );
  } else {
    // Mark all as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.isRead, false)
        )
      );
  }

  return NextResponse.json({ success: true });
}
