import { db } from '@/lib/db/drizzle';
import { posts, surveys } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { slugify } from './slugify';

export async function generateUniquePostSlug(
  title: string,
  excludePostId?: number
): Promise<string> {
  const base = slugify(title);
  if (!base) return `post-${Date.now()}`;

  let candidate = base;
  let counter = 0;

  while (true) {
    const conditions = [eq(posts.slug, candidate)];
    if (excludePostId) {
      conditions.push(ne(posts.id, excludePostId));
    }

    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return candidate;

    counter++;
    candidate = `${base}-${counter}`;
  }
}

export async function generateUniqueSurveySlug(
  title: string,
  excludeSurveyId?: number
): Promise<string> {
  const base = slugify(title);
  if (!base) return `survey-${Date.now()}`;

  let candidate = base;
  let counter = 0;

  while (true) {
    const conditions = [eq(surveys.slug, candidate)];
    if (excludeSurveyId) {
      conditions.push(ne(surveys.id, excludeSurveyId));
    }

    const [existing] = await db
      .select({ id: surveys.id })
      .from(surveys)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return candidate;

    counter++;
    candidate = `${base}-${counter}`;
  }
}
