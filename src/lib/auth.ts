import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "dogfood_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function randomSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSessionForUser(userId: string) {
  const token = randomSessionToken();

  return db.session.create({
    data: {
      sessionToken: token,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
    include: {
      user: true,
    },
  });
}

export async function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split("; ")
      .filter(Boolean)
      .map((chunk) => {
        const [key, ...rest] = chunk.split("=");
        return [key, decodeURIComponent(rest.join("="))];
      })
  );

  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export function setSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt: Date
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });
}
