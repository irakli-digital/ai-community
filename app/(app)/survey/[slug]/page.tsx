import { notFound } from 'next/navigation';
import { getSurveyBySlug } from '@/lib/db/survey-queries';
import { SurveyClient } from './survey-client';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SurveyPage({ params }: Props) {
  const { slug } = await params;
  const survey = await getSurveyBySlug(slug);

  if (!survey || !survey.isPublished) {
    notFound();
  }

  return <SurveyClient survey={survey} />;
}
