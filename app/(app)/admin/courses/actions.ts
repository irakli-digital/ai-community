'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  courses,
  courseSections,
  lessons,
  lessonAttachments,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, asc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  const { hasAdminRole } = await import('@/lib/auth/roles');
  if (!hasAdminRole(user.role)) throw new Error('Access denied.');
  return user;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u10D0-\u10FF-]/g, '') // keep Georgian chars
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function detectVideoProvider(url: string): string | null {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return null;
}

// ─── Get All Courses (Admin) ────────────────────────────────────────────────

export async function getAdminCourses() {
  await requireAdmin();
  return db
    .select()
    .from(courses)
    .orderBy(asc(courses.sortOrder), asc(courses.createdAt));
}

// ─── Get Single Course with Sections & Lessons ──────────────────────────────

export async function getAdminCourse(courseId: number) {
  await requireAdmin();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) return null;

  const sections = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.courseId, courseId))
    .orderBy(asc(courseSections.sortOrder));

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.sortOrder));

  const attachments = await db
    .select()
    .from(lessonAttachments)
    .orderBy(asc(lessonAttachments.createdAt));

  // Group lessons by section
  const sectionsWithLessons = sections.map((s) => ({
    ...s,
    lessons: courseLessons
      .filter((l) => l.sectionId === s.id)
      .map((l) => ({
        ...l,
        attachments: attachments.filter((a) => a.lessonId === l.id),
      })),
  }));

  return { course, sections: sectionsWithLessons };
}

// ─── Create Course ──────────────────────────────────────────────────────────

const createCourseSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().optional(),
  isPaid: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function createCourse(input: z.infer<typeof createCourseSchema>) {
  await requireAdmin();
  const data = createCourseSchema.parse(input);

  const slug = slugify(data.title) || `course-${Date.now()}`;

  const [course] = await db
    .insert(courses)
    .values({
      title: data.title,
      slug,
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      isPaid: data.isPaid ?? false,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath('/admin/courses');
  revalidatePath('/classroom');
  return { courseId: course.id };
}

// ─── Update Course ──────────────────────────────────────────────────────────

const updateCourseSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().optional(),
  isPaid: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function updateCourse(input: z.infer<typeof updateCourseSchema>) {
  await requireAdmin();
  const data = updateCourseSchema.parse(input);

  const slug = slugify(data.title) || `course-${Date.now()}`;

  await db
    .update(courses)
    .set({
      title: data.title,
      slug,
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      isPaid: data.isPaid ?? false,
      sortOrder: data.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, data.id));

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${data.id}`);
  revalidatePath('/classroom');
  return { success: true };
}

// ─── Publish / Unpublish ────────────────────────────────────────────────────

export async function publishCourse(courseId: number) {
  await requireAdmin();
  await db
    .update(courses)
    .set({ isPublished: true, updatedAt: new Date() })
    .where(eq(courses.id, courseId));

  revalidatePath('/admin/courses');
  revalidatePath('/classroom');
  return { success: true };
}

export async function unpublishCourse(courseId: number) {
  await requireAdmin();
  await db
    .update(courses)
    .set({ isPublished: false, updatedAt: new Date() })
    .where(eq(courses.id, courseId));

  revalidatePath('/admin/courses');
  revalidatePath('/classroom');
  return { success: true };
}

// ─── Delete Course ──────────────────────────────────────────────────────────

export async function deleteCourse(courseId: number) {
  await requireAdmin();
  await db.delete(courses).where(eq(courses.id, courseId));
  revalidatePath('/admin/courses');
  revalidatePath('/classroom');
  return { success: true };
}

// ─── Section CRUD ───────────────────────────────────────────────────────────

const createSectionSchema = z.object({
  courseId: z.number(),
  title: z.string().min(1).max(300),
  sortOrder: z.number().optional(),
});

export async function createSection(
  input: z.infer<typeof createSectionSchema>
) {
  await requireAdmin();
  const data = createSectionSchema.parse(input);

  const [section] = await db
    .insert(courseSections)
    .values({
      courseId: data.courseId,
      title: data.title,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath(`/admin/courses/${data.courseId}`);
  return { sectionId: section.id };
}

const updateSectionSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(300),
  sortOrder: z.number().optional(),
});

export async function updateSection(
  input: z.infer<typeof updateSectionSchema>
) {
  await requireAdmin();
  const data = updateSectionSchema.parse(input);

  const [section] = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.id, data.id))
    .limit(1);

  if (!section) throw new Error('Section not found.');

  await db
    .update(courseSections)
    .set({
      title: data.title,
      sortOrder: data.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(courseSections.id, data.id));

  revalidatePath(`/admin/courses/${section.courseId}`);
  return { success: true };
}

export async function deleteSection(sectionId: number) {
  await requireAdmin();

  const [section] = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.id, sectionId))
    .limit(1);

  if (!section) throw new Error('Section not found.');

  await db.delete(courseSections).where(eq(courseSections.id, sectionId));

  // Recalculate totalLessons
  await recalcTotalLessons(section.courseId);

  revalidatePath(`/admin/courses/${section.courseId}`);
  return { success: true };
}

// ─── Lesson CRUD ────────────────────────────────────────────────────────────

const createLessonSchema = z.object({
  sectionId: z.number(),
  courseId: z.number(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  videoUrl: z.string().optional(),
  content: z.string().max(100000).optional(),
  sortOrder: z.number().optional(),
  durationSeconds: z.number().optional(),
});

export async function createLesson(
  input: z.infer<typeof createLessonSchema>
) {
  await requireAdmin();
  const data = createLessonSchema.parse(input);

  const provider = data.videoUrl ? detectVideoProvider(data.videoUrl) : null;

  const [lesson] = await db
    .insert(lessons)
    .values({
      sectionId: data.sectionId,
      courseId: data.courseId,
      title: data.title,
      description: data.description ?? null,
      videoUrl: data.videoUrl ?? null,
      videoProvider: provider,
      content: data.content ?? null,
      sortOrder: data.sortOrder ?? 0,
      durationSeconds: data.durationSeconds ?? null,
    })
    .returning();

  await recalcTotalLessons(data.courseId);

  revalidatePath(`/admin/courses/${data.courseId}`);
  return { lessonId: lesson.id };
}

const updateLessonSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  videoUrl: z.string().optional(),
  content: z.string().max(100000).optional(),
  sortOrder: z.number().optional(),
  durationSeconds: z.number().optional(),
});

export async function updateLesson(
  input: z.infer<typeof updateLessonSchema>
) {
  await requireAdmin();
  const data = updateLessonSchema.parse(input);

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, data.id))
    .limit(1);

  if (!lesson) throw new Error('Lesson not found.');

  const provider = data.videoUrl ? detectVideoProvider(data.videoUrl) : null;

  await db
    .update(lessons)
    .set({
      title: data.title,
      description: data.description ?? null,
      videoUrl: data.videoUrl ?? null,
      videoProvider: provider,
      content: data.content ?? null,
      sortOrder: data.sortOrder ?? 0,
      durationSeconds: data.durationSeconds ?? null,
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, data.id));

  revalidatePath(`/admin/courses/${lesson.courseId}`);
  return { success: true };
}

export async function deleteLesson(lessonId: number) {
  await requireAdmin();

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) throw new Error('Lesson not found.');

  await db.delete(lessons).where(eq(lessons.id, lessonId));
  await recalcTotalLessons(lesson.courseId);

  revalidatePath(`/admin/courses/${lesson.courseId}`);
  return { success: true };
}

// ─── Lesson Attachment CRUD ─────────────────────────────────────────────────

const addAttachmentSchema = z.object({
  lessonId: z.number(),
  fileName: z.string().min(1).max(500),
  fileUrl: z.string().url(),
  fileSizeBytes: z.number().optional(),
  mimeType: z.string().optional(),
});

export async function addLessonAttachment(
  input: z.infer<typeof addAttachmentSchema>
) {
  await requireAdmin();
  const data = addAttachmentSchema.parse(input);

  const [attachment] = await db
    .insert(lessonAttachments)
    .values({
      lessonId: data.lessonId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSizeBytes: data.fileSizeBytes ?? null,
      mimeType: data.mimeType ?? null,
    })
    .returning();

  return { attachmentId: attachment.id };
}

export async function deleteLessonAttachment(attachmentId: number) {
  await requireAdmin();
  await db
    .delete(lessonAttachments)
    .where(eq(lessonAttachments.id, attachmentId));
  return { success: true };
}

// ─── Reorder Sections ───────────────────────────────────────────────────────

export async function reorderSections(
  items: { id: number; sortOrder: number }[]
) {
  await requireAdmin();
  for (const item of items) {
    await db
      .update(courseSections)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(eq(courseSections.id, item.id));
  }
  return { success: true };
}

// ─── Reorder Lessons ────────────────────────────────────────────────────────

export async function reorderLessons(
  items: { id: number; sortOrder: number }[]
) {
  await requireAdmin();
  for (const item of items) {
    await db
      .update(lessons)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(eq(lessons.id, item.id));
  }
  return { success: true };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function recalcTotalLessons(courseId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessons)
    .where(eq(lessons.courseId, courseId));

  const total = result[0]?.count ?? 0;

  await db
    .update(courses)
    .set({ totalLessons: total, updatedAt: new Date() })
    .where(eq(courses.id, courseId));
}
