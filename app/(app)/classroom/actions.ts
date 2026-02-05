'use server';

import { db } from '@/lib/db/drizzle';
import {
  courses,
  courseSections,
  lessons,
  lessonAttachments,
  courseProgress,
} from '@/lib/db/schema';
import { getUser, isPaidUser } from '@/lib/db/queries';
import { eq, and, asc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ─── Get Published Courses with Progress ────────────────────────────────────

export async function getPublishedCourses() {
  const user = await getUser();
  if (!user) return [];

  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.isPublished, true))
    .orderBy(asc(courses.sortOrder), asc(courses.createdAt));

  // Get progress for current user
  const progress = await db
    .select({
      courseId: courseProgress.courseId,
      completed: sql<number>`count(case when ${courseProgress.completed} = true then 1 end)::int`,
    })
    .from(courseProgress)
    .where(eq(courseProgress.userId, user.id))
    .groupBy(courseProgress.courseId);

  const progressMap = new Map(progress.map((p) => [p.courseId, p.completed]));

  return allCourses.map((course) => ({
    ...course,
    completedLessons: progressMap.get(course.id) ?? 0,
  }));
}

// ─── Get Course Detail (by slug) ────────────────────────────────────────────

export async function getCourseBySlug(slug: string) {
  const user = await getUser();
  if (!user) return null;

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.isPublished, true)))
    .limit(1);

  if (!course) return null;

  const sections = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.courseId, course.id))
    .orderBy(asc(courseSections.sortOrder));

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.sortOrder));

  const attachmentsList = await db
    .select()
    .from(lessonAttachments)
    .where(
      sql`${lessonAttachments.lessonId} IN (SELECT id FROM lessons WHERE course_id = ${course.id})`
    );

  // Get progress for current user
  const progress = await db
    .select()
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, user.id),
        eq(courseProgress.courseId, course.id)
      )
    );

  const completedLessonIds = new Set(
    progress.filter((p) => p.completed).map((p) => p.lessonId)
  );

  const sectionsWithLessons = sections.map((s) => ({
    ...s,
    lessons: courseLessons
      .filter((l) => l.sectionId === s.id)
      .map((l) => ({
        ...l,
        completed: completedLessonIds.has(l.id),
        attachments: attachmentsList.filter((a) => a.lessonId === l.id),
      })),
  }));

  return {
    course,
    sections: sectionsWithLessons,
    completedCount: completedLessonIds.size,
    totalLessons: courseLessons.length,
  };
}

// ─── Get Single Lesson ──────────────────────────────────────────────────────

export async function getLesson(lessonId: number) {
  const user = await getUser();
  if (!user) return null;

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  const attachmentsList = await db
    .select()
    .from(lessonAttachments)
    .where(eq(lessonAttachments.lessonId, lessonId));

  // Check completion
  const [progress] = await db
    .select()
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, user.id),
        eq(courseProgress.lessonId, lessonId)
      )
    )
    .limit(1);

  return {
    ...lesson,
    attachments: attachmentsList,
    completed: progress?.completed ?? false,
  };
}

// ─── Mark Lesson Complete / Incomplete ──────────────────────────────────────

export async function markLessonComplete(lessonId: number, courseId: number) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  // Check if progress record exists
  const [existing] = await db
    .select()
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, user.id),
        eq(courseProgress.lessonId, lessonId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(courseProgress)
      .set({
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(courseProgress.id, existing.id));
  } else {
    await db.insert(courseProgress).values({
      userId: user.id,
      courseId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    });
  }

  revalidatePath(`/classroom`);
  return { success: true, completed: true };
}

export async function markLessonIncomplete(lessonId: number) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  await db
    .update(courseProgress)
    .set({
      completed: false,
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courseProgress.userId, user.id),
        eq(courseProgress.lessonId, lessonId)
      )
    );

  revalidatePath(`/classroom`);
  return { success: true, completed: false };
}

// ─── Mark Lesson as Viewed (auto-tracking) ─────────────────────────────────

export async function markLessonViewed(lessonId: number, courseId: number) {
  const user = await getUser();
  if (!user) return;

  // Only create if not exists — doesn't mark as "completed"
  const [existing] = await db
    .select()
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, user.id),
        eq(courseProgress.lessonId, lessonId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(courseProgress).values({
      userId: user.id,
      courseId,
      lessonId,
      completed: false,
    });
  }
}

// ─── Check access ───────────────────────────────────────────────────────────

export async function canAccessCourse(courseId: number): Promise<{
  hasAccess: boolean;
  isPaidCourse: boolean;
}> {
  const user = await getUser();
  if (!user) return { hasAccess: false, isPaidCourse: false };

  const [course] = await db
    .select({ isPaid: courses.isPaid })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) return { hasAccess: false, isPaidCourse: false };

  if (!course.isPaid) return { hasAccess: true, isPaidCourse: false };

  // Paid course: check if user is paid or admin
  if (user.role === 'admin') return { hasAccess: true, isPaidCourse: true };

  const paid = await isPaidUser(user.id);
  return { hasAccess: paid, isPaidCourse: true };
}
