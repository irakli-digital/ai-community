'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
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
  { value: 'multiple_choice', label: 'Multiple Choice' },
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

type StepErrors = {
  label?: string;
  options?: string;
};

type ValidationErrors = {
  title?: string;
  steps: Record<number, StepErrors>;
};

export default function EditSurveyPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({ steps: {} });
  const formRef = useRef<HTMLDivElement>(null);

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
        options: s.options ? (() => { try { return JSON.parse(s.options); } catch { return []; } })() : [],
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
        options: type === 'single_choice' || type === 'multiple_choice' ? [''] : [],
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

  // ─── Validation ──────────────────────────────────────────────────

  function validate(): boolean {
    const next: ValidationErrors = { steps: {} };
    let valid = true;

    if (!title.trim()) {
      next.title = 'Title is required';
      valid = false;
    }

    steps.forEach((step, idx) => {
      const stepErr: StepErrors = {};

      if (!step.label.trim()) {
        stepErr.label = 'Question is required';
        valid = false;
      }

      if (hasChoiceOptions(step.questionType)) {
        const hasNonEmpty = step.options.some((o) => o.trim());
        if (!hasNonEmpty) {
          stepErr.options = 'At least one non-empty option is required';
          valid = false;
        }
      }

      if (Object.keys(stepErr).length > 0) {
        next.steps[idx] = stepErr;
      }
    });

    setErrors(next);

    if (!valid) {
      requestAnimationFrame(() => {
        const firstError = formRef.current?.querySelector('[data-error="true"]');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    return valid;
  }

  // ─── Save ─────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validate()) return;
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
    type === 'single_choice' || type === 'multiple_choice';

  return (
    <div ref={formRef} className="space-y-6">
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
          <div data-error={!!errors.title || undefined}>
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Survey title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
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
              <div data-error={!!errors.steps[idx]?.label || undefined}>
                <label className="text-xs font-medium">Question *</label>
                <Input
                  value={step.label}
                  onChange={(e) => {
                    updateStep(idx, { label: e.target.value });
                    if (errors.steps[idx]?.label) {
                      setErrors((prev) => {
                        const next = { ...prev, steps: { ...prev.steps } };
                        next.steps[idx] = { ...next.steps[idx], label: undefined };
                        return next;
                      });
                    }
                  }}
                  placeholder="Enter your question..."
                  className={errors.steps[idx]?.label ? 'border-red-500' : ''}
                />
                {errors.steps[idx]?.label && (
                  <p className="mt-1 text-xs text-red-500">{errors.steps[idx].label}</p>
                )}
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
                <div className="space-y-2" data-error={!!errors.steps[idx]?.options || undefined}>
                  <label className="text-xs font-medium">Options</label>
                  {step.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => {
                          updateOption(idx, optIdx, e.target.value);
                          if (errors.steps[idx]?.options) {
                            setErrors((prev) => {
                              const next = { ...prev, steps: { ...prev.steps } };
                              next.steps[idx] = { ...next.steps[idx], options: undefined };
                              return next;
                            });
                          }
                        }}
                        placeholder={`Option ${optIdx + 1}`}
                        className={`flex-1 ${errors.steps[idx]?.options ? 'border-red-500' : ''}`}
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
                  {errors.steps[idx]?.options && (
                    <p className="text-xs text-red-500">{errors.steps[idx].options}</p>
                  )}
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
        <Button onClick={handleSave} disabled={isPending}>
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
