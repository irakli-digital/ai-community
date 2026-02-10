import { notFound } from 'next/navigation';
import { getCourseBySlug, getLesson, canAccessCourse } from '../../actions';
import { LessonSidebar } from '@/components/classroom/lesson-sidebar';
import { CourseProgressBar } from '@/components/classroom/progress-bar';
import { VideoEmbed } from '@/components/classroom/video-embed';
import { LessonContent } from '@/components/classroom/lesson-content';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId: lessonIdStr } = await params;
  const lessonId = Number(lessonIdStr);
  if (isNaN(lessonId)) notFound();

  const data = await getCourseBySlug(courseSlug);
  if (!data) notFound();

  const { course, sections, completedCount, totalLessons } = data;
  const access = await canAccessCourse(course.id);

  // Access control for paid courses
  if (!access.hasAccess && access.isPaidCourse) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {course.title}
        </h1>
        <div className="mt-6 rounded-lg border border-border bg-secondary p-4">
          <p className="font-medium text-foreground">
            This is a paid course. Subscribe to a paid plan to access this course.
          </p>
          <Link
            href="/settings/billing"
            className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Subscribe
          </Link>
        </div>
      </div>
    );
  }

  const lesson = await getLesson(lessonId);
  if (!lesson) notFound();

  // Find next/prev lessons for navigation
  const allLessons = sections.flatMap((s) => s.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Course header */}
      <div className="mb-4 space-y-2">
        <Link
          href={`/classroom/${courseSlug}`}
          className="text-sm text-primary hover:text-primary/80"
        >
          ← {course.title}
        </Link>
        <CourseProgressBar completed={completedCount} total={totalLessons} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="order-2 w-full shrink-0 lg:order-1 lg:w-72">
          <div className="sticky top-20 rounded-lg border border-border bg-card p-3">
            <LessonSidebar
              sections={sections}
              courseSlug={courseSlug}
              activeLessonId={lessonId}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="order-1 flex-1 lg:order-2">
          <LessonContent
            lesson={lesson}
            courseId={course.id}
            courseSlug={courseSlug}
            isPaidCourse={course.isPaid}
            hasAccess={access.hasAccess}
            prevLessonId={prevLesson?.id ?? null}
            nextLessonId={nextLesson?.id ?? null}
          />
        </div>
      </div>
    </div>
  );
}
