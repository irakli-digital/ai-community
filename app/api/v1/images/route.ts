import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';
import {
  authenticateRequest,
  processAndUploadImage,
} from '@/app/api/v1/_lib/helpers';

const IMAGE_RATE_LIMIT = {
  maxAttempts: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const requestSchema = z.object({
  image: z.string().min(1),
  altText: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  if (isRateLimited(`api-images:${clientIp}`, IMAGE_RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 20 image uploads per hour.' },
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

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation error.',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { image, altText } = parsed.data;
  const authorId = parseInt(process.env.API_AUTHOR_USER_ID || '1', 10);

  try {
    const url = await processAndUploadImage(
      image,
      `posts/inline/${authorId}`
    );

    const alt = altText || 'image';
    const markdown = `![${alt}](${url})`;

    return NextResponse.json(
      {
        success: true,
        url,
        altText: alt,
        markdown,
      },
      { status: 201 }
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
