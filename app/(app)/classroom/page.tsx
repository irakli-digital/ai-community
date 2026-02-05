import { t } from '@/lib/i18n/ka';
import { getPublishedCourses } from './actions';
import { CourseCard } from '@/components/classroom/course-card';

export default async function ClassroomPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.classroom')}</h1>

      {courses.length === 0 ? (
        <p className="py-8 text-center text-gray-500">
          კურსები ჯერ არ არის.
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
