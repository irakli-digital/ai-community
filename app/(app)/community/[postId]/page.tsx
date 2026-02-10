import { notFound } from 'next/navigation';
import { getUser, isPaidUser } from '@/lib/db/queries';
import { hasAdminRole, hasModRole } from '@/lib/auth/roles';
import { getPostById, getPostComments } from '@/lib/db/community-queries';
import { PostDetailClient } from './post-detail-client';

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

  const comments = await getPostComments(postId, user?.id);
  const paid = user ? await isPaidUser(user.id) : false;
  const canLike = paid || hasAdminRole(user?.role);
  const isAuthor = user?.id === post.author.id;
  const isAdminOrMod = hasModRole(user?.role);

  return (
    <PostDetailClient
      post={post}
      comments={comments}
      canLike={canLike ?? false}
      isAuthor={isAuthor}
      isAdminOrMod={isAdminOrMod ?? false}
      userId={user?.id ?? null}
      userRole={user?.role ?? 'member'}
    />
  );
}
