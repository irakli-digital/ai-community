'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { User } from '@/lib/db/schema';
import { t } from '@/lib/i18n/ka';
import { AvatarUpload } from '@/components/shared/avatar-upload';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfileSettingsPage() {
  const { data: user, mutate } = useSWR<User>('/api/user', fetcher);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAvatarUpload(publicUrl: string) {
    // Save avatar URL immediately
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: publicUrl }),
    });
    if (res.ok) {
      mutate();
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name') as string,
      bio: form.get('bio') as string,
      location: form.get('location') as string,
      websiteUrl: form.get('websiteUrl') as string,
      facebookUrl: form.get('facebookUrl') as string,
      linkedinUrl: form.get('linkedinUrl') as string,
      twitterUrl: form.get('twitterUrl') as string,
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || t('error.generic'));
      } else {
        setSuccess(t('profile.profileUpdated'));
        mutate();
      }
    } catch {
      setError(t('error.generic'));
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || '?';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.editProfile')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Avatar */}
        <div className="mb-6">
          <AvatarUpload
            currentUrl={user.avatarUrl}
            fallback={initials}
            onUpload={handleAvatarUpload}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="mb-2">
              {t('settings.name')}
            </Label>
            <Input
              id="name"
              name="name"
              placeholder={t('settings.namePlaceholder')}
              defaultValue={user.name || ''}
              required
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="mb-2">
              {t('settings.bio')}
            </Label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder={t('settings.bioPlaceholder')}
              defaultValue={user.bio || ''}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="mb-2">
              {t('settings.location')}
            </Label>
            <Input
              id="location"
              name="location"
              placeholder={t('settings.locationPlaceholder')}
              defaultValue={user.location || ''}
            />
          </div>

          {/* Social Links */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {t('profile.socialLinks')}
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="websiteUrl" className="mb-2">
                  {t('settings.websiteUrl')}
                </Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  placeholder="https://example.com"
                  defaultValue={user.websiteUrl || ''}
                />
              </div>
              <div>
                <Label htmlFor="facebookUrl" className="mb-2">
                  {t('settings.facebookUrl')}
                </Label>
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="url"
                  placeholder="https://facebook.com/..."
                  defaultValue={user.facebookUrl || ''}
                />
              </div>
              <div>
                <Label htmlFor="linkedinUrl" className="mb-2">
                  {t('settings.linkedinUrl')}
                </Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  defaultValue={user.linkedinUrl || ''}
                />
              </div>
              <div>
                <Label htmlFor="twitterUrl" className="mb-2">
                  {t('settings.twitterUrl')}
                </Label>
                <Input
                  id="twitterUrl"
                  name="twitterUrl"
                  type="url"
                  placeholder="https://x.com/..."
                  defaultValue={user.twitterUrl || ''}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('settings.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
