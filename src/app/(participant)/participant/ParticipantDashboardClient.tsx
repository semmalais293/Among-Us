'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EventCountdown from '@/components/EventCountdown'
import CopyButton from '@/components/CopyButton'
import TrackBadge from '@/components/TrackBadge'

export default function ParticipantDashboardClient({
  user,
  event,
  initialTeam,
  initialSubmission,
  isWindowOpen,
}: {
  user: any
  event: any
  initialTeam: any
  initialSubmission: any
  isWindowOpen: boolean
}) {
  const router = useRouter()

  // Team state
  const [team, setTeam] = useState(initialTeam)
  const [newTeamName, setNewTeamName] = useState('')
  const [joinInviteCode, setJoinInviteCode] = useState('')
  const [teamActionLoading, setTeamActionLoading] = useState(false)
  const [teamError, setTeamError] = useState<string | null>(null)

  // Submission state
  const [submission, setSubmission] = useState(initialSubmission)
  const [title, setTitle] = useState(initialSubmission?.title || '')
  const [description, setDescription] = useState(initialSubmission?.description || '')
  const [trackId, setTrackId] = useState(initialSubmission?.trackId || '')
  const [repoUrl, setRepoUrl] = useState(initialSubmission?.repoUrl || '')
  const [demoUrl, setDemoUrl] = useState(initialSubmission?.demoUrl || '')
  const [submitting, setSubmitting] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)
  const [subSuccess, setSubSuccess] = useState<string | null>(null)

  // Handle Team Creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setTeamError(null)
    setTeamActionLoading(true)

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, name: newTeamName }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create team')

      setTeam(data.team)
      router.refresh()
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Error creating team')
    } finally {
      setTeamActionLoading(false)
    }
  }

  // Handle Joining Team by Invite Code
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeamError(null)
    setTeamActionLoading(true)

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinInviteCode }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join team')

      setTeam(data.team)
      router.refresh()
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Error joining team')
    } finally {
      setTeamActionLoading(false)
    }
  }

  // Handle Submission Save (Draft or Submitted)
  const handleSaveSubmission = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!team || !event) return
    setSubError(null)
    setSubSuccess(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission?.id,
          teamId: team.id,
          eventId: event.id,
          title,
          description,
          trackId: trackId || undefined,
          repoUrl,
          demoUrl,
          status: targetStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save submission')

      setSubmission(data.submission)
      setSubSuccess(
        targetStatus === 'SUBMITTED'
          ? '🎉 Project successfully submitted to the hackathon!'
          : 'Draft saved successfully.'
      )
      router.refresh()
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'Failed to save submission')
    } finally {
      setSubmitting(false)
    }
  }

  if (!event) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white">No Active Hackathon Event Found</h2>
        <p className="text-sm text-slate-400 mt-2">
          Please check back later or contact an organizer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Event Header Banner with Countdown */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
            Active Event
          </span>
          <h2 className="text-xl font-bold text-white">{event.name}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">{event.description}</p>
        </div>

        <EventCountdown deadline={event.submissionDeadline} />
      </div>

      {/* Team Setup Section (if no team) */}
      {!team ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Team */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
                +
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Create a New Team</h3>
              <p className="text-xs text-slate-400 mb-6">
                Form a new hackathon squad. You will be assigned as the team lead and receive a unique invite code to share with teammates.
              </p>

              {teamError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {teamError}
                </div>
              )}

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Team Name
                  </label>
                  <input
                    id="create-team-name-input"
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Code Crusaders"
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  id="create-team-submit-btn"
                  type="submit"
                  disabled={teamActionLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {teamActionLoading ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            </div>
          </div>

          {/* Join Team */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4">
                #
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Join an Existing Team</h3>
              <p className="text-xs text-slate-400 mb-6">
                Enter the team invite code provided by your teammate to join their squad.
              </p>

              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Invite Code
                  </label>
                  <input
                    id="join-team-code-input"
                    type="text"
                    required
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value)}
                    placeholder="e.g., IMPOSTOR2026"
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm uppercase focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <button
                  id="join-team-submit-btn"
                  type="submit"
                  disabled={teamActionLoading}
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {teamActionLoading ? 'Joining...' : 'Join Team'}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Team Overview Card */
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Squad
              </span>
              <h3 className="text-2xl font-black text-white mt-1">{team.name}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Invite Code:</span>
                <span
                  id="team-invite-code-badge"
                  className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-lg"
                >
                  {team.inviteCode}
                </span>
                <CopyButton text={team.inviteCode} label="Copy Code" />
              </div>
              <CopyButton
                text={typeof window !== 'undefined' ? `${window.location.origin}/join/${team.inviteCode}` : `/join/${team.inviteCode}`}
                label="Copy Invite Link"
              />
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Roster ({team.members?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {team.members?.map((m: any) => (
                <div
                  key={m.userId}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-slate-200">{m.user.name}</span>
                  {m.userId === user.id && (
                    <span className="text-[10px] text-indigo-400 font-bold">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submission Management Section */}
      {team && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <h3 className="text-xl font-bold text-white">Project Submission</h3>
              <p className="text-xs text-slate-400 mt-1">
                Collaborate with your team to draft or finalize your submission.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Status:</span>
              {submission?.status === 'SUBMITTED' ? (
                <span
                  id="submission-status-badge"
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Submitted
                </span>
              ) : (
                <span
                  id="submission-status-badge"
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Draft
                </span>
              )}
            </div>
          </div>

          {!isWindowOpen && (
            <div
              id="submission-closed-notice"
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3"
            >
              <svg className="w-5 h-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Deadline Passed:</strong> The submission window for this event has closed. Edits and submissions are disabled.
              </span>
            </div>
          )}

          {subError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {subError}
            </div>
          )}

          {subSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              {subSuccess}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Project Title *
              </label>
              <input
                id="submission-title-input"
                type="text"
                disabled={!isWindowOpen || submitting}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name of your creation"
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Challenge Track
              </label>
              <select
                id="submission-track-select"
                disabled={!isWindowOpen || submitting}
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">-- Select a Track (Optional) --</option>
                {event.tracks?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description & Architecture *
              </label>
              <textarea
                id="submission-description-input"
                rows={5}
                disabled={!isWindowOpen || submitting}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you build? How does it work? Mention any notable tech or offline features..."
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Repository URL
                </label>
                <input
                  id="submission-repourl-input"
                  type="url"
                  disabled={!isWindowOpen || submitting}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Live / Local Demo URL
                </label>
                <input
                  id="submission-demourl-input"
                  type="url"
                  disabled={!isWindowOpen || submitting}
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="http://localhost:3000/demo"
                  className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>

            {isWindowOpen && (
              <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
                <button
                  id="submission-save-draft-btn"
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveSubmission('DRAFT')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  id="submission-submit-btn"
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveSubmission('SUBMITTED')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit to Hackathon 🚀'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
