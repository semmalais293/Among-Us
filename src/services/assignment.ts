import { db } from "../lib/db";

export interface CreateAssignmentParams {
  judgeId: string;
  submissionId: string;
}

export interface AutoAssignParams {
  eventId: string;
  judgesPerSubmission?: number;
  trackId?: string;
}

export interface AssignmentProgress {
  judgeId: string;
  judgeName: string;
  judgeEmail: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
}

/**
 * Assign a judge to a submission.
 * Enforces conflict of interest: a judge cannot evaluate a submission from a team they belong to.
 */
export async function assignJudgeToSubmission(
  params: CreateAssignmentParams,
  prismaClient = db
) {
  const { judgeId, submissionId } = params;

  // 1. Fetch submission with team members to check conflict of interest
  const submission = await prismaClient.submission.findUnique({
    where: { id: submissionId },
    include: {
      team: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found.`);
  }

  // 2. Conflict of interest validation
  if (submission.team) {
    const isTeamMember = submission.team.members.some(
      (m: { userId: string }) => m.userId === judgeId
    );
    if (isTeamMember) {
      throw new Error(
        `Conflict of interest: Judge ${judgeId} is a member of team ${submission.team.name} for submission ${submissionId}.`
      );
    }
  }

  // 3. Verify user is a JUDGE, ORGANIZER, or ADMIN
  const judge = await prismaClient.user.findUnique({
    where: { id: judgeId },
  });

  if (!judge || !["JUDGE", "ORGANIZER", "ADMIN"].includes(judge.role)) {
    throw new Error(`User ${judgeId} does not possess judging privileges.`);
  }

  // 4. Create or return existing assignment
  const assignment = await prismaClient.judgeAssignment.upsert({
    where: {
      judgeId_submissionId: {
        judgeId,
        submissionId,
      },
    },
    update: {},
    create: {
      judgeId,
      submissionId,
      isCompleted: false,
    },
    include: {
      submission: true,
      judge: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return assignment;
}

/**
 * Automated round-robin load-balanced judge assignment.
 * Evenly distributes submissions across all available judges while respecting conflicts of interest.
 */
export async function autoAssignJudges(
  params: AutoAssignParams,
  prismaClient = db
) {
  const { eventId, judgesPerSubmission = 3, trackId } = params;

  // 1. Find all active judges for the event
  const judges = await prismaClient.user.findMany({
    where: {
      role: { in: ["JUDGE", "ORGANIZER", "ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (judges.length === 0) {
    throw new Error("No eligible judges found for assignment.");
  }

  // 2. Find all submitted submissions for the event (optionally filtered by track)
  const submissionFilter: any = {
    eventId,
    status: "SUBMITTED",
  };
  if (trackId) {
    submissionFilter.trackId = trackId;
  }

  const submissions = await prismaClient.submission.findMany({
    where: submissionFilter,
    include: {
      team: {
        include: {
          members: true,
        },
      },
      assignments: true,
    },
  });

  if (submissions.length === 0) {
    return { assignedCount: 0, skippedDueToConflict: 0, message: "No submitted projects to assign." };
  }

  // Track judge assignment loads: judgeId -> count of assignments
  const judgeLoads = new Map<string, number>();
  for (const j of judges) {
    judgeLoads.set(j.id, 0);
  }

  // Count existing assignments across the event
  const existingAssignments = await prismaClient.judgeAssignment.findMany({
    where: {
      submission: {
        eventId,
      },
    },
  });
  for (const a of existingAssignments) {
    if (judgeLoads.has(a.judgeId)) {
      judgeLoads.set(a.judgeId, (judgeLoads.get(a.judgeId) || 0) + 1);
    }
  }

  let assignedCount = 0;
  let skippedDueToConflict = 0;

  for (const sub of submissions) {
    const existingJudgeIds = new Set(sub.assignments.map((a: { judgeId: string }) => a.judgeId));
    const teamMemberIds = new Set(
      sub.team ? sub.team.members.map((m: { userId: string }) => m.userId) : []
    );

    const needed = Math.max(0, judgesPerSubmission - existingJudgeIds.size);
    if (needed === 0) continue;

    // Filter eligible judges for this submission
    const eligibleJudges = judges.filter((j: { id: string }) => {
      if (existingJudgeIds.has(j.id)) return false;
      if (teamMemberIds.has(j.id)) return false;
      return true;
    });

    // Sort eligible judges by lowest current load (Greedy load balancing)
    eligibleJudges.sort((a: { id: string }, b: { id: string }) => {
      return (judgeLoads.get(a.id) || 0) - (judgeLoads.get(b.id) || 0);
    });

    const selectedJudges = eligibleJudges.slice(0, needed);
    if (selectedJudges.length < needed) {
      skippedDueToConflict += needed - selectedJudges.length;
    }

    for (const judge of selectedJudges) {
      await prismaClient.judgeAssignment.create({
        data: {
          judgeId: judge.id,
          submissionId: sub.id,
          isCompleted: false,
        },
      });
      judgeLoads.set(judge.id, (judgeLoads.get(judge.id) || 0) + 1);
      assignedCount++;
    }
  }

  return {
    assignedCount,
    skippedDueToConflict,
    totalSubmissions: submissions.length,
    activeJudges: judges.length,
  };
}

/**
 * Fetch all assignments assigned to a judge, including rubric and submission details.
 */
export async function getJudgeAssignments(
  judgeId: string,
  eventId?: string,
  prismaClient = db
) {
  const whereClause: any = { judgeId };
  if (eventId) {
    whereClause.submission = { eventId };
  }

  return await prismaClient.judgeAssignment.findMany({
    where: whereClause,
    include: {
      submission: {
        include: {
          track: true,
          team: {
            select: { id: true, name: true },
          },
        },
      },
      scores: {
        include: {
          criterion: true,
        },
      },
    },
    orderBy: [{ isCompleted: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Retrieve judge progress across an event.
 */
export async function getJudgeProgressList(
  eventId: string,
  prismaClient = db
): Promise<AssignmentProgress[]> {
  const judges = await prismaClient.user.findMany({
    where: {
      role: { in: ["JUDGE", "ORGANIZER", "ADMIN"] },
    },
    include: {
      assignments: {
        where: {
          submission: { eventId },
        },
      },
    },
  });

  return judges.map((j: { id: string; name: string; email: string; assignments: any[] }) => {
    const totalAssigned = j.assignments.length;
    const completed = j.assignments.filter((a: any) => a.isCompleted).length;
    const pending = totalAssigned - completed;
    const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

    return {
      judgeId: j.id,
      judgeName: j.name || "Anonymous Judge",
      judgeEmail: j.email,
      totalAssigned,
      completed,
      pending,
      completionRate,
    };
  });
}
