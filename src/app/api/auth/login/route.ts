import { NextResponse } from "next/server";

import {
  createSessionForUser,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

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
      action: "LOGIN",
      entity: "user",
      entityId: user.id,
    });

    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
