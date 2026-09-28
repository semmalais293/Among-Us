import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { createTeam, getUserTeam, getTeamDetails } from '@/services/teams'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN'], req)
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId') || undefined
    const teamId = searchParams.get('teamId')

    if (teamId) {
      const team = await getTeamDetails(teamId)
      return NextResponse.json({ team })
    }

    const team = await getUserTeam(user.id, eventId)
    return NextResponse.json({ team })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN'], req)
    const body = await req.json()
    const { eventId, name } = body

    if (!eventId || !name) {
      return NextResponse.json(
        { error: 'eventId and team name are required' },
        { status: 400 }
      )
    }

    const team = await createTeam({
      eventId,
      name,
      creatorUserId: user.id,
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
