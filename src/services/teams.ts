import prisma from '@/lib/db'
import crypto from 'crypto'

export function generateInviteCode(prefix = 'TEAM'): string {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${randomPart}`
}

/**
 * Creates a new team and adds the creator as the first member
 */
export async function createTeam(params: {
  eventId: string
  name: string
  creatorUserId: string
}) {
  const { eventId, name, creatorUserId } = params

  if (!name || name.trim().length === 0) {
    throw new Error('Team name is required')
  }

  // Check if user is already in a team for this event
  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId: creatorUserId,
      team: {
        eventId,
      },
    },
    include: {
      team: true,
    },
  })

  if (existingMembership) {
    throw new Error(`You are already a member of team "${existingMembership.team.name}" for this event.`)
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode()
  let attempts = 0
  while (attempts < 5) {
    const codeConflict = await prisma.team.findUnique({
      where: { inviteCode },
    })
    if (!codeConflict) break
    inviteCode = generateInviteCode()
    attempts++
  }

  const team = await prisma.team.create({
    data: {
      eventId,
      name: name.trim(),
      inviteCode,
      members: {
        create: {
          userId: creatorUserId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      submissions: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: creatorUserId,
      action: 'TEAM_CREATED',
      entity: 'Team',
      entityId: team.id,
      metadata: JSON.stringify({ name: team.name, inviteCode: team.inviteCode }),
    },
  })

  return team
}

/**
 * Joins an existing team via its unique invite code
 */
export async function joinTeamByInviteCode(params: {
  inviteCode: string
  userId: string
}) {
  const { inviteCode, userId } = params
  const normalizedCode = inviteCode.trim().toUpperCase()

  const team = await prisma.team.findUnique({
    where: { inviteCode: normalizedCode },
    include: {
      event: true,
      members: true,
    },
  })

  if (!team) {
    throw new Error('Invalid invite code: No team found with this code')
  }

  // Check if event is closed
  if (team.event.status === 'CLOSED') {
    throw new Error('Cannot join team: This hackathon event is closed')
  }

  // Check if user is already in this team
  const isAlreadyInThisTeam = team.members.some((m) => m.userId === userId)
  if (isAlreadyInThisTeam) {
    return team
  }

  // Check if team is full (max 4 members)
  if (team.members.length >= 4) {
    const error = new Error('Team is full: Maximum 4 members allowed per team.')
    ;(error as any).statusCode = 409
    throw error
  }

  // Check if user is already in another team for this same event
  const existingMembershipInEvent = await prisma.teamMember.findFirst({
    where: {
      userId,
      team: {
        eventId: team.eventId,
      },
    },
    include: {
      team: true,
    },
  })

  if (existingMembershipInEvent) {
    const error = new Error(
      `You are already in team "${existingMembershipInEvent.team.name}" for this event. Leave that team first to join another.`
    )
    ;(error as any).statusCode = 409
    throw error
  }

  // Add user to team
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'TEAM_MEMBER_JOINED',
      entity: 'Team',
      entityId: team.id,
      metadata: JSON.stringify({ inviteCode: normalizedCode }),
    },
  })

  // Return refreshed team details
  return prisma.team.findUnique({
    where: { id: team.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      submissions: true,
    },
  })
}

/**
 * Retrieves the team that a user belongs to for a given event
 */
export async function getUserTeam(userId: string, eventId?: string) {
  const membership = await prisma.teamMember.findFirst({
    where: {
      userId,
      ...(eventId ? { team: { eventId } } : {}),
    },
    include: {
      team: {
        include: {
          event: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
          submissions: {
            include: {
              track: true,
            },
          },
        },
      },
    },
  })

  return membership?.team ?? null
}

/**
 * Retrieves full team details by team ID
 */
export async function getTeamDetails(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      event: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      submissions: {
        include: {
          track: true,
        },
      },
    },
  })
}
