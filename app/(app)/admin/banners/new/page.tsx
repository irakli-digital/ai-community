'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import { ImageUpload } from '@/components/shared/image-upload';
import { createBanner } from '../actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBannerPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [buttonText, setButtonText] = useState('Learn More');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createBanner({
        title: title || undefined,
        subtitle: subtitle || undefined,
        imageUrl: imageUrl || undefined,
        linkUrl: linkUrl || undefined,
        showButton,
        buttonText: buttonText || undefined,
      });
      if (result.bannerId) {
        router.push('/admin/banners');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/banners">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Banner</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banner Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Banner title"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Subtitle</label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Banner subtitle..."
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Image</label>
              <ImageUpload
                onUpload={(url) => setImageUrl(url)}
                currentUrl={imageUrl || null}
                onRemove={() => setImageUrl('')}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Link URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showButton"
                checked={showButton}
                onChange={(e) => setShowButton(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="showButton" className="text-sm font-medium">
                Show CTA button
              </label>
            </div>

            {showButton && (
              <div>
                <label className="text-sm font-medium">Button Text</label>
                <Input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Learn More"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? t('common.loading') : t('common.create')}
              </Button>
              <Link href="/admin/banners">
                <Button variant="ghost">{t('common.cancel')}</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
