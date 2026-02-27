'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import {
  getAdminSurveys,
  togglePublish,
  deleteSurvey,
} from './actions';
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ClipboardList,
  BarChart3,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

type SurveyRow = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  isPublished: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  responsesCount: number;
};

export default function AdminSurveysPage() {
  const [surveyList, setSurveyList] = useState<SurveyRow[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    const data = await getAdminSurveys();
    setSurveyList(data as SurveyRow[]);
  }

  async function handleTogglePublish(id: number, isPublished: boolean) {
    startTransition(async () => {
      await togglePublish(id, isPublished);
      await loadSurveys();
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this survey? All responses will be lost.'))
      return;
    startTransition(async () => {
      await deleteSurvey(id);
      await loadSurveys();
    });
  }

  async function handleCopyLink(slug: string | null) {
    if (!slug) return;
    const url = `${window.location.origin}/survey/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Surveys</h1>
        </div>
        <Link href="/admin/surveys/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t('common.create')}
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {surveyList.map((survey) => (
          <Card key={survey.id} className="py-3">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{survey.title}</span>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        survey.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {survey.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {survey.responsesCount} responses ·{' '}
                    {new Date(survey.createdAt).toLocaleDateString()}
                  </p>
                  {survey.isPublished && survey.slug && (
                    <p className="text-xs text-blue-600">
                      /survey/{survey.slug}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyLink(survey.slug)}
                  title="Copy public link"
                  disabled={!survey.slug}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleTogglePublish(survey.id, survey.isPublished)
                  }
                  disabled={isPending}
                  title={survey.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {survey.isPublished ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/admin/surveys/${survey.id}/responses`}>
                  <Button variant="ghost" size="icon" title="View responses">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/admin/surveys/${survey.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(survey.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {surveyList.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No surveys yet. Create your first survey!
          </p>
        )}
      </div>
    </div>
  );
}
