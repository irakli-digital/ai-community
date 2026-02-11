import { notFound } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { hasModRole } from '@/lib/auth/roles';
import { getPostBySlugs } from '@/lib/db/community-queries';
import { EditPostClient } from './edit-post-client';

type Props = {
  params: Promise<{ categorySlug: string; postSlug: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const rawParams = await params;
  const categorySlug = decodeURIComponent(rawParams.categorySlug);
  const postSlug = decodeURIComponent(rawParams.postSlug);

  const user = await getUser();
  if (!user) notFound();

  const post = await getPostBySlugs(categorySlug, postSlug, user.id);
  if (!post) notFound();

  const isAuthor = user.id === post.author.id;
  const isAdminOrMod = hasModRole(user.role);
  if (!isAuthor && !isAdminOrMod) notFound();

  return (
    <EditPostClient
      postId={post.id}
      initialTitle={post.title}
      initialContent={post.content}
      initialSlug={post.slug}
      initialCategoryId={post.category?.id ?? null}
      initialCategorySlug={post.categorySlug}
      initialFeaturedImageUrl={post.featuredImageUrl}
    />
  );
}
