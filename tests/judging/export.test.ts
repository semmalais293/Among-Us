import assert from "node:assert";
import { test, describe } from "node:test";
import {
  escapeCsvField,
  buildCsv,
  generateAssignmentsCsv,
  generateRawScoresCsv,
  generateNormalizedResultsCsv,
} from "../../src/services/export.ts";

describe("Export Service - Pure CSV Tests (RFC 4180)", () => {
  test("escapeCsvField: handles commas, quotes, newlines, and values", () => {
    assert.strictEqual(escapeCsvField("Hello"), "Hello");
    assert.strictEqual(escapeCsvField('Quotes "inside" text'), '"Quotes ""inside"" text"');
    assert.strictEqual(escapeCsvField("Line 1\nLine 2"), '"Line 1\nLine 2"');
    assert.strictEqual(escapeCsvField("Field, with comma"), '"Field, with comma"');
    assert.strictEqual(escapeCsvField(null), "");
    assert.strictEqual(escapeCsvField(undefined), "");
    assert.strictEqual(escapeCsvField(42), "42");
  });

  test("buildCsv: formats lines with CRLF and UTF-8 BOM", () => {
    const csv = buildCsv(["Col1", "Col2"], [["Val1", "Val2"]]);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("Col1,Col2\r\nVal1,Val2"));
  });

  test("generateAssignmentsCsv: creates assignment report", () => {
    const csv = generateAssignmentsCsv([
      {
        judgeId: "J1",
        judgeName: "Judge Alice",
        submissionId: "S1",
        submissionTitle: "Quantum AI",
        isCompleted: true,
      },
    ]);

    assert.ok(csv.includes("Judge ID,Judge Name,Submission ID,Submission Title,Status"));
    assert.ok(csv.includes("J1,Judge Alice,S1,Quantum AI,COMPLETED"));
  });

  test("generateRawScoresCsv: creates line-item criteria score breakdown", () => {
    const csv = generateRawScoresCsv([
      {
        judgeId: "J1",
        judgeName: "Judge Alice",
        submissionId: "S1",
        submissionTitle: "Quantum AI",
        criterionName: "Technical Depth",
        value: 9,
        maxScore: 10,
        weight: 2,
      },
    ]);

    assert.ok(csv.includes("Criterion Name,Score Value,Max Score,Weight,Percentage"));
    assert.ok(csv.includes("Technical Depth,9,10,2,90.00%"));
  });

  test("generateNormalizedResultsCsv: creates normalized ranking export", () => {
    const csv = generateNormalizedResultsCsv([
      {
        rank: 1,
        submissionId: "S1",
        submissionTitle: "Quantum AI",
        trackName: "AI/ML",
        rawAverage: 90,
        normalizedScore: 92.5,
        judgeCount: 3,
      },
    ]);

    assert.ok(csv.includes("Rank,Submission ID,Submission Title,Track,Raw Average Score,Normalized Score,Total Judges"));
    assert.ok(csv.includes("1,S1,Quantum AI,AI/ML,90.00,92.50,3"));
  });
});
