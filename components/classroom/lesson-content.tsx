'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { RichMarkdown } from '@/components/shared/rich-markdown';
import { VideoEmbed } from './video-embed';
import {
  markLessonComplete,
  markLessonIncomplete,
  markLessonViewed,
} from '@/app/(app)/classroom/actions';
import type { Lesson, LessonAttachment } from '@/lib/db/schema';
import {
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type LessonWithMeta = Lesson & {
  attachments: LessonAttachment[];
  completed: boolean;
};

export function LessonContent({
  lesson,
  courseId,
  courseSlug,
  isPaidCourse,
  hasAccess,
  prevLessonId,
  nextLessonId,
}: {
  lesson: LessonWithMeta;
  courseId: number;
  courseSlug: string;
  isPaidCourse: boolean;
  hasAccess: boolean;
  prevLessonId: number | null;
  nextLessonId: number | null;
}) {
  const [completed, setCompleted] = useState(lesson.completed);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  // Auto-mark as viewed when scrolled to bottom
  useEffect(() => {
    if (viewedRef.current) return;
    const el = bottomRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          markLessonViewed(lesson.id, courseId);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [lesson.id, courseId]);

  // Update when lesson changes
  useEffect(() => {
    setCompleted(lesson.completed);
    viewedRef.current = false;
  }, [lesson.id, lesson.completed]);

  function handleToggleComplete() {
    startTransition(async () => {
      if (completed) {
        await markLessonIncomplete(lesson.id);
        setCompleted(false);
      } else {
        await markLessonComplete(lesson.id, courseId);
        setCompleted(true);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Video */}
      {lesson.videoUrl && <VideoEmbed url={lesson.videoUrl} />}

      {/* Title & completion */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">{lesson.title}</h2>
        <Button
          variant={completed ? 'default' : 'ghost'}
          size="sm"
          onClick={handleToggleComplete}
          disabled={isPending}
          className={
            completed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'border border-border'
          }
        >
          {completed ? (
            <>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              <Circle className="mr-1 h-4 w-4" />
              Mark as complete
            </>
          )}
        </Button>
      </div>

      {/* Description */}
      {lesson.description && (
        <p className="text-muted-foreground">{lesson.description}</p>
      )}

      {/* Markdown content */}
      {lesson.content && (
        <RichMarkdown content={lesson.content} showToc />
      )}

      {/* Attachments */}
      {lesson.attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Attachments
          </h3>
          <div className="space-y-1">
            {lesson.attachments.map((attachment) => {
              const canDownload = !isPaidCourse || hasAccess;
              return (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{attachment.fileName}</span>
                    {attachment.fileSizeBytes && (
                      <span className="text-xs text-muted-foreground">
                        ({formatBytes(attachment.fileSizeBytes)})
                      </span>
                    )}
                  </div>
                  {canDownload ? (
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Premium
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {prevLessonId ? (
          <Link href={`/classroom/${courseSlug}/${prevLessonId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous lesson
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextLessonId ? (
          <Link href={`/classroom/${courseSlug}/${nextLessonId}`}>
            <Button variant="ghost" size="sm">
              Next lesson
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Intersection observer sentinel */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
