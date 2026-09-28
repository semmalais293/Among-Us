import { NextResponse } from "next/server";

import { requireRole } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["ADMIN"]);

  if (auth.response) {
    return auth.response;
  }

  return NextResponse.json({
    ok: true,
    message: "Admin access confirmed.",
    user: {
      id: auth.user.id,
      role: auth.user.role,
      email: auth.user.email,
    },
  });
}
