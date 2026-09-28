import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { addTrack, deleteTrack } from '@/services/events'

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ORGANIZER', 'ADMIN'], req)
    const body = await req.json()
    const { eventId, name, description } = body

    if (!eventId || !name) {
      return NextResponse.json(
        { error: 'Event ID and track name are required' },
        { status: 400 }
      )
    }

    const track = await addTrack(eventId, name.trim(), description?.trim())
    return NextResponse.json({ track }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(['ORGANIZER', 'ADMIN'], req)
    const { searchParams } = new URL(req.url)
    const trackId = searchParams.get('id')

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    const track = await deleteTrack(trackId, user.id)
    return NextResponse.json({ success: true, track })
  } catch (error) {
    return handleApiError(error)
  }
}
