/**
 * Pure normalization logic for hackathon judging.
 * Strictly zero database dependencies.
 */

export interface JudgeScoreInput {
  judgeId: string;
  submissionId: string;
  weightedScore: number;
}

export interface JudgeStatistics {
  judgeId: string;
  count: number;
  mean: number;
  stdDev: number;
  isFallback: boolean; // True if < 2 scores or zero variance (mean-centered)
}

export interface NormalizedEvaluation {
  judgeId: string;
  submissionId: string;
  rawScore: number;
  zScore: number;
  normalizedScore: number;
}

export interface SubmissionRanking {
  rank: number;
  submissionId: string;
  rawAverage: number;
  normalizedScore: number;
  judgeCount: number;
}

export interface NormalizationOptions {
  targetMean?: number;
  targetStdDev?: number;
}

/**
 * Computes mean and sample standard deviation (Bessel's correction).
 */
export function computeStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;

  if (values.length < 2) {
    return { mean, stdDev: 0 };
  }

  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Normalizes scores per-judge using Z-score standardization.
 * Fallback to mean-centering if judge has < 2 scores or zero variance.
 *
 * @param scores Array of { judgeId, submissionId, weightedScore }
 * @param options Target scale options (defaults to targetMean=75, targetStdDev=15)
 */
export function normalizeScores(
  scores: JudgeScoreInput[],
  options: NormalizationOptions = {}
): {
  evaluations: NormalizedEvaluation[];
  judgeStats: Record<string, JudgeStatistics>;
  rankings: SubmissionRanking[];
} {
  const targetMean = options.targetMean ?? 75;
  const targetStdDev = options.targetStdDev ?? 15;

  // 1. Group scores by judge
  const scoresByJudge = new Map<string, number[]>();
  for (const s of scores) {
    if (!scoresByJudge.has(s.judgeId)) {
      scoresByJudge.set(s.judgeId, []);
    }
    scoresByJudge.get(s.judgeId)!.push(s.weightedScore);
  }

  // 2. Compute stats for each judge
  const judgeStats: Record<string, JudgeStatistics> = {};
  for (const [judgeId, vals] of scoresByJudge.entries()) {
    const stats = computeStats(vals);
    const isFallback = vals.length < 2 || stats.stdDev === 0;
    judgeStats[judgeId] = {
      judgeId,
      count: vals.length,
      mean: stats.mean,
      stdDev: stats.stdDev,
      isFallback,
    };
  }

  // 3. Normalize each score
  const evaluations: NormalizedEvaluation[] = scores.map((s) => {
    const stat = judgeStats[s.judgeId];
    let zScore = 0;
    let normalizedScore = s.weightedScore;

    if (!stat || stat.count === 0) {
      zScore = 0;
      normalizedScore = s.weightedScore;
    } else if (stat.isFallback) {
      // Fallback to mean-centering: difference from judge's mean
      // zScore is the raw difference, normalized score centers around targetMean
      zScore = s.weightedScore - stat.mean;
      normalizedScore = targetMean + zScore;
    } else {
      // Standard z-score: (x - mean) / stdDev
      zScore = (s.weightedScore - stat.mean) / stat.stdDev;
      normalizedScore = targetMean + zScore * targetStdDev;
    }

    return {
      judgeId: s.judgeId,
      submissionId: s.submissionId,
      rawScore: s.weightedScore,
      zScore: Number(zScore.toFixed(4)),
      normalizedScore: Number(normalizedScore.toFixed(4)),
    };
  });

  // 4. Aggregate by submission
  const subMap = new Map<
    string,
    { rawScores: number[]; normalizedScores: number[] }
  >();

  for (const ev of evaluations) {
    if (!subMap.has(ev.submissionId)) {
      subMap.set(ev.submissionId, { rawScores: [], normalizedScores: [] });
    }
    const entry = subMap.get(ev.submissionId)!;
    entry.rawScores.push(ev.rawScore);
    entry.normalizedScores.push(ev.normalizedScore);
  }

  // 5. Generate rankings
  const rankings: SubmissionRanking[] = [];
  for (const [subId, data] of subMap.entries()) {
    const rawSum = data.rawScores.reduce((a, b) => a + b, 0);
    const normSum = data.normalizedScores.reduce((a, b) => a + b, 0);
    const count = data.rawScores.length;

    rankings.push({
      rank: 0,
      submissionId: subId,
      rawAverage: Number((rawSum / count).toFixed(2)),
      normalizedScore: Number((normSum / count).toFixed(2)),
      judgeCount: count,
    });
  }

  // Sort descending by normalized score, break ties with raw average
  rankings.sort((a, b) => {
    if (b.normalizedScore !== a.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }
    return b.rawAverage - a.rawAverage;
  });

  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return {
    evaluations,
    judgeStats,
    rankings,
  };
}
