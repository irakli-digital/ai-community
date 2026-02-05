import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { posts, courses, users } from '@/lib/db/schema';
import { sql, and, isNull, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();
  const tab = searchParams.get('tab') || 'posts';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // Build tsquery from the search terms — use & for AND between words
  const tsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `'${term.replace(/'/g, "''")}'`)
    .join(' & ');

  try {
    if (tab === 'posts') {
      const results = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          createdAt: posts.createdAt,
          authorId: posts.authorId,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
          likesCount: posts.likesCount,
          commentsCount: posts.commentsCount,
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            isNull(posts.deletedAt),
            sql`${posts}.search_vector @@ to_tsquery('simple', ${tsQuery})`
          )
        )
        .orderBy(
          sql`ts_rank(${posts}.search_vector, to_tsquery('simple', ${tsQuery})) DESC`
        )
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(posts)
        .where(
          and(
            isNull(posts.deletedAt),
            sql`${posts}.search_vector @@ to_tsquery('simple', ${tsQuery})`
          )
        );

      return NextResponse.json({
        results,
        total: countResult?.count ?? 0,
      });
    }

    if (tab === 'courses') {
      const results = await db
        .select({
          id: courses.id,
          title: courses.title,
          slug: courses.slug,
          description: courses.description,
          thumbnailUrl: courses.thumbnailUrl,
          isPaid: courses.isPaid,
          totalLessons: courses.totalLessons,
        })
        .from(courses)
        .where(
          and(
            eq(courses.isPublished, true),
            sql`${courses}.search_vector @@ to_tsquery('simple', ${tsQuery})`
          )
        )
        .orderBy(
          sql`ts_rank(${courses}.search_vector, to_tsquery('simple', ${tsQuery})) DESC`
        )
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courses)
        .where(
          and(
            eq(courses.isPublished, true),
            sql`${courses}.search_vector @@ to_tsquery('simple', ${tsQuery})`
          )
        );

      return NextResponse.json({
        results,
        total: countResult?.count ?? 0,
      });
    }

    if (tab === 'members') {
      const results = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          level: users.level,
          points: users.points,
          lastSeenAt: users.lastSeenAt,
        })
        .from(users)
        .where(
          and(
            isNull(users.deletedAt),
            sql`${users.name} ILIKE ${'%' + query + '%'}`
          )
        )
        .orderBy(sql`${users.lastSeenAt} DESC NULLS LAST`)
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(
          and(
            isNull(users.deletedAt),
            sql`${users.name} ILIKE ${'%' + query + '%'}`
          )
        );

      return NextResponse.json({
        results,
        total: countResult?.count ?? 0,
      });
    }

    return NextResponse.json({ results: [], total: 0 });
  } catch (error) {
    console.error('[Search] Error:', error);
    return NextResponse.json({ results: [], total: 0 });
  }
}
