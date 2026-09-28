import { NextResponse } from "next/server";

import {
  createSessionForUser,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!name || !email || password.length < 8) {
      return NextResponse.json(
        { error: "Name, email, and password (8+ chars) are required." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "PARTICIPANT",
      },
    });

    const session = await createSessionForUser(user.id);
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    setSessionCookie(response, session.sessionToken, session.expiresAt);
    await logAction({
      actorId: user.id,
      action: "SIGNUP",
      entity: "user",
      entityId: user.id,
    });

    return response;
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 }
    );
  }
}
