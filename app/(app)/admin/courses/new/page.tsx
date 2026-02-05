'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import { createCourse } from '../actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCoursePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCourse({
        title,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        isPaid,
        sortOrder,
      });
      if (result.courseId) {
        router.push(`/admin/courses/${result.courseId}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ახალი კურსი</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>კურსის ინფორმაცია</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">სათაური *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="კურსის სათაური"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">აღწერა</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="კურსის აღწერა..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">თამბნეილის URL</label>
              <Input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isPaid" className="text-sm font-medium">
                  ფასიანი კურსი
                </label>
              </div>
              <div>
                <label className="text-sm font-medium">თანმიმდევრობა</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending || !title}>
                {isPending ? t('common.loading') : t('common.create')}
              </Button>
              <Link href="/admin/courses">
                <Button variant="ghost">{t('common.cancel')}</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
