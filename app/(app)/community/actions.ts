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
import { hasAdminRole, hasModRole } from '@/lib/auth/roles';
import { awardPoints, revokePoints } from '@/lib/gamification';
import {
  notifyPostLiked,
  notifyCommentLiked,
  notifyPostCommented,
  notifyCommentReplied,
} from '@/lib/notifications';
import { generateUniquePostSlug } from '@/lib/utils/slugify-server';
import { getPostUrl } from '@/lib/utils/post-url';
import { isPrivateIP } from '@/lib/utils/network';
import { categories } from '@/lib/db/schema';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

async function requirePaidUser() {
  const user = await requireUser();
  const paid = await isPaidUser(user.id);
  if (!paid && !hasAdminRole(user.role)) {
    throw new Error('This feature is only available for paid plan users.');
  }
  return user;
}

async function requireAdminOrMod() {
  const user = await requireUser();
  if (!hasModRole(user.role)) {
    throw new Error('You do not have permission to perform this action.');
  }
  return user;
}

// ─── SSRF-safe OG fetch ─────────────────────────────────────────────────────

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
      headers: { 'User-Agent': 'AgenticTribe-Bot/1.0' },
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
  slug: z.string().max(350).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
  featuredImageUrl: z.string().url().optional().or(z.literal('')),
  isDraft: z.boolean().optional().default(false),
});

export async function createPost(input: z.infer<typeof createPostSchema>) {
  const user = await requirePaidUser();
  const data = createPostSchema.parse(input);

  const slug = data.slug?.trim()
    ? await generateUniquePostSlug(data.slug)
    : await generateUniquePostSlug(data.title);

  const [post] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      categoryId: data.categoryId ?? null,
      title: data.title,
      slug,
      content: data.content,
      featuredImageUrl: data.featuredImageUrl || null,
      isDraft: data.isDraft,
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

  // Look up category slug for redirect
  let categorySlug: string | null = null;
  if (data.categoryId) {
    const [cat] = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);
    categorySlug = cat?.slug ?? null;
  }

  revalidatePath('/community');
  return { postId: post.id, slug: post.slug, categorySlug };
}

// ─── Update Post ────────────────────────────────────────────────────────────

const updatePostSchema = z.object({
  postId: z.number(),
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  categoryId: z.number().nullable().optional(),
  slug: z.string().max(350).optional(),
  featuredImageUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  isDraft: z.boolean().optional(),
});

export async function updatePost(input: z.infer<typeof updatePostSchema>) {
  const user = await requireUser();
  const data = updatePostSchema.parse(input);

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, data.postId), isNull(posts.deletedAt)))
    .limit(1);

  if (!post) throw new Error('Post not found.');
  if (post.authorId !== user.id && !hasModRole(user.role)) {
    throw new Error('You do not have permission to perform this action.');
  }

  // Regenerate slug if title or slug changed
  let newSlug = post.slug;
  if (data.slug?.trim() && data.slug.trim() !== post.slug) {
    newSlug = await generateUniquePostSlug(data.slug.trim(), data.postId);
  } else if (data.title !== post.title) {
    newSlug = await generateUniquePostSlug(data.title, data.postId);
  }

  await db
    .update(posts)
    .set({
      title: data.title,
      slug: newSlug,
      content: data.content,
      categoryId: data.categoryId ?? null,
      featuredImageUrl: data.featuredImageUrl || null,
      ...(data.isDraft !== undefined ? { isDraft: data.isDraft } : {}),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, data.postId));

  // Look up category slug for redirect
  let categorySlug: string | null = null;
  const catId = data.categoryId ?? null;
  if (catId) {
    const [cat] = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, catId))
      .limit(1);
    categorySlug = cat?.slug ?? null;
  }

  revalidatePath('/community');
  revalidatePath('/community-post', 'layout');
  revalidatePath(`/community/${data.postId}`);

  return { slug: newSlug, categorySlug };
}

// ─── Delete Post ────────────────────────────────────────────────────────────

export async function deletePost(postId: number) {
  const user = await requireUser();

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);

  if (!post) throw new Error('Post not found.');
  if (post.authorId !== user.id && !hasModRole(user.role)) {
    throw new Error('You do not have permission to perform this action.');
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

  // Award point to post author (not self)
  const [post] = await db
    .select({
      authorId: posts.authorId,
      title: posts.title,
      slug: posts.slug,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post && post.authorId !== user.id) {
    const result = await awardPoints({
      userId: post.authorId,
      points: 1,
      reason: 'post_liked',
      sourceUserId: user.id,
      sourceType: 'post',
      sourceId: postId,
    });

    // Look up category slug for notification link
    let catSlug: string | null = null;
    if (post.categoryId) {
      const [cat] = await db
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.id, post.categoryId))
        .limit(1);
      catSlug = cat?.slug ?? null;
    }

    // Notify post author
    notifyPostLiked({
      postAuthorId: post.authorId,
      actorId: user.id,
      actorName: user.name || 'User',
      postId,
      postTitle: post.title,
      postSlug: post.slug,
      categorySlug: catSlug,
    }).catch(() => {}); // fire-and-forget

    // Notify level-up if applicable
    if (result.leveledUp) {
      const { notifyLevelUp } = await import('@/lib/notifications');
      notifyLevelUp({ userId: post.authorId, newLevel: result.newLevel }).catch(() => {});
    }
  }

  revalidatePath('/community');
  revalidatePath(`/community-post`, 'layout');
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

  // Revoke point from post author (not self)
  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post && post.authorId !== user.id) {
    await revokePoints({
      userId: post.authorId,
      points: -1,
      reason: 'post_unliked',
      sourceUserId: user.id,
      sourceType: 'post',
      sourceId: postId,
    });
  }

  revalidatePath('/community');
  revalidatePath(`/community-post`, 'layout');
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

  // Notify post author about new comment (fire-and-forget)
  const [commentedPost] = await db
    .select({
      authorId: posts.authorId,
      title: posts.title,
      slug: posts.slug,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(eq(posts.id, data.postId))
    .limit(1);

  // Look up category slug for notification link
  let commentCatSlug: string | null = null;
  if (commentedPost?.categoryId) {
    const [cat] = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, commentedPost.categoryId))
      .limit(1);
    commentCatSlug = cat?.slug ?? null;
  }

  if (commentedPost && commentedPost.authorId !== user.id) {
    notifyPostCommented({
      postAuthorId: commentedPost.authorId,
      actorId: user.id,
      actorName: user.name || 'User',
      postId: data.postId,
      postTitle: commentedPost.title,
      postSlug: commentedPost.slug,
      categorySlug: commentCatSlug,
    }).catch(() => {});
  }

  // Notify parent comment author about reply
  if (data.parentId) {
    const [parentComment] = await db
      .select({ authorId: comments.authorId })
      .from(comments)
      .where(eq(comments.id, data.parentId))
      .limit(1);

    if (parentComment && parentComment.authorId !== user.id) {
      notifyCommentReplied({
        commentAuthorId: parentComment.authorId,
        actorId: user.id,
        actorName: user.name || 'User',
        postId: data.postId,
        postSlug: commentedPost?.slug,
        categorySlug: commentCatSlug,
      }).catch(() => {});
    }
  }

  revalidatePath(`/community-post`, 'layout');
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

  if (!comment) throw new Error('Comment not found.');
  if (
    comment.authorId !== user.id &&
    !hasModRole(user.role)
  ) {
    throw new Error('You do not have permission to perform this action.');
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

  revalidatePath(`/community-post`, 'layout');
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

  // Award point to comment author (not self)
  const [comment] = await db
    .select({ authorId: comments.authorId, content: comments.content, postId: comments.postId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (comment && comment.authorId !== user.id) {
    const result = await awardPoints({
      userId: comment.authorId,
      points: 1,
      reason: 'comment_liked',
      sourceUserId: user.id,
      sourceType: 'comment',
      sourceId: commentId,
    });

    // Fetch post slug data for notification link
    let commentLikeCatSlug: string | null = null;
    const [commentPost] = await db
      .select({ slug: posts.slug, categoryId: posts.categoryId })
      .from(posts)
      .where(eq(posts.id, comment.postId))
      .limit(1);
    if (commentPost?.categoryId) {
      const [cat] = await db
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.id, commentPost.categoryId))
        .limit(1);
      commentLikeCatSlug = cat?.slug ?? null;
    }

    // Notify comment author
    notifyCommentLiked({
      commentAuthorId: comment.authorId,
      actorId: user.id,
      actorName: user.name || 'User',
      postId: comment.postId,
      commentContent: comment.content,
      postSlug: commentPost?.slug,
      categorySlug: commentLikeCatSlug,
    }).catch(() => {});

    if (result.leveledUp) {
      const { notifyLevelUp } = await import('@/lib/notifications');
      notifyLevelUp({ userId: comment.authorId, newLevel: result.newLevel }).catch(() => {});
    }
  }

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

  // Revoke point from comment author (not self)
  const [comment] = await db
    .select({ authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (comment && comment.authorId !== user.id) {
    await revokePoints({
      userId: comment.authorId,
      points: -1,
      reason: 'comment_unliked',
      sourceUserId: user.id,
      sourceType: 'comment',
      sourceId: commentId,
    });
  }

  return { success: true, liked: false };
}

// ─── Get Post Detail (for modal) ─────────────────────────────────────────────

export async function getPostDetail(postId: number) {
  const user = await getUser();
  const { getPostById, getPostComments } = await import(
    '@/lib/db/community-queries'
  );

  const post = await getPostById(postId, user?.id);
  if (!post) return null;

  const postComments = await getPostComments(postId, user?.id);
  const paid = user ? await isPaidUser(user.id) : false;
  const canLike = paid || hasAdminRole(user?.role);
  const isAuthor = user?.id === post.author.id;
  const isAdminOrMod = hasModRole(user?.role);

  return {
    post,
    comments: postComments,
    canLike: canLike ?? false,
    isAuthor,
    isAdminOrMod: isAdminOrMod ?? false,
    userId: user?.id ?? null,
    userRole: user?.role ?? 'member',
  };
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
