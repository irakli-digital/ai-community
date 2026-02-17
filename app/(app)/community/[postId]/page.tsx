import { redirect, notFound } from 'next/navigation';
import { getPostById } from '@/lib/db/community-queries';
import { getPostUrl } from '@/lib/utils/post-url';

type Props = {
  params: Promise<{ postId: string }>;
};

export default async function OldPostDetailPage({ params }: Props) {
  const { postId: postIdStr } = await params;
  const postId = Number(postIdStr);
  if (isNaN(postId)) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  redirect(getPostUrl(post));
}
