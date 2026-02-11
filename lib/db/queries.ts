import { desc, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, users, subscriptions, communitySettings } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getUserById(userId: number) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserSubscription(userId: number) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateUserSubscription(
  userId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    stripePriceId: string | null;
    status: string;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }
) {
  // Upsert: insert if not exists, update if exists
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      userId,
      ...subscriptionData,
    });
  }
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getCommunitySettings() {
  const result = await db
    .select()
    .from(communitySettings)
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getMemberCount() {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(isNull(users.deletedAt));

  return result[0]?.count ?? 0;
}

export async function getOnlineMemberCount() {
  // Simulated online count based on total members + Georgia timezone (UTC+4)
  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(isNull(users.deletedAt));

  const totalMembers = totalResult[0]?.count ?? 0;
  if (totalMembers === 0) return 0;

  // Get Georgia time (UTC+4)
  const now = new Date();
  const georgiaHour = (now.getUTCHours() + 4) % 24;

  // Determine percentage range based on time of day
  let minPct: number;
  let maxPct: number;

  if (georgiaHour >= 9 && georgiaHour <= 22) {
    // Daytime: 15-20%
    minPct = 15;
    maxPct = 20;
  } else if (
    (georgiaHour >= 7 && georgiaHour < 9) ||
    georgiaHour === 23
  ) {
    // Transition: 5-10%
    minPct = 5;
    maxPct = 10;
  } else {
    // Night (0-6h): 1-3%
    minPct = 1;
    maxPct = 3;
  }

  // Stable per 20-minute window using seeded pseudo-random (LCG)
  const intervalIndex = Math.floor(now.getTime() / (20 * 60 * 1000));
  const seed = intervalIndex * 2654435761; // Knuth multiplicative hash
  const pseudoRandom = ((seed & 0x7fffffff) % 1000) / 1000; // 0..1

  const pct = minPct + pseudoRandom * (maxPct - minPct);
  const onlineCount = Math.max(1, Math.round(totalMembers * (pct / 100)));

  return onlineCount;
}

export async function isPaidUser(userId: number): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  if (!sub) return false;
  return sub.status === 'active' || sub.status === 'trialing';
}
