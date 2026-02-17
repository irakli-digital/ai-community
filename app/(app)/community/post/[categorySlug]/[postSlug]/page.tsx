import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUser, isPaidUser } from '@/lib/db/queries';
import { hasAdminRole, hasModRole } from '@/lib/auth/roles';
import { getPostBySlugs, getPostComments, getRelatedPosts } from '@/lib/db/community-queries';
import { PostDetailClient } from './post-detail-client';
import { getImageVariantUrl } from '@/lib/storage/image-utils';

type Props = {
  params: Promise<{ categorySlug: string; postSlug: string }>;
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')   // ![alt](url) → remove
    .replace(/#{1,6}\s+/g, '')                 // headings
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')        // inline code
    .replace(/\n+/g, ' ')                      // newlines → space
    .replace(/\s+/g, ' ')                      // collapse whitespace
    .trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const rawParams = await params;
    const categorySlug = decodeURIComponent(rawParams.categorySlug);
    const postSlug = decodeURIComponent(rawParams.postSlug);
    const post = await getPostBySlugs(categorySlug, postSlug);
    if (!post) return {};

    const description = stripMarkdown(post.content).slice(0, 160);

    return {
      title: `${post.title} — Agentic Tribe`,
      description,
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        ...(post.featuredImageUrl
          ? {
              images: [
                {
                  url: getImageVariantUrl(post.featuredImageUrl, 'og'),
                  width: 1200,
                  height: 630,
                },
              ],
            }
          : {}),
      },
    };
  } catch {
    return {};
  }
}

export default async function PostDetailPage({ params }: Props) {
  const rawParams = await params;
  const categorySlug = decodeURIComponent(rawParams.categorySlug);
  const postSlug = decodeURIComponent(rawParams.postSlug);

  const user = await getUser();
  const post = await getPostBySlugs(categorySlug, postSlug, user?.id);
  if (!post) notFound();

  const [comments, relatedPosts] = await Promise.all([
    getPostComments(post.id, user?.id),
    getRelatedPosts(post.id, post.categoryId ?? null),
  ]);
  const paid = user ? await isPaidUser(user.id) : false;
  const canLike = paid || hasAdminRole(user?.role);
  const isAuthor = user?.id === post.author.id;
  const isAdminOrMod = hasModRole(user?.role);

  return (
    <PostDetailClient
      post={post}
      comments={comments}
      relatedPosts={relatedPosts}
      canLike={canLike ?? false}
      isAuthor={isAuthor}
      isAdminOrMod={isAdminOrMod ?? false}
      userId={user?.id ?? null}
      userRole={user?.role ?? 'member'}
    />
  );
}
