import { db } from './drizzle';
import {
  surveyScoreConfig,
  surveyAnswerWeights,
  surveyCategoryThresholds,
} from './schema';
import { eq, inArray } from 'drizzle-orm';

export interface ScoreResult {
  total: number;
  subscores: { name: string; score: number; maxPoints: number }[];
  category: { label: string; description: string } | null;
}

export async function calculateScores(
  surveyId: number,
  answers: { stepId: number; value: string }[]
): Promise<ScoreResult> {
  const stepIds = answers.map((a) => a.stepId);
  if (stepIds.length === 0) {
    return { total: 0, subscores: [], category: null };
  }

  // Fetch weights only for the answered steps, configs, and thresholds in parallel
  const [weights, configs, thresholds] = await Promise.all([
    db
      .select()
      .from(surveyAnswerWeights)
      .where(inArray(surveyAnswerWeights.stepId, stepIds)),
    db
      .select()
      .from(surveyScoreConfig)
      .where(eq(surveyScoreConfig.surveyId, surveyId))
      .orderBy(surveyScoreConfig.sortOrder),
    db
      .select()
      .from(surveyCategoryThresholds)
      .where(eq(surveyCategoryThresholds.surveyId, surveyId))
      .orderBy(surveyCategoryThresholds.sortOrder),
  ]);

  // Build lookup: stepId+answerValue → points
  const weightMap = new Map<string, number>();
  for (const w of weights) {
    weightMap.set(`${w.stepId}:${w.answerValue}`, w.points);
  }

  // Calculate points per answer (handles multi-select JSON arrays)
  const stepPoints = new Map<number, number>();
  for (const answer of answers) {
    let values: string[];
    try {
      const parsed = JSON.parse(answer.value);
      values = Array.isArray(parsed) ? parsed : [answer.value];
    } catch {
      values = [answer.value];
    }

    let points = 0;
    for (const val of values) {
      points += weightMap.get(`${answer.stepId}:${val}`) ?? 0;
    }
    stepPoints.set(answer.stepId, points);
  }

  // Group points by subscore config
  const subscores: { name: string; score: number; maxPoints: number }[] = [];
  for (const config of configs) {
    let configStepIds: number[];
    try {
      configStepIds = JSON.parse(config.stepIds);
    } catch {
      configStepIds = [];
    }

    let score = 0;
    for (const sid of configStepIds) {
      score += stepPoints.get(sid) ?? 0;
    }

    subscores.push({
      name: config.name,
      score,
      maxPoints: config.maxPoints,
    });
  }

  // Total = sum of subscores if defined, otherwise sum of all step points
  const total =
    subscores.length > 0
      ? subscores.reduce((sum, s) => sum + s.score, 0)
      : [...stepPoints.values()].reduce((sum, p) => sum + p, 0);

  // Look up category from thresholds
  let category: { label: string; description: string } | null = null;
  for (const t of thresholds) {
    if (total >= t.minScore && total <= t.maxScore) {
      category = { label: t.label, description: t.description ?? '' };
      break;
    }
  }

  return { total, subscores, category };
}
