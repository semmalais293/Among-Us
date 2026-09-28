import { Role } from '@prisma/client'
import { cookies } from 'next/headers'
import { AuthUser, getSessionUserFromToken, SESSION_COOKIE_NAME } from './auth'
import { NextResponse } from 'next/server'

export class AuthError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AuthError'
  }
}

/**
 * Extracts session token from either a Request object (cookies header)
 * or Next.js cookies() store.
 */
export function extractSessionToken(request?: Request): string | null {
  if (request) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
      if (match) {
        return decodeURIComponent(match.split('=')[1])
      }
    }
  }

  try {
    const cookieStore = cookies()
    return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
  } catch {
    return null
  }
}

/**
 * requireRole: Enforces authentication and authorization.
 * Role check: User must have one of the allowed roles (or ADMIN).
 * Throws AuthError(401) if not logged in.
 * Throws AuthError(403) if role is insufficient.
 */
export async function requireRole(
  allowedRoles: Role | Role[],
  request?: Request
): Promise<AuthUser> {
  const token = extractSessionToken(request)
  if (!token) {
    throw new AuthError(401, 'Authentication required: please log in')
  }

  const user = await getSessionUserFromToken(token)
  if (!user) {
    throw new AuthError(401, 'Invalid or expired session: please log in again')
  }

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  // ADMIN is allowed everywhere unless strict isolation is required
  const isAllowed = rolesArray.includes(user.role) || user.role === 'ADMIN'
  if (!isAllowed) {
    throw new AuthError(
      403,
      `Forbidden: role '${user.role}' does not have permission (requires ${rolesArray.join(' or ')})`
    )
  }

  return user
}

/**
 * Convenience wrapper to return appropriate JSON error responses for AuthError
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }
  const message = error instanceof Error ? error.message : 'Internal Server Error'
  return NextResponse.json({ error: message }, { status: 500 })
}
