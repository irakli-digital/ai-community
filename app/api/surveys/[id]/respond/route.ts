import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSurveyById, createSurveyResponse } from '@/lib/db/survey-queries';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';

const respondSchema = z.object({
  respondentName: z.string().max(200).optional(),
  respondentEmail: z.string().email().max(255).optional().or(z.literal('')),
  answers: z
    .array(
      z.object({
        stepId: z.number().int().positive(),
        value: z.string().max(5000),
      })
    )
    .min(1),
});

type RouteParams = { params: Promise<{ id: string }> };

// ─── POST: Submit a public survey response ──────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(request.headers);
    if (isRateLimited(`survey-respond:${clientIp}`, { maxAttempts: 20, windowMs: 15 * 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
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

    if (!survey.isPublished) {
      return NextResponse.json(
        { error: 'This survey is not accepting responses.' },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Validate that all stepIds belong to this survey
    const validStepIds = new Set(survey.steps.map((s) => s.id));
    for (const answer of parsed.data.answers) {
      if (!validStepIds.has(answer.stepId)) {
        return NextResponse.json(
          { error: `Step ID ${answer.stepId} does not belong to this survey.` },
          { status: 400 }
        );
      }
    }

    // Check required steps are answered
    const answeredStepIds = new Set(parsed.data.answers.map((a) => a.stepId));
    for (const step of survey.steps) {
      if (step.isRequired && !answeredStepIds.has(step.id)) {
        return NextResponse.json(
          { error: `Step "${step.label}" is required.` },
          { status: 400 }
        );
      }
    }

    await createSurveyResponse({
      surveyId,
      respondentName: parsed.data.respondentName,
      respondentEmail: parsed.data.respondentEmail || undefined,
      answers: parsed.data.answers,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
