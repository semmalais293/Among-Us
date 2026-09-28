import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { joinTeamByInviteCode } from '@/services/teams'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN'], req)
    const body = await req.json()
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    const team = await joinTeamByInviteCode({
      inviteCode,
      userId: user.id,
    })

    return NextResponse.json({ team })
  } catch (error) {
    return handleApiError(error)
  }
}
