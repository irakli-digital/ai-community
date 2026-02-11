/**
 * Derives a variant URL from an original S3 image URL.
 *
 * Original: https://bucket.s3.region.amazonaws.com/posts/featured/42/1700000000.jpg
 * Variant:  https://bucket.s3.region.amazonaws.com/posts/featured/42/1700000000/sm.webp
 *
 * Non-S3 URLs (e.g. external images in markdown) pass through unchanged.
 */
export function getImageVariantUrl(
  originalUrl: string,
  variant: string
): string {
  if (!originalUrl) return originalUrl;

  // Only transform S3 image URLs (amazonaws.com)
  if (!originalUrl.includes('.amazonaws.com/')) return originalUrl;

  // Only transform known image extensions
  if (!/\.(jpe?g|png|webp)$/i.test(originalUrl)) return originalUrl;

  // Strip the file extension and append /{variant}.webp
  const dotIndex = originalUrl.lastIndexOf('.');
  if (dotIndex === -1) return originalUrl;

  const base = originalUrl.slice(0, dotIndex);
  return `${base}/${variant}.webp`;
}

/**
 * Extracts the S3 key from a full S3 public URL.
 * e.g. "https://bucket.s3.region.amazonaws.com/avatars/1/123.jpg" -> "avatars/1/123.jpg"
 */
export function getS3KeyFromUrl(url: string): string | null {
  if (!url.includes('.amazonaws.com/')) return null;
  const match = url.match(/\.amazonaws\.com\/(.+)$/);
  return match ? match[1] : null;
}
