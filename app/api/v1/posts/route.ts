import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { posts, categories } from '@/lib/db/schema';
import { getUserById } from '@/lib/db/queries';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateUniquePostSlug } from '@/lib/utils/slugify-server';
import { getPostUrl } from '@/lib/utils/post-url';
import { getOrCreateGeneralCategory } from '@/lib/db/community-queries';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';
import {
  authenticateRequest,
  processAndUploadImage,
} from '@/app/api/v1/_lib/helpers';

const API_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  slug: z.string().max(350).optional(),
  categorySlug: z.string().max(100).optional(),
  image: z.string().optional(),
  isDraft: z.boolean().optional().default(true),
});

const patchPostSchema = z.object({
  postId: z.number().int().positive(),
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).max(50000).optional(),
  slug: z.string().max(350).optional(),
  categorySlug: z.string().max(100).nullable().optional(),
  image: z.string().nullable().optional(),
  isDraft: z.boolean().optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthorId(): number {
  return parseInt(process.env.API_AUTHOR_USER_ID || '1', 10);
}

function getBaseUrl(): string {
  return process.env.BASE_URL || 'https://agentictribe.ge';
}

async function resolveCategorySlug(
  categorySlug: string
): Promise<{ id: number; slug: string } | null> {
  const [cat] = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);
  return cat || null;
}

function formatPostResponse(
  post: {
    id: number;
    slug: string;
    title: string;
    content: string;
    featuredImageUrl: string | null;
    isDraft: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  categorySlug: string | null
) {
  const baseUrl = getBaseUrl();
  const postPath = getPostUrl({ slug: post.slug, categorySlug });
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    categorySlug,
    featuredImageUrl: post.featuredImageUrl,
    isDraft: post.isDraft,
    url: `${baseUrl}${postPath}`,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

// ─── GET: List or fetch single post ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  if (isRateLimited(`api-posts-get:${clientIp}`, API_RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 requests per hour.' },
      { status: 429 }
    );
  }

  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  // ── Single post by ID or slug ──
  if (id || slug) {
    const condition = id
      ? eq(posts.id, parseInt(id, 10))
      : eq(posts.slug, slug!);

    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        content: posts.content,
        featuredImageUrl: posts.featuredImageUrl,
        isDraft: posts.isDraft,
        categoryId: posts.categoryId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(and(condition, isNull(posts.deletedAt)))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    const post = rows[0];

    // Resolve category slug
    let categorySlug: string | null = null;
    if (post.categoryId) {
      const [cat] = await db
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.id, post.categoryId))
        .limit(1);
      if (cat) categorySlug = cat.slug;
    }

    return NextResponse.json({
      post: formatPostResponse(post, categorySlug),
    });
  }

  // ── List posts with pagination & filters ──
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1),
    100
  );
  const offset = Math.max(
    parseInt(searchParams.get('offset') || '0', 10) || 0,
    0
  );
  const filterCategorySlug = searchParams.get('categorySlug');
  const filterIsDraft = searchParams.get('isDraft');

  const conditions = [isNull(posts.deletedAt)];

  if (filterCategorySlug) {
    const cat = await resolveCategorySlug(filterCategorySlug);
    if (!cat) {
      return NextResponse.json(
        { error: `Category "${filterCategorySlug}" not found.` },
        { status: 400 }
      );
    }
    conditions.push(eq(posts.categoryId, cat.id));
  }

  if (filterIsDraft === 'true') {
    conditions.push(eq(posts.isDraft, true));
  } else if (filterIsDraft === 'false') {
    conditions.push(eq(posts.isDraft, false));
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(whereClause);

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      content: posts.content,
      featuredImageUrl: posts.featuredImageUrl,
      isDraft: posts.isDraft,
      categoryId: posts.categoryId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(whereClause)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  // Batch-resolve category slugs
  const categoryIds = [
    ...new Set(rows.map((r) => r.categoryId).filter(Boolean)),
  ] as number[];
  const categoryMap = new Map<number, string>();
  if (categoryIds.length > 0) {
    const cats = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories);
    for (const cat of cats) {
      categoryMap.set(cat.id, cat.slug);
    }
  }

  const postsResult = rows.map((post) =>
    formatPostResponse(post, post.categoryId ? (categoryMap.get(post.categoryId) ?? null) : null)
  );

  return NextResponse.json({
    posts: postsResult,
    total: countResult.count,
    limit,
    offset,
  });
}

// ─── POST: Create a new post ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  if (isRateLimited(`api-posts:${clientIp}`, API_RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 requests per hour.' },
      { status: 429 }
    );
  }

  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation error.',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const {
    title,
    content,
    slug: requestSlug,
    categorySlug,
    image,
    isDraft,
  } = parsed.data;

  // Resolve author
  const authorId = getAuthorId();
  const author = await getUserById(authorId);
  if (!author) {
    return NextResponse.json(
      { error: `Author user ID ${authorId} not found.` },
      { status: 400 }
    );
  }

  // Resolve category (default to "general" when none provided)
  let categoryId: number | null = null;
  let resolvedCategorySlug: string | null = null;
  if (categorySlug) {
    const cat = await resolveCategorySlug(categorySlug);
    if (!cat) {
      return NextResponse.json(
        { error: `Category "${categorySlug}" not found.` },
        { status: 400 }
      );
    }
    categoryId = cat.id;
    resolvedCategorySlug = cat.slug;
  } else {
    const general = await getOrCreateGeneralCategory();
    categoryId = general.id;
    resolvedCategorySlug = general.slug;
  }

  // Handle image upload
  let featuredImageUrl: string | null = null;
  if (image) {
    try {
      featuredImageUrl = await processAndUploadImage(
        image,
        `posts/featured/${authorId}`
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: `Image processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
        { status: 400 }
      );
    }
  }

  // Generate slug
  const slug = requestSlug?.trim()
    ? await generateUniquePostSlug(requestSlug)
    : await generateUniquePostSlug(title);

  // Insert post
  const [post] = await db
    .insert(posts)
    .values({
      authorId,
      categoryId,
      title,
      slug,
      content,
      featuredImageUrl,
      isDraft,
    })
    .returning();

  revalidatePath('/community');

  const baseUrl = getBaseUrl();
  const postPath = getPostUrl({
    slug: post.slug,
    categorySlug: resolvedCategorySlug,
  });

  return NextResponse.json(
    {
      success: true,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        categorySlug: resolvedCategorySlug,
        featuredImageUrl: post.featuredImageUrl,
        isDraft: post.isDraft,
        url: `${baseUrl}${postPath}`,
        createdAt: post.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}

// ─── PATCH: Partially update a post ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  if (isRateLimited(`api-posts:${clientIp}`, API_RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 requests per hour.' },
      { status: 429 }
    );
  }

  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = patchPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation error.',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { postId, title, content, slug: requestSlug, categorySlug, image, isDraft } =
    parsed.data;

  // Fetch existing post
  const [existing] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }

  // Permission: only the API author can edit
  const authorId = getAuthorId();
  if (existing.authorId !== authorId) {
    return NextResponse.json(
      { error: 'You can only edit posts created by the API author.' },
      { status: 403 }
    );
  }

  // Build update fields
  const updateFields: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (title !== undefined) {
    updateFields.title = title;
  }

  if (content !== undefined) {
    updateFields.content = content;
  }

  if (isDraft !== undefined) {
    updateFields.isDraft = isDraft;
  }

  // Handle slug: explicit slug > auto from new title > keep existing
  if (requestSlug !== undefined) {
    updateFields.slug = await generateUniquePostSlug(requestSlug, postId);
  } else if (title !== undefined) {
    updateFields.slug = await generateUniquePostSlug(title, postId);
  }

  // Handle category
  if (categorySlug === null) {
    updateFields.categoryId = null;
  } else if (categorySlug !== undefined) {
    const cat = await resolveCategorySlug(categorySlug);
    if (!cat) {
      return NextResponse.json(
        { error: `Category "${categorySlug}" not found.` },
        { status: 400 }
      );
    }
    updateFields.categoryId = cat.id;
  }

  // Handle image
  if (image === null) {
    updateFields.featuredImageUrl = null;
  } else if (image !== undefined) {
    try {
      updateFields.featuredImageUrl = await processAndUploadImage(
        image,
        `posts/featured/${authorId}`
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: `Image processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
        { status: 400 }
      );
    }
  }

  // Execute update
  const [updated] = await db
    .update(posts)
    .set(updateFields)
    .where(eq(posts.id, postId))
    .returning();

  revalidatePath('/community');

  // Resolve category slug for response
  let resolvedCategorySlug: string | null = null;
  if (updated.categoryId) {
    const [cat] = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, updated.categoryId))
      .limit(1);
    if (cat) resolvedCategorySlug = cat.slug;
  }

  return NextResponse.json({
    success: true,
    post: formatPostResponse(updated, resolvedCategorySlug),
  });
}
