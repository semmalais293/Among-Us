/**
 * Pure scoring logic for hackathon judging.
 * Strictly zero database dependencies.
 */

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
}

export interface CriterionScoreInput {
  criterionId: string;
  value: number;
}

export interface CriterionBreakdown {
  criterionId: string;
  name: string;
  value: number;
  maxScore: number;
  weight: number;
  percentage: number;
  weightedContribution: number;
}

export interface ScoringResult {
  weightedScore: number; // 0..100 percentage
  rawPoints: number;
  maxPoints: number;
  totalWeight: number;
  breakdown: CriterionBreakdown[];
}

/**
 * Validates criterion score inputs against rubric criteria.
 * Throws an Error if value is < 0 or > maxScore, or if criterion does not exist.
 */
export function validateScores(
  criteria: RubricCriterion[],
  scores: CriterionScoreInput[]
): void {
  const criteriaMap = new Map<string, RubricCriterion>();
  for (const c of criteria) {
    if (c.maxScore <= 0) {
      throw new Error(`Invalid criterion "${c.name}": maxScore must be greater than 0.`);
    }
    if (c.weight <= 0) {
      throw new Error(`Invalid criterion "${c.name}": weight must be greater than 0.`);
    }
    criteriaMap.set(c.id, c);
  }

  for (const s of scores) {
    const criterion = criteriaMap.get(s.criterionId);
    if (!criterion) {
      throw new Error(`Criterion ID "${s.criterionId}" not found in rubric criteria.`);
    }

    if (typeof s.value !== "number" || isNaN(s.value)) {
      throw new Error(
        `Invalid score for criterion "${criterion.name}": value must be a valid number.`
      );
    }

    if (s.value < 0 || s.value > criterion.maxScore) {
      throw new Error(
        `Score out of range: value ${s.value} for criterion "${criterion.name}" must be between 0 and ${criterion.maxScore}.`
      );
    }
  }
}

/**
 * Pure function: calculates weighted score for a submission assignment.
 * Formula: sum(criterion.value / maxScore * weight) / sum(weights) * 100
 *
 * @param criteria Array of rubric criteria
 * @param scores Array of submitted scores { criterionId, value }
 */
export function calculateWeightedScore(
  criteria: RubricCriterion[],
  scores: CriterionScoreInput[]
): ScoringResult {
  validateScores(criteria, scores);

  const scoresMap = new Map<string, number>();
  for (const s of scores) {
    scoresMap.set(s.criterionId, s.value);
  }

  let totalWeight = 0;
  let weightedProgressSum = 0;
  let rawPoints = 0;
  let maxPoints = 0;
  const breakdown: CriterionBreakdown[] = [];

  for (const c of criteria) {
    const val = scoresMap.get(c.id) ?? 0;
    const criterionPct = (val / c.maxScore) * 100;
    const weightedContrib = (val / c.maxScore) * c.weight;

    totalWeight += c.weight;
    weightedProgressSum += weightedContrib;
    rawPoints += val;
    maxPoints += c.maxScore;

    breakdown.push({
      criterionId: c.id,
      name: c.name,
      value: val,
      maxScore: c.maxScore,
      weight: c.weight,
      percentage: Number(criterionPct.toFixed(2)),
      weightedContribution: Number(weightedContrib.toFixed(4)),
    });
  }

  const finalWeightedScore =
    totalWeight > 0 ? (weightedProgressSum / totalWeight) * 100 : 0;

  return {
    weightedScore: Number(finalWeightedScore.toFixed(2)),
    rawPoints: Number(rawPoints.toFixed(2)),
    maxPoints: Number(maxPoints.toFixed(2)),
    totalWeight: Number(totalWeight.toFixed(2)),
    breakdown,
  };
}
