'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { t } from '@/lib/i18n/ka';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
  onRemove?: () => void;
}

export function ImageUpload({ onUpload, currentUrl, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError(t('upload.invalidType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('upload.tooLarge'));
      return;
    }

    setUploading(true);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      // 1. Get presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          contentLength: file.size,
          category: 'post',
        }),
      });

      if (!res.ok) {
        let msg = 'Failed to get upload URL.';
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed.');
      }

      // 3. Notify parent
      onUpload(publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setError(msg);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setError(null);
    onRemove?.();
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {displayUrl ? (
        <div className="relative">
          <img
            src={displayUrl}
            alt="Featured image"
            className="w-full rounded-lg object-cover"
            style={{ maxHeight: '240px' }}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          {uploading ? 'Uploading...' : 'Add featured image'}
        </button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
