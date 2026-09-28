import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import prisma from './db'
import { Role } from '@prisma/client'

export const SESSION_COOKIE_NAME = 'dogfood_session'
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function destroySession(token: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { token },
    })
  } catch {
    // Session might already be gone
  }
}

export async function getSessionUserFromToken(token: string): Promise<AuthUser | null> {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  })

  if (!session) return null

  // Check expiration
  if (session.expiresAt.getTime() < Date.now()) {
    await destroySession(token)
    return null
  }

  return session.user
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return null
    return await getSessionUserFromToken(token)
  } catch {
    return null
  }
}
