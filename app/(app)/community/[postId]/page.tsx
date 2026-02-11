import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUser, isPaidUser } from '@/lib/db/queries';
import { hasAdminRole, hasModRole } from '@/lib/auth/roles';
import { getPostById, getPostComments, getRelatedPosts } from '@/lib/db/community-queries';
import { PostDetailClient } from './post-detail-client';
import { getImageVariantUrl } from '@/lib/storage/image-utils';

type Props = {
  params: Promise<{ postId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId: postIdStr } = await params;
  const postId = Number(postIdStr);
  if (isNaN(postId)) return {};

  const post = await getPostById(postId);
  if (!post) return {};

  return {
    title: `${post.title} — Agentic Tribe`,
    description: post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.content.slice(0, 160),
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
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId: postIdStr } = await params;
  const postId = Number(postIdStr);
  if (isNaN(postId)) notFound();

  const user = await getUser();
  const post = await getPostById(postId, user?.id);
  if (!post) notFound();

  const [comments, relatedPosts] = await Promise.all([
    getPostComments(postId, user?.id),
    getRelatedPosts(postId, post.categoryId ?? null),
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
