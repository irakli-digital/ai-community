'use client';

import { useState } from 'react';
import { Settings, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCommunitySettings, uploadAndSetImage } from './actions';

type SettingsData = {
  id: number;
  name: string;
  description: string;
  aboutContent: string;
  logoUrl: string;
  coverImageUrl: string;
};

export function CommunitySettingsClient({ settings }: { settings: SettingsData }) {
  const [name, setName] = useState(settings.name);
  const [description, setDescription] = useState(settings.description);
  const [aboutContent, setAboutContent] = useState(settings.aboutContent);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [coverImageUrl, setCoverImageUrl] = useState(settings.coverImageUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await updateCommunitySettings({
        name,
        description,
        aboutContent,
        logoUrl: logoUrl || null,
        coverImageUrl: coverImageUrl || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'შეცდომა');
    }
    setSaving(false);
  }

  async function handleImageUpload(
    type: 'logo' | 'cover',
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('ფაილი ძალიან დიდია. მაქსიმუმ 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('ფაილის ტიპი დაუშვებელია. გამოიყენეთ JPG, PNG ან WebP.');
      return;
    }

    setUploading(type);
    setError('');
    try {
      // Get presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          prefix: `community/${type}`,
        }),
      });

      if (!res.ok) throw new Error('ატვირთვა ვერ მოხერხდა');
      const { presignedUrl, publicUrl } = await res.json();

      // Upload to S3
      await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (type === 'logo') {
        setLogoUrl(publicUrl);
      } else {
        setCoverImageUrl(publicUrl);
      }
    } catch (err: any) {
      setError(err.message || 'ატვირთვა ვერ მოხერხდა');
    }
    setUploading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-orange-600" />
        <h1 className="text-2xl font-bold text-gray-900">თემის პარამეტრები</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">თემის სახელი</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="AI წრე"
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">მოკლე აღწერა</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="მოკლე აღწერა საზოგადოების შესახებ..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 resize-none"
          />
        </div>

        {/* About Content (Markdown) */}
        <div className="space-y-2">
          <Label htmlFor="aboutContent">
            საზოგადოების შესახებ (Markdown)
          </Label>
          <textarea
            id="aboutContent"
            value={aboutContent}
            onChange={(e) => setAboutContent(e.target.value)}
            placeholder="# სათაური&#10;&#10;აქ დაწერეთ საზოგადოების შესახებ ინფორმაცია Markdown ფორმატში..."
            rows={10}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-orange-300 resize-y"
          />
          <p className="text-xs text-gray-400">
            Markdown ფორმატი: # სათაური, **ბოლდი**, *იტალიკი*, - სია
          </p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>ლოგო</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="ლოგო"
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {uploading === 'logo' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  ლოგოს ატვირთვა
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageUpload('logo', e)}
                  disabled={uploading === 'logo'}
                />
              </label>
              {logoUrl && (
                <button
                  onClick={() => setLogoUrl('')}
                  className="ml-2 text-xs text-red-500 hover:text-red-600"
                >
                  წაშლა
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <Label>ფონის სურათი</Label>
          <div className="space-y-3">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="ფონი"
                className="h-32 w-full rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {uploading === 'cover' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  ფონის ატვირთვა
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageUpload('cover', e)}
                  disabled={uploading === 'cover'}
                />
              </label>
              {coverImageUrl && (
                <button
                  onClick={() => setCoverImageUrl('')}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  წაშლა
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            პარამეტრები წარმატებით შეინახა ✓
          </p>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'ინახება...' : 'შენახვა'}
          </Button>
        </div>
      </div>
    </div>
  );
}
