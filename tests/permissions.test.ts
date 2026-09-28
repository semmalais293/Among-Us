import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSessionFromRequest } from "@/lib/auth";
import { GET as getMe } from "@/app/api/me/route";
import { GET as getOrganizer } from "@/app/api/organizer/route";

vi.mock("@/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAction: vi.fn(),
}));

const sessionResolver = vi.mocked(getSessionFromRequest);

describe("backend route authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when a protected route is requested without a session", async () => {
    sessionResolver.mockResolvedValue(null);

    const response = await getMe(new Request("http://localhost/api/me"));

    expect(response.status).toBe(401);
  });

  it("returns 403 when a participant requests the organizer-only route", async () => {
    sessionResolver.mockResolvedValue({
      user: {
        id: "participant-id",
        email: "participant@dogfood.local",
        name: "Participant",
        role: "PARTICIPANT",
      },
    } as never);

    const response = await getOrganizer(
      new Request("http://localhost/api/organizer")
    );

    expect(response.status).toBe(403);
  });
});
