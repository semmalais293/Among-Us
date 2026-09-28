import prisma from '@/lib/db'
import { SubmissionStatus } from '@prisma/client'
import { isSubmissionWindowOpen } from './events'

export interface UpsertSubmissionInput {
  submissionId?: string
  teamId: string
  eventId: string
  userId: string
  title: string
  description: string
  repoUrl?: string
  demoUrl?: string
  trackId?: string
  status: SubmissionStatus
}

/**
 * Creates or updates a team's submission with strict deadline enforcement
 */
export async function upsertSubmission(input: UpsertSubmissionInput) {
  const {
    submissionId,
    teamId,
    eventId,
    userId,
    title,
    description,
    repoUrl,
    demoUrl,
    trackId,
    status,
  } = input

  if (!title || title.trim().length === 0) {
    throw new Error('Project title is required')
  }

  if (!description || description.trim().length === 0) {
    throw new Error('Project description is required')
  }

  // 1. Verify User is a member of the team
  const isMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  })

  if (!isMember) {
    const error = new Error('Unauthorized: You must be a verified member of this team to manage its submission.')
    ;(error as any).statusCode = 403
    throw error
  }

  // 2. Verify Event and Deadline Enforcement
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  })

  if (!event) {
    const error = new Error('Event not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const isOpen = isSubmissionWindowOpen(event)
  if (!isOpen) {
    const error = new Error(
      `Submission deadline passed at ${new Date(event.submissionDeadline).toISOString()}. New submissions and edits are closed.`
    )
    ;(error as any).statusCode = 403
    throw error
  }

  // 3. Validate track belongs to event if provided
  if (trackId) {
    const track = await prisma.track.findFirst({
      where: { id: trackId, eventId },
    })
    if (!track) {
      throw new Error('Selected track does not belong to this event.')
    }
  }

  // 4. Create or Update
  let submission
  if (submissionId) {
    // Verify existing submission belongs to this team
    const existing = await prisma.submission.findUnique({
      where: { id: submissionId },
    })
    if (!existing || existing.teamId !== teamId) {
      throw new Error('Submission not found or does not belong to your team.')
    }

    submission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        title: title.trim(),
        description: description.trim(),
        repoUrl: repoUrl?.trim() || null,
        demoUrl: demoUrl?.trim() || null,
        trackId: trackId || null,
        status,
      },
      include: {
        team: true,
        track: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'SUBMISSION_UPDATED',
        entity: 'Submission',
        entityId: submission.id,
        metadata: JSON.stringify({ status, title }),
      },
    })
  } else {
    // Check if team already has a submission for this event
    const existingTeamSub = await prisma.submission.findFirst({
      where: { teamId, eventId },
    })

    if (existingTeamSub) {
      // Update existing
      submission = await prisma.submission.update({
        where: { id: existingTeamSub.id },
        data: {
          title: title.trim(),
          description: description.trim(),
          repoUrl: repoUrl?.trim() || null,
          demoUrl: demoUrl?.trim() || null,
          trackId: trackId || null,
          status,
        },
        include: {
          team: true,
          track: true,
        },
      })
    } else {
      submission = await prisma.submission.create({
        data: {
          teamId,
          eventId,
          title: title.trim(),
          description: description.trim(),
          repoUrl: repoUrl?.trim() || null,
          demoUrl: demoUrl?.trim() || null,
          trackId: trackId || null,
          status,
        },
        include: {
          team: true,
          track: true,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'SUBMISSION_CREATED',
        entity: 'Submission',
        entityId: submission.id,
        metadata: JSON.stringify({ status, title }),
      },
    })
  }

  return submission
}

/**
 * Retrieves a submission by ID
 */
export async function getSubmission(submissionId: string) {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
      track: true,
      event: true,
    },
  })
}

/**
 * Retrieves a team's submission for an event
 */
export async function getTeamSubmission(teamId: string, eventId: string) {
  return prisma.submission.findFirst({
    where: { teamId, eventId },
    include: {
      track: true,
      team: true,
    },
  })
}
