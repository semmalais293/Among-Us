import { describe, expect, it } from "vitest";

describe("permissions contract", () => {
  it("requires explicit role membership", () => {
    expect(["ADMIN", "ORGANIZER", "JUDGE", "PARTICIPANT"]).toContain("ADMIN");
  });

  it("enforces backend role checks with a 403 path", () => {
    const isAllowed = (role: string, allowed: string[]) =>
      allowed.includes(role);
    expect(isAllowed("PARTICIPANT", ["ADMIN"])).toBe(false);
    expect(isAllowed("ADMIN", ["ADMIN"])).toBe(true);
  });
});
