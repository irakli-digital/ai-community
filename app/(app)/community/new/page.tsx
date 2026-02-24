'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/shared/markdown-editor';
import { ImageUpload } from '@/components/shared/image-upload';
import { t } from '@/lib/i18n/ka';
import { createPost } from '../actions';
import { getCategories } from '@/app/(app)/admin/categories/actions';
import type { Category } from '@/lib/db/schema';
import { getPostUrl } from '@/lib/utils/post-url';
import { slugify } from '@/lib/utils/slugify';

export default function NewPostPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Auto-generate slug from title unless manually edited
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  // Get current category slug for URL preview
  const currentCatSlug = categories.find((c) => c.id === categoryId)?.slug ?? 'general';

  async function handleSave(isDraft: boolean) {
    if (!title.trim() || !content.trim()) return;

    setError('');
    startTransition(async () => {
      try {
        const result = await createPost({
          title: title.trim(),
          content: content.trim(),
          slug: slug.trim() || undefined,
          categoryId,
          linkUrl: linkUrl.trim() || undefined,
          featuredImageUrl: featuredImageUrl || undefined,
          isDraft,
        });
        if (result.postId) {
          if (isDraft) {
            router.push('/community');
          } else {
            router.push(getPostUrl({
              slug: result.slug,
              categorySlug: result.categorySlug,
            }));
          }
        }
      } catch (err: any) {
        setError(err.message || t('error.generic'));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/community">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {t('community.newPost')}
        </h1>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

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
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuallyEdited(true);
            }}
            placeholder="post-url-slug"
            maxLength={350}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            /community/post/{currentCatSlug}/{slug || '...'}
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

        {/* Link embed */}
        {showLinkInput ? (
          <div className="flex items-center gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLinkInput(true)}
            >
              <Link2 className="h-4 w-4" />
              Add Link
            </Button>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            disabled={isPending || !title || !content}
            onClick={() => handleSave(false)}
          >
            {isPending ? t('common.loading') : 'Publish'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !title || !content}
            onClick={() => handleSave(true)}
          >
            {isPending ? t('common.loading') : 'Save as Draft'}
          </Button>
          <Link href="/community">
            <Button type="button" variant="ghost">
              {t('common.cancel')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
