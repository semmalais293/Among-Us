import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  });
}
