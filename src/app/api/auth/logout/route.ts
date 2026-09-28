import { NextResponse } from "next/server";

import { getSessionFromRequest, SESSION_COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);

  if (session) {
    await db.session.delete({ where: { id: session.id } });
  }

  await logAction({
    actorId: session?.user.id ?? null,
    action: "LOGOUT",
    entity: "Session",
    entityId: session?.id ?? "unknown",
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
