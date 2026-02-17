import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucket = process.env.AWS_S3_BUCKET || '';

/**
 * Generate a presigned URL for direct client-side upload to S3.
 */
export async function getPresignedUploadUrl({
  key,
  contentType,
  contentLength,
}: {
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<{ url: string; key: string }> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(
      `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  // Validate file size
  if (contentLength > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum 5MB.');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  return { url, key };
}

/**
 * Get the public URL for an S3 object.
 */
export function getPublicUrl(key: string): string {
  return `https://${bucket}.s3.${process.env.AWS_S3_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
}

/**
 * Generate a unique S3 key for avatar uploads.
 */
export function getAvatarKey(userId: number, extension: string): string {
  const timestamp = Date.now();
  return `avatars/${userId}/${timestamp}.${extension}`;
}

/**
 * Generate a unique S3 key for post image uploads.
 */
export function getPostImageKey(postId: number, index: number, extension: string): string {
  const timestamp = Date.now();
  return `posts/${postId}/${timestamp}-${index}.${extension}`;
}

/**
 * Generate a unique S3 key for course content uploads.
 */
export function getCourseFileKey(courseId: number, fileName: string): string {
  const timestamp = Date.now();
  return `courses/${courseId}/${timestamp}-${fileName}`;
}

/**
 * Delete an object from S3.
 */
export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * Download an object from S3 as a Buffer.
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await s3Client.send(command);
  const stream = response.Body;
  if (!stream) throw new Error('Empty response body from S3');

  // Convert the readable stream to a Buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Upload a Buffer to S3.
 */
export async function uploadBufferToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await s3Client.send(command);
}

export { s3Client, bucket, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
