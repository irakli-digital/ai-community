import { db } from './drizzle';
import {
  surveys,
  surveySteps,
  surveySections,
  surveyResponses,
  surveyAnswers,
} from './schema';
import { eq, desc, asc, sql, inArray } from 'drizzle-orm';

// ─── Surveys ────────────────────────────────────────────────────────────────

export async function getSurveys() {
  return await db
    .select({
      id: surveys.id,
      title: surveys.title,
      slug: surveys.slug,
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

  const sections = await db
    .select()
    .from(surveySections)
    .where(eq(surveySections.surveyId, survey.id))
    .orderBy(asc(surveySections.sortOrder));

  const steps = await db
    .select()
    .from(surveySteps)
    .where(eq(surveySteps.surveyId, survey.id))
    .orderBy(asc(surveySteps.stepNumber));

  return { ...survey, sections, steps };
}

export async function getSurveyById(surveyId: number) {
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);

  if (!survey) return null;

  const sections = await db
    .select()
    .from(surveySections)
    .where(eq(surveySections.surveyId, surveyId))
    .orderBy(asc(surveySections.sortOrder));

  const steps = await db
    .select()
    .from(surveySteps)
    .where(eq(surveySteps.surveyId, surveyId))
    .orderBy(asc(surveySteps.stepNumber));

  return { ...survey, sections, steps };
}

export async function createSurvey(data: {
  title: string;
  slug?: string;
  description?: string;
  isPublished?: boolean;
  createdBy: number;
  sections?: {
    title: string;
    description?: string;
    sortOrder: number;
    showIntermediateResults?: boolean;
    continueButtonText?: string;
    steps?: {
      stepNumber: number;
      questionType: string;
      label: string;
      options?: string;
      isRequired?: boolean;
    }[];
  }[];
  steps?: {
    stepNumber: number;
    questionType: string;
    label: string;
    options?: string;
    isRequired?: boolean;
    sectionId?: number;
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

  // Insert sections and their steps
  if (data.sections && data.sections.length > 0) {
    let globalStepNumber = 1;
    for (const section of data.sections) {
      const [insertedSection] = await db
        .insert(surveySections)
        .values({
          surveyId: survey.id,
          title: section.title,
          description: section.description,
          sortOrder: section.sortOrder,
          showIntermediateResults: section.showIntermediateResults ?? false,
          continueButtonText: section.continueButtonText,
        })
        .returning();

      if (section.steps && section.steps.length > 0) {
        await db.insert(surveySteps).values(
          section.steps.map((step) => ({
            surveyId: survey.id,
            sectionId: insertedSection.id,
            stepNumber: step.stepNumber || globalStepNumber++,
            questionType: step.questionType,
            label: step.label,
            options: step.options,
            isRequired: step.isRequired ?? true,
          }))
        );
      }
    }
  }

  // Insert standalone steps (no section)
  if (data.steps && data.steps.length > 0) {
    const stepNumbers = data.steps.map((s) => s.stepNumber);
    if (new Set(stepNumbers).size !== stepNumbers.length) {
      throw new Error('Duplicate step numbers are not allowed');
    }

    await db.insert(surveySteps).values(
      data.steps.map((step) => ({
        surveyId: survey.id,
        sectionId: step.sectionId ?? null,
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
    sections?: {
      title: string;
      description?: string;
      sortOrder: number;
      showIntermediateResults?: boolean;
      continueButtonText?: string;
    }[];
    steps?: {
      stepNumber: number;
      questionType: string;
      label: string;
      options?: string;
      isRequired?: boolean;
      sectionIndex?: number; // index into the sections array for linking
    }[];
  }
) {
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.isPublished !== undefined) updateFields.isPublished = data.isPublished;

  await db.update(surveys).set(updateFields).where(eq(surveys.id, surveyId));

  if (data.sections !== undefined) {
    // Delete existing sections (cascade deletes steps with sectionId)
    await db
      .delete(surveySections)
      .where(eq(surveySections.surveyId, surveyId));

    // Also delete all steps (they'll be re-inserted)
    if (data.steps !== undefined) {
      await db.delete(surveySteps).where(eq(surveySteps.surveyId, surveyId));
    }

    // Insert new sections
    const insertedSections: { id: number }[] = [];
    for (const section of data.sections) {
      const [inserted] = await db
        .insert(surveySections)
        .values({
          surveyId,
          title: section.title,
          description: section.description,
          sortOrder: section.sortOrder,
          showIntermediateResults: section.showIntermediateResults ?? false,
          continueButtonText: section.continueButtonText,
        })
        .returning({ id: surveySections.id });
      insertedSections.push(inserted);
    }

    // Insert steps with section references
    if (data.steps !== undefined && data.steps.length > 0) {
      await db.insert(surveySteps).values(
        data.steps.map((step) => ({
          surveyId,
          sectionId:
            step.sectionIndex !== undefined &&
            step.sectionIndex >= 0 &&
            step.sectionIndex < insertedSections.length
              ? insertedSections[step.sectionIndex].id
              : null,
          stepNumber: step.stepNumber,
          questionType: step.questionType,
          label: step.label,
          options: step.options,
          isRequired: step.isRequired ?? true,
        }))
      );
    }
  } else if (data.steps !== undefined) {
    // No sections change, just replace steps
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

// ─── Sections CRUD ──────────────────────────────────────────────────────────

export async function getSurveySections(surveyId: number) {
  return await db
    .select()
    .from(surveySections)
    .where(eq(surveySections.surveyId, surveyId))
    .orderBy(asc(surveySections.sortOrder));
}

export async function createSurveySection(data: {
  surveyId: number;
  title: string;
  description?: string;
  sortOrder: number;
  showIntermediateResults?: boolean;
  continueButtonText?: string;
}) {
  const [section] = await db
    .insert(surveySections)
    .values({
      surveyId: data.surveyId,
      title: data.title,
      description: data.description,
      sortOrder: data.sortOrder,
      showIntermediateResults: data.showIntermediateResults ?? false,
      continueButtonText: data.continueButtonText,
    })
    .returning();
  return section;
}

export async function updateSurveySection(
  sectionId: number,
  data: {
    title?: string;
    description?: string;
    sortOrder?: number;
    showIntermediateResults?: boolean;
    continueButtonText?: string;
  }
) {
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.sortOrder !== undefined) updateFields.sortOrder = data.sortOrder;
  if (data.showIntermediateResults !== undefined)
    updateFields.showIntermediateResults = data.showIntermediateResults;
  if (data.continueButtonText !== undefined)
    updateFields.continueButtonText = data.continueButtonText;

  await db
    .update(surveySections)
    .set(updateFields)
    .where(eq(surveySections.id, sectionId));
}

export async function deleteSurveySection(sectionId: number) {
  await db.delete(surveySections).where(eq(surveySections.id, sectionId));
}

// ─── Responses ──────────────────────────────────────────────────────────────

export async function createSurveyResponse(data: {
  surveyId: number;
  respondentName?: string;
  respondentEmail?: string;
  answers: { stepId: number; value: string }[];
}) {
  return await db.transaction(async (tx) => {
    const [response] = await tx
      .insert(surveyResponses)
      .values({
        surveyId: data.surveyId,
        respondentName: data.respondentName,
        respondentEmail: data.respondentEmail,
      })
      .returning();

    if (data.answers.length > 0) {
      await tx.insert(surveyAnswers).values(
        data.answers.map((answer) => ({
          responseId: response.id,
          stepId: answer.stepId,
          value: answer.value,
        }))
      );
    }

    return response;
  });
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
    .where(inArray(surveyAnswers.responseId, responseIds));

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
