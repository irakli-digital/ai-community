'use client';

import Link from 'next/link';
import Image from 'next/image';
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
      <div className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-secondary">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {course.isPaid && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-amber-100/90 px-2 py-1 text-xs font-medium text-amber-800 backdrop-blur-sm">
              <Lock className="h-3 w-3" />
              Premium
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary line-clamp-2">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{course.totalLessons} {course.totalLessons === 1 ? 'lesson' : 'lessons'}</span>
            {hasProgress && (
              <span className="text-primary font-medium">
                {course.completedLessons}/{course.totalLessons}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {hasProgress && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
