import { db } from '@/lib/db/drizzle';
import { users, pointEvents } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// ─── Level Thresholds ───────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 10, 30, 70, 150, 300, 600, 1200, 2500] as const;

/**
 * Calculate level from points (1-9)
 */
export function calculateLevel(points: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

/**
 * Get points required for a specific level
 */
export function getPointsForLevel(level: number): number {
  if (level < 1 || level > 9) return 0;
  return LEVEL_THRESHOLDS[level - 1];
}

/**
 * Get points required for the next level (or null if max level)
 */
export function getPointsForNextLevel(currentLevel: number): number | null {
  if (currentLevel >= 9) return null;
  return LEVEL_THRESHOLDS[currentLevel]; // currentLevel is 1-indexed, so index = currentLevel for next
}

// ─── Award Points ───────────────────────────────────────────────────────────

/**
 * Award points to a user (when someone likes their content).
 * Also logs the event and updates the user's level.
 */
export async function awardPoints(params: {
  userId: number; // recipient (content author)
  points: number; // +1 typically
  reason: string; // 'post_liked' | 'comment_liked'
  sourceUserId: number; // the liker
  sourceType: 'post' | 'comment';
  sourceId: number; // postId or commentId
}): Promise<{ newPoints: number; newLevel: number; leveledUp: boolean }> {
  // Log the point event
  await db.insert(pointEvents).values({
    userId: params.userId,
    points: params.points,
    reason: params.reason,
    sourceUserId: params.sourceUserId,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
  });

  // Atomic increment (floor at 0)
  const [updated] = await db
    .update(users)
    .set({
      points: sql`GREATEST(${users.points} + ${params.points}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.userId))
    .returning({ points: users.points, level: users.level });

  if (!updated) {
    return { newPoints: 0, newLevel: 1, leveledUp: false };
  }

  const newLevel = calculateLevel(updated.points);
  const leveledUp = newLevel > updated.level;

  // Update level if changed
  if (newLevel !== updated.level) {
    await db
      .update(users)
      .set({ level: newLevel })
      .where(eq(users.id, params.userId));
  }

  return {
    newPoints: updated.points,
    newLevel,
    leveledUp,
  };
}

/**
 * Revoke points from a user (when a like is removed).
 */
export async function revokePoints(params: {
  userId: number;
  points: number; // -1 typically (pass as negative)
  reason: string; // 'post_unliked' | 'comment_unliked'
  sourceUserId: number;
  sourceType: 'post' | 'comment';
  sourceId: number;
}): Promise<{ newPoints: number; newLevel: number }> {
  // Log the point event
  await db.insert(pointEvents).values({
    userId: params.userId,
    points: params.points,
    reason: params.reason,
    sourceUserId: params.sourceUserId,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
  });

  // Atomic decrement (floor at 0)
  const [updated] = await db
    .update(users)
    .set({
      points: sql`GREATEST(${users.points} + ${params.points}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.userId))
    .returning({ points: users.points, level: users.level });

  if (!updated) {
    return { newPoints: 0, newLevel: 1 };
  }

  const newLevel = calculateLevel(updated.points);

  // Update level if changed
  if (newLevel !== updated.level) {
    await db
      .update(users)
      .set({ level: newLevel })
      .where(eq(users.id, params.userId));
  }

  return {
    newPoints: updated.points,
    newLevel,
  };
}
