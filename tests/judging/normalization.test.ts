import assert from "node:assert";
import { test, describe } from "node:test";
import {
  calculateSampleStats,
  computeZScore,
  getEventNormalizedStandings,
} from "../../src/services/normalization.ts";

describe("Normalization Service - Mathematical & Calibration Tests", () => {
  test("calculateSampleStats: correctly computes mean and standard deviation with Bessel correction", () => {
    // Dataset: [10, 20, 30] -> mean = 20, variance = (100 + 0 + 100) / 2 = 100 -> stdDev = 10
    const stats = calculateSampleStats([10, 20, 30]);
    assert.strictEqual(stats.mean, 20);
    assert.strictEqual(stats.stdDev, 10);
  });

  test("calculateSampleStats: handles single element without dividing by zero", () => {
    const stats = calculateSampleStats([75]);
    assert.strictEqual(stats.mean, 75);
    assert.strictEqual(stats.stdDev, 0);
  });

  test("computeZScore: calculates accurate Z-score and calibrated target score", () => {
    // Judge mean = 60, stdDev = 10, rawScore = 80 -> z = +2.0
    // Target mean = 75, target stdDev = 15 -> Calibrated score = 75 + 2 * 15 = 105 -> clamped to 100
    const res = computeZScore(80, 60, 10, 75, 15);
    assert.strictEqual(res.zScore, 2);
    assert.strictEqual(res.normalizedScore, 100);

    // Below average: rawScore = 50 -> z = -1.0 -> 75 - 15 = 60
    const res2 = computeZScore(50, 60, 10, 75, 15);
    assert.strictEqual(res2.zScore, -1);
    assert.strictEqual(res2.normalizedScore, 60);
  });

  test("computeZScore: handles zero standard deviation gracefully", () => {
    const res = computeZScore(85, 85, 0, 75, 15);
    assert.strictEqual(res.zScore, 0);
    assert.strictEqual(res.normalizedScore, 85);
  });

  test("getEventNormalizedStandings: eliminates judge bias across lenient vs harsh judges", async () => {
    // Scenario:
    // Submission A was scored by Judge Harsh: 70% (which was the highest score Judge Harsh gave! Harsh mean is 50, std 10)
    // Submission B was scored by Judge Generous: 85% (which was the lowest score Judge Generous gave! Generous mean is 90, std 5)
    //
    // Raw comparison: Submission B (85%) would beat Submission A (70%).
    // Normalized comparison:
    // Submission A Z-score = (70 - 50) / 10 = +2.0 -> Normalized = 75 + 2 * 15 = 100
    // Submission B Z-score = (85 - 90) / 5 = -1.0 -> Normalized = 75 - 15 = 60
    //
    // Therefore, Submission A correctly ranks #1 over Submission B after normalization!

    const mockDb: any = {
      judgeAssignment: {
        findMany: async () => [
          // Judge Harsh assignments (scores: 30, 50, 70 -> mean=50, variance=(400+0+400)/2=400 -> std=20)
          {
            id: "a-harsh-1",
            judgeId: "judge-harsh",
            judge: { id: "judge-harsh", name: "Judge Harsh" },
            submissionId: "sub-A",
            isCompleted: true,
            submission: { track: { name: "AI" }, team: { name: "Team Alpha" } },
            scores: [{ value: 7, criterion: { maxScore: 10, weight: 1 } }], // 70%
          },
          {
            id: "a-harsh-2",
            judgeId: "judge-harsh",
            judge: { id: "judge-harsh", name: "Judge Harsh" },
            submissionId: "sub-C",
            isCompleted: true,
            submission: { track: { name: "AI" }, team: { name: "Team Gamma" } },
            scores: [{ value: 5, criterion: { maxScore: 10, weight: 1 } }], // 50%
          },
          {
            id: "a-harsh-3",
            judgeId: "judge-harsh",
            judge: { id: "judge-harsh", name: "Judge Harsh" },
            submissionId: "sub-D",
            isCompleted: true,
            submission: { track: { name: "Web" }, team: { name: "Team Delta" } },
            scores: [{ value: 3, criterion: { maxScore: 10, weight: 1 } }], // 30%
          },

          // Judge Generous assignments (scores: 85, 90, 95 -> mean=90, variance=(25+0+25)/2=25 -> std=5)
          {
            id: "a-gen-1",
            judgeId: "judge-gen",
            judge: { id: "judge-gen", name: "Judge Generous" },
            submissionId: "sub-B",
            isCompleted: true,
            submission: { track: { name: "AI" }, team: { name: "Team Beta" } },
            scores: [{ value: 8.5, criterion: { maxScore: 10, weight: 1 } }], // 85%
          },
          {
            id: "a-gen-2",
            judgeId: "judge-gen",
            judge: { id: "judge-gen", name: "Judge Generous" },
            submissionId: "sub-E",
            isCompleted: true,
            submission: { track: { name: "Web" }, team: { name: "Team Epsilon" } },
            scores: [{ value: 9.0, criterion: { maxScore: 10, weight: 1 } }], // 90%
          },
          {
            id: "a-gen-3",
            judgeId: "judge-gen",
            judge: { id: "judge-gen", name: "Judge Generous" },
            submissionId: "sub-F",
            isCompleted: true,
            submission: { track: { name: "Web" }, team: { name: "Team Zeta" } },
            scores: [{ value: 9.5, criterion: { maxScore: 10, weight: 1 } }], // 95%
          },
        ],
      },
      submission: {
        findMany: async () => [
          {
            id: "sub-A",
            title: "Project Alpha",
            trackId: "track-ai",
            track: { name: "AI" },
            team: { name: "Team Alpha" },
            assignments: [{ id: "a-harsh-1" }],
          },
          {
            id: "sub-B",
            title: "Project Beta",
            trackId: "track-ai",
            track: { name: "AI" },
            team: { name: "Team Beta" },
            assignments: [{ id: "a-gen-1" }],
          },
        ],
      },
    };

    const leaderboard = await getEventNormalizedStandings("event-1", 75, 15, mockDb);

    const subA = leaderboard.standings.find((s) => s.submissionId === "sub-A");
    const subB = leaderboard.standings.find((s) => s.submissionId === "sub-B");

    assert.ok(subA && subB);

    // Verify raw comparison
    assert.strictEqual(subA.rawAverage, 70);
    assert.strictEqual(subB.rawAverage, 85);

    // Verify normalized calibration: Sub A scored +1.0 std dev above Harsh's mean -> 75 + 15 = 90
    // Sub B scored -1.0 std dev below Generous's mean -> 75 - 15 = 60
    assert.strictEqual(subA.normalizedScore, 90);
    assert.strictEqual(subB.normalizedScore, 60);

    // Verify rank: Project Alpha is #1!
    assert.strictEqual(subA.rank, 1);
    assert.strictEqual(subB.rank, 2);
  });
});
