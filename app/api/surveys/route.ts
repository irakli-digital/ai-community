import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { getSurveys, createSurvey } from '@/lib/db/survey-queries';

const createSurveySchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  isPublished: z.boolean().optional(),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int().positive(),
        questionType: z.enum(['text', 'single_choice', 'multiple_choice', 'rating']),
        label: z.string().min(1).max(1000),
        options: z.string().max(5000).optional(),
        isRequired: z.boolean().optional(),
      })
    )
    .optional(),
});

// ─── GET: List all surveys (admin only) ─────────────────────────────────────

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await getSurveys();
  return NextResponse.json({ surveys: result });
}

// ─── POST: Create a new survey (admin only) ─────────────────────────────────

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
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

  const survey = await createSurvey({
    ...parsed.data,
    createdBy: user.id,
  });

  return NextResponse.json({ survey }, { status: 201 });
}
