import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { processUploadedImage } from '@/lib/storage/image-processing';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { key, category } = (await request.json()) as {
      key: string;
      category: 'avatar' | 'post';
    };

    if (!key || !category) {
      return NextResponse.json(
        { error: 'key and category are required.' },
        { status: 400 }
      );
    }

    if (category !== 'avatar' && category !== 'post') {
      return NextResponse.json(
        { error: 'category must be "avatar" or "post".' },
        { status: 400 }
      );
    }

    // Validate ownership: users can only process their own uploads
    const userPrefix = `avatars/${user.id}/`;
    const postPrefix = `posts/featured/${user.id}/`;
    const uploadPrefix = `uploads/${user.id}/`;
    if (
      !key.startsWith(userPrefix) &&
      !key.startsWith(postPrefix) &&
      !key.startsWith(uploadPrefix)
    ) {
      return NextResponse.json(
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    const variantKeys = await processUploadedImage(key, category);

    return NextResponse.json({ success: true, variants: variantKeys });
  } catch (error) {
    console.error('Image processing error:', error);
    const message =
      error instanceof Error ? error.message : 'Image processing failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
