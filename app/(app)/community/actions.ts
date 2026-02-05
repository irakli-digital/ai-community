'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  posts,
  postImages,
  postLinks,
  comments,
  postLikes,
  commentLikes,
  users,
} from '@/lib/db/schema';
import { getUser, isPaidUser } from '@/lib/db/queries';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

async function requirePaidUser() {
  const user = await requireUser();
  const paid = await isPaidUser(user.id);
  if (!paid && user.role !== 'admin') {
    throw new Error('ეს ფუნქცია მხოლოდ ფასიანი გეგმის მომხმარებლებისთვისაა.');
  }
  return user;
}

async function requireAdminOrMod() {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw new Error('არ გაქვთ ამ მოქმედების უფლება.');
  }
  return user;
}

// ─── SSRF-safe OG fetch ─────────────────────────────────────────────────────

function isPrivateIP(hostname: string): boolean {
  // Block private/reserved IP ranges
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  }
  if (hostname === 'localhost' || hostname === '::1') return true;
  return false;
}

async function fetchOGMetadata(
  url: string
): Promise<{ title?: string; description?: string; imageUrl?: string } | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return null;
    if (isPrivateIP(parsed.hostname)) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AI-Circle-Bot/1.0' },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) return null;

    const html = await response.text();
    const truncated = html.slice(0, 50000); // only parse first 50KB

    const getMetaContent = (property: string): string | undefined => {
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
        'i'
      );
      const altRegex = new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        'i'
      );
      return regex.exec(truncated)?.[1] || altRegex.exec(truncated)?.[1];
    };

    const title =
      getMetaContent('og:title') ||
      /<title[^>]*>([^<]*)<\/title>/i.exec(truncated)?.[1];
    const description =
      getMetaContent('og:description') || getMetaContent('description');
    const imageUrl = getMetaContent('og:image');

    return { title, description, imageUrl };
  } catch {
    return null;
  }
}

// ─── Create Post ────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  categoryId: z.number().nullable().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
});

export async function createPost(input: z.infer<typeof createPostSchema>) {
  const user = await requirePaidUser();
  const data = createPostSchema.parse(input);

  const [post] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      categoryId: data.categoryId ?? null,
      title: data.title,
      content: data.content,
    })
    .returning();

  // Insert images
  if (data.imageUrls && data.imageUrls.length > 0) {
    await db.insert(postImages).values(
      data.imageUrls.map((url, i) => ({
        postId: post.id,
        url,
        sortOrder: i,
      }))
    );
  }

  // Fetch and insert link OG metadata
  if (data.linkUrl && data.linkUrl.length > 0) {
    const og = await fetchOGMetadata(data.linkUrl);
    await db.insert(postLinks).values({
      postId: post.id,
      url: data.linkUrl,
      title: og?.title ?? null,
      description: og?.description ?? null,
      imageUrl: og?.imageUrl ?? null,
    });
  }

  revalidatePath('/community');
  return { postId: post.id };
}

// ─── Update Post ────────────────────────────────────────────────────────────

const updatePostSchema = z.object({
  postId: z.number(),
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  categoryId: z.number().nullable().optional(),
});

export async function updatePost(input: z.infer<typeof updatePostSchema>) {
  const user = await requireUser();
  const data = updatePostSchema.parse(input);

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, data.postId), isNull(posts.deletedAt)))
    .limit(1);

  if (!post) throw new Error('პოსტი ვერ მოიძებნა.');
  if (post.authorId !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
    throw new Error('არ გაქვთ ამ მოქმედების უფლება.');
  }

  await db
    .update(posts)
    .set({
      title: data.title,
      content: data.content,
      categoryId: data.categoryId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, data.postId));

  revalidatePath('/community');
  revalidatePath(`/community/${data.postId}`);
  return { success: true };
}

// ─── Delete Post ────────────────────────────────────────────────────────────

export async function deletePost(postId: number) {
  const user = await requireUser();

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);

  if (!post) throw new Error('პოსტი ვერ მოიძებნა.');
  if (post.authorId !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
    throw new Error('არ გაქვთ ამ მოქმედების უფლება.');
  }

  await db
    .update(posts)
    .set({ deletedAt: new Date() })
    .where(eq(posts.id, postId));

  revalidatePath('/community');
  return { success: true };
}

// ─── Like Post ──────────────────────────────────────────────────────────────

export async function likePost(postId: number) {
  const user = await requirePaidUser();

  // Check if already liked
  const existing = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)))
    .limit(1);

  if (existing.length > 0) return { success: true, liked: true };

  await db.insert(postLikes).values({ userId: user.id, postId });
  // Atomic increment
  await db
    .update(posts)
    .set({ likesCount: sql`${posts.likesCount} + 1` })
    .where(eq(posts.id, postId));

  revalidatePath('/community');
  revalidatePath(`/community/${postId}`);
  return { success: true, liked: true };
}

// ─── Unlike Post ────────────────────────────────────────────────────────────

export async function unlikePost(postId: number) {
  const user = await requireUser();

  const [existing] = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)))
    .limit(1);

  if (!existing) return { success: true, liked: false };

  await db
    .delete(postLikes)
    .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)));

  // Atomic decrement
  await db
    .update(posts)
    .set({ likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)` })
    .where(eq(posts.id, postId));

  revalidatePath('/community');
  revalidatePath(`/community/${postId}`);
  return { success: true, liked: false };
}

// ─── Create Comment ─────────────────────────────────────────────────────────

const createCommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(1).max(10000),
  parentId: z.number().nullable().optional(),
});

export async function createComment(
  input: z.infer<typeof createCommentSchema>
) {
  const user = await requireUser(); // All users can comment
  const data = createCommentSchema.parse(input);

  const [comment] = await db
    .insert(comments)
    .values({
      postId: data.postId,
      authorId: user.id,
      parentId: data.parentId ?? null,
      content: data.content,
    })
    .returning();

  // Atomic increment comments count on post
  await db
    .update(posts)
    .set({ commentsCount: sql`${posts.commentsCount} + 1` })
    .where(eq(posts.id, data.postId));

  revalidatePath(`/community/${data.postId}`);
  revalidatePath('/community');
  return { commentId: comment.id };
}

// ─── Delete Comment ─────────────────────────────────────────────────────────

export async function deleteComment(commentId: number) {
  const user = await requireUser();

  const [comment] = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)))
    .limit(1);

  if (!comment) throw new Error('კომენტარი ვერ მოიძებნა.');
  if (
    comment.authorId !== user.id &&
    user.role !== 'admin' &&
    user.role !== 'moderator'
  ) {
    throw new Error('არ გაქვთ ამ მოქმედების უფლება.');
  }

  await db
    .update(comments)
    .set({ deletedAt: new Date() })
    .where(eq(comments.id, commentId));

  // Atomic decrement
  await db
    .update(posts)
    .set({ commentsCount: sql`GREATEST(${posts.commentsCount} - 1, 0)` })
    .where(eq(posts.id, comment.postId));

  revalidatePath(`/community/${comment.postId}`);
  return { success: true };
}

// ─── Like Comment ───────────────────────────────────────────────────────────

export async function likeComment(commentId: number) {
  const user = await requirePaidUser();

  const existing = await db
    .select()
    .from(commentLikes)
    .where(
      and(
        eq(commentLikes.userId, user.id),
        eq(commentLikes.commentId, commentId)
      )
    )
    .limit(1);

  if (existing.length > 0) return { success: true, liked: true };

  await db.insert(commentLikes).values({ userId: user.id, commentId });
  await db
    .update(comments)
    .set({ likesCount: sql`${comments.likesCount} + 1` })
    .where(eq(comments.id, commentId));

  return { success: true, liked: true };
}

// ─── Unlike Comment ─────────────────────────────────────────────────────────

export async function unlikeComment(commentId: number) {
  const user = await requireUser();

  const [existing] = await db
    .select()
    .from(commentLikes)
    .where(
      and(
        eq(commentLikes.userId, user.id),
        eq(commentLikes.commentId, commentId)
      )
    )
    .limit(1);

  if (!existing) return { success: true, liked: false };

  await db
    .delete(commentLikes)
    .where(
      and(
        eq(commentLikes.userId, user.id),
        eq(commentLikes.commentId, commentId)
      )
    );

  await db
    .update(comments)
    .set({ likesCount: sql`GREATEST(${comments.likesCount} - 1, 0)` })
    .where(eq(comments.id, commentId));

  return { success: true, liked: false };
}

// ─── Pin / Unpin Post (admin/mod only) ──────────────────────────────────────

export async function pinPost(postId: number) {
  await requireAdminOrMod();

  await db
    .update(posts)
    .set({ isPinned: true })
    .where(eq(posts.id, postId));

  revalidatePath('/community');
  return { success: true };
}

export async function unpinPost(postId: number) {
  await requireAdminOrMod();

  await db
    .update(posts)
    .set({ isPinned: false })
    .where(eq(posts.id, postId));

  revalidatePath('/community');
  return { success: true };
}
