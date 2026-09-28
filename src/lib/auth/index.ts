import type { User } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "dogfood_session";

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

export type AuthSession = {
  id: string;
  user: SessionUser;
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function createSession(userId: string) {
  const sessionToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  return db.session.create({
    data: { userId, sessionToken, expiresAt },
  });
}

export function setSessionCookie(
  response: Response,
  sessionToken: string
): void {
  const cookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];

  if (process.env.NODE_ENV === "production") {
    cookie.push("Secure");
  }

  response.headers.append("Set-Cookie", cookie.join("; "));
}

export async function getSessionFromRequest(
  request: Request
): Promise<AuthSession | null> {
  const token = getCookieValue(
    request.headers.get("cookie"),
    SESSION_COOKIE_NAME
  );

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return {
    id: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
}

export function getCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}
