import { getActiveEvent } from '@/services/events'
import { getPublicGallerySubmissions } from '@/services/gallery'
import GalleryClient from './GalleryClient'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const [event, submissions] = await Promise.all([
    getActiveEvent(),
    getPublicGallerySubmissions(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Hackathon Submissions Gallery</h1>
        <p className="text-sm text-slate-400 mt-2">
          Browse all peer-reviewed projects submitted for {event?.name || 'the hackathon'}.
        </p>
      </div>

      <GalleryClient
        initialSubmissions={submissions}
        tracks={event?.tracks || []}
      />
    </div>
  )
}
