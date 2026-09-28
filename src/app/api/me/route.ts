import { NextResponse } from "next/server";

import { requireUser } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  return NextResponse.json({
    user: {
      id: auth.session.user.id,
      email: auth.session.user.email,
      name: auth.session.user.name,
      role: auth.session.user.role,
    },
  });
}
