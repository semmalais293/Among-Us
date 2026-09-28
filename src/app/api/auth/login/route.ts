import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { createSession, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (
    !input ||
    typeof input !== "object" ||
    !("email" in input) ||
    !("password" in input) ||
    typeof input.email !== "string" ||
    typeof input.password !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
  });

  if (!user || !(await compare(input.password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const session = await createSession(user.id);
  await logAction({
    actorId: user.id,
    action: "LOGIN",
    entity: "Session",
    entityId: session.id,
  });

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  setSessionCookie(response, session.sessionToken);
  return response;
}
