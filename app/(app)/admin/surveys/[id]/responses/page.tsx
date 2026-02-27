'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import { getAdminSurvey, getAdminSurveyResponses } from '../../actions';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { SurveyStep } from '@/lib/db/schema';

type ResponseRow = {
  id: number;
  surveyId: number;
  respondentName: string | null;
  respondentEmail: string | null;
  createdAt: Date;
  answers: {
    id: number;
    responseId: number;
    stepId: number;
    value: string;
    createdAt: Date;
  }[];
};

export default function SurveyResponsesPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const [isPending] = useTransition();

  const [surveyTitle, setSurveyTitle] = useState('');
  const [steps, setSteps] = useState<SurveyStep[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    const [survey, resp] = await Promise.all([
      getAdminSurvey(surveyId),
      getAdminSurveyResponses(surveyId),
    ]);
    if (survey) {
      setSurveyTitle(survey.title);
      setSteps(survey.steps);
    }
    setResponses(resp as ResponseRow[]);
  }, [surveyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getStepLabel(stepId: number) {
    return steps.find((s) => s.id === stepId)?.label ?? `Step #${stepId}`;
  }

  if (isPending) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/surveys">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Responses</h1>
          {surveyTitle && (
            <p className="text-sm text-muted-foreground">{surveyTitle}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {responses.map((resp) => (
          <Card key={resp.id} className="py-3">
            <CardContent>
              <button
                onClick={() => toggleExpand(resp.id)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {expandedIds.has(resp.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <span className="font-medium">
                      {resp.respondentName || resp.respondentEmail || 'Anonymous'}
                    </span>
                    {resp.respondentEmail && resp.respondentName && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {resp.respondentEmail}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(resp.createdAt).toLocaleDateString()}{' '}
                  {new Date(resp.createdAt).toLocaleTimeString()}
                </span>
              </button>

              {expandedIds.has(resp.id) && (
                <div className="mt-3 ml-7 space-y-2 border-t pt-3">
                  {resp.answers.map((answer) => (
                    <div key={answer.id}>
                      <p className="text-xs font-medium text-muted-foreground">
                        {getStepLabel(answer.stepId)}
                      </p>
                      <p className="text-sm">{answer.value}</p>
                    </div>
                  ))}
                  {resp.answers.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No answers recorded.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {responses.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No responses yet.
          </p>
        )}
      </div>
    </div>
  );
}
