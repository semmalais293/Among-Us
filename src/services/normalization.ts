import { calculateWeightedScore } from "./scoring.ts";

// Lazy-loaded Prisma database client to support offline unit testing and modular development
async function getDb(overrideClient?: any) {
  if (overrideClient) return overrideClient;
  try {
    // @ts-ignore
    const dbModule = await import("../lib/db");
    return dbModule.db;
  } catch {
    throw new Error("Database client (src/lib/db) is not yet initialized by Person A.");
  }
}

export interface JudgeStats {
  judgeId: string;
  judgeName: string;
  count: number;
  mean: number;
  stdDev: number;
}

export interface SubmissionScoreSummary {
  submissionId: string;
  title: string;
  trackId?: string;
  trackName?: string;
  teamName?: string;
  rawAverage: number;
  normalizedScore: number;
  completedJudgesCount: number;
  totalJudgesCount: number;
  rank: number;
  trackRank: number;
  individualJudgeScores: {
    judgeId: string;
    judgeName: string;
    rawScore: number;
    normalizedScore: number;
    zScore: number;
  }[];
}

export interface EventLeaderboardResult {
  eventId: string;
  targetScale: { mean: number; stdDev: number };
  judgeStats: JudgeStats[];
  standings: SubmissionScoreSummary[];
}

/**
 * Standard Sample Standard Deviation.
 * Uses N - 1 denominator for Bessel's correction.
 */
export function calculateSampleStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  if (values.length === 1) return { mean: values[0], stdDev: 0 };

  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
  const stdDev = Math.sqrt(variance);

  return {
    mean: Number(mean.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
  };
}

/**
 * Normalize an individual score based on a judge's distribution.
 */
export function computeZScore(
  rawScore: number,
  judgeMean: number,
  judgeStdDev: number,
  targetMean = 75,
  targetStdDev = 15
): { zScore: number; normalizedScore: number } {
  if (judgeStdDev === 0) {
    // If standard deviation is 0, judge gave the exact same score to all submissions.
    // Fall back to targetMean or rawScore.
    return { zScore: 0, normalizedScore: Number(rawScore.toFixed(2)) };
  }

  const z = (rawScore - judgeMean) / judgeStdDev;
  const scaled = targetMean + z * targetStdDev;
  const clamped = Math.max(0, Math.min(100, scaled));

  return {
    zScore: Number(z.toFixed(4)),
    normalizedScore: Number(clamped.toFixed(2)),
  };
}

/**
 * Calculates normalized standings across an event.
 */
export async function getEventNormalizedStandings(
  eventId: string,
  targetMean = 75,
  targetStdDev = 15,
  prismaClient?: any
): Promise<EventLeaderboardResult> {
  const client = await getDb(prismaClient);
  // 1. Fetch completed assignments with scores and criteria for the event
  const assignments = await client.judgeAssignment.findMany({
    where: {
      submission: { eventId },
      isCompleted: true,
    },
    include: {
      judge: { select: { id: true, name: true } },
      submission: {
        include: {
          track: true,
          team: { select: { name: true } },
        },
      },
      scores: {
        include: {
          criterion: true,
        },
      },
    },
  });

  // Also fetch all submissions to count uncompleted / pending assignments
  const allSubmissions = await client.submission.findMany({
    where: { eventId, status: "SUBMITTED" },
    include: {
      track: true,
      team: { select: { name: true } },
      assignments: true,
    },
  });

  // 2. Compute each assignment's weighted percentage score
  // Map: assignmentId -> percentage score
  const assignmentRawScores = new Map<
    string,
    { judgeId: string; judgeName: string; submissionId: string; rawScore: number }
  >();

  // Map: judgeId -> array of raw scores
  const judgeScoresMap = new Map<string, { judgeName: string; scores: number[] }>();

  for (const a of assignments) {
    if (!a.scores || a.scores.length === 0) continue;

    const scoreInputs = a.scores.map((s: any) => ({
      value: s.value,
      maxScore: s.criterion.maxScore,
      weight: s.criterion.weight,
    }));

    const calc = calculateWeightedScore(scoreInputs);
    const rawScore = calc.percentageScore;

    assignmentRawScores.set(a.id, {
      judgeId: a.judgeId,
      judgeName: a.judge?.name || "Judge",
      submissionId: a.submissionId,
      rawScore,
    });

    if (!judgeScoresMap.has(a.judgeId)) {
      judgeScoresMap.set(a.judgeId, {
        judgeName: a.judge?.name || "Judge",
        scores: [],
      });
    }
    judgeScoresMap.get(a.judgeId)!.scores.push(rawScore);
  }

  // 3. Compute stats per judge
  const judgeStatsMap = new Map<string, JudgeStats>();
  const judgeStatsList: JudgeStats[] = [];

  for (const [judgeId, data] of judgeScoresMap.entries()) {
    const stats = calculateSampleStats(data.scores);
    const entry: JudgeStats = {
      judgeId,
      judgeName: data.judgeName,
      count: data.scores.length,
      mean: stats.mean,
      stdDev: stats.stdDev,
    };
    judgeStatsMap.set(judgeId, entry);
    judgeStatsList.push(entry);
  }

  // 4. Map normalized scores onto assignments & submissions
  // submissionId -> list of judge evaluations
  const subEvals = new Map<
    string,
    {
      judgeId: string;
      judgeName: string;
      rawScore: number;
      normalizedScore: number;
      zScore: number;
    }[]
  >();

  for (const [assignmentId, info] of assignmentRawScores.entries()) {
    const stats = judgeStatsMap.get(info.judgeId) || { mean: info.rawScore, stdDev: 0 };
    const norm = computeZScore(
      info.rawScore,
      stats.mean,
      stats.stdDev,
      targetMean,
      targetStdDev
    );

    if (!subEvals.has(info.submissionId)) {
      subEvals.set(info.submissionId, []);
    }

    subEvals.get(info.submissionId)!.push({
      judgeId: info.judgeId,
      judgeName: info.judgeName,
      rawScore: info.rawScore,
      normalizedScore: norm.normalizedScore,
      zScore: norm.zScore,
    });
  }

  // 5. Aggregate scores per submission
  const summaries: SubmissionScoreSummary[] = allSubmissions.map((sub: any) => {
    const evals = subEvals.get(sub.id) || [];
    const completedCount = evals.length;
    const totalCount = sub.assignments.length;

    let rawAvg = 0;
    let normAvg = 0;

    if (completedCount > 0) {
      const rawSum = evals.reduce((sum, e) => sum + e.rawScore, 0);
      const normSum = evals.reduce((sum, e) => sum + e.normalizedScore, 0);
      rawAvg = Number((rawSum / completedCount).toFixed(2));
      normAvg = Number((normSum / completedCount).toFixed(2));
    }

    return {
      submissionId: sub.id,
      title: sub.title,
      trackId: sub.trackId,
      trackName: sub.track?.name || "General",
      teamName: sub.team?.name || "Independent",
      rawAverage: rawAvg,
      normalizedScore: normAvg,
      completedJudgesCount: completedCount,
      totalJudgesCount: totalCount,
      rank: 0,
      trackRank: 0,
      individualJudgeScores: evals,
    };
  });

  // 6. Sort and rank: Normalized score DESC, then raw average DESC, then completed count DESC
  summaries.sort((a, b) => {
    if (b.normalizedScore !== a.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }
    if (b.rawAverage !== a.rawAverage) {
      return b.rawAverage - a.rawAverage;
    }
    return b.completedJudgesCount - a.completedJudgesCount;
  });

  summaries.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  // Compute track-specific ranks
  const trackCounters = new Map<string, number>();
  for (const s of summaries) {
    const tKey = s.trackId || "default";
    const currentTrackRank = (trackCounters.get(tKey) || 0) + 1;
    trackCounters.set(tKey, currentTrackRank);
    s.trackRank = currentTrackRank;
  }

  return {
    eventId,
    targetScale: { mean: targetMean, stdDev: targetStdDev },
    judgeStats: judgeStatsList,
    standings: summaries,
  };
}
