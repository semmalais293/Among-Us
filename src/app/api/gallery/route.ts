import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/permissions'
import { getPublicGallerySubmissions } from '@/services/gallery'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId') || undefined
    const search = searchParams.get('search') || undefined
    const trackId = searchParams.get('trackId') || undefined

    const submissions = await getPublicGallerySubmissions({
      eventId,
      search,
      trackId,
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    return handleApiError(error)
  }
}
