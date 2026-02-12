'use client';

import { useState } from 'react';
import { getImageVariantUrl } from '@/lib/storage/image-utils';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  avatarUrl: string | null;
  name: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function UserAvatar({ avatarUrl, name, size = 'sm', className }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [variantFailed, setVariantFailed] = useState(false);

  const sizeClass = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  const textClass = size === 'md' ? 'text-sm' : 'text-xs';
  const initial = (name?.[0] ?? '?').toUpperCase();

  if (!avatarUrl || imgFailed) {
    return (
      <div className={cn(sizeClass, 'flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground', textClass, className)}>
        {initial}
      </div>
    );
  }

  const src = variantFailed
    ? avatarUrl
    : getImageVariantUrl(avatarUrl, 'avatar-sm');

  return (
    <img
      src={src}
      alt={name ?? ''}
      className={cn(sizeClass, 'shrink-0 rounded-full object-cover', className)}
      onError={() => {
        if (!variantFailed) {
          setVariantFailed(true);
        } else {
          setImgFailed(true);
        }
      }}
    />
  );
}
