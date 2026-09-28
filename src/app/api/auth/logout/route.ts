import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);

  if (session) {
    await db.session.delete({ where: { id: session.id } });
    await logAction({
      actorId: session.userId,
      action: "LOGOUT",
      entity: "session",
      entityId: session.id,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
