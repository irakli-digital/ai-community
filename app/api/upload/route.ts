import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getPresignedUploadUrl,
  getAvatarKey,
  getPublicUrl,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/storage/s3';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, contentType, contentLength, category } = body as {
      fileName: string;
      contentType: string;
      contentLength: number;
      category?: 'avatar' | 'post' | 'course';
    };

    if (!fileName || !contentType || !contentLength) {
      return NextResponse.json(
        { error: 'fileName, contentType, and contentLength are required.' },
        { status: 400 }
      );
    }

    // Validate
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (contentLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum 5MB.' },
        { status: 400 }
      );
    }

    // Determine key based on category
    const extension = fileName.split('.').pop() || 'jpg';
    let key: string;

    switch (category) {
      case 'avatar':
        key = getAvatarKey(user.id, extension);
        break;
      default:
        key = `uploads/${user.id}/${Date.now()}.${extension}`;
        break;
    }

    const { url } = await getPresignedUploadUrl({
      key,
      contentType,
      contentLength,
    });

    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl: url, publicUrl, key });
  } catch (error) {
    console.error('Upload error:', error);
    const message =
      error instanceof Error ? error.message : 'Upload error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
