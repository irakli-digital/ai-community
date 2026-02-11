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
import { updatePost } from '../../actions';
import { getCategories } from '@/app/(app)/admin/categories/actions';
import type { Category } from '@/lib/db/schema';

interface EditPostClientProps {
  postId: number;
  initialTitle: string;
  initialContent: string;
  initialCategoryId: number | null;
  initialFeaturedImageUrl: string | null;
}

export function EditPostClient({
  postId,
  initialTitle,
  initialContent,
  initialCategoryId,
  initialFeaturedImageUrl,
}: EditPostClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialFeaturedImageUrl || '');
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

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
          categoryId,
          featuredImageUrl: featuredImageUrl || undefined,
        });
        router.push(`/community/${postId}`);
      } catch (err: any) {
        setError(err.message || t('error.generic'));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/community/${postId}`}>
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
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  categoryId === null
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}
              >
                None
              </button>
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
          <Link href={`/community/${postId}`}>
            <Button type="button" variant="ghost">
              {t('common.cancel')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
