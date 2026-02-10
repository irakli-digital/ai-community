'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n/ka';
import { createPost } from '../actions';
import { getCategories } from '@/app/(app)/admin/categories/actions';
import type { Category } from '@/lib/db/schema';

export default function NewPostPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
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
        const result = await createPost({
          title: title.trim(),
          content: content.trim(),
          categoryId,
          linkUrl: linkUrl.trim() || undefined,
        });
        if (result.postId) {
          router.push(`/community/${result.postId}`);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post..."
            rows={10}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            required
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
          <Button type="submit" disabled={isPending || !title || !content}>
            {isPending ? t('common.loading') : 'Publish'}
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
