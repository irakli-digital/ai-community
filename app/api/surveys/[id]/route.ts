import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import {
  getSurveyById,
  updateSurvey,
  deleteSurvey,
} from '@/lib/db/survey-queries';

const updateSurveySchema = z.object({
  title: z.string().min(1).max(300).optional(),
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

type RouteParams = { params: Promise<{ id: string }> };

// ─── GET: Get a single survey (admin only) ──────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const surveyId = parseInt(id, 10);
  if (isNaN(surveyId)) {
    return NextResponse.json({ error: 'Invalid survey ID.' }, { status: 400 });
  }

  const survey = await getSurveyById(surveyId);
  if (!survey) {
    return NextResponse.json({ error: 'Survey not found.' }, { status: 404 });
  }

  return NextResponse.json({ survey });
}

// ─── PATCH: Update a survey (admin only) ────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const surveyId = parseInt(id, 10);
  if (isNaN(surveyId)) {
    return NextResponse.json({ error: 'Invalid survey ID.' }, { status: 400 });
  }

  const existing = await getSurveyById(surveyId);
  if (!existing) {
    return NextResponse.json({ error: 'Survey not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = updateSurveySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const survey = await updateSurvey(surveyId, parsed.data);
  return NextResponse.json({ survey });
}

// ─── DELETE: Delete a survey (admin only) ───────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const surveyId = parseInt(id, 10);
  if (isNaN(surveyId)) {
    return NextResponse.json({ error: 'Invalid survey ID.' }, { status: 400 });
  }

  const existing = await getSurveyById(surveyId);
  if (!existing) {
    return NextResponse.json({ error: 'Survey not found.' }, { status: 404 });
  }

  await deleteSurvey(surveyId);
  return NextResponse.json({ success: true });
}
