import prisma from '@/lib/db'
import { SubmissionStatus } from '@prisma/client'

export interface GalleryFilterParams {
  eventId?: string
  search?: string
  trackId?: string
}

/**
 * Retrieves submitted projects for public gallery showcase
 * Enforces: Only submissions with status SUBMITTED are returned to public viewers.
 */
export async function getPublicGallerySubmissions(params: GalleryFilterParams = {}) {
  const { eventId, search, trackId } = params

  const whereClause: any = {
    status: SubmissionStatus.SUBMITTED,
  }

  if (eventId) {
    whereClause.eventId = eventId
  }

  if (trackId && trackId !== 'all') {
    whereClause.trackId = trackId
  }

  if (search && search.trim().length > 0) {
    const term = search.trim()
    whereClause.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { team: { name: { contains: term, mode: 'insensitive' } } },
    ]
  }

  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
      track: true,
      event: {
        select: { id: true, name: true, status: true },
      },
      _count: {
        select: {
          judgeAssignments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return submissions
}
