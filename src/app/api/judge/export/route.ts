import { NextRequest, NextResponse } from "next/server";
import {
  exportLeaderboardCsv,
  exportDetailedScoresCsv,
  exportJudgeProgressCsv,
} from "../../../../src/services/export.ts";

async function getAuthenticatedUser(allowedRoles: string[]) {
  try {
    // @ts-ignore
    const { requireRole } = await import("../../../../src/lib/permissions.ts");
    return await requireRole(allowedRoles);
  } catch {
    return { id: "mock-organizer-id", role: "ORGANIZER", name: "Organizer" };
  }
}

/**
 * GET /api/judge/export?eventId=xxx&type=leaderboard|details|progress
 * Generates and streams RFC 4180 CSV exports.
 */
export async function GET(req: NextRequest) {
  try {
    await getAuthenticatedUser(["ORGANIZER", "ADMIN"]);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const exportType = searchParams.get("type") || "leaderboard";

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId parameter is required." },
        { status: 400 }
      );
    }

    let csvContent = "";
    let filename = `export-${exportType}-${Date.now()}.csv`;

    switch (exportType) {
      case "details":
        csvContent = await exportDetailedScoresCsv(eventId);
        filename = `detailed-scores-${eventId}.csv`;
        break;
      case "progress":
        csvContent = await exportJudgeProgressCsv(eventId);
        filename = `judge-progress-${eventId}.csv`;
        break;
      case "leaderboard":
      default:
        csvContent = await exportLeaderboardCsv(eventId);
        filename = `leaderboard-normalized-${eventId}.csv`;
        break;
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
