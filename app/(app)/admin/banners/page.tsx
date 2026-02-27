'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import {
  getAdminBanners,
  toggleBannerActive,
  deleteBanner,
  reorderBanners,
} from './actions';
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Image,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

type BannerRow = {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  showButton: boolean;
  buttonText: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
};

export default function AdminBannersPage() {
  const [bannerList, setBannerList] = useState<BannerRow[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    const data = await getAdminBanners();
    setBannerList(data as BannerRow[]);
  }

  async function handleToggleActive(id: number, isActive: boolean) {
    startTransition(async () => {
      await toggleBannerActive(id, isActive);
      await loadBanners();
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    startTransition(async () => {
      await deleteBanner(id);
      await loadBanners();
    });
  }

  async function handleMove(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= bannerList.length) return;

    const updated = [...bannerList];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];

    const reordered = updated.map((b, i) => ({ id: b.id, sortOrder: i }));
    setBannerList(updated);

    startTransition(async () => {
      await reorderBanners(reordered);
      await loadBanners();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Banners</h1>
        </div>
        <Link href="/admin/banners/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t('common.create')}
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {bannerList.map((banner, idx) => (
          <Card key={banner.id} className="py-3">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title ?? ''}
                    className="h-12 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-16 items-center justify-center rounded bg-secondary">
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {banner.title || 'Untitled banner'}
                    </span>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        banner.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {banner.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {banner.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Order: {banner.sortOrder}
                    {banner.linkUrl && ' · Has link'}
                    {banner.showButton && ' · Button visible'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0 || isPending}
                  title="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === bannerList.length - 1 || isPending}
                  title="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(banner.id, banner.isActive)}
                  disabled={isPending}
                  title={banner.isActive ? 'Deactivate' : 'Activate'}
                >
                  {banner.isActive ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/admin/banners/${banner.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(banner.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {bannerList.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No banners yet. Create your first banner!
          </p>
        )}
      </div>
    </div>
  );
}
