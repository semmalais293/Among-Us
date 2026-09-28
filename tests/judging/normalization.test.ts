import assert from "node:assert";
import { test, describe } from "node:test";
import {
  computeStats,
  normalizeScores,
  type JudgeScoreInput,
} from "../../src/services/normalization.ts";

describe("Normalization Service - Pure Logic & Fixtures", () => {
  test("computeStats: correctly computes mean and sample standard deviation", () => {
    const stats = computeStats([10, 20, 30]);
    assert.strictEqual(stats.mean, 20);
    assert.strictEqual(stats.stdDev, 10);
  });

  test("computeStats: handles single element gracefully", () => {
    const stats = computeStats([85]);
    assert.strictEqual(stats.mean, 85);
    assert.strictEqual(stats.stdDev, 0);
  });

  test("normalizeScores: harsh judge vs lenient judge fixture SHOWING raw ranking != normalized ranking", () => {
    /**
     * FIXTURE SETUP:
     * - Judge Harsh:
     *   - Submission A: 60 (Harsh's highest score! Other scores: 40, 20. Mean = 40, stdDev = 20)
     * - Judge Lenient:
     *   - Submission B: 80 (Lenient's lowest score! Other scores: 90, 100. Mean = 90, stdDev = 10)
     *
     * RAW COMPARISON:
     * - Submission B has raw average 80
     * - Submission A has raw average 60
     * Raw Ranking: Submission B (#1) > Submission A (#2)
     *
     * NORMALIZED COMPARISON (targetMean=75, targetStdDev=15):
     * - Submission A Z-Score = (60 - 40) / 20 = +1.0
     *   Normalized Score = 75 + 1.0 * 15 = 90.0
     * - Submission B Z-Score = (80 - 90) / 10 = -1.0
     *   Normalized Score = 75 + (-1.0) * 15 = 60.0
     *
     * Normalized Ranking: Submission A (#1, score 90) > Submission B (#2, score 60)
     * Proves: RAW RANKING != NORMALIZED RANKING!
     */

    const fixtureScores: JudgeScoreInput[] = [
      // Judge Harsh (scores: 65, 30, 25 -> mean = 40, stdDev = 21.79)
      { judgeId: "judge-harsh", submissionId: "sub-A", weightedScore: 65 },
      { judgeId: "judge-harsh", submissionId: "sub-C", weightedScore: 30 },
      { judgeId: "judge-harsh", submissionId: "sub-D", weightedScore: 25 },

      // Judge Lenient (scores: 85, 90, 95 -> mean = 90, stdDev = 5)
      { judgeId: "judge-lenient", submissionId: "sub-B", weightedScore: 85 },
      { judgeId: "judge-lenient", submissionId: "sub-E", weightedScore: 90 },
      { judgeId: "judge-lenient", submissionId: "sub-F", weightedScore: 95 },
    ];

    const result = normalizeScores(fixtureScores, { targetMean: 75, targetStdDev: 15 });

    const rankSubA = result.rankings.find((r) => r.submissionId === "sub-A")!;
    const rankSubB = result.rankings.find((r) => r.submissionId === "sub-B")!;

    // 1. Verify Raw Scores: Sub B (85) beats Sub A (65)
    assert.strictEqual(rankSubA.rawAverage, 65);
    assert.strictEqual(rankSubB.rawAverage, 85);
    assert.ok(rankSubB.rawAverage > rankSubA.rawAverage, "Raw: Sub B must have higher raw score than Sub A");

    // 2. Verify Normalized Scores: Sub A (92.21) beats Sub B (60.0)
    assert.strictEqual(rankSubA.normalizedScore, 92.21);
    assert.strictEqual(rankSubB.normalizedScore, 60.0);

    // 3. Verify that Normalized Ranking INVERTS Raw Ranking!
    assert.strictEqual(rankSubA.rank, 1, "Sub A must be Rank #1 after normalization");
    assert.strictEqual(rankSubB.rank, 6, "Sub B must be Rank #6 after normalization");
    assert.ok(rankSubA.normalizedScore > rankSubB.normalizedScore);

    // Explicit assertion: Raw ranking != Normalized ranking
    const rawRanks = [...result.rankings].sort((a, b) => b.rawAverage - a.rawAverage);
    assert.notDeepStrictEqual(
      rawRanks.map((r) => r.submissionId),
      result.rankings.map((r) => r.submissionId),
      "Raw ranking must NOT equal normalized ranking"
    );
  });

  test("normalizeScores: fallback to mean-centering when judge has < 2 scores", () => {
    const scores: JudgeScoreInput[] = [
      { judgeId: "judge-single", submissionId: "sub-1", weightedScore: 85 },
    ];

    const result = normalizeScores(scores, { targetMean: 75 });
    assert.strictEqual(result.judgeStats["judge-single"].isFallback, true);
    // When count=1, zScore is 0 (mean-centered: 85 - 85 = 0), normalized = 75
    const ev = result.evaluations[0];
    assert.strictEqual(ev.zScore, 0);
    assert.strictEqual(ev.normalizedScore, 75);
  });

  test("normalizeScores: fallback to mean-centering when judge has zero variance", () => {
    const scores: JudgeScoreInput[] = [
      { judgeId: "judge-flat", submissionId: "sub-1", weightedScore: 70 },
      { judgeId: "judge-flat", submissionId: "sub-2", weightedScore: 70 },
      { judgeId: "judge-flat", submissionId: "sub-3", weightedScore: 70 },
    ];

    const result = normalizeScores(scores, { targetMean: 75 });
    assert.strictEqual(result.judgeStats["judge-flat"].isFallback, true);
    assert.strictEqual(result.judgeStats["judge-flat"].stdDev, 0);
    // All z-scores should be 0, all normalized scores equal targetMean
    for (const ev of result.evaluations) {
      assert.strictEqual(ev.zScore, 0);
      assert.strictEqual(ev.normalizedScore, 75);
    }
  });
});
