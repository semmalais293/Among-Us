import { NextResponse } from "next/server";

import { requireRole } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["ORGANIZER"]);

  if (auth.response) {
    return auth.response;
  }

  return NextResponse.json({ ok: true });
}
