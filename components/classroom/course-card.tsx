'use client';

import Link from 'next/link';
import { Lock, BookOpen } from 'lucide-react';
import type { Course } from '@/lib/db/schema';

type CourseWithProgress = Course & {
  completedLessons: number;
};

export function CourseCard({ course }: { course: CourseWithProgress }) {
  const progress =
    course.totalLessons > 0
      ? Math.round((course.completedLessons / course.totalLessons) * 100)
      : 0;
  const hasProgress = course.completedLessons > 0;

  return (
    <Link href={`/classroom/${course.slug}`}>
      <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-orange-300 hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-300" />
            </div>
          )}
          {course.isPaid && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-amber-100/90 px-2 py-1 text-xs font-medium text-amber-800 backdrop-blur-sm">
              <Lock className="h-3 w-3" />
              ფასიანი
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 line-clamp-2">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {course.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>{course.totalLessons} გაკვეთილი</span>
            {hasProgress && (
              <span className="text-orange-600 font-medium">
                {course.completedLessons}/{course.totalLessons}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {hasProgress && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
