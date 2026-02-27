'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = {
  id: number;
  surveyId: number;
  stepNumber: number;
  questionType: string;
  label: string;
  options: string | null;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Survey = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  steps: Step[];
};

type SurveyClientProps = {
  survey: Survey;
};

// -1 = welcome, 0..n-1 = steps, n = submitting/thank-you
const WELCOME = -1;

export function SurveyClient({ survey }: SurveyClientProps) {
  const [currentStep, setCurrentStep] = useState(WELCOME);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  const totalSteps = survey.steps.length;
  const isWelcome = currentStep === WELCOME;
  const isLastStep = currentStep === totalSteps - 1;
  const step = !isWelcome && currentStep < totalSteps ? survey.steps[currentStep] : null;

  const progress = isWelcome ? 0 : Math.round(((currentStep + 1) / totalSteps) * 100);

  const submitSurvey = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    const current = answersRef.current;
    const payload = {
      answers: survey.steps
        .filter((s) => current[s.id] !== undefined && current[s.id] !== '')
        .map((s) => ({
          stepId: s.id,
          value: current[s.id],
        })),
    };

    try {
      const res = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit survey.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }, [survey]);

  const goNext = useCallback(() => {
    if (isWelcome) {
      setDirection('up');
      setCurrentStep(0);
      return;
    }
    if (!step) return;

    const current = answersRef.current;

    // Validate required
    if (step.isRequired && !current[step.id]?.trim()) {
      setError('This question is required.');
      return;
    }

    // Email validation
    if (step.questionType === 'email' && current[step.id]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(current[step.id])) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setError(null);

    if (isLastStep) {
      submitSurvey();
    } else {
      setDirection('up');
      setCurrentStep((s) => s + 1);
    }
  }, [isWelcome, step, isLastStep, submitSurvey]);

  const goBack = useCallback(() => {
    if (isWelcome || currentStep === 0) return;
    setError(null);
    setDirection('down');
    setCurrentStep((s) => s - 1);
  }, [isWelcome, currentStep]);

  const setAnswer = useCallback((stepId: number, value: string) => {
    setError(null);
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (submitted || submitting) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        // Don't submit on Enter inside textarea
        if (step?.questionType === 'textarea') return;
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, submitted, submitting, step]);

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="w-full max-w-[640px] px-6 text-center">
          <div className="mb-6 text-5xl">&#10003;</div>
          <h1 className="mb-3 text-3xl font-bold text-foreground">
            Thank you!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your response has been recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Progress bar */}
      {!isWelcome && (
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Back button */}
      {!isWelcome && currentStep > 0 && (
        <button
          onClick={goBack}
          className="absolute left-4 top-5 z-10 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
      )}

      {/* Content area */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="w-full max-w-[640px] px-6">
          {isWelcome ? (
            <WelcomeScreen
              title={survey.title}
              description={survey.description}
              onStart={goNext}
            />
          ) : step ? (
            <StepRenderer
              key={step.id}
              step={step}
              value={answers[step.id] || ''}
              onChange={(val) => setAnswer(step.id, val)}
              onNext={goNext}
              isLast={isLastStep}
              submitting={submitting}
              error={error}
              direction={direction}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Welcome Screen ────────────────────────────────────────────────────── */

function WelcomeScreen({
  title,
  description,
  onStart,
}: {
  title: string;
  description: string | null;
  onStart: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-center duration-500">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="mb-8 text-lg text-muted-foreground">{description}</p>
      )}
      <Button onClick={onStart} size="lg" className="px-8 text-base">
        Start
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Enter</kbd>
      </p>
    </div>
  );
}

/* ─── Step Renderer ─────────────────────────────────────────────────────── */

function StepRenderer({
  step,
  value,
  onChange,
  onNext,
  isLast,
  submitting,
  error,
  direction,
}: {
  step: Step;
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  isLast: boolean;
  submitting: boolean;
  error: string | null;
  direction: 'up' | 'down';
}) {
  const animClass =
    direction === 'up'
      ? 'animate-in fade-in slide-in-from-bottom-6 duration-400'
      : 'animate-in fade-in slide-in-from-top-6 duration-400';

  return (
    <div className={animClass}>
      <label className="mb-6 block text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
        {step.label}
        {step.isRequired && <span className="ml-1 text-primary">*</span>}
      </label>

      <div className="mb-4">
        {step.questionType === 'text' && (
          <TextInput value={value} onChange={onChange} />
        )}
        {step.questionType === 'textarea' && (
          <TextareaInput value={value} onChange={onChange} onSubmit={onNext} />
        )}
        {step.questionType === 'email' && (
          <EmailInput value={value} onChange={onChange} />
        )}
        {step.questionType === 'single_choice' && (
          <SingleChoice
            options={step.options}
            value={value}
            onChange={(val) => {
              onChange(val);
              // Auto-advance on single choice
              setTimeout(() => onNext(), 200);
            }}
          />
        )}
        {step.questionType === 'multi_choice' && (
          <MultiChoice options={step.options} value={value} onChange={onChange} />
        )}
        {step.questionType === 'rating' && (
          <RatingInput
            value={value}
            onChange={(val) => {
              onChange(val);
              setTimeout(() => onNext(), 300);
            }}
          />
        )}
        {step.questionType === 'yes_no' && (
          <YesNoInput
            value={value}
            onChange={(val) => {
              onChange(val);
              setTimeout(() => onNext(), 200);
            }}
          />
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {/* Show explicit continue/submit for non-auto-advancing types */}
      {!['single_choice', 'rating', 'yes_no'].includes(step.questionType) && (
        <div className="flex items-center gap-3">
          <Button onClick={onNext} disabled={submitting} size="lg">
            {submitting ? 'Submitting...' : isLast ? 'Submit' : 'Continue'}
          </Button>
          {!isLast && (
            <span className="text-xs text-muted-foreground">
              press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Enter</kbd>
            </span>
          )}
        </div>
      )}

      {/* For auto-advancing types, still show submit on last step */}
      {['single_choice', 'rating', 'yes_no'].includes(step.questionType) && isLast && (
        <Button onClick={onNext} disabled={submitting} size="lg" className="mt-2">
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      )}
    </div>
  );
}

/* ─── Input Components ──────────────────────────────────────────────────── */

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer..."
      className="h-12 border-0 border-b-2 border-muted bg-transparent text-lg focus-visible:border-primary focus-visible:ring-0"
    />
  );
}

function TextareaInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Type your answer..."
        rows={4}
        className="w-full resize-none rounded-md border-0 border-b-2 border-muted bg-transparent px-3 py-2 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Cmd</kbd> +{' '}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Enter</kbd> to continue
      </p>
    </div>
  );
}

function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Input
      ref={ref}
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="name@example.com"
      className="h-12 border-0 border-b-2 border-muted bg-transparent text-lg focus-visible:border-primary focus-visible:ring-0"
    />
  );
}

function SingleChoice({
  options,
  value,
  onChange,
}: {
  options: string | null;
  value: string;
  onChange: (v: string) => void;
}) {
  const items: string[] = parseOptions(options);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= items.length) {
        e.preventDefault();
        onChange(items[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items, onChange]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onChange(item)}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-all ${
            value === item
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-muted bg-transparent text-foreground hover:border-muted-foreground/50'
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-current text-xs font-medium">
            {String.fromCharCode(65 + i)}
          </span>
          {item}
        </button>
      ))}
    </div>
  );
}

function MultiChoice({
  options,
  value,
  onChange,
}: {
  options: string | null;
  value: string;
  onChange: (v: string) => void;
}) {
  const items: string[] = parseOptions(options);
  const selected: string[] = value ? JSON.parse(value) : [];

  const toggle = (item: string) => {
    const next = selected.includes(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    onChange(JSON.stringify(next));
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= items.length) {
        e.preventDefault();
        toggle(items[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items, selected]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isSelected = selected.includes(item);
        return (
          <button
            key={i}
            onClick={() => toggle(item)}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-all ${
              isSelected
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-muted bg-transparent text-foreground hover:border-muted-foreground/50'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-current'
              }`}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            {item}
          </button>
        );
      })}
    </div>
  );
}

function RatingInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const current = value ? parseInt(value, 10) : 0;
  const display = hovered ?? current;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        e.preventDefault();
        onChange(String(num));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onChange]);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(String(n))}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className={`flex h-14 w-14 items-center justify-center rounded-lg border text-xl font-semibold transition-all ${
            n <= display
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted text-muted-foreground hover:border-primary/50 hover:text-foreground'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function YesNoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onChange('Yes');
      } else if (e.key === '2' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onChange('No');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onChange]);

  return (
    <div className="flex gap-3">
      {['Yes', 'No'].map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`flex h-16 flex-1 items-center justify-center rounded-lg border text-lg font-medium transition-all ${
            value === option
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-muted text-foreground hover:border-muted-foreground/50'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function parseOptions(options: string | null): string[] {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
