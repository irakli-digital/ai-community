import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/settings', '/api/', '/notifications'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
