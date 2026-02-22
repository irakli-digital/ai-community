import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { uploadBufferToS3, getPublicUrl } from '@/lib/storage/s3';
import { isPrivateIP } from '@/lib/utils/network';

/**
 * Authenticate a request using Bearer token against API_SECRET.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function authenticateRequest(request: NextRequest): boolean {
  const apiSecret = process.env.API_SECRET;
  if (!apiSecret) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);

  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(apiSecret);

  if (tokenBuffer.length !== secretBuffer.length) return false;
  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

/**
 * Download an image from an HTTPS URL with SSRF protection.
 */
export async function downloadImageFromUrl(
  url: string
): Promise<{ buffer: Buffer; extension: string }> {
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

    const contentType = response.headers.get('content-type') || '';
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('jpeg') || contentType.includes('jpg'))
      extension = 'jpg';
    else {
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

/**
 * Decode a base64-encoded image (plain base64 or data URI).
 */
export function decodeBase64Image(
  data: string
): { buffer: Buffer; extension: string } {
  let base64String = data;
  let extension = 'jpg';

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

/**
 * Resolve an image input (HTTPS URL or base64) to a buffer + extension.
 */
export async function resolveImageInput(
  image: string
): Promise<{ buffer: Buffer; extension: string }> {
  const isUrl = image.startsWith('https://');
  const isDataUri = image.startsWith('data:image/');

  if (isUrl) {
    return downloadImageFromUrl(image);
  } else if (isDataUri || /^[A-Za-z0-9+/]/.test(image)) {
    return decodeBase64Image(image);
  }

  throw new Error('Image must be an HTTPS URL or base64-encoded data.');
}

/**
 * Process an image input and upload to S3 with WebP variants.
 * Returns the public URL of the original image.
 */
export async function processAndUploadImage(
  image: string,
  s3KeyPrefix: string
): Promise<string> {
  const { buffer, extension } = await resolveImageInput(image);

  const timestamp = Date.now();
  const s3Key = `${s3KeyPrefix}/${timestamp}.${extension}`;
  const mimeType =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

  await uploadBufferToS3(s3Key, buffer, mimeType);

  const { processUploadedImage } = await import(
    '@/lib/storage/image-processing'
  );
  await processUploadedImage(s3Key, 'post');

  return getPublicUrl(s3Key);
}
