'use server';

import { db } from '@/lib/db/drizzle';
import { notifications, users } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

// ─── Notification Types ─────────────────────────────────────────────────────

export type NotificationType =
  | 'post_like'
  | 'comment_like'
  | 'post_comment'
  | 'comment_reply'
  | 'level_up'
  | 'new_course'
  | 'announcement';

// ─── Create Notification (with 15-min batching) ────────────────────────────

export async function createNotification(params: {
  userId: number;
  type: NotificationType;
  title: string;
  body?: string;
  linkUrl?: string;
  actorId?: number;
}): Promise<void> {
  // Don't notify yourself
  if (params.actorId && params.actorId === params.userId) return;

  const BATCH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const batchableTypes: NotificationType[] = ['post_like', 'comment_like', 'post_comment', 'comment_reply'];

  if (batchableTypes.includes(params.type)) {
    // Check for existing notification of the same type within the 15-min window
    const windowStart = new Date(Date.now() - BATCH_WINDOW_MS);
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, params.userId),
          eq(notifications.type, params.type),
          gte(notifications.createdAt, windowStart),
          eq(notifications.isRead, false),
          params.linkUrl
            ? eq(notifications.linkUrl, params.linkUrl)
            : sql`true`
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(1);

    if (existing) {
      // Update existing notification with new batch count
      const currentBody = existing.body || '';
      const countMatch = currentBody.match(/^\[(\d+)\]/);
      const currentCount = countMatch ? parseInt(countMatch[1]) : 1;
      const newCount = currentCount + 1;

      // Build batched title
      const batchedTitle = getBatchedTitle(params.type, newCount, params.linkUrl);

      await db
        .update(notifications)
        .set({
          title: batchedTitle,
          body: `[${newCount}]`,
          actorId: params.actorId ?? existing.actorId,
          createdAt: new Date(), // bump to top
        })
        .where(eq(notifications.id, existing.id));

      return;
    }
  }

  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    linkUrl: params.linkUrl ?? null,
    actorId: params.actorId ?? null,
  });
}

function getBatchedTitle(type: NotificationType, count: number, _linkUrl?: string): string {
  switch (type) {
    case 'post_like':
      return `${count} ადამიანმა მოიწონა თქვენი პოსტი`;
    case 'comment_like':
      return `${count} ადამიანმა მოიწონა თქვენი კომენტარი`;
    case 'post_comment':
      return `${count} ახალი კომენტარი თქვენს პოსტზე`;
    case 'comment_reply':
      return `${count} ახალი პასუხი თქვენს კომენტარზე`;
    default:
      return `${count} ახალი შეტყობინება`;
  }
}

// ─── Specific Notification Triggers ─────────────────────────────────────────

export async function notifyPostLiked(params: {
  postAuthorId: number;
  actorId: number;
  actorName: string;
  postId: number;
  postTitle: string;
}): Promise<void> {
  await createNotification({
    userId: params.postAuthorId,
    type: 'post_like',
    title: `${params.actorName}-მ მოიწონა თქვენი პოსტი: "${truncate(params.postTitle, 50)}"`,
    linkUrl: `/community/${params.postId}`,
    actorId: params.actorId,
  });
}

export async function notifyCommentLiked(params: {
  commentAuthorId: number;
  actorId: number;
  actorName: string;
  postId: number;
  commentContent: string;
}): Promise<void> {
  await createNotification({
    userId: params.commentAuthorId,
    type: 'comment_like',
    title: `${params.actorName}-მ მოიწონა თქვენი კომენტარი: "${truncate(params.commentContent, 50)}"`,
    linkUrl: `/community/${params.postId}`,
    actorId: params.actorId,
  });
}

export async function notifyPostCommented(params: {
  postAuthorId: number;
  actorId: number;
  actorName: string;
  postId: number;
  postTitle: string;
}): Promise<void> {
  await createNotification({
    userId: params.postAuthorId,
    type: 'post_comment',
    title: `${params.actorName}-მ დაწერა კომენტარი თქვენს პოსტზე: "${truncate(params.postTitle, 50)}"`,
    linkUrl: `/community/${params.postId}`,
    actorId: params.actorId,
  });
}

export async function notifyCommentReplied(params: {
  commentAuthorId: number;
  actorId: number;
  actorName: string;
  postId: number;
}): Promise<void> {
  await createNotification({
    userId: params.commentAuthorId,
    type: 'comment_reply',
    title: `${params.actorName}-მ უპასუხა თქვენს კომენტარს`,
    linkUrl: `/community/${params.postId}`,
    actorId: params.actorId,
  });
}

export async function notifyLevelUp(params: {
  userId: number;
  newLevel: number;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: 'level_up',
    title: `გილოცავთ! თქვენ მიაღწიეთ ${params.newLevel} დონეს! 🎉`,
    linkUrl: `/members/${params.userId}`,
  });
}

export async function notifyNewCourse(params: {
  courseTitle: string;
  courseSlug: string;
}): Promise<void> {
  // Notify all users
  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.deletedAt} IS NULL`);

  for (const user of allUsers) {
    await createNotification({
      userId: user.id,
      type: 'new_course',
      title: `ახალი კურსი გამოქვეყნდა: "${truncate(params.courseTitle, 80)}"`,
      linkUrl: `/classroom/${params.courseSlug}`,
    });
  }
}

export async function notifyAnnouncement(params: {
  title: string;
  body?: string;
  linkUrl?: string;
}): Promise<void> {
  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.deletedAt} IS NULL`);

  for (const user of allUsers) {
    await createNotification({
      userId: user.id,
      type: 'announcement',
      title: params.title,
      body: params.body,
      linkUrl: params.linkUrl,
    });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
