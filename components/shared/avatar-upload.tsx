'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n/ka';

interface AvatarUploadProps {
  currentUrl?: string | null;
  fallback: string;
  onUpload: (publicUrl: string) => void | Promise<void>;
}

export function AvatarUpload({ currentUrl, fallback, onUpload }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError(t('upload.invalidType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('upload.tooLarge'));
      return;
    }

    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploading(true);

    try {
      // 1. Get presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          contentLength: file.size,
          category: 'avatar',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('S3 upload failed');
      }

      // 3. Notify parent
      await onUpload(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ატვირთვის შეცდომა');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={displayUrl || undefined} />
          <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-medium">
            {fallback}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Camera className="mr-2 h-4 w-4" />
        {currentUrl ? t('upload.changeAvatar') : t('upload.avatar')}
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
