'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BannerData {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  showButton: boolean;
  buttonText: string;
}

export function SidebarBanners() {
  const [banners, setBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    fetch('/api/banners')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBanners(data);
      })
      .catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  return (
    <>
      {banners.map((banner) => (
        <BannerCard key={banner.id} banner={banner} />
      ))}
    </>
  );
}

function BannerCard({ banner }: { banner: BannerData }) {
  const hasImage = !!banner.imageUrl;
  const hasLink = !!banner.linkUrl;
  const isClickableCard = hasLink && !banner.showButton;

  const content = (
    <div
      className={`relative overflow-hidden rounded-lg ${
        hasImage
          ? 'min-h-[200px]'
          : 'border border-border bg-card p-5'
      }`}
    >
      {hasImage && (
        <>
          <img
            src={banner.imageUrl!}
            alt={banner.title ?? ''}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </>
      )}

      <div
        className={`relative flex min-h-[200px] flex-col justify-end ${
          hasImage ? 'p-5' : ''
        }`}
      >
        {banner.title && (
          <h3
            className={`font-bold ${
              hasImage ? 'text-white' : 'text-foreground'
            }`}
          >
            {banner.title}
          </h3>
        )}
        {banner.subtitle && (
          <p
            className={`mt-1 text-sm ${
              hasImage ? 'text-white/80' : 'text-muted-foreground'
            }`}
          >
            {banner.subtitle}
          </p>
        )}
        {banner.showButton && hasLink && (
          <Link href={banner.linkUrl!} className="mt-3 inline-block">
            <Button
              size="sm"
              variant={hasImage ? 'secondary' : 'default'}
            >
              {banner.buttonText}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  if (isClickableCard) {
    return (
      <Link
        href={banner.linkUrl!}
        className="block transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}
