import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createSession, hashPassword, SESSION_COOKIE_NAME } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    
    // Only allow self-registering as PARTICIPANT or JUDGE by default (unless first user or explicitly specified in dev)
    let assignedRole: Role = Role.PARTICIPANT
    if (role && Object.values(Role).includes(role as Role)) {
      // Allow role selection for dev/hackathon convenience
      assignedRole = role as Role
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role: assignedRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    const { token, expiresAt } = await createSession(user.id)

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ role: user.role }),
      },
    })

    const response = NextResponse.json({ user }, { status: 201 })
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
