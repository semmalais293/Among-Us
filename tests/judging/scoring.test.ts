import assert from "node:assert";
import { test, describe } from "node:test";
import {
  calculateWeightedScore,
  validateScores,
  type RubricCriterion,
} from "../../src/services/scoring.ts";

describe("Scoring Service - Pure Formula & Boundary Tests", () => {
  const criteria: RubricCriterion[] = [
    { id: "c1", name: "Impact", weight: 3, maxScore: 10 },
    { id: "c2", name: "Technical Execution", weight: 2, maxScore: 20 },
    { id: "c3", name: "UI/UX", weight: 1, maxScore: 5 },
  ];

  test("calculateWeightedScore: computes correct weighted score percentage", () => {
    // Formula: sum(criterion.value / maxScore * weight) / sum(weights) * 100
    // c1: 8/10 * 3 = 2.4
    // c2: 15/20 * 2 = 1.5
    // c3: 4/5 * 1 = 0.8
    // Total weight = 3 + 2 + 1 = 6
    // Weighted progress sum = 2.4 + 1.5 + 0.8 = 4.7
    // Final weighted score = (4.7 / 6) * 100 = 78.33%

    const scores = [
      { criterionId: "c1", value: 8 },
      { criterionId: "c2", value: 15 },
      { criterionId: "c3", value: 4 },
    ];

    const result = calculateWeightedScore(criteria, scores);

    assert.strictEqual(result.weightedScore, 78.33);
    assert.strictEqual(result.rawPoints, 27); // 8 + 15 + 4
    assert.strictEqual(result.maxPoints, 35); // 10 + 20 + 5
    assert.strictEqual(result.totalWeight, 6);

    // Verify breakdown
    assert.strictEqual(result.breakdown[0].percentage, 80); // 8/10
    assert.strictEqual(result.breakdown[1].percentage, 75); // 15/20
    assert.strictEqual(result.breakdown[2].percentage, 80); // 4/5
  });

  test("validateScores: rejects score out of range (value > maxScore)", () => {
    const scores = [
      { criterionId: "c1", value: 12 }, // Max is 10!
    ];

    assert.throws(
      () => {
        validateScores(criteria, scores);
      },
      {
        message: 'Score out of range: value 12 for criterion "Impact" must be between 0 and 10.',
      }
    );
  });

  test("validateScores: rejects score out of range (value < 0)", () => {
    const scores = [
      { criterionId: "c2", value: -1 }, // Negative score
    ];

    assert.throws(
      () => {
        validateScores(criteria, scores);
      },
      {
        message: 'Score out of range: value -1 for criterion "Technical Execution" must be between 0 and 20.',
      }
    );
  });

  test("validateScores: rejects non-existent criterion", () => {
    const scores = [
      { criterionId: "unknown-criterion-999", value: 5 },
    ];

    assert.throws(
      () => {
        validateScores(criteria, scores);
      },
      {
        message: 'Criterion ID "unknown-criterion-999" not found in rubric criteria.',
      }
    );
  });

  test("validateScores: allows valid boundaries (0 and maxScore)", () => {
    const scores = [
      { criterionId: "c1", value: 0 },
      { criterionId: "c2", value: 20 },
      { criterionId: "c3", value: 5 },
    ];

    assert.doesNotThrow(() => {
      validateScores(criteria, scores);
    });
  });
});
