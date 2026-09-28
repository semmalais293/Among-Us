import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function requireUser(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user: session.user, response: null };
}

export async function requireRole(request: Request, roles: UserRole[]) {
  const auth = await requireUser(request);

  if (!auth.user) {
    return auth;
  }

  if (!roles.includes(auth.user.role)) {
    await logAction({
      actorId: auth.user.id,
      action: "ACCESS_DENIED",
      entity: "route",
      entityId: request.url,
    });

    return {
      user: auth.user,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: auth.user, response: null };
}

export async function canAccessEvent(request: Request, eventId: string) {
  const auth = await requireUser(request);

  if (!auth.user) {
    return false;
  }

  if (auth.user.role === "ADMIN" || auth.user.role === "ORGANIZER") {
    return true;
  }

  if (auth.user.role === "PARTICIPANT") {
    const membership = await db.teamMember.findFirst({
      where: {
        userId: auth.user.id,
        team: { eventId },
      },
      select: { id: true },
    });

    return Boolean(membership);
  }

  if (auth.user.role === "JUDGE") {
    const assignment = await db.judgeAssignment.findFirst({
      where: {
        judgeId: auth.user.id,
        submission: { eventId },
      },
      select: { id: true },
    });

    return Boolean(assignment);
  }

  return false;
}
