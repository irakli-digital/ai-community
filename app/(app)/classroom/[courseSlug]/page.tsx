import { redirect, notFound } from 'next/navigation';
import { getCourseBySlug, canAccessCourse } from '../actions';
import { CourseProgressBar } from '@/components/classroom/progress-bar';
import { LessonSidebar } from '@/components/classroom/lesson-sidebar';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const data = await getCourseBySlug(courseSlug);
  if (!data) notFound();

  const { course, sections, completedCount, totalLessons } = data;
  const access = await canAccessCourse(course.id);

  // If paid course and no access — show upgrade prompt
  if (!access.hasAccess && access.isPaidCourse) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-2 text-muted-foreground">{course.description}</p>
        )}
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

  // Find first lesson to redirect to (or show overview)
  const firstLesson = sections[0]?.lessons[0];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Course header */}
      <div className="mb-6 space-y-3">
        <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground">{course.description}</p>
        )}
        <CourseProgressBar completed={completedCount} total={totalLessons} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full shrink-0 lg:w-72">
          <div className="sticky top-20 rounded-lg border border-border bg-card p-3">
            <LessonSidebar
              sections={sections}
              courseSlug={courseSlug}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1">
          {firstLesson ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                Select a lesson from the sidebar or
              </p>
              <Link
                href={`/classroom/${courseSlug}/${firstLesson.id}`}
                className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Start from the first lesson
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                This course has no lessons yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
