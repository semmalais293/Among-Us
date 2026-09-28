import prisma from '@/lib/db'
import { Event, EventStatus } from '@prisma/client'

export interface CreateEventInput {
  name: string
  description?: string
  startsAt: Date
  endsAt: Date
  submissionDeadline: Date
  status?: EventStatus
  tracks?: Array<{ name: string; description?: string }>
  prizes?: Array<{ title: string; amount?: string; description?: string }>
}

export interface UpdateEventInput {
  name?: string
  description?: string
  startsAt?: Date
  endsAt?: Date
  submissionDeadline?: Date
  status?: EventStatus
  tracks?: Array<{ name: string; description?: string }>
  prizes?: Array<{ title: string; amount?: string; description?: string }>
}

/**
 * Checks if the event submission window is currently open
 */
export function isSubmissionWindowOpen(event: {
  submissionDeadline: Date
  status: EventStatus
}): boolean {
  if (event.status === EventStatus.CLOSED) return false
  const now = new Date()
  return now.getTime() <= new Date(event.submissionDeadline).getTime()
}

/**
 * Retrieves the currently active event or first upcoming event
 */
export async function getActiveEvent() {
  const activeEvent = await prisma.event.findFirst({
    where: {
      status: {
        in: [EventStatus.ACTIVE, EventStatus.UPCOMING, EventStatus.VOTING],
      },
    },
    include: {
      tracks: true,
      prizes: true,
      _count: {
        select: {
          teams: true,
          submissions: true,
        },
      },
    },
    orderBy: {
      startsAt: 'desc',
    },
  })

  return activeEvent
}

/**
 * Retrieves all events for listing
 */
export async function listEvents() {
  return prisma.event.findMany({
    include: {
      tracks: true,
      prizes: true,
      _count: {
        select: {
          teams: true,
          submissions: true,
        },
      },
    },
    orderBy: {
      startsAt: 'desc',
    },
  })
}

/**
 * Retrieves full details for an event by ID
 */
export async function getEventDetails(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      tracks: true,
      prizes: true,
      teams: {
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
      },
      submissions: {
        include: {
          team: true,
          track: true,
        },
      },
      rubrics: {
        include: {
          criteria: true,
        },
      },
    },
  })
}

/**
 * Creates a new hackathon event (Organizer/Admin only)
 */
export async function createEvent(data: CreateEventInput, actorId: string) {
  const event = await prisma.event.create({
    data: {
      name: data.name,
      description: data.description,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      submissionDeadline: data.submissionDeadline,
      status: data.status || EventStatus.UPCOMING,
      ...(data.tracks && data.tracks.length > 0
        ? {
            tracks: {
              create: data.tracks.map((t) => ({
                name: t.name,
                description: t.description,
              })),
            },
          }
        : {}),
      ...(data.prizes && data.prizes.length > 0
        ? {
            prizes: {
              create: data.prizes.map((p) => ({
                title: p.title,
                amount: p.amount,
                description: p.description,
              })),
            },
          }
        : {}),
    },
    include: {
      tracks: true,
      prizes: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'EVENT_CREATED',
      entity: 'Event',
      entityId: event.id,
      metadata: JSON.stringify({ name: event.name }),
    },
  })

  return event
}

/**
 * Updates event details or deadline (Organizer/Admin only)
 */
export async function updateEvent(
  eventId: string,
  data: UpdateEventInput,
  actorId: string
) {
  const { tracks, prizes, ...fields } = data

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...fields,
      ...(tracks && tracks.length > 0
        ? {
            tracks: {
              create: tracks.map((t) => ({
                name: t.name,
                description: t.description,
              })),
            },
          }
        : {}),
      ...(prizes && prizes.length > 0
        ? {
            prizes: {
              create: prizes.map((p) => ({
                title: p.title,
                amount: p.amount,
                description: p.description,
              })),
            },
          }
        : {}),
    },
    include: {
      tracks: true,
      prizes: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'EVENT_UPDATED',
      entity: 'Event',
      entityId: event.id,
      metadata: JSON.stringify(data),
    },
  })

  return event
}

export async function addTrack(eventId: string, name: string, description?: string) {
  return prisma.track.create({
    data: {
      eventId,
      name,
      description,
    },
  })
}

export async function addPrize(eventId: string, title: string, amount?: string, description?: string) {
  return prisma.prize.create({
    data: {
      eventId,
      title,
      amount,
      description,
    },
  })
}
