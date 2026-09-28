import assert from "node:assert";
import { test, describe } from "node:test";
import {
  escapeCsvField,
  buildCsv,
  exportLeaderboardCsv,
} from "../../src/services/export.ts";

describe("Export Service - RFC 4180 CSV Tests", () => {
  test("escapeCsvField: correctly handles strings, numbers, and nulls", () => {
    assert.strictEqual(escapeCsvField("SimpleText"), "SimpleText");
    assert.strictEqual(escapeCsvField(42), "42");
    assert.strictEqual(escapeCsvField(null), "");
    assert.strictEqual(escapeCsvField(undefined), "");
  });

  test("escapeCsvField: wraps in quotes when comma, quote, or newline is present", () => {
    // Comma
    assert.strictEqual(escapeCsvField("Hackathon, LLC"), '"Hackathon, LLC"');
    // Quotes (must double inner quotes)
    assert.strictEqual(escapeCsvField('The "Best" Project'), '"The ""Best"" Project"');
    // Newline
    assert.strictEqual(escapeCsvField("Line 1\nLine 2"), '"Line 1\nLine 2"');
  });

  test("buildCsv: creates UTF-8 BOM prefixed RFC 4180 document", () => {
    const headers = ["Title", "Score", "Notes"];
    const rows = [
      ["Project A", 95, "Great, clean UI"],
      ['Project "B"', 80, "Needs work"],
    ];

    const csv = buildCsv(headers, rows);
    // Starts with UTF-8 BOM
    assert.ok(csv.startsWith("\uFEFF"));

    const lines = csv.replace("\uFEFF", "").split("\r\n");
    assert.strictEqual(lines[0], "Title,Score,Notes");
    assert.strictEqual(lines[1], 'Project A,95,"Great, clean UI"');
    assert.strictEqual(lines[2], '"Project ""B""",80,Needs work');
  });

  test("exportLeaderboardCsv: outputs full CSV correctly", async () => {
    const mockDb: any = {
      judgeAssignment: {
        findMany: async () => [],
      },
      submission: {
        findMany: async () => [
          {
            id: "sub-101",
            title: "Super App",
            track: { name: "Open Source" },
            team: { name: "Devs" },
            assignments: [],
          },
        ],
      },
    };

    const csv = await exportLeaderboardCsv("event-123", mockDb);
    assert.ok(csv.includes("Super App"));
    assert.ok(csv.includes("Open Source"));
    assert.ok(csv.includes("Overall Rank"));
  });
});
