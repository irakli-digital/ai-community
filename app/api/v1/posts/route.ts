import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/lib/db/drizzle';
import { posts, categories } from '@/lib/db/schema';
import { getUserById } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { uploadBufferToS3, getPublicUrl } from '@/lib/storage/s3';
import { processUploadedImage } from '@/lib/storage/image-processing';
import { generateUniquePostSlug } from '@/lib/utils/slugify-server';
import { getPostUrl } from '@/lib/utils/post-url';
import { isPrivateIP } from '@/lib/utils/network';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';

const API_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const requestSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  slug: z.string().max(350).optional(),
  categorySlug: z.string().max(100).optional(),
  image: z.string().optional(),
});

function authenticateRequest(request: NextRequest): boolean {
  const apiSecret = process.env.API_SECRET;
  if (!apiSecret) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);

  // Constant-time comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(apiSecret);

  if (tokenBuffer.length !== secretBuffer.length) return false;
  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

async function downloadImageFromUrl(url: string): Promise<{ buffer: Buffer; extension: string }> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS image URLs are allowed');
  }
  if (isPrivateIP(parsed.hostname)) {
    throw new Error('Private/reserved IP addresses are not allowed');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AgenticTribe-Bot/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new Error('Image too large (max 10MB)');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine extension from content-type or URL
    const contentType = response.headers.get('content-type') || '';
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
    else {
      // Fallback: try from URL path
      const pathExt = parsed.pathname.split('.').pop()?.toLowerCase();
      if (pathExt && ['jpg', 'jpeg', 'png', 'webp'].includes(pathExt)) {
        extension = pathExt === 'jpeg' ? 'jpg' : pathExt;
      }
    }

    return { buffer, extension };
  } finally {
    clearTimeout(timeout);
  }
}

function decodeBase64Image(data: string): { buffer: Buffer; extension: string } {
  let base64String = data;
  let extension = 'jpg';

  // Handle data URI format: data:image/png;base64,iVBOR...
  const dataUriMatch = data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (dataUriMatch) {
    const mimeExt = dataUriMatch[1];
    base64String = dataUriMatch[2];
    if (mimeExt === 'jpeg') extension = 'jpg';
    else if (['png', 'webp', 'jpg'].includes(mimeExt)) extension = mimeExt;
  }

  const buffer = Buffer.from(base64String, 'base64');
  if (buffer.length === 0) {
    throw new Error('Invalid base64 image data');
  }
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('Image too large (max 10MB)');
  }

  return { buffer, extension };
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request.headers);
  if (isRateLimited(`api-posts:${clientIp}`, API_RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 requests per hour.' },
      { status: 429 }
    );
  }

  // Authentication
  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, content, slug: requestSlug, categorySlug, image } = parsed.data;

  // Resolve author
  const authorId = parseInt(process.env.API_AUTHOR_USER_ID || '1', 10);
  const author = await getUserById(authorId);
  if (!author) {
    return NextResponse.json(
      { error: `Author user ID ${authorId} not found.` },
      { status: 400 }
    );
  }

  // Resolve category
  let categoryId: number | null = null;
  let resolvedCategorySlug: string | null = null;
  if (categorySlug) {
    const [cat] = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!cat) {
      return NextResponse.json(
        { error: `Category "${categorySlug}" not found.` },
        { status: 400 }
      );
    }
    categoryId = cat.id;
    resolvedCategorySlug = cat.slug;
  }

  // Handle image upload
  let featuredImageUrl: string | null = null;
  if (image) {
    try {
      let imageBuffer: Buffer;
      let extension: string;

      const isUrl = image.startsWith('https://');
      const isDataUri = image.startsWith('data:image/');

      if (isUrl) {
        const result = await downloadImageFromUrl(image);
        imageBuffer = result.buffer;
        extension = result.extension;
      } else if (isDataUri || /^[A-Za-z0-9+/]/.test(image)) {
        const result = decodeBase64Image(image);
        imageBuffer = result.buffer;
        extension = result.extension;
      } else {
        return NextResponse.json(
          { error: 'Image must be an HTTPS URL or base64-encoded data.' },
          { status: 400 }
        );
      }

      // Upload original to S3
      const timestamp = Date.now();
      const s3Key = `posts/featured/${authorId}/${timestamp}.${extension}`;
      const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
      await uploadBufferToS3(s3Key, imageBuffer, mimeType);

      // Generate WebP variants
      await processUploadedImage(s3Key, 'post');

      featuredImageUrl = getPublicUrl(s3Key);
    } catch (err) {
      return NextResponse.json(
        { error: `Image processing failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
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
    })
    .returning();

  revalidatePath('/community');

  const baseUrl = process.env.BASE_URL || 'https://agentictribe.ge';
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
        url: `${baseUrl}${postPath}`,
        createdAt: post.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
