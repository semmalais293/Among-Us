import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
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
    !("name" in input) ||
    !("email" in input) ||
    !("password" in input) ||
    typeof input.name !== "string" ||
    typeof input.email !== "string" ||
    typeof input.password !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid signup details" },
      { status: 400 }
    );
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (
    !name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12
  ) {
    return NextResponse.json(
      { error: "Invalid signup details" },
      { status: 400 }
    );
  }

  const passwordHash = await hash(password, 12);
  let user;
  try {
    user = await db.user.create({
      data: { name, email, passwordHash, role: UserRole.PARTICIPANT },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }
    throw error;
  }

  const session = await createSession(user.id);
  await logAction({
    actorId: user.id,
    action: "SIGNUP",
    entity: "User",
    entityId: user.id,
  });

  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    { status: 201 }
  );
  setSessionCookie(response, session.sessionToken);
  return response;
}
