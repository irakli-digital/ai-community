import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getSurveyById, getSurveyResponses } from '@/lib/db/survey-queries';

type RouteParams = { params: Promise<{ id: string }> };

// ─── GET: List responses for a survey (admin only) ──────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
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

    const responses = await getSurveyResponses(surveyId);
    return NextResponse.json({ responses });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
