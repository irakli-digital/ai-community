import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { notifications, users } from '@/lib/db/schema';
import { eq, and, desc, lt, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ notifications: [], nextCursor: null });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  const cursor = searchParams.get('cursor');

  const conditions = [eq(notifications.userId, user.id)];

  if (cursor) {
    conditions.push(lt(notifications.id, parseInt(cursor)));
  }

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      linkUrl: notifications.linkUrl,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actorId: notifications.actorId,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id.toString() : null;

  return NextResponse.json({
    notifications: trimmed,
    nextCursor,
  });
}
