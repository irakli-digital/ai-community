'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import { ImageUpload } from '@/components/shared/image-upload';
import { getAdminBanner, updateBanner } from '../../actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditBannerPage() {
  const params = useParams();
  const router = useRouter();
  const bannerId = Number(params.id);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [buttonText, setButtonText] = useState('Learn More');

  useEffect(() => {
    async function load() {
      const banner = await getAdminBanner(bannerId);
      if (!banner) {
        router.push('/admin/banners');
        return;
      }
      setTitle(banner.title ?? '');
      setSubtitle(banner.subtitle ?? '');
      setImageUrl(banner.imageUrl ?? '');
      setLinkUrl(banner.linkUrl ?? '');
      setShowButton(banner.showButton);
      setButtonText(banner.buttonText);
      setLoading(false);
    }
    load();
  }, [bannerId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateBanner({
        id: bannerId,
        title: title || null,
        subtitle: subtitle || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        showButton,
        buttonText: buttonText || 'Learn More',
      });
      router.push('/admin/banners');
    });
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/banners">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Banner</h1>
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
                {isPending ? t('common.loading') : 'Save'}
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
