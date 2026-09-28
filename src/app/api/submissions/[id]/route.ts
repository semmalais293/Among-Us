import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { getSubmission } from '@/services/submissions'

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
