import { db } from './drizzle';
import {
  surveys,
  surveySteps,
  surveyResponses,
  surveyAnswers,
} from './schema';
import { eq, desc, asc, sql } from 'drizzle-orm';

// ─── Surveys ────────────────────────────────────────────────────────────────

export async function getSurveys() {
  return await db
    .select({
      id: surveys.id,
      title: surveys.title,
      description: surveys.description,
      isPublished: surveys.isPublished,
      createdBy: surveys.createdBy,
      createdAt: surveys.createdAt,
      updatedAt: surveys.updatedAt,
      responsesCount: sql<number>`(
        select count(*)::int from survey_responses
        where survey_responses.survey_id = ${surveys.id}
      )`,
    })
    .from(surveys)
    .orderBy(desc(surveys.createdAt));
}

export async function getSurveyBySlug(slug: string) {
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.slug, slug))
    .limit(1);

  if (!survey) return null;

  const steps = await db
    .select()
    .from(surveySteps)
    .where(eq(surveySteps.surveyId, survey.id))
    .orderBy(asc(surveySteps.stepNumber));

  return { ...survey, steps };
}

export async function getSurveyById(surveyId: number) {
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);

  if (!survey) return null;

  const steps = await db
    .select()
    .from(surveySteps)
    .where(eq(surveySteps.surveyId, surveyId))
    .orderBy(asc(surveySteps.stepNumber));

  return { ...survey, steps };
}

export async function createSurvey(data: {
  title: string;
  slug: string;
  description?: string;
  isPublished?: boolean;
  createdBy: number;
  steps?: {
    stepNumber: number;
    questionType: string;
    label: string;
    options?: string;
    isRequired?: boolean;
  }[];
}) {
  const [survey] = await db
    .insert(surveys)
    .values({
      title: data.title,
      slug: data.slug,
      description: data.description,
      isPublished: data.isPublished ?? false,
      createdBy: data.createdBy,
    })
    .returning();

  if (data.steps && data.steps.length > 0) {
    await db.insert(surveySteps).values(
      data.steps.map((step) => ({
        surveyId: survey.id,
        stepNumber: step.stepNumber,
        questionType: step.questionType,
        label: step.label,
        options: step.options,
        isRequired: step.isRequired ?? true,
      }))
    );
  }

  return getSurveyById(survey.id);
}

export async function updateSurvey(
  surveyId: number,
  data: {
    title?: string;
    description?: string;
    isPublished?: boolean;
    steps?: {
      stepNumber: number;
      questionType: string;
      label: string;
      options?: string;
      isRequired?: boolean;
    }[];
  }
) {
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.isPublished !== undefined) updateFields.isPublished = data.isPublished;

  await db.update(surveys).set(updateFields).where(eq(surveys.id, surveyId));

  if (data.steps !== undefined) {
    await db.delete(surveySteps).where(eq(surveySteps.surveyId, surveyId));
    if (data.steps.length > 0) {
      await db.insert(surveySteps).values(
        data.steps.map((step) => ({
          surveyId,
          stepNumber: step.stepNumber,
          questionType: step.questionType,
          label: step.label,
          options: step.options,
          isRequired: step.isRequired ?? true,
        }))
      );
    }
  }

  return getSurveyById(surveyId);
}

export async function deleteSurvey(surveyId: number) {
  await db.delete(surveys).where(eq(surveys.id, surveyId));
}

// ─── Responses ──────────────────────────────────────────────────────────────

export async function createSurveyResponse(data: {
  surveyId: number;
  respondentName?: string;
  respondentEmail?: string;
  answers: { stepId: number; value: string }[];
}) {
  const [response] = await db
    .insert(surveyResponses)
    .values({
      surveyId: data.surveyId,
      respondentName: data.respondentName,
      respondentEmail: data.respondentEmail,
    })
    .returning();

  if (data.answers.length > 0) {
    await db.insert(surveyAnswers).values(
      data.answers.map((answer) => ({
        responseId: response.id,
        stepId: answer.stepId,
        value: answer.value,
      }))
    );
  }

  return response;
}

export async function getSurveyResponses(surveyId: number) {
  const responses = await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .orderBy(desc(surveyResponses.createdAt));

  if (responses.length === 0) return [];

  const responseIds = responses.map((r) => r.id);
  const allAnswers = await db
    .select({
      id: surveyAnswers.id,
      responseId: surveyAnswers.responseId,
      stepId: surveyAnswers.stepId,
      value: surveyAnswers.value,
      createdAt: surveyAnswers.createdAt,
    })
    .from(surveyAnswers)
    .where(
      sql`${surveyAnswers.responseId} IN (${sql.join(
        responseIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  const answersByResponse = new Map<number, typeof allAnswers>();
  for (const answer of allAnswers) {
    const existing = answersByResponse.get(answer.responseId) ?? [];
    existing.push(answer);
    answersByResponse.set(answer.responseId, existing);
  }

  return responses.map((r) => ({
    ...r,
    answers: answersByResponse.get(r.id) ?? [],
  }));
}
