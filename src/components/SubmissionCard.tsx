import Link from 'next/link'
import TrackBadge from './TrackBadge'

interface SubmissionCardProps {
  id: string
  title: string
  description: string
  teamName: string
  membersCount: number
  trackName?: string | null
  repoUrl?: string | null
  demoUrl?: string | null
  status?: string
}

export default function SubmissionCard({
  title,
  description,
  teamName,
  membersCount,
  trackName,
  repoUrl,
  demoUrl,
  status = 'SUBMITTED',
}: SubmissionCardProps) {
  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-800/80 shadow-xl group">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TrackBadge name={trackName} />
            {status === 'DRAFT' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Draft
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-slate-400">
            {membersCount} {membersCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
          {title}
        </h3>

        <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          By {teamName}
        </p>

        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed mb-6">
          {description}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Code</span>
            </a>
          )}
          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Demo</span>
            </a>
          )}
        </div>

        <Link
          href={`/gallery?id=${encodeURIComponent(title)}`}
          className="text-slate-400 hover:text-white font-semibold transition-colors"
        >
          View details &rarr;
        </Link>
      </div>
    </div>
  )
}
