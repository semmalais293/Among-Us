import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

import { getSessionFromRequest, type AuthSession } from "@/lib/auth";

type AuthorizationResult =
  | { session: AuthSession; response?: never }
  | { session?: never; response: NextResponse };

export async function requireUser(
  request: Request
): Promise<AuthorizationResult> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session };
}

export async function requireRole(
  request: Request,
  roles: UserRole[]
): Promise<AuthorizationResult> {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth;
  }

  if (!roles.includes(auth.session.user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}
