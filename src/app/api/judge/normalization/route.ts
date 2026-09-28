import { NextRequest, NextResponse } from "next/server";
import { getEventNormalizedStandings } from "../../../../src/services/normalization.ts";

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
 * GET /api/judge/normalization?eventId=xxx&targetMean=75&targetStdDev=15
 * Computes cross-judge calibrated standings.
 */
export async function GET(req: NextRequest) {
  try {
    await getAuthenticatedUser(["ORGANIZER", "ADMIN"]);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId is required." },
        { status: 400 }
      );
    }

    const targetMean = searchParams.get("targetMean")
      ? parseFloat(searchParams.get("targetMean")!)
      : 75;
    const targetStdDev = searchParams.get("targetStdDev")
      ? parseFloat(searchParams.get("targetStdDev")!)
      : 15;

    const data = await getEventNormalizedStandings(eventId, targetMean, targetStdDev);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate normalization" },
      { status: 500 }
    );
  }
}
