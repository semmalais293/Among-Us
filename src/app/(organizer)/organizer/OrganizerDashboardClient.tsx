'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TrackBadge from '@/components/TrackBadge'

export default function OrganizerDashboardClient({
  initialEvent,
}: {
  initialEvent: any
}) {
  const router = useRouter()
  const [event, setEvent] = useState(initialEvent)
  const [status, setStatus] = useState<string>(initialEvent?.status || 'ACTIVE')
  const [deadline, setDeadline] = useState<string>(
    initialEvent?.submissionDeadline
      ? new Date(initialEvent.submissionDeadline).toISOString().slice(0, 16)
      : ''
  )
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!event) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
        <p className="text-slate-400 text-sm">No active event found.</p>
      </div>
    )
  }

  const teams = event.teams || []
  const submissions = event.submissions || []
  const submittedCount = submissions.filter((s: any) => s.status === 'SUBMITTED').length
  const draftCount = submissions.filter((s: any) => s.status === 'DRAFT').length

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)

    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          status,
          submissionDeadline: new Date(deadline).toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update event')

      setEvent({ ...event, ...data.event })
      setMessage({ type: 'success', text: 'Event settings successfully updated!' })
      router.refresh()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating event',
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Registered Teams
          </span>
          <span className="text-3xl font-black text-white">{teams.length}</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Projects
          </span>
          <span className="text-3xl font-black text-white">{submissions.length}</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Submitted (Final)
          </span>
          <span className="text-3xl font-black text-emerald-400">{submittedCount}</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            In Draft
          </span>
          <span className="text-3xl font-black text-amber-400">{draftCount}</span>
        </div>
      </div>

      {/* Event Schedule & Status Controls */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-2">Event Schedule & State Management</h3>
        <p className="text-xs text-slate-400 mb-6">
          Toggle event lifecycle stages or adjust submission deadlines.
        </p>

        {message && (
          <div
            className={`mb-6 p-3.5 rounded-xl border text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateEvent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Event Status
            </label>
            <select
              id="organizer-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="UPCOMING">UPCOMING</option>
              <option value="ACTIVE">ACTIVE (Accepting Submissions)</option>
              <option value="VOTING">VOTING (Judging In Progress)</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Submission Deadline
            </label>
            <input
              id="organizer-deadline-input"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <button
              id="organizer-save-settings-btn"
              type="submit"
              disabled={updating}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Tracks & Prizes Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracks Management */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2">Event Tracks ({event.tracks?.length || 0})</h3>
          <p className="text-xs text-slate-400 mb-4">
            Active competition categories available for participant submissions.
          </p>

          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
            {event.tracks && event.tracks.length > 0 ? (
              event.tracks.map((t: any) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="font-semibold text-indigo-400">{t.name}</div>
                  {t.description && <div className="text-slate-400 mt-0.5">{t.description}</div>}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No tracks created yet.</p>
            )}
          </div>
        </div>

        {/* Prizes Management */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2">Prize Pool ({event.prizes?.length || 0})</h3>
          <p className="text-xs text-slate-400 mb-4">
            Awards and honors configured for top-scoring submissions.
          </p>

          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
            {event.prizes && event.prizes.length > 0 ? (
              event.prizes.map((p: any) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{p.title}</div>
                    {p.description && <div className="text-slate-400 mt-0.5">{p.description}</div>}
                  </div>
                  {p.amount && <div className="font-mono text-emerald-400 font-bold shrink-0">{p.amount}</div>}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No prizes created yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Submissions & Teams Master Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800/80">
          <h3 className="text-lg font-bold text-white">Submissions Directory</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of all project entries, track distribution, and repository links.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Project Title</th>
                <th className="px-6 py-3.5">Team</th>
                <th className="px-6 py-3.5">Track</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {submissions.length > 0 ? (
                submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {sub.title}
                    </td>
                    <td className="px-6 py-4">
                      {sub.team?.name}
                    </td>
                    <td className="px-6 py-4">
                      <TrackBadge name={sub.track?.name} />
                    </td>
                    <td className="px-6 py-4">
                      {sub.status === 'SUBMITTED' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Submitted
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sub.repoUrl && (
                          <a
                            href={sub.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-white underline"
                          >
                            Repo
                          </a>
                        )}
                        {sub.demoUrl && (
                          <a
                            href={sub.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Demo
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No submissions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
