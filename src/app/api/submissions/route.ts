import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { upsertSubmission, getTeamSubmission } from '@/services/submissions'
import { SubmissionStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN', 'JUDGE'], req)
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const eventId = searchParams.get('eventId')

    if (!teamId || !eventId) {
      return NextResponse.json(
        { error: 'teamId and eventId query parameters are required' },
        { status: 400 }
      )
    }

    const submission = await getTeamSubmission(teamId, eventId)
    return NextResponse.json({ submission })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN'], req)
    const body = await req.json()
    const {
      submissionId,
      teamId,
      eventId,
      title,
      description,
      repoUrl,
      demoUrl,
      trackId,
      status,
    } = body

    if (!teamId || !eventId || !title || !description) {
      return NextResponse.json(
        { error: 'teamId, eventId, title, and description are required' },
        { status: 400 }
      )
    }

    const submission = await upsertSubmission({
      submissionId,
      teamId,
      eventId,
      userId: user.id,
      title,
      description,
      repoUrl,
      demoUrl,
      trackId,
      status: status === 'SUBMITTED' ? SubmissionStatus.SUBMITTED : SubmissionStatus.DRAFT,
    })

    return NextResponse.json({ submission }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
