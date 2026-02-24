import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';
import { authenticateRequest } from '@/app/api/v1/_lib/helpers';

const API_RATE_LIMIT = {
  maxAttempts: 30,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// ─── GET: List all categories ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  if (isRateLimited(`api-categories-get:${clientIp}`, API_RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 30 requests per hour.' },
      { status: 429 }
    );
  }

  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 }
    );
  }

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      color: categories.color,
    })
    .from(categories)
    .orderBy(asc(categories.name));

  return NextResponse.json({ categories: rows });
}
