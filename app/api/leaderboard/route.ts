import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, pointEvents } from '@/lib/db/schema';
import { desc, isNull, sql, gte, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'all';

  let entries;

  if (period === '7d' || period === '30d') {
    const days = period === '7d' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate from pointEvents for time-filtered leaderboards
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        level: users.level,
        lastSeenAt: users.lastSeenAt,
        points: sql<number>`COALESCE(SUM(${pointEvents.points}), 0)::int`.as('total_points'),
      })
      .from(pointEvents)
      .innerJoin(users, sql`${pointEvents.userId} = ${users.id}`)
      .where(
        and(
          gte(pointEvents.createdAt, since),
          isNull(users.deletedAt)
        )
      )
      .groupBy(users.id)
      .having(sql`SUM(${pointEvents.points}) > 0`)
      .orderBy(desc(sql`total_points`))
      .limit(50);

    entries = rows.map((r) => ({
      id: r.id,
      name: r.name,
      avatarUrl: r.avatarUrl,
      level: r.level,
      points: r.points,
      lastSeenAt: r.lastSeenAt?.toISOString() ?? null,
    }));
  } else {
    // All-time: read directly from users.points
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        level: users.level,
        points: users.points,
        lastSeenAt: users.lastSeenAt,
      })
      .from(users)
      .where(and(isNull(users.deletedAt), sql`${users.points} > 0`))
      .orderBy(desc(users.points))
      .limit(50);

    entries = rows.map((r) => ({
      id: r.id,
      name: r.name,
      avatarUrl: r.avatarUrl,
      level: r.level,
      points: r.points,
      lastSeenAt: r.lastSeenAt?.toISOString() ?? null,
    }));
  }

  return NextResponse.json({ entries });
}
