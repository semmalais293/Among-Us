import Link from 'next/link'
import { getActiveEvent } from '@/services/events'
import { getPublicGallerySubmissions } from '@/services/gallery'
import EventCountdown from '@/components/EventCountdown'
import SubmissionCard from '@/components/SubmissionCard'
import TrackBadge from '@/components/TrackBadge'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [event, recentSubmissions, user] = await Promise.all([
    getActiveEvent(),
    getPublicGallerySubmissions(),
    getCurrentUser(),
  ])

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Self-Hostable • Offline-First Hackathon
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {event?.name || 'Dogfood 72h Hackathon'}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              {event?.description ||
                'Build resilient, high-impact projects completely self-hosted with zero external SaaS dependencies.'}
            </p>

            {event && (
              <div className="mt-8">
                <EventCountdown deadline={event.submissionDeadline} />
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Link
                  href="/participant"
                  id="hero-dashboard-btn"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Manage Team & Submission &rarr;
                </Link>
              ) : (
                <Link
                  href="/register"
                  id="hero-register-btn"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join Hackathon &rarr;
                </Link>
              )}

              <Link
                href="/gallery"
                id="hero-gallery-btn"
                className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-semibold text-sm transition-all"
              >
                Browse Submissions ({recentSubmissions.length})
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tracks & Prizes Grid */}
      <section className="py-16 border-b border-slate-800/80 bg-[#080c16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Tracks */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Hackathon Tracks</h2>
                  <p className="text-xs text-slate-400 mt-1">Submit your project under one of these thematic tracks</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event?.tracks && event.tracks.length > 0 ? (
                  event.tracks.map((track) => (
                    <div
                      key={track.id}
                      className="glass-panel p-5 rounded-xl border border-slate-800/80 hover:border-indigo-500/30 transition-colors"
                    >
                      <TrackBadge name={track.name} />
                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        {track.description || 'Specialized category challenge.'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No tracks registered yet.</p>
                )}
              </div>
            </div>

            {/* Prizes */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Prize Pool</h2>
                  <p className="text-xs text-slate-400 mt-1">Rewards for top ranked submissions</p>
                </div>
              </div>

              <div className="space-y-3">
                {event?.prizes && event.prizes.length > 0 ? (
                  event.prizes.map((prize, idx) => (
                    <div
                      key={prize.id}
                      className="glass-panel p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{prize.title}</h4>
                          {prize.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{prize.description}</p>
                          )}
                        </div>
                      </div>
                      {prize.amount && (
                        <span className="text-sm font-bold text-emerald-400 font-mono shrink-0">
                          {prize.amount}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Prize details coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Submissions Gallery */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Public Project Gallery</h2>
              <p className="text-sm text-slate-400 mt-1">
                Explore submitted projects evaluated by peer judges
              </p>
            </div>
            <Link
              href="/gallery"
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all submissions &rarr;
            </Link>
          </div>

          {recentSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSubmissions.slice(0, 3).map((sub) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
              <p className="text-slate-400 text-sm">No submissions submitted to the gallery yet.</p>
              <p className="text-slate-500 text-xs mt-1">Be the first team to submit!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
