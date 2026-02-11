'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, ZoomIn, X, Check } from 'lucide-react';
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

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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

    // Open crop modal
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setOriginalFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setOriginalFile(null);
    setCroppedAreaPixels(null);
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPixels || !originalFile) return;

    setUploading(true);
    setCropSrc(null);

    try {
      // Produce cropped blob
      const croppedBlob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      URL.revokeObjectURL(cropSrc);

      // Show preview of cropped image
      const preview = URL.createObjectURL(croppedBlob);
      setPreviewUrl(preview);

      // Cropped blob is always JPEG from canvas
      const croppedType = 'image/jpeg';

      // 1. Get presigned URL with the cropped blob's size
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'avatar.jpg',
          contentType: croppedType,
          contentLength: croppedBlob.size,
          category: 'avatar',
        }),
      });

      if (!res.ok) {
        let msg = t('upload.presignFailed');
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload cropped blob directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': croppedType },
        body: croppedBlob,
      });

      if (!uploadRes.ok) {
        throw new Error(t('upload.s3Failed'));
      }

      // 3. Notify parent
      await onUpload(publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('upload.genericError');
      // Detect CORS / network errors
      if (msg === 'Failed to fetch' || msg === 'NetworkError when attempting to fetch resource.') {
        setError(t('upload.networkError'));
      } else {
        setError(msg);
      }
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      setOriginalFile(null);
      setCroppedAreaPixels(null);
    }
  }

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={displayUrl || undefined} />
          <AvatarFallback className="bg-secondary text-foreground text-xl font-medium">
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative flex flex-col w-full max-w-md mx-4 rounded-lg border border-border bg-card overflow-hidden">
            {/* Crop area */}
            <div className="relative h-72 bg-background">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom control */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
              <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-muted cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-4 py-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCropCancel}
              >
                <X className="mr-1.5 h-4 w-4" />
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleCropConfirm}
              >
                <Check className="mr-1.5 h-4 w-4" />
                {t('upload.cropConfirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Creates a cropped image blob from the source image and crop area.
 */
async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Output a 400x400 square (good quality for avatars)
  const size = 400;
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob'));
      },
      'image/jpeg',
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
