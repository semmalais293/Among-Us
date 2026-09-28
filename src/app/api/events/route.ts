import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { getActiveEvent, listEvents, createEvent, updateEvent } from '@/services/events'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === 'true'

    if (all) {
      const events = await listEvents()
      return NextResponse.json({ events })
    }

    const event = await getActiveEvent()
    return NextResponse.json({ event })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['ORGANIZER', 'ADMIN'], req)
    const body = await req.json()

    if (!body.name || !body.startsAt || !body.endsAt || !body.submissionDeadline) {
      return NextResponse.json(
        { error: 'Name, startsAt, endsAt, and submissionDeadline are required' },
        { status: 400 }
      )
    }

    const event = await createEvent(
      {
        name: body.name,
        description: body.description,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        submissionDeadline: new Date(body.submissionDeadline),
        status: body.status,
      },
      user.id
    )

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(['ORGANIZER', 'ADMIN'], req)
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const event = await updateEvent(
      id,
      {
        ...updateData,
        ...(updateData.startsAt ? { startsAt: new Date(updateData.startsAt) } : {}),
        ...(updateData.endsAt ? { endsAt: new Date(updateData.endsAt) } : {}),
        ...(updateData.submissionDeadline
          ? { submissionDeadline: new Date(updateData.submissionDeadline) }
          : {}),
      },
      user.id
    )

    return NextResponse.json({ event })
  } catch (error) {
    return handleApiError(error)
  }
}
