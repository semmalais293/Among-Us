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

export interface CriterionScoreInput {
  criterionId: string;
  value: number;
}

export interface SubmitScoresParams {
  assignmentId: string;
  judgeId: string;
  scores: CriterionScoreInput[];
  feedback?: string;
  isDraft?: boolean;
}

export interface WeightedScoreResult {
  assignmentId: string;
  rawSum: number;
  maxPossibleSum: number;
  percentageScore: number;
  weightedScore: number;
  isCompleted: boolean;
}

/**
 * Calculates weighted score from criteria values and weights.
 * Formula: sum( (value / maxScore) * weight ) / sum(weight) * 100
 */
export function calculateWeightedScore(
  scores: { value: number; maxScore: number; weight: number }[]
): { percentageScore: number; weightedScore: number; rawSum: number; maxPossibleSum: number } {
  if (scores.length === 0) {
    return { percentageScore: 0, weightedScore: 0, rawSum: 0, maxPossibleSum: 0 };
  }

  let totalWeight = 0;
  let weightedProgressSum = 0;
  let rawSum = 0;
  let maxPossibleSum = 0;

  for (const s of scores) {
    const clampedVal = Math.max(0, Math.min(s.value, s.maxScore));
    totalWeight += s.weight;
    weightedProgressSum += (clampedVal / s.maxScore) * s.weight;
    rawSum += clampedVal;
    maxPossibleSum += s.maxScore;
  }

  const percentageScore =
    totalWeight > 0 ? (weightedProgressSum / totalWeight) * 100 : 0;

  return {
    percentageScore: Number(percentageScore.toFixed(2)),
    weightedScore: Number(weightedProgressSum.toFixed(2)),
    rawSum: Number(rawSum.toFixed(2)),
    maxPossibleSum: Number(maxPossibleSum.toFixed(2)),
  };
}

/**
 * Submit or update scores for a judge assignment.
 * Enforces role isolation, boundary checks, and audit logging.
 */
export async function submitAssignmentScores(
  params: SubmitScoresParams,
  prismaClient?: any
): Promise<WeightedScoreResult> {
  const client = await getDb(prismaClient);
  const { assignmentId, judgeId, scores, feedback, isDraft = false } = params;

  // 1. Verify assignment exists and belongs to the judge
  const assignment = await client.judgeAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      submission: {
        include: {
          event: {
            include: {
              rubric: {
                include: {
                  criteria: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found.`);
  }

  if (assignment.judgeId !== judgeId) {
    // Only assigned judge (or admin checking caller role upstream) can score
    throw new Error("Unauthorized: You are not assigned to score this submission.");
  }

  const rubric = assignment.submission?.event?.rubric;
  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    throw new Error("Event rubric is not configured. Cannot record scores.");
  }

  const criteriaMap = new Map<string, { id: string; name: string; maxScore: number; weight: number }>();
  for (const c of rubric.criteria) {
    criteriaMap.set(c.id, c);
  }

  // 2. Validate all provided scores
  const scoreCalcs: { value: number; maxScore: number; weight: number }[] = [];

  for (const input of scores) {
    const criterion = criteriaMap.get(input.criterionId);
    if (!criterion) {
      throw new Error(`Criterion ID ${input.criterionId} does not belong to this event's rubric.`);
    }

    if (input.value < 0 || input.value > criterion.maxScore) {
      throw new Error(
        `Invalid score value ${input.value} for criterion "${criterion.name}". Must be between 0 and ${criterion.maxScore}.`
      );
    }

    scoreCalcs.push({
      value: input.value,
      maxScore: criterion.maxScore,
      weight: criterion.weight,
    });
  }

  // 3. Check if all required criteria are present (if finalizing)
  const allCriteriaAnswered = rubric.criteria.every((c: { id: string }) =>
    scores.some((s) => s.criterionId === c.id)
  );

  const shouldComplete = !isDraft && allCriteriaAnswered;

  // 4. Save scores in transaction
  await client.$transaction(async (tx: any) => {
    for (const input of scores) {
      await tx.score.upsert({
        where: {
          assignmentId_criterionId: {
            assignmentId,
            criterionId: input.criterionId,
          },
        },
        update: {
          value: input.value,
        },
        create: {
          assignmentId,
          criterionId: input.criterionId,
          value: input.value,
        },
      });
    }

    await tx.judgeAssignment.update({
      where: { id: assignmentId },
      data: {
        isCompleted: shouldComplete,
      },
    });

    // Audit Log
    if (tx.auditLog) {
      await tx.auditLog.create({
        data: {
          actorId: judgeId,
          action: isDraft ? "SAVE_DRAFT_SCORE" : "SUBMIT_FINAL_SCORE",
          entity: "JudgeAssignment",
          entityId: assignmentId,
          details: JSON.stringify({
            scoreCount: scores.length,
            isCompleted: shouldComplete,
            feedback,
          }),
        },
      });
    }
  });

  const calculation = calculateWeightedScore(scoreCalcs);

  return {
    assignmentId,
    rawSum: calculation.rawSum,
    maxPossibleSum: calculation.maxPossibleSum,
    percentageScore: calculation.percentageScore,
    weightedScore: calculation.weightedScore,
    isCompleted: shouldComplete,
  };
}

/**
 * Fetch detailed assignment evaluation state for a judge.
 */
export async function getAssignmentScoringDetails(
  assignmentId: string,
  judgeId: string,
  prismaClient?: any
) {
  const client = await getDb(prismaClient);
  const assignment = await client.judgeAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      submission: {
        include: {
          track: true,
          team: {
            select: { name: true },
          },
          event: {
            include: {
              rubric: {
                include: {
                  criteria: true,
                },
              },
            },
          },
        },
      },
      scores: true,
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  if (assignment.judgeId !== judgeId) {
    throw new Error("Unauthorized to access this assignment's scoring details.");
  }

  const rubric = assignment.submission.event.rubric;
  const criteria = rubric ? rubric.criteria : [];
  const currentScoresMap = new Map(assignment.scores.map((s: { criterionId: string; value: number }) => [s.criterionId, s.value]));

  const criteriaWithValues = criteria.map((c: { id: string; name: string; weight: number; maxScore: number }) => ({
    ...c,
    currentValue: currentScoresMap.get(c.id) ?? null,
  }));

  return {
    assignmentId: assignment.id,
    isCompleted: assignment.isCompleted,
    submission: {
      id: assignment.submission.id,
      title: assignment.submission.title,
      description: assignment.submission.description,
      repoUrl: assignment.submission.repoUrl,
      demoUrl: assignment.submission.demoUrl,
      track: assignment.submission.track?.name || "General",
      teamName: assignment.submission.team?.name || "Independent",
    },
    criteria: criteriaWithValues,
  };
}
