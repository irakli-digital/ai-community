import type { MetadataRoute } from 'next';
import { db } from '@/lib/db/drizzle';
import { posts, courses } from '@/lib/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic post pages
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const allPosts = await db
      .select({ id: posts.id, updatedAt: posts.updatedAt })
      .from(posts)
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))
      .limit(500);

    postPages = allPosts.map((post) => ({
      url: `${baseUrl}/community/${post.id}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // DB not available, skip dynamic pages
  }

  // Dynamic course pages
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const allCourses = await db
      .select({ slug: courses.slug, updatedAt: courses.updatedAt })
      .from(courses)
      .where(eq(courses.isPublished, true))
      .limit(100);

    coursePages = allCourses.map((course) => ({
      url: `${baseUrl}/classroom/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available, skip dynamic pages
  }

  return [...staticPages, ...postPages, ...coursePages];
}
