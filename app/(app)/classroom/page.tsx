import type { Metadata } from 'next';
import { t } from '@/lib/i18n/ka';
import { getPublishedCourses } from './actions';
import { CourseCard } from '@/components/classroom/course-card';
import { GraduationCap, Bot, Sparkles, Code2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Classroom — Agentic Tribe',
  description: 'Agentic Tribe courses — learn artificial intelligence and automation.',
  openGraph: {
    title: 'Classroom — Agentic Tribe',
    description: 'Agentic Tribe courses — learn artificial intelligence and automation.',
    type: 'website',
  },
};

const placeholderCourses = [
  {
    icon: Bot,
    title: 'AI Agents & Automation',
    description: 'Build autonomous AI agents that automate complex workflows and tasks.',
  },
  {
    icon: Sparkles,
    title: 'Prompt Engineering',
    description: 'Master the art of crafting effective prompts for large language models.',
  },
  {
    icon: Code2,
    title: 'AI-Powered Web Dev',
    description: 'Integrate AI capabilities into modern web applications.',
  },
];

export default async function ClassroomPage() {
  const courses = await getPublishedCourses();

  if (courses.length > 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('nav.classroom')}</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <div className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Courses Coming Soon
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          We&apos;re preparing comprehensive courses on AI, automation, and modern development. Stay tuned for launch announcements.
        </p>
      </div>

      {/* Placeholder course cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderCourses.map((course) => (
          <div
            key={course.title}
            className="relative rounded-lg border border-border bg-card p-6 opacity-60"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <course.icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {course.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {course.description}
            </p>
            <span className="mt-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              Coming Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
