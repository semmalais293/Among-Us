import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSubmissionWindowOpen } from '../src/services/events'
import { EventStatus, SubmissionStatus } from '@prisma/client'

// Mock prisma client for service unit & API tests
vi.mock('@/lib/db', () => {
  return {
    default: {
      event: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      team: {
        findUnique: vi.fn(),
      },
      teamMember: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      submission: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      },
    },
  }
})

import prisma from '@/lib/db'
import { joinTeamByInviteCode } from '../src/services/teams'
import { upsertSubmission } from '../src/services/submissions'
import { getPublicGallerySubmissions } from '../src/services/gallery'

describe('T1 API & Business Logic Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Deadline enforcement
  describe('1. Deadline Enforcement', () => {
    it('rejects submission creation/edit after deadline with status 403', async () => {
      const pastDeadline = new Date(Date.now() - 3600 * 1000) // 1 hour ago

      // Mock user is team member
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
        id: 'tm-1',
        teamId: 'team-1',
        userId: 'user-1',
        joinedAt: new Date(),
      })

      // Mock event with expired deadline
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: 'event-1',
        name: 'Dogfood Hackathon',
        description: null,
        startsAt: new Date(Date.now() - 48 * 3600 * 1000),
        endsAt: new Date(Date.now() + 24 * 3600 * 1000),
        submissionDeadline: pastDeadline,
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(
        upsertSubmission({
          teamId: 'team-1',
          eventId: 'event-1',
          userId: 'user-1',
          title: 'Late Submission',
          description: 'Submitting after deadline',
          status: SubmissionStatus.SUBMITTED,
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining('Submission deadline passed'),
      })
    })

    it('isSubmissionWindowOpen returns false for past deadline or closed event', () => {
      const pastDeadline = new Date(Date.now() - 1000)
      expect(
        isSubmissionWindowOpen({
          submissionDeadline: pastDeadline,
          status: EventStatus.ACTIVE,
        })
      ).toBe(false)

      const futureDeadline = new Date(Date.now() + 100000)
      expect(
        isSubmissionWindowOpen({
          submissionDeadline: futureDeadline,
          status: EventStatus.CLOSED,
        })
      ).toBe(false)
    })
  })

  // 2. Team size limit (max 4 members)
  describe('2. Team Size Limit', () => {
    it('rejects joining a team that already has 4 members with status 409', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        id: 'team-full',
        eventId: 'event-1',
        name: 'Full Squad',
        inviteCode: 'FULL-TEAM',
        createdAt: new Date(),
        updatedAt: new Date(),
        event: {
          id: 'event-1',
          status: EventStatus.ACTIVE,
        },
        members: [
          { id: 'tm-1', teamId: 'team-full', userId: 'u-1', joinedAt: new Date() },
          { id: 'tm-2', teamId: 'team-full', userId: 'u-2', joinedAt: new Date() },
          { id: 'tm-3', teamId: 'team-full', userId: 'u-3', joinedAt: new Date() },
          { id: 'tm-4', teamId: 'team-full', userId: 'u-4', joinedAt: new Date() },
        ],
      } as any)

      await expect(
        joinTeamByInviteCode({
          inviteCode: 'FULL-TEAM',
          userId: 'u-5', // 5th member
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('Maximum 4 members allowed per team'),
      })
    })

    it('rejects user who is already in another team for the same event with status 409', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        id: 'team-b',
        eventId: 'event-1',
        name: 'Team Beta',
        inviteCode: 'BETA-CODE',
        createdAt: new Date(),
        updatedAt: new Date(),
        event: { id: 'event-1', status: EventStatus.ACTIVE },
        members: [{ id: 'tm-1', teamId: 'team-b', userId: 'u-1', joinedAt: new Date() }],
      } as any)

      // Mock user already belongs to Team Alpha for event-1
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
        id: 'tm-existing',
        teamId: 'team-a',
        userId: 'u-2',
        joinedAt: new Date(),
        team: {
          id: 'team-a',
          name: 'Team Alpha',
          eventId: 'event-1',
        },
      } as any)

      await expect(
        joinTeamByInviteCode({
          inviteCode: 'BETA-CODE',
          userId: 'u-2',
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('You are already in team "Team Alpha" for this event'),
      })
    })
  })

  // 3. Non-member cannot edit submission
  describe('3. Non-Member Submission Access Control', () => {
    it('rejects submission create/edit attempt by a non-team-member with status 403', async () => {
      // Return null -> user is not a member of team-1
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null)

      await expect(
        upsertSubmission({
          teamId: 'team-1',
          eventId: 'event-1',
          userId: 'intruder-user-id',
          title: 'Hacked Submission',
          description: 'Should be rejected',
          status: SubmissionStatus.DRAFT,
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining('Unauthorized: You must be a verified member of this team'),
      })
    })
  })

  // 4. Public gallery hides drafts
  describe('4. Public Gallery Excludes Drafts', () => {
    it('strictly filters for SubmissionStatus.SUBMITTED and ignores DRAFT projects', async () => {
      vi.mocked(prisma.submission.findMany).mockResolvedValue([
        {
          id: 'sub-1',
          title: 'Submitted Project',
          description: 'Visible in gallery',
          status: SubmissionStatus.SUBMITTED,
          team: { id: 't-1', name: 'Alpha', members: [] },
          track: { id: 'tr-1', name: 'Full-Stack' },
          event: { id: 'e-1', name: 'Hackathon', status: EventStatus.ACTIVE },
          _count: { judgeAssignments: 2 },
        },
      ] as any)

      const galleryItems = await getPublicGallerySubmissions()

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: SubmissionStatus.SUBMITTED,
          }),
        })
      )
      expect(galleryItems).toHaveLength(1)
      expect(galleryItems[0].status).toBe(SubmissionStatus.SUBMITTED)
    })
  })
})
