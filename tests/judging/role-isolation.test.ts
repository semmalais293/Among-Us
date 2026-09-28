import assert from "node:assert";
import { test, describe } from "node:test";

/**
 * Pure authorization and role-isolation guard simulator for judging endpoints.
 * Validates backend access control without external dependencies.
 */

type Role = "PARTICIPANT" | "JUDGE" | "ORGANIZER" | "ADMIN";

interface MockSessionUser {
  id: string;
  role: Role;
}

interface MockAssignment {
  id: string;
  judgeId: string;
  submissionId: string;
}

interface MockScore {
  assignmentId: string;
  criterionId: string;
  value: number;
}

export class RoleIsolationGuard {
  static getAssignments(user: MockSessionUser, targetJudgeId: string, allAssignments: MockAssignment[]) {
    // Participants can never view judging assignments
    if (user.role === "PARTICIPANT") {
      throw new Error("403 Forbidden: Participants cannot access judging assignments.");
    }

    // A judge can ONLY view their own assigned projects
    if (user.role === "JUDGE" && user.id !== targetJudgeId) {
      throw new Error("403 Forbidden: Judges cannot view other judges' assignments.");
    }

    // Organizers and Admins can view any judge's assignments
    return allAssignments.filter((a) => a.judgeId === targetJudgeId);
  }

  static getScores(user: MockSessionUser, assignment: MockAssignment, scores: MockScore[]) {
    if (user.role === "PARTICIPANT") {
      throw new Error("403 Forbidden: Participants cannot view scores.");
    }

    // A judge can ONLY view scores for assignments assigned to them
    if (user.role === "JUDGE" && user.id !== assignment.judgeId) {
      throw new Error("403 Forbidden: Judges cannot view other judges' scores.");
    }

    return scores.filter((s) => s.assignmentId === assignment.id);
  }

  static submitScore(user: MockSessionUser, assignment: MockAssignment, newScores: MockScore[]) {
    if (user.role === "PARTICIPANT") {
      throw new Error("403 Forbidden: Participants cannot submit scores.");
    }

    // A judge can ONLY score assignments assigned to them
    if (user.role === "JUDGE" && user.id !== assignment.judgeId) {
      throw new Error("403 Forbidden: Judges cannot submit or modify scores for other judges' assignments.");
    }

    return { success: true, count: newScores.length };
  }

  static getAggregates(user: MockSessionUser) {
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      throw new Error("403 Forbidden: Only Organizers and Admins can view normalized score aggregates.");
    }
    return { success: true, authorized: true };
  }
}

describe("Role Isolation & Backend Security Tests (403 Enforcement)", () => {
  const judge1: MockSessionUser = { id: "judge-alice", role: "JUDGE" };
  const judge2: MockSessionUser = { id: "judge-bob", role: "JUDGE" };
  const participant: MockSessionUser = { id: "user-charlie", role: "PARTICIPANT" };
  const organizer: MockSessionUser = { id: "org-dan", role: "ORGANIZER" };

  const assignmentAlice: MockAssignment = {
    id: "assign-1",
    judgeId: "judge-alice",
    submissionId: "sub-101",
  };

  const scoresAlice: MockScore[] = [
    { assignmentId: "assign-1", criterionId: "crit-1", value: 9 },
  ];

  test("Judge CANNOT read another judge's assignments (returns 403)", () => {
    assert.throws(
      () => {
        // Judge Bob attempts to read Judge Alice's assignments
        RoleIsolationGuard.getAssignments(judge2, "judge-alice", [assignmentAlice]);
      },
      {
        message: /403 Forbidden: Judges cannot view other judges' assignments/,
      }
    );
  });

  test("Judge CAN read their own assignments", () => {
    const assignments = RoleIsolationGuard.getAssignments(judge1, "judge-alice", [
      assignmentAlice,
    ]);
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0].id, "assign-1");
  });

  test("Judge CANNOT read another judge's scores (returns 403)", () => {
    assert.throws(
      () => {
        // Judge Bob attempts to read Judge Alice's scores
        RoleIsolationGuard.getScores(judge2, assignmentAlice, scoresAlice);
      },
      {
        message: /403 Forbidden: Judges cannot view other judges' scores/,
      }
    );
  });

  test("Judge CANNOT write scores to another judge's assignment (returns 403)", () => {
    assert.throws(
      () => {
        // Judge Bob attempts to score Judge Alice's assignment
        RoleIsolationGuard.submitScore(judge2, assignmentAlice, [
          { assignmentId: "assign-1", criterionId: "crit-1", value: 10 },
        ]);
      },
      {
        message: /403 Forbidden: Judges cannot submit or modify scores for other judges' assignments/,
      }
    );
  });

  test("Participant CANNOT view any assignments or scores (returns 403)", () => {
    assert.throws(
      () => {
        RoleIsolationGuard.getAssignments(participant, "judge-alice", [assignmentAlice]);
      },
      {
        message: /403 Forbidden: Participants cannot access judging assignments/,
      }
    );

    assert.throws(
      () => {
        RoleIsolationGuard.getScores(participant, assignmentAlice, scoresAlice);
      },
      {
        message: /403 Forbidden: Participants cannot view scores/,
      }
    );

    assert.throws(
      () => {
        RoleIsolationGuard.submitScore(participant, assignmentAlice, scoresAlice);
      },
      {
        message: /403 Forbidden: Participants cannot submit scores/,
      }
    );
  });

  test("Organizer CAN view aggregates and any judge's assignments", () => {
    const assignments = RoleIsolationGuard.getAssignments(organizer, "judge-alice", [
      assignmentAlice,
    ]);
    assert.strictEqual(assignments.length, 1);

    const aggregates = RoleIsolationGuard.getAggregates(organizer);
    assert.strictEqual(aggregates.authorized, true);
  });
});
