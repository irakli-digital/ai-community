import { permanentRedirect, notFound } from 'next/navigation';
import { getPostById } from '@/lib/db/community-queries';
import { getPostEditUrl } from '@/lib/utils/post-url';

type Props = {
  params: Promise<{ postId: string }>;
};

export default async function OldEditPostPage({ params }: Props) {
  const { postId: postIdStr } = await params;
  const postId = Number(postIdStr);
  if (isNaN(postId)) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  permanentRedirect(getPostEditUrl(post));
}
