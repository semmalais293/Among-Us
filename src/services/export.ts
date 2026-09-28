import { getEventNormalizedStandings } from "./normalization.ts";
import { getJudgeProgressList } from "./assignment.ts";

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

/**
 * Escapes a field according to RFC 4180 standards.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  // If the string contains comma, double-quote, or newline, wrap in quotes and double internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats rows into an RFC 4180 CSV string with UTF-8 BOM.
 */
export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

/**
 * Export final leaderboard & normalized standings as CSV.
 */
export async function exportLeaderboardCsv(eventId: string, prismaClient?: any): Promise<string> {
  const standingsData = await getEventNormalizedStandings(eventId, 75, 15, prismaClient);

  const headers = [
    "Overall Rank",
    "Track Rank",
    "Submission ID",
    "Title",
    "Track",
    "Team Name",
    "Raw Average Score",
    "Normalized Score",
    "Completed Judges",
    "Total Assigned Judges",
  ];

  const rows = standingsData.standings.map((s) => [
    s.rank,
    s.trackRank,
    s.submissionId,
    s.title,
    s.trackName || "General",
    s.teamName || "Independent",
    s.rawAverage.toFixed(2),
    s.normalizedScore.toFixed(2),
    s.completedJudgesCount,
    s.totalJudgesCount,
  ]);

  return buildCsv(headers, rows);
}

/**
 * Export criterion-level detailed scores across all judges for auditing.
 */
export async function exportDetailedScoresCsv(eventId: string, prismaClient?: any): Promise<string> {
  const client = await getDb(prismaClient);
  const assignments = await client.judgeAssignment.findMany({
    where: {
      submission: { eventId },
    },
    include: {
      judge: { select: { id: true, name: true, email: true } },
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
    orderBy: [{ submissionId: "asc" }, { judgeId: "asc" }],
  });

  const headers = [
    "Submission ID",
    "Submission Title",
    "Track",
    "Team Name",
    "Judge ID",
    "Judge Name",
    "Judge Email",
    "Assignment Completed",
    "Criterion ID",
    "Criterion Name",
    "Criterion Weight",
    "Score Value",
    "Max Score",
    "Normalized Percentage For Criterion",
    "Scored At",
  ];

  const rows: (string | number | null | undefined)[][] = [];

  for (const a of assignments) {
    if (!a.scores || a.scores.length === 0) {
      rows.push([
        a.submission.id,
        a.submission.title,
        a.submission.track?.name || "General",
        a.submission.team?.name || "Independent",
        a.judge.id,
        a.judge.name || "Anonymous",
        a.judge.email,
        a.isCompleted ? "YES" : "NO",
        "N/A",
        "No scores entered",
        0,
        0,
        0,
        0,
        "",
      ]);
      continue;
    }

    for (const score of a.scores) {
      const pct =
        score.criterion.maxScore > 0
          ? ((score.value / score.criterion.maxScore) * 100).toFixed(2)
          : "0.00";

      rows.push([
        a.submission.id,
        a.submission.title,
        a.submission.track?.name || "General",
        a.submission.team?.name || "Independent",
        a.judge.id,
        a.judge.name || "Anonymous",
        a.judge.email,
        a.isCompleted ? "YES" : "NO",
        score.criterion.id,
        score.criterion.name,
        score.criterion.weight,
        score.value,
        score.criterion.maxScore,
        pct,
        score.updatedAt ? new Date(score.updatedAt).toISOString() : "",
      ]);
    }
  }

  return buildCsv(headers, rows);
}

/**
 * Export judge evaluation progress and workload statistics.
 */
export async function exportJudgeProgressCsv(eventId: string, prismaClient?: any): Promise<string> {
  const progressList = await getJudgeProgressList(eventId, prismaClient);

  const headers = [
    "Judge ID",
    "Judge Name",
    "Judge Email",
    "Total Assigned",
    "Completed",
    "Pending",
    "Completion Rate (%)",
  ];

  const rows = progressList.map((j) => [
    j.judgeId,
    j.judgeName,
    j.judgeEmail,
    j.totalAssigned,
    j.completed,
    j.pending,
    `${j.completionRate}%`,
  ]);

  return buildCsv(headers, rows);
}
