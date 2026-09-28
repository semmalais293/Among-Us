import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./auth";

describe("auth helpers", () => {
  it("hashes and verifies a password", async () => {
    const password = "AdminPass123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
