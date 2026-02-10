import type { Metadata } from 'next';
import { t } from '@/lib/i18n/ka';
import { getPublishedCourses } from './actions';
import { CourseCard } from '@/components/classroom/course-card';

export const metadata: Metadata = {
  title: 'Classroom — Agentic Tribe',
  description: 'Agentic Tribe courses — learn artificial intelligence and automation.',
  openGraph: {
    title: 'Classroom — Agentic Tribe',
    description: 'Agentic Tribe courses — learn artificial intelligence and automation.',
    type: 'website',
  },
};

export default async function ClassroomPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('nav.classroom')}</h1>

      {courses.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No courses available yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
