import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { desc, isNull, and, eq, sql, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const levelParam = searchParams.get('level');
  const level = levelParam ? parseInt(levelParam, 10) : null;

  const conditions = [isNull(users.deletedAt)];

  if (search.trim()) {
    conditions.push(ilike(users.name, `%${search.trim()}%`));
  }

  if (level && level >= 1 && level <= 9) {
    conditions.push(eq(users.level, level));
  }

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
    .where(and(...conditions))
    .orderBy(
      desc(sql`COALESCE(${users.lastSeenAt}, '1970-01-01'::timestamp)`),
      desc(users.createdAt)
    )
    .limit(100);

  const members = rows.map((r) => ({
    id: r.id,
    name: r.name,
    avatarUrl: r.avatarUrl,
    level: r.level,
    points: r.points,
    lastSeenAt: r.lastSeenAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ members });
}
