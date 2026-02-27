'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import { getAdminSurvey, updateSurvey, togglePublish } from '../../actions';
import type { SurveyStep } from '@/lib/db/schema';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
  EyeOff,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multiple Choice' },
  { value: 'email', label: 'Email' },
  { value: 'rating', label: 'Rating' },
  { value: 'yes_no', label: 'Yes / No' },
] as const;

type StepDraft = {
  questionType: string;
  label: string;
  options: string[];
  isRequired: boolean;
};

export default function EditSurveyPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    const data = await getAdminSurvey(surveyId);
    if (!data) return;
    setTitle(data.title);
    setDescription(data.description ?? '');
    setIsPublished(data.isPublished);
    setSteps(
      data.steps.map((s: SurveyStep) => ({
        questionType: s.questionType,
        label: s.label,
        options: s.options ? JSON.parse(s.options) : [],
        isRequired: s.isRequired,
      }))
    );
    setLoaded(true);
  }, [surveyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Step management ──────────────────────────────────────────────

  function addStep(type: string) {
    setSteps((prev) => [
      ...prev,
      {
        questionType: type,
        label: '',
        options: type === 'single_choice' || type === 'multi_choice' ? [''] : [],
        isRequired: true,
      },
    ]);
  }

  function removeStep(idx: number) {
    if (!confirm('Remove this step?')) return;
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateStep(idx: number, patch: Partial<StepDraft>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }

  function moveStep(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function addOption(stepIdx: number) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx ? { ...s, options: [...s.options, ''] } : s
      )
    );
  }

  function updateOption(stepIdx: number, optIdx: number, value: string) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx
          ? {
              ...s,
              options: s.options.map((o, j) => (j === optIdx ? value : o)),
            }
          : s
      )
    );
  }

  function removeOption(stepIdx: number, optIdx: number) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx
          ? { ...s, options: s.options.filter((_, j) => j !== optIdx) }
          : s
      )
    );
  }

  // ─── Save ─────────────────────────────────────────────────────────

  async function handleSave() {
    startTransition(async () => {
      await updateSurvey({
        id: surveyId,
        title,
        description: description || undefined,
        steps: steps.map((s, i) => ({
          stepNumber: i + 1,
          questionType: s.questionType,
          label: s.label,
          options:
            s.options.length > 0
              ? JSON.stringify(s.options.filter((o) => o.trim()))
              : undefined,
          isRequired: s.isRequired,
        })),
      });
      await loadData();
    });
  }

  async function handleTogglePublish() {
    startTransition(async () => {
      await togglePublish(surveyId, isPublished);
      await loadData();
    });
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/surveys/${surveyId}`;
    navigator.clipboard.writeText(url);
  }

  if (!loaded) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  const hasChoiceOptions = (type: string) =>
    type === 'single_choice' || type === 'multi_choice';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/surveys">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Edit Survey</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            title="Copy public link"
          >
            <Link2 className="mr-1 h-4 w-4" />
            Copy Link
          </Button>
          <Button
            onClick={handleTogglePublish}
            disabled={isPending}
            variant={isPublished ? 'ghost' : 'default'}
            size="sm"
          >
            {isPublished ? (
              <>
                <EyeOff className="mr-1 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-1 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Survey Details */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Survey title"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Survey description..."
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Steps Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Steps</h2>
        </div>

        {steps.map((step, idx) => (
          <Card key={idx}>
            <CardContent className="space-y-3 py-4">
              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {idx + 1}
                  </span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {QUESTION_TYPES.find((q) => q.value === step.questionType)
                      ?.label ?? step.questionType}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0 || isPending}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1 || isPending}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="text-xs font-medium">Question *</label>
                <Input
                  value={step.label}
                  onChange={(e) => updateStep(idx, { label: e.target.value })}
                  placeholder="Enter your question..."
                />
              </div>

              {/* Required toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${idx}`}
                  checked={step.isRequired}
                  onChange={(e) =>
                    updateStep(idx, { isRequired: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <label
                  htmlFor={`required-${idx}`}
                  className="text-sm font-medium"
                >
                  Required
                </label>
              </div>

              {/* Options for choice types */}
              {hasChoiceOptions(step.questionType) && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">Options</label>
                  {step.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateOption(idx, optIdx, e.target.value)
                        }
                        placeholder={`Option ${optIdx + 1}`}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(idx, optIdx)}
                        disabled={step.options.length <= 1}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    onClick={() => addOption(idx)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Option
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {steps.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No steps yet. Add your first question below.
          </p>
        )}

        {/* Add Step */}
        <Card className="border-dashed border-primary/50">
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Add a new step
            </p>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(type.value)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {type.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isPending || !title}>
          <Save className="mr-1 h-4 w-4" />
          {isPending ? t('common.loading') : t('common.save')}
        </Button>
        <Link href="/admin/surveys">
          <Button variant="ghost">{t('common.cancel')}</Button>
        </Link>
      </div>
    </div>
  );
}
