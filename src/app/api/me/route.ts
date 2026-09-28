import { NextResponse } from "next/server";

import { requireUser } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      role: auth.user.role,
    },
  });
}
