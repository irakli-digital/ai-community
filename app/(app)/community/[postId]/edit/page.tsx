import { notFound } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { hasModRole } from '@/lib/auth/roles';
import { getPostById } from '@/lib/db/community-queries';
import { EditPostClient } from './edit-post-client';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId: postIdStr } = await params;
  const postId = Number(postIdStr);
  if (isNaN(postId)) notFound();

  const user = await getUser();
  if (!user) notFound();

  const post = await getPostById(postId, user.id);
  if (!post) notFound();

  const isAuthor = user.id === post.author.id;
  const isAdminOrMod = hasModRole(user.role);
  if (!isAuthor && !isAdminOrMod) notFound();

  return (
    <EditPostClient
      postId={post.id}
      initialTitle={post.title}
      initialContent={post.content}
      initialCategoryId={post.category?.id ?? null}
      initialFeaturedImageUrl={post.featuredImageUrl}
    />
  );
}
