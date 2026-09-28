/**
 * Pure CSV export logic for hackathon judging data.
 * Adheres strictly to RFC 4180 with UTF-8 BOM for cross-platform Excel compatibility.
 * Zero database dependencies.
 */

/**
 * Escapes a field according to RFC 4180 standards.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats headers and rows into an RFC 4180 CSV string with UTF-8 BOM.
 */
export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

export interface AssignmentExportRow {
  judgeId: string;
  judgeName?: string;
  submissionId: string;
  submissionTitle?: string;
  isCompleted?: boolean;
}

export interface RawScoreExportRow {
  judgeId: string;
  judgeName?: string;
  submissionId: string;
  submissionTitle?: string;
  criterionName: string;
  value: number;
  maxScore: number;
  weight: number;
}

export interface NormalizedResultExportRow {
  rank: number;
  submissionId: string;
  submissionTitle?: string;
  trackName?: string;
  rawAverage: number;
  normalizedScore: number;
  judgeCount: number;
}

/**
 * Generates CSV for Judge Assignments.
 */
export function generateAssignmentsCsv(rows: AssignmentExportRow[]): string {
  const headers = [
    "Judge ID",
    "Judge Name",
    "Submission ID",
    "Submission Title",
    "Status",
  ];

  const data = rows.map((r) => [
    r.judgeId,
    r.judgeName || "N/A",
    r.submissionId,
    r.submissionTitle || "N/A",
    r.isCompleted ? "COMPLETED" : "PENDING",
  ]);

  return buildCsv(headers, data);
}

/**
 * Generates CSV for Line-Item Raw Scores across criteria.
 */
export function generateRawScoresCsv(rows: RawScoreExportRow[]): string {
  const headers = [
    "Judge ID",
    "Judge Name",
    "Submission ID",
    "Submission Title",
    "Criterion Name",
    "Score Value",
    "Max Score",
    "Weight",
    "Percentage",
  ];

  const data = rows.map((r) => {
    const pct = r.maxScore > 0 ? ((r.value / r.maxScore) * 100).toFixed(2) : "0.00";
    return [
      r.judgeId,
      r.judgeName || "N/A",
      r.submissionId,
      r.submissionTitle || "N/A",
      r.criterionName,
      r.value,
      r.maxScore,
      r.weight,
      `${pct}%`,
    ];
  });

  return buildCsv(headers, data);
}

/**
 * Generates CSV for Normalized Standings & Results.
 */
export function generateNormalizedResultsCsv(rows: NormalizedResultExportRow[]): string {
  const headers = [
    "Rank",
    "Submission ID",
    "Submission Title",
    "Track",
    "Raw Average Score",
    "Normalized Score",
    "Total Judges",
  ];

  const data = rows.map((r) => [
    r.rank,
    r.submissionId,
    r.submissionTitle || "N/A",
    r.trackName || "General",
    r.rawAverage.toFixed(2),
    r.normalizedScore.toFixed(2),
    r.judgeCount,
  ]);

  return buildCsv(headers, data);
}
