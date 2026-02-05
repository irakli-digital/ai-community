'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Video, FileText } from 'lucide-react';
import type { CourseSection, Lesson, LessonAttachment } from '@/lib/db/schema';

type LessonWithMeta = Lesson & {
  completed: boolean;
  attachments: LessonAttachment[];
};

type SectionWithLessons = CourseSection & {
  lessons: LessonWithMeta[];
};

export function LessonSidebar({
  sections,
  courseSlug,
  activeLessonId,
}: {
  sections: SectionWithLessons[];
  courseSlug: string;
  activeLessonId?: number;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(sections.map((s) => s.id))
  );

  function toggleSection(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <div key={section.id}>
          {/* Section header */}
          <button
            onClick={() => toggleSection(section.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {expanded.has(section.id) ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            )}
            <span className="line-clamp-1">{section.title}</span>
          </button>

          {/* Lessons */}
          {expanded.has(section.id) && (
            <div className="ml-2 space-y-0.5">
              {section.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <Link
                    key={lesson.id}
                    href={`/classroom/${courseSlug}/${lesson.id}`}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                    )}
                    <span className="line-clamp-1 flex-1">{lesson.title}</span>
                    {lesson.videoUrl && (
                      <Video className="h-3 w-3 shrink-0 text-gray-300" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
