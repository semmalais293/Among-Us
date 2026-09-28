/**
 * Pure assignment logic for hackathon judging.
 * Strictly zero database dependencies.
 */

export interface Assignment {
  judgeId: string;
  submissionId: string;
}

export interface JudgeLoadSummary {
  judgeId: string;
  assignedCount: number;
}

/**
 * Pure function: assign(judges, submissions, judgesPerSubmission)
 *
 * Balances workload so that each judge receives an equal number of submissions (+/- 1).
 * Guarantees that no judge gets assigned the same submission twice.
 *
 * @param judges Array of judge IDs
 * @param submissions Array of submission IDs
 * @param judgesPerSubmission Number of judges needed for each submission
 */
export function assign(
  judges: string[],
  submissions: string[],
  judgesPerSubmission: number
): Assignment[] {
  if (judges.length === 0 || submissions.length === 0 || judgesPerSubmission <= 0) {
    return [];
  }

  // A submission cannot have more judges than total available judges
  const k = Math.min(judgesPerSubmission, judges.length);

  // Track load per judge
  const judgeLoads = new Map<string, number>();
  for (const j of judges) {
    judgeLoads.set(j, 0);
  }

  const assignments: Assignment[] = [];

  for (const subId of submissions) {
    // Rank judges by lowest current load, tie-break by judge ID for determinism
    const candidates = [...judges].sort((a, b) => {
      const loadA = judgeLoads.get(a) || 0;
      const loadB = judgeLoads.get(b) || 0;
      if (loadA !== loadB) {
        return loadA - loadB;
      }
      return a.localeCompare(b);
    });

    // Select the k least loaded judges
    const selectedJudges = candidates.slice(0, k);

    for (const judgeId of selectedJudges) {
      assignments.push({ judgeId, submissionId: subId });
      judgeLoads.set(judgeId, (judgeLoads.get(judgeId) || 0) + 1);
    }
  }

  return assignments;
}

/**
 * Pure function for manual judge assignment.
 * Checks for duplicates and returns the updated assignment list.
 */
export function manualAssign(
  existingAssignments: Assignment[],
  judgeId: string,
  submissionId: string
): Assignment[] {
  const exists = existingAssignments.some(
    (a) => a.judgeId === judgeId && a.submissionId === submissionId
  );

  if (exists) {
    throw new Error(
      `Assignment already exists: Judge ${judgeId} is already assigned to submission ${submissionId}.`
    );
  }

  return [...existingAssignments, { judgeId, submissionId }];
}

/**
 * Pure function to remove an assignment manually.
 */
export function removeAssignment(
  existingAssignments: Assignment[],
  judgeId: string,
  submissionId: string
): Assignment[] {
  return existingAssignments.filter(
    (a) => !(a.judgeId === judgeId && a.submissionId === submissionId)
  );
}

/**
 * Compute workload distribution summary to verify +/-1 balance.
 */
export function getJudgeLoadSummaries(
  judges: string[],
  assignments: Assignment[]
): JudgeLoadSummary[] {
  const countMap = new Map<string, number>();
  for (const j of judges) {
    countMap.set(j, 0);
  }

  for (const a of assignments) {
    countMap.set(a.judgeId, (countMap.get(a.judgeId) || 0) + 1);
  }

  return judges.map((j) => ({
    judgeId: j,
    assignedCount: countMap.get(j) || 0,
  }));
}
