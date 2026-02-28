'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = {
  id: number;
  surveyId: number;
  sectionId: number | null;
  stepNumber: number;
  questionType: string;
  label: string;
  options: string | null;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Section = {
  id: number;
  surveyId: number;
  title: string;
  description: string | null;
  sortOrder: number;
  showIntermediateResults: boolean;
  continueButtonText: string | null;
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
  sections: Section[];
  steps: Step[];
};

type SurveyClientProps = {
  survey: Survey;
};

// Represents what we show at each "position" in the survey flow
type FlowItem =
  | { type: 'section_header'; section: Section }
  | { type: 'step'; step: Step; sectionId: number | null }
  | { type: 'intermediate'; section: Section };

// -1 = welcome, 0..n-1 = flow items, n = submitting/thank-you
const WELCOME = -1;

export function SurveyClient({ survey }: SurveyClientProps) {
  const [currentIndex, setCurrentIndex] = useState(WELCOME);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  // Build the flow: section headers, steps, and intermediate screens
  const flow = useMemo(() => {
    const items: FlowItem[] = [];
    const hasSections = survey.sections.length > 0;

    if (!hasSections) {
      // No sections — flat list of steps
      for (const step of survey.steps) {
        items.push({ type: 'step', step, sectionId: null });
      }
      return items;
    }

    // Group steps by sectionId
    const stepsBySection = new Map<number | null, Step[]>();
    for (const step of survey.steps) {
      const key = step.sectionId;
      const existing = stepsBySection.get(key) ?? [];
      existing.push(step);
      stepsBySection.set(key, existing);
    }

    // Steps without a section go first
    const unsectionedSteps = stepsBySection.get(null) ?? [];
    for (const step of unsectionedSteps) {
      items.push({ type: 'step', step, sectionId: null });
    }

    // Sections in sortOrder, each with header → steps → optional intermediate
    const sortedSections = [...survey.sections].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    for (const section of sortedSections) {
      items.push({ type: 'section_header', section });

      const sectionSteps = stepsBySection.get(section.id) ?? [];
      for (const step of sectionSteps) {
        items.push({ type: 'step', step, sectionId: section.id });
      }

      if (section.showIntermediateResults) {
        items.push({ type: 'intermediate', section });
      }
    }

    return items;
  }, [survey]);

  // Count only actual steps for progress
  const totalQuestions = flow.filter((f) => f.type === 'step').length;
  const questionsAnswered = flow
    .slice(0, currentIndex + 1)
    .filter((f) => f.type === 'step').length;
  const progress =
    currentIndex === WELCOME
      ? 0
      : Math.round((questionsAnswered / totalQuestions) * 100);

  const isWelcome = currentIndex === WELCOME;
  const currentItem = !isWelcome && currentIndex < flow.length ? flow[currentIndex] : null;
  const isLastFlowItem = currentIndex === flow.length - 1;

  // Find the next step item to determine if this is the last question
  const isLastQuestion = useMemo(() => {
    if (!currentItem || currentItem.type !== 'step') return false;
    for (let i = currentIndex + 1; i < flow.length; i++) {
      if (flow[i].type === 'step') return false;
    }
    return true;
  }, [currentItem, currentIndex, flow]);

  const submitSurvey = useCallback(
    async (stepsToSubmit?: Step[]) => {
      setSubmitting(true);
      setError(null);

      const current = answersRef.current;
      const relevantSteps = stepsToSubmit || survey.steps;
      const payload = {
        answers: relevantSteps
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

        if (!stepsToSubmit) {
          setSubmitted(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setSubmitting(false);
      }
    },
    [survey]
  );

  const goNext = useCallback(() => {
    if (isWelcome) {
      setDirection('up');
      setCurrentIndex(0);
      return;
    }
    if (!currentItem) return;

    if (currentItem.type === 'step') {
      const { step } = currentItem;
      const current = answersRef.current;

      // Validate required
      if (step.isRequired && !current[step.id]?.trim()) {
        setError('This question is required.');
        return;
      }

      // Email validation
      if (step.questionType === 'email' && current[step.id]) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(current[step.id])) {
          setError('Please enter a valid email address.');
          return;
        }
      }
    }

    setError(null);

    if (isLastFlowItem) {
      submitSurvey();
    } else {
      setDirection('up');
      setCurrentIndex((s) => s + 1);
    }
  }, [isWelcome, currentItem, isLastFlowItem, submitSurvey]);

  const goBack = useCallback(() => {
    if (isWelcome || currentIndex === 0) return;
    setError(null);
    setDirection('down');
    setCurrentIndex((s) => s - 1);
  }, [isWelcome, currentIndex]);

  const setAnswer = useCallback((stepId: number, value: string) => {
    setError(null);
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  }, []);

  // Handle partial submit from intermediate screen
  const handlePartialSubmit = useCallback(
    (sectionId: number) => {
      // Collect steps up to and including this section
      const stepsToSubmit: Step[] = [];
      for (const item of flow) {
        if (item.type === 'step') stepsToSubmit.push(item.step);
        if (item.type === 'intermediate' && item.section.id === sectionId) break;
      }
      submitSurvey(stepsToSubmit).then(() => {
        setSubmitted(true);
      });
    },
    [flow, submitSurvey]
  );

  const handleContinueFromIntermediate = useCallback(() => {
    setError(null);
    setDirection('up');
    setCurrentIndex((s) => s + 1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (submitted || submitting) return;

      // Don't intercept Enter for intermediate or section_header screens
      if (
        currentItem &&
        (currentItem.type === 'intermediate' || currentItem.type === 'section_header')
      ) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (currentItem.type === 'section_header') {
            goNext();
          } else {
            handleContinueFromIntermediate();
          }
        }
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        // Don't submit on Enter inside textarea
        if (
          currentItem?.type === 'step' &&
          currentItem.step.questionType === 'textarea'
        )
          return;
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, submitted, submitting, currentItem, handleContinueFromIntermediate]);

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
      {!isWelcome && currentIndex > 0 && (
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
          ) : currentItem?.type === 'section_header' ? (
            <SectionHeaderScreen
              key={`section-${currentItem.section.id}`}
              section={currentItem.section}
              onContinue={goNext}
              direction={direction}
            />
          ) : currentItem?.type === 'intermediate' ? (
            <IntermediateScreen
              key={`intermediate-${currentItem.section.id}`}
              section={currentItem.section}
              onContinue={handleContinueFromIntermediate}
              onSubmitPartial={() =>
                handlePartialSubmit(currentItem.section.id)
              }
              submitting={submitting}
              direction={direction}
            />
          ) : currentItem?.type === 'step' ? (
            <StepRenderer
              key={currentItem.step.id}
              step={currentItem.step}
              value={answers[currentItem.step.id] || ''}
              onChange={(val) => setAnswer(currentItem.step.id, val)}
              onNext={goNext}
              isLast={isLastQuestion}
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

/* ─── Section Header Screen ─────────────────────────────────────────────── */

function SectionHeaderScreen({
  section,
  onContinue,
  direction,
}: {
  section: Section;
  onContinue: () => void;
  direction: 'up' | 'down';
}) {
  const animClass =
    direction === 'up'
      ? 'animate-in fade-in slide-in-from-bottom-6 duration-400'
      : 'animate-in fade-in slide-in-from-top-6 duration-400';

  return (
    <div className={`${animClass} text-center`}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>
      <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {section.title}
      </h2>
      {section.description && (
        <p className="mb-8 text-lg text-muted-foreground">
          {section.description}
        </p>
      )}
      <Button onClick={onContinue} size="lg" className="px-8 text-base">
        Continue
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        press{' '}
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          Enter
        </kbd>
      </p>
    </div>
  );
}

/* ─── Intermediate Results Screen ───────────────────────────────────────── */

function IntermediateScreen({
  section,
  onContinue,
  onSubmitPartial,
  submitting,
  direction,
}: {
  section: Section;
  onContinue: () => void;
  onSubmitPartial: () => void;
  submitting: boolean;
  direction: 'up' | 'down';
}) {
  const animClass =
    direction === 'up'
      ? 'animate-in fade-in slide-in-from-bottom-6 duration-400'
      : 'animate-in fade-in slide-in-from-top-6 duration-400';

  return (
    <div className={`${animClass} text-center`}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
        {section.title} — Complete!
      </h2>
      <p className="mb-8 text-muted-foreground">
        You can submit your responses so far, or continue to the next section
        for more detailed results.
      </p>
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={onContinue}
          size="lg"
          className="px-8 text-base"
          disabled={submitting}
        >
          {section.continueButtonText || 'Continue to Next Section'}
        </Button>
        <button
          onClick={onSubmitPartial}
          disabled={submitting}
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {submitting ? 'Submitting...' : 'Submit responses so far'}
        </button>
      </div>
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
        {step.questionType === 'multiple_choice' && (
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
      className="h-12 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-lg focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
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
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
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
        className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{isMac ? 'Cmd' : 'Ctrl'}</kbd> +{' '}
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
      className="h-12 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-lg focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
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
      const code = e.key.toLowerCase().charCodeAt(0) - 97; // a=0, b=1, ...
      if (e.key.length === 1 && code >= 0 && code < items.length) {
        e.preventDefault();
        onChange(items[code]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items, onChange]);

  return (
    <div className="flex flex-col gap-2" role="radiogroup">
      {items.map((item, i) => (
        <button
          key={i}
          role="radio"
          aria-checked={value === item}
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
  let selected: string[];
  try {
    const parsed = value ? JSON.parse(value) : [];
    selected = Array.isArray(parsed) ? parsed : [];
  } catch {
    selected = [];
  }

  const toggle = useCallback(
    (item: string) => {
      const next = selected.includes(item)
        ? selected.filter((s) => s !== item)
        : [...selected, item];
      onChange(JSON.stringify(next));
    },
    [selected, onChange]
  );

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
  }, [items, toggle]);

  return (
    <div className="flex flex-col gap-2" role="group">
      {items.map((item, i) => {
        const isSelected = selected.includes(item);
        return (
          <button
            key={i}
            role="checkbox"
            aria-checked={isSelected}
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
    <div className="flex gap-2" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          role="radio"
          aria-checked={current === n}
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
    <div className="flex gap-3" role="radiogroup">
      {['Yes', 'No'].map((option) => (
        <button
          key={option}
          role="radio"
          aria-checked={value === option}
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
