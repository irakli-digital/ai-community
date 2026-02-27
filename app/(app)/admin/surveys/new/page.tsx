'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import { createSurvey } from '../actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewSurveyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createSurvey({
        title,
        description: description || undefined,
      });
      if (result.surveyId) {
        router.push(`/admin/surveys/${result.surveyId}/edit`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/surveys">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Survey</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Survey title"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Survey description..."
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending || !title}>
                {isPending ? t('common.loading') : t('common.create')}
              </Button>
              <Link href="/admin/surveys">
                <Button variant="ghost">{t('common.cancel')}</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
