'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/shared/markdown-editor';
import { ImageUpload } from '@/components/shared/image-upload';
import { t } from '@/lib/i18n/ka';
import { updatePost } from '@/app/(app)/community/actions';
import { getCategories } from '@/app/(app)/admin/categories/actions';
import type { Category } from '@/lib/db/schema';
import { getPostUrl } from '@/lib/utils/post-url';
import { slugify } from '@/lib/utils/slugify';

interface EditPostClientProps {
  postId: number;
  initialTitle: string;
  initialContent: string;
  initialSlug: string;
  initialCategoryId: number | null;
  initialCategorySlug: string | null;
  initialFeaturedImageUrl: string | null;
}

export function EditPostClient({
  postId,
  initialTitle,
  initialContent,
  initialSlug,
  initialCategoryId,
  initialCategorySlug,
  initialFeaturedImageUrl,
}: EditPostClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [slug, setSlug] = useState(initialSlug);
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialFeaturedImageUrl || '');
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const backUrl = getPostUrl({ slug: initialSlug, categorySlug: initialCategorySlug });

  // Get current category slug for URL preview
  const currentCatSlug = categories.find((c) => c.id === categoryId)?.slug ?? initialCategorySlug ?? 'uncategorized';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError('');
    startTransition(async () => {
      try {
        await updatePost({
          postId,
          title: title.trim(),
          content: content.trim(),
          slug: slug.trim(),
          categoryId,
          featuredImageUrl: featuredImageUrl || undefined,
        });
      } catch (err: any) {
        if (typeof err?.digest === 'string' && err.digest.includes('NEXT_REDIRECT')) return;
        setError(err.message || t('error.generic'));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backUrl}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Edit Post
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Featured Image */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Featured Image
          </label>
          <ImageUpload
            currentUrl={featuredImageUrl || null}
            onUpload={setFeaturedImageUrl}
            onRemove={() => setFeaturedImageUrl('')}
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    categoryId === cat.id
                      ? 'text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-accent'
                  }`}
                  style={
                    categoryId === cat.id
                      ? { backgroundColor: cat.color }
                      : undefined
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            maxLength={300}
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            URL Slug
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="post-url-slug"
            maxLength={350}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            /community-post/{currentCatSlug}/{slug || slugify(title) || '...'}
          </p>
        </div>

        {/* Content (Markdown) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Content (Markdown)
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            minRows={10}
            placeholder="Write your post..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending || !title || !content}>
            {isPending ? t('common.loading') : 'Save Changes'}
          </Button>
          <Link href={backUrl}>
            <Button type="button" variant="ghost">
              {t('common.cancel')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
