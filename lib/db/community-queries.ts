import { db } from './drizzle';
import {
  posts,
  postImages,
  postLinks,
  comments,
  postLikes,
  commentLikes,
  categories,
  users,
} from './schema';
import {
  eq,
  and,
  isNull,
  desc,
  asc,
  lt,
  or,
  sql,
  inArray,
} from 'drizzle-orm';

// ─── Feed types ─────────────────────────────────────────────────────────────

export type FeedPost = {
  id: number;
  title: string;
  content: string;
  featuredImageUrl: string | null;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  categoryId: number | null;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
    level: number;
  };
  category: {
    id: number;
    name: string;
    color: string;
  } | null;
  liked: boolean; // whether current user liked it
};

// ─── Get Latest Posts (public, no auth context) ────────────────────────────

export type LatestPost = {
  id: number;
  title: string;
  content: string;
  featuredImageUrl: string | null;
  createdAt: Date;
  author: { id: number; name: string | null; avatarUrl: string | null };
  category: { id: number; name: string; color: string } | null;
  commentsCount: number;
  likesCount: number;
};

export async function getLatestPosts(limit = 6): Promise<LatestPost[]> {
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      featuredImageUrl: posts.featuredImageUrl,
      createdAt: posts.createdAt,
      commentsCount: posts.commentsCount,
      likesCount: posts.likesCount,
      authorId: posts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      catId: categories.id,
      catName: categories.name,
      catColor: categories.color,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(isNull(posts.deletedAt))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    featuredImageUrl: r.featuredImageUrl,
    createdAt: r.createdAt,
    commentsCount: r.commentsCount,
    likesCount: r.likesCount,
    author: { id: r.authorId, name: r.authorName, avatarUrl: r.authorAvatar },
    category: r.catId ? { id: r.catId, name: r.catName!, color: r.catColor! } : null,
  }));
}

// ─── Get Feed Posts ─────────────────────────────────────────────────────────

export async function getFeedPosts(params: {
  cursor?: { createdAt: string; id: number } | null;
  categoryId?: number | null;
  limit?: number;
  userId?: number | null; // current user for like status
}): Promise<{ posts: FeedPost[]; nextCursor: { createdAt: string; id: number } | null }> {
  const limit = params.limit ?? 20;

  // Build conditions
  const conditions = [isNull(posts.deletedAt)];

  if (params.categoryId) {
    conditions.push(eq(posts.categoryId, params.categoryId));
  }

  if (params.cursor) {
    conditions.push(
      or(
        lt(posts.createdAt, new Date(params.cursor.createdAt)),
        and(
          eq(posts.createdAt, new Date(params.cursor.createdAt)),
          lt(posts.id, params.cursor.id)
        )
      )!
    );
  }

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      featuredImageUrl: posts.featuredImageUrl,
      isPinned: posts.isPinned,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      createdAt: posts.createdAt,
      categoryId: posts.categoryId,
      authorId: posts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      authorLevel: users.level,
      catId: categories.id,
      catName: categories.name,
      catColor: categories.color,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1); // fetch one extra for cursor

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;

  // Get like status for current user
  let likedPostIds: Set<number> = new Set();
  if (params.userId && trimmed.length > 0) {
    const postIds = trimmed.map((r) => r.id);
    const likes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, params.userId),
          inArray(postLikes.postId, postIds)
        )
      );
    likedPostIds = new Set(likes.map((l) => l.postId));
  }

  const feedPosts: FeedPost[] = trimmed.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    featuredImageUrl: r.featuredImageUrl,
    isPinned: r.isPinned,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    createdAt: r.createdAt,
    categoryId: r.categoryId,
    author: {
      id: r.authorId,
      name: r.authorName,
      avatarUrl: r.authorAvatar,
      level: r.authorLevel,
    },
    category: r.catId
      ? { id: r.catId, name: r.catName!, color: r.catColor! }
      : null,
    liked: likedPostIds.has(r.id),
  }));

  const nextCursor = hasMore
    ? {
        createdAt: trimmed[trimmed.length - 1].createdAt.toISOString(),
        id: trimmed[trimmed.length - 1].id,
      }
    : null;

  return { posts: feedPosts, nextCursor };
}

// ─── Get Pinned Posts ───────────────────────────────────────────────────────

export async function getPinnedPosts(params: {
  categoryId?: number | null;
  userId?: number | null;
}): Promise<FeedPost[]> {
  const conditions = [isNull(posts.deletedAt), eq(posts.isPinned, true)];

  if (params.categoryId) {
    conditions.push(eq(posts.categoryId, params.categoryId));
  }

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      featuredImageUrl: posts.featuredImageUrl,
      isPinned: posts.isPinned,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      createdAt: posts.createdAt,
      categoryId: posts.categoryId,
      authorId: posts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      authorLevel: users.level,
      catId: categories.id,
      catName: categories.name,
      catColor: categories.color,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt));

  let likedPostIds: Set<number> = new Set();
  if (params.userId && rows.length > 0) {
    const postIds = rows.map((r) => r.id);
    const likes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, params.userId),
          inArray(postLikes.postId, postIds)
        )
      );
    likedPostIds = new Set(likes.map((l) => l.postId));
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    featuredImageUrl: r.featuredImageUrl,
    isPinned: r.isPinned,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    createdAt: r.createdAt,
    categoryId: r.categoryId,
    author: {
      id: r.authorId,
      name: r.authorName,
      avatarUrl: r.authorAvatar,
      level: r.authorLevel,
    },
    category: r.catId
      ? { id: r.catId, name: r.catName!, color: r.catColor! }
      : null,
    liked: likedPostIds.has(r.id),
  }));
}

// ─── Get Single Post with details ───────────────────────────────────────────

export type PostDetail = FeedPost & {
  images: { id: number; url: string; altText: string | null; sortOrder: number }[];
  links: {
    id: number;
    url: string;
    title: string | null;
    description: string | null;
    imageUrl: string | null;
  }[];
};

export async function getPostById(
  postId: number,
  userId?: number | null
): Promise<PostDetail | null> {
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      featuredImageUrl: posts.featuredImageUrl,
      isPinned: posts.isPinned,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      createdAt: posts.createdAt,
      categoryId: posts.categoryId,
      authorId: posts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      authorLevel: users.level,
      catId: categories.id,
      catName: categories.name,
      catColor: categories.color,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);

  if (rows.length === 0) return null;
  const r = rows[0];

  // Get images
  const images = await db
    .select()
    .from(postImages)
    .where(eq(postImages.postId, postId))
    .orderBy(asc(postImages.sortOrder));

  // Get links
  const links = await db
    .select()
    .from(postLinks)
    .where(eq(postLinks.postId, postId));

  // Get like status
  let liked = false;
  if (userId) {
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .limit(1);
    liked = !!existing;
  }

  return {
    id: r.id,
    title: r.title,
    content: r.content,
    featuredImageUrl: r.featuredImageUrl,
    isPinned: r.isPinned,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    createdAt: r.createdAt,
    categoryId: r.categoryId,
    author: {
      id: r.authorId,
      name: r.authorName,
      avatarUrl: r.authorAvatar,
      level: r.authorLevel,
    },
    category: r.catId
      ? { id: r.catId, name: r.catName!, color: r.catColor! }
      : null,
    liked,
    images: images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      sortOrder: img.sortOrder,
    })),
    links: links.map((link) => ({
      id: link.id,
      url: link.url,
      title: link.title,
      description: link.description,
      imageUrl: link.imageUrl,
    })),
  };
}

// ─── Get Comments for a Post ────────────────────────────────────────────────

export type CommentWithAuthor = {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  likesCount: number;
  createdAt: Date;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
    level: number;
  };
  liked: boolean;
  replies: CommentWithAuthor[];
};

export async function getPostComments(
  postId: number,
  userId?: number | null
): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      parentId: comments.parentId,
      content: comments.content,
      likesCount: comments.likesCount,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      authorLevel: users.level,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(and(eq(comments.postId, postId), isNull(comments.deletedAt)))
    .orderBy(asc(comments.createdAt));

  // Get like statuses
  let likedCommentIds: Set<number> = new Set();
  if (userId && rows.length > 0) {
    const commentIds = rows.map((r) => r.id);
    const likes = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.userId, userId),
          inArray(commentLikes.commentId, commentIds)
        )
      );
    likedCommentIds = new Set(likes.map((l) => l.commentId));
  }

  // Build tree (one level threading)
  const allComments = rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    parentId: r.parentId,
    content: r.content,
    likesCount: r.likesCount,
    createdAt: r.createdAt,
    author: {
      id: r.authorId,
      name: r.authorName,
      avatarUrl: r.authorAvatar,
      level: r.authorLevel,
    },
    liked: likedCommentIds.has(r.id),
    replies: [] as CommentWithAuthor[],
  }));

  const topLevel: CommentWithAuthor[] = [];
  const byId = new Map<number, CommentWithAuthor>();

  for (const c of allComments) {
    byId.set(c.id, c);
  }

  for (const c of allComments) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(c);
    } else {
      topLevel.push(c);
    }
  }

  return topLevel;
}

// ─── Related Posts ──────────────────────────────────────────────────────────

export type RelatedPost = {
  id: number;
  title: string;
  featuredImageUrl: string | null;
  commentsCount: number;
  likesCount: number;
  createdAt: Date;
  author: { name: string | null; avatarUrl: string | null };
  category: { name: string; color: string } | null;
};

export async function getRelatedPosts(
  postId: number,
  categoryId: number | null,
  limit = 5
): Promise<RelatedPost[]> {
  // Same category first, then recent posts, excluding the current post
  const conditions = [isNull(posts.deletedAt), sql`${posts.id} != ${postId}`];
  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId));
  }

  let rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      featuredImageUrl: posts.featuredImageUrl,
      commentsCount: posts.commentsCount,
      likesCount: posts.likesCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      catName: categories.name,
      catColor: categories.color,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  // If not enough from same category, backfill with recent posts
  if (categoryId && rows.length < limit) {
    const existingIds = [postId, ...rows.map((r) => r.id)];
    const backfill = await db
      .select({
        id: posts.id,
        title: posts.title,
        featuredImageUrl: posts.featuredImageUrl,
        commentsCount: posts.commentsCount,
        likesCount: posts.likesCount,
        createdAt: posts.createdAt,
        authorName: users.name,
        authorAvatar: users.avatarUrl,
        catName: categories.name,
        catColor: categories.color,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(
        and(
          isNull(posts.deletedAt),
          sql`${posts.id} NOT IN (${sql.join(existingIds.map((id) => sql`${id}`), sql`, `)})`
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit - rows.length);

    rows = [...rows, ...backfill];
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    featuredImageUrl: r.featuredImageUrl,
    commentsCount: r.commentsCount,
    likesCount: r.likesCount,
    createdAt: r.createdAt,
    author: { name: r.authorName, avatarUrl: r.authorAvatar },
    category: r.catName ? { name: r.catName, color: r.catColor! } : null,
  }));
}
