import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { getSubmission, upsertSubmission } from '@/services/submissions'
import { SubmissionStatus } from '@prisma/client'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN', 'JUDGE'], req)
    const submission = await getSubmission(params.id)

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN'], req)
    const body = await req.json()
    const {
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
      submissionId: params.id,
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

    return NextResponse.json({ submission })
  } catch (error) {
    return handleApiError(error)
  }
}

