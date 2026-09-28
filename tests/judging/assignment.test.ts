import assert from "node:assert";
import { test, describe } from "node:test";
import {
  assign,
  manualAssign,
  removeAssignment,
  getJudgeLoadSummaries,
} from "../../src/services/assignment.ts";

describe("Assignment Service - Load Balancing & Duplication Tests", () => {
  test("assign: balances load so each judge gets equal +/- 1 projects", () => {
    // 5 judges, 7 submissions, 3 judgesPerSubmission
    // Total assignment slots needed = 7 * 3 = 21 slots.
    // 21 / 5 = 4 with remainder 1.
    // Therefore, exactly 1 judge gets 5 projects, and 4 judges get 4 projects.
    // Difference between max load and min load must be <= 1!

    const judges = ["J1", "J2", "J3", "J4", "J5"];
    const submissions = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
    const judgesPerSubmission = 3;

    const assignments = assign(judges, submissions, judgesPerSubmission);

    // Total assignments must equal 21
    assert.strictEqual(assignments.length, 21);

    const loadSummaries = getJudgeLoadSummaries(judges, assignments);
    const loads = loadSummaries.map((s) => s.assignedCount);

    const minLoad = Math.min(...loads);
    const maxLoad = Math.max(...loads);

    assert.strictEqual(minLoad, 4, "Min load must be 4");
    assert.strictEqual(maxLoad, 5, "Max load must be 5");
    assert.ok(maxLoad - minLoad <= 1, "Load difference must be at most 1");

    // Exactly one judge has 5, four have 4
    const countWith5 = loads.filter((l) => l === 5).length;
    const countWith4 = loads.filter((l) => l === 4).length;
    assert.strictEqual(countWith5, 1);
    assert.strictEqual(countWith4, 4);
  });

  test("assign: no judge gets the same project twice", () => {
    const judges = ["J1", "J2", "J3", "J4"];
    const submissions = ["S1", "S2", "S3", "S4", "S5", "S6"];
    const judgesPerSubmission = 3;

    const assignments = assign(judges, submissions, judgesPerSubmission);

    // Check every submission's assigned judges are distinct
    for (const subId of submissions) {
      const assignedJudges = assignments
        .filter((a) => a.submissionId === subId)
        .map((a) => a.judgeId);

      assert.strictEqual(assignedJudges.length, 3);
      const uniqueJudges = new Set(assignedJudges);
      assert.strictEqual(
        uniqueJudges.size,
        3,
        `Submission ${subId} must not have duplicate judges`
      );
    }
  });

  test("assign: handles edge cases (more judgesPerSubmission than available judges)", () => {
    const judges = ["J1", "J2"];
    const submissions = ["S1", "S2"];
    // Requested 5 judges per submission, but only 2 judges exist
    const assignments = assign(judges, submissions, 5);

    // Each submission gets exactly the 2 available judges
    assert.strictEqual(assignments.length, 4);
    for (const subId of submissions) {
      const assignedJudges = assignments
        .filter((a) => a.submissionId === subId)
        .map((a) => a.judgeId);
      assert.deepStrictEqual(assignedJudges.sort(), ["J1", "J2"]);
    }
  });

  test("manualAssign: successfully assigns and prevents duplicate assignment", () => {
    let list = [
      { judgeId: "J1", submissionId: "S1" },
      { judgeId: "J2", submissionId: "S1" },
    ];

    // Add valid new assignment
    list = manualAssign(list, "J3", "S1");
    assert.strictEqual(list.length, 3);

    // Attempt to add duplicate J1 -> S1
    assert.throws(
      () => {
        manualAssign(list, "J1", "S1");
      },
      {
        message: /Assignment already exists/,
      }
    );
  });

  test("removeAssignment: removes existing assignment", () => {
    const list = [
      { judgeId: "J1", submissionId: "S1" },
      { judgeId: "J2", submissionId: "S1" },
    ];

    const updated = removeAssignment(list, "J1", "S1");
    assert.strictEqual(updated.length, 1);
    assert.strictEqual(updated[0].judgeId, "J2");
  });
});
