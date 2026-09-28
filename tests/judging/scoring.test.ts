import assert from "node:assert";
import { test, describe } from "node:test";
import {
  calculateWeightedScore,
  submitAssignmentScores,
} from "../../src/services/scoring.ts";

describe("Scoring Service - Unit & Logic Tests", () => {
  test("calculateWeightedScore: calculates correct percentage with equal weights", () => {
    const scores = [
      { value: 8, maxScore: 10, weight: 1 }, // 80%
      { value: 6, maxScore: 10, weight: 1 }, // 60%
    ];
    const result = calculateWeightedScore(scores);
    assert.strictEqual(result.percentageScore, 70);
    assert.strictEqual(result.rawSum, 14);
    assert.strictEqual(result.maxPossibleSum, 20);
  });

  test("calculateWeightedScore: weights criteria correctly", () => {
    // Criterion 1: weight 3, value 10/10 (100% -> 3.0 weighted points)
    // Criterion 2: weight 1, value 5/10 (50% -> 0.5 weighted points)
    // Total weight = 4, Total weighted progress = 3.5 -> (3.5 / 4) * 100 = 87.5%
    const scores = [
      { value: 10, maxScore: 10, weight: 3 },
      { value: 5, maxScore: 10, weight: 1 },
    ];
    const result = calculateWeightedScore(scores);
    assert.strictEqual(result.percentageScore, 87.5);
    assert.strictEqual(result.weightedScore, 3.5);
  });

  test("calculateWeightedScore: clamps out-of-bound values", () => {
    const scores = [
      { value: 15, maxScore: 10, weight: 1 }, // clamped to 10
      { value: -5, maxScore: 10, weight: 1 }, // clamped to 0
    ];
    const result = calculateWeightedScore(scores);
    assert.strictEqual(result.percentageScore, 50);
    assert.strictEqual(result.rawSum, 10);
  });

  test("calculateWeightedScore: handles empty criteria array gracefully", () => {
    const result = calculateWeightedScore([]);
    assert.strictEqual(result.percentageScore, 0);
    assert.strictEqual(result.rawSum, 0);
  });

  test("submitAssignmentScores: rejects unauthorized judge attempting to score", async () => {
    const mockDb: any = {
      judgeAssignment: {
        findUnique: async () => ({
          id: "assign-1",
          judgeId: "judge-correct",
          submission: {
            event: {
              rubric: {
                criteria: [{ id: "c1", name: "Impact", weight: 1, maxScore: 10 }],
              },
            },
          },
        }),
      },
    };

    await assert.rejects(
      async () => {
        await submitAssignmentScores(
          {
            assignmentId: "assign-1",
            judgeId: "impostor-judge",
            scores: [{ criterionId: "c1", value: 8 }],
          },
          mockDb
        );
      },
      {
        message: "Unauthorized: You are not assigned to score this submission.",
      }
    );
  });

  test("submitAssignmentScores: rejects score for non-existent criterion", async () => {
    const mockDb: any = {
      judgeAssignment: {
        findUnique: async () => ({
          id: "assign-1",
          judgeId: "judge-1",
          submission: {
            event: {
              rubric: {
                criteria: [{ id: "c1", name: "Code Quality", weight: 1, maxScore: 10 }],
              },
            },
          },
        }),
      },
    };

    await assert.rejects(
      async () => {
        await submitAssignmentScores(
          {
            assignmentId: "assign-1",
            judgeId: "judge-1",
            scores: [{ criterionId: "c-invalid", value: 9 }],
          },
          mockDb
        );
      },
      {
        message: 'Criterion ID c-invalid does not belong to this event\'s rubric.',
      }
    );
  });

  test("submitAssignmentScores: rejects score exceeding maxScore", async () => {
    const mockDb: any = {
      judgeAssignment: {
        findUnique: async () => ({
          id: "assign-1",
          judgeId: "judge-1",
          submission: {
            event: {
              rubric: {
                criteria: [{ id: "c1", name: "Innovation", weight: 1, maxScore: 10 }],
              },
            },
          },
        }),
      },
    };

    await assert.rejects(
      async () => {
        await submitAssignmentScores(
          {
            assignmentId: "assign-1",
            judgeId: "judge-1",
            scores: [{ criterionId: "c1", value: 12 }],
          },
          mockDb
        );
      },
      {
        message: 'Invalid score value 12 for criterion "Innovation". Must be between 0 and 10.',
      }
    );
  });

  test("submitAssignmentScores: successfully saves final scores and marks completed", async () => {
    let completedMarked = false;
    const upsertedScores: any[] = [];

    const mockDb: any = {
      judgeAssignment: {
        findUnique: async () => ({
          id: "assign-1",
          judgeId: "judge-1",
          submission: {
            event: {
              rubric: {
                criteria: [
                  { id: "c1", name: "UI/UX", weight: 1, maxScore: 10 },
                  { id: "c2", name: "Execution", weight: 2, maxScore: 10 },
                ],
              },
            },
          },
        }),
      },
      $transaction: async (cb: any) => {
        const tx = {
          score: {
            upsert: async (payload: any) => {
              upsertedScores.push(payload);
            },
          },
          judgeAssignment: {
            update: async (payload: any) => {
              completedMarked = payload.data.isCompleted;
            },
          },
          auditLog: {
            create: async () => {},
          },
        };
        return await cb(tx);
      },
    };

    const res = await submitAssignmentScores(
      {
        assignmentId: "assign-1",
        judgeId: "judge-1",
        scores: [
          { criterionId: "c1", value: 8 },
          { criterionId: "c2", value: 10 },
        ],
        isDraft: false,
      },
      mockDb
    );

    assert.strictEqual(completedMarked, true);
    assert.strictEqual(res.isCompleted, true);
    assert.strictEqual(upsertedScores.length, 2);
    // (8/10 * 1 + 10/10 * 2) / 3 * 100 = 2.8 / 3 * 100 = 93.33%
    assert.strictEqual(res.percentageScore, 93.33);
  });
});
