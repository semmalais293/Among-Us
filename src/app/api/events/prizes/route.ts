import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, requireRole } from '@/lib/permissions'
import { addPrize, deletePrize } from '@/services/events'

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ORGANIZER', 'ADMIN'], req)
    const body = await req.json()
    const { eventId, title, amount, description } = body

    if (!eventId || !title) {
      return NextResponse.json(
        { error: 'Event ID and prize title are required' },
        { status: 400 }
      )
    }

    const prize = await addPrize(
      eventId,
      title.trim(),
      amount?.trim(),
      description?.trim()
    )
    return NextResponse.json({ prize }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(['ORGANIZER', 'ADMIN'], req)
    const { searchParams } = new URL(req.url)
    const prizeId = searchParams.get('id')

    if (!prizeId) {
      return NextResponse.json({ error: 'Prize ID is required' }, { status: 400 })
    }

    const prize = await deletePrize(prizeId, user.id)
    return NextResponse.json({ success: true, prize })
  } catch (error) {
    return handleApiError(error)
  }
}
