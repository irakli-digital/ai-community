'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import {
  getAdminCourses,
  publishCourse,
  unpublishCourse,
  deleteCourse,
} from './actions';
import type { Course } from '@/lib/db/schema';
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminCoursesPage() {
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    const data = await getAdminCourses();
    setCourseList(data);
  }

  async function handlePublish(id: number, isPublished: boolean) {
    startTransition(async () => {
      if (isPublished) {
        await unpublishCourse(id);
      } else {
        await publishCourse(id);
      }
      await loadCourses();
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this course? This will delete all sections and lessons.')) return;
    startTransition(async () => {
      await deleteCourse(id);
      await loadCourses();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('admin.courses')}
          </h1>
        </div>
        <Link href="/admin/courses/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t('common.create')}
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {courseList.map((course) => (
          <Card key={course.id} className="py-3">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{course.title}</span>
                    {course.isPaid && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Lock className="h-3 w-3" />
                        Paid
                      </span>
                    )}
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        course.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {course.totalLessons} lessons · #{course.sortOrder}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePublish(course.id, course.isPublished)}
                  disabled={isPending}
                  title={course.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {course.isPublished ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/admin/courses/${course.id}`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(course.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {courseList.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No courses yet. Create your first course!
          </p>
        )}
      </div>
    </div>
  );
}
