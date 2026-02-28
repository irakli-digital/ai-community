'use server';

import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import {
  getSurveys as dbGetSurveys,
  getSurveyById as dbGetSurveyById,
  createSurvey as dbCreateSurvey,
  updateSurvey as dbUpdateSurvey,
  deleteSurvey as dbDeleteSurvey,
  getSurveyResponses as dbGetSurveyResponses,
} from '@/lib/db/survey-queries';
import { generateUniqueSurveySlug } from '@/lib/utils/slugify-server';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  const { hasAdminRole } = await import('@/lib/auth/roles');
  if (!hasAdminRole(user.role)) throw new Error('Access denied.');
  return user;
}

// ─── Get All Surveys ────────────────────────────────────────────────────────

export async function getAdminSurveys() {
  await requireAdmin();
  return dbGetSurveys();
}

// ─── Get Single Survey ──────────────────────────────────────────────────────

export async function getAdminSurvey(surveyId: number) {
  await requireAdmin();
  return dbGetSurveyById(surveyId);
}

// ─── Create Survey ──────────────────────────────────────────────────────────

const createSurveySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
});

export async function createSurvey(
  input: z.infer<typeof createSurveySchema>
) {
  const user = await requireAdmin();
  const data = createSurveySchema.parse(input);
  const slug = await generateUniqueSurveySlug(data.title);

  const survey = await dbCreateSurvey({
    title: data.title,
    slug,
    description: data.description,
    createdBy: user.id,
  });

  revalidatePath('/admin/surveys');
  return { surveyId: survey?.id };
}

// ─── Update Survey ──────────────────────────────────────────────────────────

const sectionSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  sortOrder: z.number(),
  showIntermediateResults: z.boolean().optional(),
  continueButtonText: z.string().max(200).optional(),
});

const updateSurveySchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  sections: z.array(sectionSchema).optional(),
  steps: z
    .array(
      z.object({
        stepNumber: z.number(),
        questionType: z.string(),
        label: z.string().min(1),
        options: z.string().optional(),
        isRequired: z.boolean().optional(),
        sectionIndex: z.number().optional(),
      })
    )
    .optional(),
});

export async function updateSurvey(
  input: z.infer<typeof updateSurveySchema>
) {
  await requireAdmin();
  const data = updateSurveySchema.parse(input);

  await dbUpdateSurvey(data.id, {
    title: data.title,
    description: data.description,
    sections: data.sections,
    steps: data.steps,
  });

  revalidatePath('/admin/surveys');
  revalidatePath(`/admin/surveys/${data.id}/edit`);
  return { success: true };
}

// ─── Toggle Publish ─────────────────────────────────────────────────────────

export async function togglePublish(surveyId: number, isPublished: boolean) {
  await requireAdmin();

  await dbUpdateSurvey(surveyId, { isPublished: !isPublished });

  revalidatePath('/admin/surveys');
  return { success: true };
}

// ─── Delete Survey ──────────────────────────────────────────────────────────

export async function deleteSurvey(surveyId: number) {
  await requireAdmin();
  await dbDeleteSurvey(surveyId);
  revalidatePath('/admin/surveys');
  return { success: true };
}

// ─── Get Survey Responses ───────────────────────────────────────────────────

export async function getAdminSurveyResponses(surveyId: number) {
  await requireAdmin();
  return dbGetSurveyResponses(surveyId);
}
