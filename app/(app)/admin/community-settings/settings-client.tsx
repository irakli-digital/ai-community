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
      setError(err.message || 'Error');
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
      setError('File is too large. Maximum 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, or WebP.');
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

      if (!res.ok) throw new Error('Upload failed');
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
      setError(err.message || 'Upload failed');
    }
    setUploading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Community Settings</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Community Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="AI Circle"
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description about the community..."
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring resize-none"
          />
        </div>

        {/* About Content (Markdown) */}
        <div className="space-y-2">
          <Label htmlFor="aboutContent">
            About the Community (Markdown)
          </Label>
          <textarea
            id="aboutContent"
            value={aboutContent}
            onChange={(e) => setAboutContent(e.target.value)}
            placeholder="# Title&#10;&#10;Write about the community here in Markdown format..."
            rows={10}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-ring resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Markdown format: # Heading, **bold**, *italic*, - list
          </p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                  {uploading === 'logo' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Logo
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
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <Label>Cover Image</Label>
          <div className="space-y-3">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Cover"
                className="h-32 w-full rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-background">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                  {uploading === 'cover' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Cover
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
                  Remove
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
            Settings saved successfully
          </p>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
