'use client'

import { useState, useMemo } from 'react'
import SubmissionCard from '@/components/SubmissionCard'

interface SubmissionItem {
  id: string
  title: string
  description: string
  repoUrl?: string | null
  demoUrl?: string | null
  status: string
  team: {
    id: string
    name: string
    members: Array<{ user: { id: string; name: string } }>
  }
  track?: {
    id: string
    name: string
  } | null
}

interface TrackItem {
  id: string
  name: string
}

export default function GalleryClient({
  initialSubmissions,
  tracks,
}: {
  initialSubmissions: any[]
  tracks: TrackItem[]
}) {
  const [search, setSearch] = useState('')
  const [selectedTrack, setSelectedTrack] = useState<string>('all')

  const filtered = useMemo(() => {
    return initialSubmissions.filter((sub) => {
      const matchesTrack =
        selectedTrack === 'all' || sub.track?.id === selectedTrack || sub.trackId === selectedTrack

      const query = search.toLowerCase().trim()
      if (!query) return matchesTrack

      const inTitle = sub.title.toLowerCase().includes(query)
      const inDesc = sub.description.toLowerCase().includes(query)
      const inTeam = sub.team?.name.toLowerCase().includes(query)

      return matchesTrack && (inTitle || inDesc || inTeam)
    })
  }, [initialSubmissions, search, selectedTrack])

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Search and Filters */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="gallery-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, team name, or keywords..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedTrack('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTrack === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Tracks ({initialSubmissions.length})
          </button>
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTrack(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTrack === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sub) => (
            <SubmissionCard
              key={sub.id}
              id={sub.id}
              title={sub.title}
              description={sub.description}
              teamName={sub.team.name}
              membersCount={sub.team.members.length}
              trackName={sub.track?.name}
              repoUrl={sub.repoUrl}
              demoUrl={sub.demoUrl}
              status={sub.status}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-16 text-center rounded-2xl border border-slate-800/80 my-8">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base font-bold text-white mb-1">No matching projects found</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search criteria or selecting another track.
          </p>
        </div>
      )}
    </div>
  )
}
