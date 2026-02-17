import type { MetadataRoute } from 'next';
import { db } from '@/lib/db/drizzle';
import { posts, courses, categories } from '@/lib/db/schema';
import { eq, and, isNull, not, desc } from 'drizzle-orm';
import { getPostUrl } from '@/lib/utils/post-url';

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
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
        catSlug: categories.slug,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(and(isNull(posts.deletedAt), not(posts.isDraft)))
      .orderBy(desc(posts.createdAt))
      .limit(500);

    postPages = allPosts.map((post) => ({
      url: `${baseUrl}${getPostUrl({ slug: post.slug, categorySlug: post.catSlug ?? null })}`,
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
