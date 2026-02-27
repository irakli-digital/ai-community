import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticateRequest } from '@/app/api/v1/_lib/helpers';
import { createSurvey } from '@/lib/db/survey-queries';

const VALID_STEP_TYPES = [
  'text',
  'textarea',
  'single_choice',
  'multiple_choice',
  'email',
  'rating',
  'yes_no',
] as const;

const CHOICE_TYPES: readonly string[] = ['single_choice', 'multiple_choice'];

const stepSchema = z
  .object({
    type: z.enum(VALID_STEP_TYPES),
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    required: z.boolean().optional().default(true),
  })
  .refine(
    (step) => {
      if (CHOICE_TYPES.includes(step.type)) {
        return step.options && step.options.length > 0;
      }
      return true;
    },
    { message: 'Choice-type steps require a non-empty options array' }
  );

const createSurveySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  steps: z.array(stepSchema).min(1),
  publish: z.boolean().optional().default(false),
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

const MAX_SLUG_RETRIES = 3;

export async function POST(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = createSurveySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, steps, publish } = parsed.data;
  const createdBy = parseInt(process.env.API_AUTHOR_USER_ID || '1', 10);

  let survey = null;
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const slug = generateSlug(title);
    try {
      survey = await createSurvey({
        title,
        slug,
        description,
        isPublished: publish,
        createdBy,
        steps: steps.map((step, index) => ({
          stepNumber: index + 1,
          questionType: step.type,
          label: step.question,
          options: step.options ? JSON.stringify(step.options) : undefined,
          isRequired: step.required,
        })),
      });
      break;
    } catch (err) {
      const isUniqueViolation =
        err instanceof Error && err.message.includes('unique');
      if (isUniqueViolation && attempt < MAX_SLUG_RETRIES - 1) {
        continue;
      }
      return NextResponse.json(
        { error: 'Failed to create survey.' },
        { status: 500 }
      );
    }
  }

  if (!survey) {
    return NextResponse.json(
      { error: 'Failed to create survey.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      id: survey.id,
      title: survey.title,
      slug: survey.slug,
      url: `/survey/${survey.slug}`,
      status: survey.isPublished ? 'published' : 'draft',
      stepsCount: steps.length,
    },
    { status: 201 }
  );
}
