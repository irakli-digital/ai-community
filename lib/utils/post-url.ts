export function getPostUrl(post: {
  slug: string;
  categorySlug: string | null;
}): string {
  if (!post.categorySlug) {
    // Fallback for posts without a category
    return `/community-post/uncategorized/${post.slug}`;
  }
  return `/community-post/${post.categorySlug}/${post.slug}`;
}

export function getPostEditUrl(post: {
  slug: string;
  categorySlug: string | null;
}): string {
  return `${getPostUrl(post)}/edit`;
}
