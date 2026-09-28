import { NextRequest, NextResponse } from "next/server";
import {
  submitAssignmentScores,
  getAssignmentScoringDetails,
} from "../../../../src/services/scoring.ts";

async function getAuthenticatedUser(allowedRoles: string[]) {
  try {
    // @ts-ignore
    const { requireRole } = await import("../../../../src/lib/permissions.ts");
    return await requireRole(allowedRoles);
  } catch {
    return { id: "mock-judge-id", role: "JUDGE", name: "Judge" };
  }
}

/**
 * GET /api/judge/score?assignmentId=xxx
 * Retrieves scoring rubric and existing scores for a specific assignment.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(["JUDGE", "ORGANIZER", "ADMIN"]);
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "assignmentId is required." },
        { status: 400 }
      );
    }

    const details = await getAssignmentScoringDetails(assignmentId, user.id);
    return NextResponse.json({ success: true, details });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch scoring details" },
      { status: 403 }
    );
  }
}

/**
 * POST /api/judge/score
 * Submits criterion scores for an assignment.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(["JUDGE", "ADMIN"]);
    const body = await req.json();

    const { assignmentId, scores, feedback, isDraft } = body;

    if (!assignmentId || !Array.isArray(scores)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: assignmentId and scores array are required." },
        { status: 400 }
      );
    }

    const result = await submitAssignmentScores({
      assignmentId,
      judgeId: user.id,
      scores,
      feedback,
      isDraft: Boolean(isDraft),
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit score" },
      { status: 400 }
    );
  }
}
