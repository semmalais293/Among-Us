import assert from "node:assert";
import { test, describe } from "node:test";
import {
  assignJudgeToSubmission,
  autoAssignJudges,
} from "../../src/services/assignment.ts";

describe("Assignment Service - Conflict & Load Balancing Tests", () => {
  test("assignJudgeToSubmission: blocks judge from scoring their own team (Conflict of Interest)", async () => {
    const mockDb: any = {
      submission: {
        findUnique: async () => ({
          id: "sub-1",
          team: {
            name: "ByteBrawlers",
            members: [{ userId: "user-judge-1" }, { userId: "user-dev-2" }],
          },
        }),
      },
    };

    await assert.rejects(
      async () => {
        await assignJudgeToSubmission(
          { judgeId: "user-judge-1", submissionId: "sub-1" },
          mockDb
        );
      },
      {
        message: /Conflict of interest: Judge user-judge-1 is a member of team ByteBrawlers/,
      }
    );
  });

  test("assignJudgeToSubmission: rejects user without judging role", async () => {
    const mockDb: any = {
      submission: {
        findUnique: async () => ({
          id: "sub-2",
          team: { name: "OtherTeam", members: [] },
        }),
      },
      user: {
        findUnique: async () => ({
          id: "user-participant",
          role: "PARTICIPANT",
        }),
      },
    };

    await assert.rejects(
      async () => {
        await assignJudgeToSubmission(
          { judgeId: "user-participant", submissionId: "sub-2" },
          mockDb
        );
      },
      {
        message: /User user-participant does not possess judging privileges/,
      }
    );
  });

  test("autoAssignJudges: balances judge workloads and skips conflict of interest", async () => {
    const createdAssignments: { judgeId: string; submissionId: string }[] = [];

    const mockDb: any = {
      user: {
        findMany: async () => [
          { id: "judge-A", name: "Alice", email: "alice@test.com" },
          { id: "judge-B", name: "Bob", email: "bob@test.com" },
          { id: "judge-C", name: "Charlie", email: "charlie@test.com" },
        ],
      },
      submission: {
        findMany: async () => [
          // Sub 1: Alice is in the team! Alice must NOT be assigned to Sub 1.
          {
            id: "sub-1",
            status: "SUBMITTED",
            team: { members: [{ userId: "judge-A" }] },
            assignments: [],
          },
          // Sub 2: No conflicts
          {
            id: "sub-2",
            status: "SUBMITTED",
            team: { members: [] },
            assignments: [],
          },
        ],
      },
      judgeAssignment: {
        findMany: async () => [], // No prior assignments
        create: async (payload: any) => {
          createdAssignments.push(payload.data);
          return payload.data;
        },
      },
    };

    const res = await autoAssignJudges(
      { eventId: "ev-1", judgesPerSubmission: 2 },
      mockDb
    );

    assert.strictEqual(res.assignedCount, 4);

    // Verify Sub 1 got Bob and Charlie (skipping Alice due to conflict)
    const sub1Judges = createdAssignments
      .filter((a) => a.submissionId === "sub-1")
      .map((a) => a.judgeId);
    assert.deepStrictEqual(sub1Judges.sort(), ["judge-B", "judge-C"]);

    // Verify Sub 2 got Alice and one of the other judges (Alice was lowest load with 0 assignments!)
    const sub2Judges = createdAssignments
      .filter((a) => a.submissionId === "sub-2")
      .map((a) => a.judgeId);
    assert.ok(sub2Judges.includes("judge-A"));
  });
});
