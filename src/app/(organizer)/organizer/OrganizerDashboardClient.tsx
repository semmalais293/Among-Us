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

  // Edit Event state
  const [name, setName] = useState<string>(initialEvent?.name || '')
  const [description, setDescription] = useState<string>(initialEvent?.description || '')
  const [status, setStatus] = useState<string>(initialEvent?.status || 'ACTIVE')
  const [startsAt, setStartsAt] = useState<string>(
    initialEvent?.startsAt
      ? new Date(initialEvent.startsAt).toISOString().slice(0, 16)
      : ''
  )
  const [endsAt, setEndsAt] = useState<string>(
    initialEvent?.endsAt
      ? new Date(initialEvent.endsAt).toISOString().slice(0, 16)
      : ''
  )
  const [deadline, setDeadline] = useState<string>(
    initialEvent?.submissionDeadline
      ? new Date(initialEvent.submissionDeadline).toISOString().slice(0, 16)
      : ''
  )
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Track management state
  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackDesc, setNewTrackDesc] = useState('')
  const [addingTrack, setAddingTrack] = useState(false)

  // Prize management state
  const [newPrizeTitle, setNewPrizeTitle] = useState('')
  const [newPrizeAmount, setNewPrizeAmount] = useState('')
  const [newPrizeDesc, setNewPrizeDesc] = useState('')
  const [addingPrize, setAddingPrize] = useState(false)

  // Create Event modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createStartsAt, setCreateStartsAt] = useState('')
  const [createEndsAt, setCreateEndsAt] = useState('')
  const [createDeadline, setCreateDeadline] = useState('')
  const [createStatus, setCreateStatus] = useState('ACTIVE')
  const [creatingEvent, setCreatingEvent] = useState(false)

  // Submissions search & filter
  const [submissionSearch, setSubmissionSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL')

  // Handle Event Details Update (Dates, Deadline, Name, Description, Status)
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setUpdating(true)
    setMessage(null)

    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          name,
          description,
          status,
          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
          submissionDeadline: deadline ? new Date(deadline).toISOString() : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update event')

      setEvent({ ...event, ...data.event })
      setMessage({ type: 'success', text: 'Event schedule, dates, and settings successfully updated!' })
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

  // Handle Create New Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingEvent(true)
    setMessage(null)

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          description: createDesc,
          startsAt: new Date(createStartsAt).toISOString(),
          endsAt: new Date(createEndsAt).toISOString(),
          submissionDeadline: new Date(createDeadline).toISOString(),
          status: createStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create event')

      setEvent(data.event)
      setName(data.event.name)
      setDescription(data.event.description || '')
      setStatus(data.event.status)
      setStartsAt(new Date(data.event.startsAt).toISOString().slice(0, 16))
      setEndsAt(new Date(data.event.endsAt).toISOString().slice(0, 16))
      setDeadline(new Date(data.event.submissionDeadline).toISOString().slice(0, 16))
      setShowCreateModal(false)
      setMessage({ type: 'success', text: `Event "${data.event.name}" created successfully!` })
      router.refresh()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error creating event',
      })
    } finally {
      setCreatingEvent(false)
    }
  }

  // Handle Add Track
  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !newTrackName.trim()) return
    setAddingTrack(true)

    try {
      const res = await fetch('/api/events/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          name: newTrackName.trim(),
          description: newTrackDesc.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add track')

      const updatedTracks = [...(event.tracks || []), data.track]
      setEvent({ ...event, tracks: updatedTracks })
      setNewTrackName('')
      setNewTrackDesc('')
      setMessage({ type: 'success', text: `Track "${data.track.name}" added successfully.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error adding track' })
    } finally {
      setAddingTrack(false)
    }
  }

  // Handle Delete Track
  const handleDeleteTrack = async (trackId: string, trackName: string) => {
    if (!confirm(`Are you sure you want to remove track "${trackName}"?`)) return

    try {
      const res = await fetch(`/api/events/tracks?id=${trackId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete track')

      const updatedTracks = (event.tracks || []).filter((t: any) => t.id !== trackId)
      setEvent({ ...event, tracks: updatedTracks })
      setMessage({ type: 'success', text: `Track "${trackName}" removed.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error deleting track' })
    }
  }

  // Handle Add Prize
  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !newPrizeTitle.trim()) return
    setAddingPrize(true)

    try {
      const res = await fetch('/api/events/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          title: newPrizeTitle.trim(),
          amount: newPrizeAmount.trim() || undefined,
          description: newPrizeDesc.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add prize')

      const updatedPrizes = [...(event.prizes || []), data.prize]
      setEvent({ ...event, prizes: updatedPrizes })
      setNewPrizeTitle('')
      setNewPrizeAmount('')
      setNewPrizeDesc('')
      setMessage({ type: 'success', text: `Prize "${data.prize.title}" added successfully.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error adding prize' })
    } finally {
      setAddingPrize(false)
    }
  }

  // Handle Delete Prize
  const handleDeletePrize = async (prizeId: string, prizeTitle: string) => {
    if (!confirm(`Are you sure you want to remove prize "${prizeTitle}"?`)) return

    try {
      const res = await fetch(`/api/events/prizes?id=${prizeId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete prize')

      const updatedPrizes = (event.prizes || []).filter((p: any) => p.id !== prizeId)
      setEvent({ ...event, prizes: updatedPrizes })
      setMessage({ type: 'success', text: `Prize "${prizeTitle}" removed.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error deleting prize' })
    }
  }

  if (!event) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-2xl font-bold">
          +
        </div>
        <h2 className="text-xl font-bold text-white">No Active Event Found</h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          You have organizer permissions. Initialize the hackathon platform by creating your first event.
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
        >
          Create First Hackathon Event
        </button>

        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateEvent}
            name={createName}
            setName={setCreateName}
            desc={createDesc}
            setDesc={setCreateDesc}
            startsAt={createStartsAt}
            setStartsAt={setCreateStartsAt}
            endsAt={createEndsAt}
            setEndsAt={setCreateEndsAt}
            deadline={createDeadline}
            setDeadline={setCreateDeadline}
            status={createStatus}
            setStatus={setCreateStatus}
            loading={creatingEvent}
          />
        )}
      </div>
    )
  }

  const teams = event.teams || []
  const submissions = event.submissions || []
  const submittedCount = submissions.filter((s: any) => s.status === 'SUBMITTED').length
  const draftCount = submissions.filter((s: any) => s.status === 'DRAFT').length

  const filteredSubmissions = submissions.filter((sub: any) => {
    const matchesStatus =
      statusFilter === 'ALL' || sub.status === statusFilter
    const query = submissionSearch.toLowerCase().trim()
    if (!query) return matchesStatus

    const inTitle = sub.title?.toLowerCase().includes(query)
    const inTeam = sub.team?.name?.toLowerCase().includes(query)
    const inTrack = sub.track?.name?.toLowerCase().includes(query)

    return matchesStatus && (inTitle || inTeam || inTrack)
  })

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Managing Event
          </span>
          <h2 className="text-2xl font-black text-white">{event.name}</h2>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          id="organizer-create-new-event-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all self-start sm:self-auto"
        >
          <span className="text-indigo-400 font-bold">+</span>
          Create Another Event
        </button>
      </div>

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

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Event Details & Schedule Management */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Event Configuration & Schedule</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit dates, submission deadline, name, description, and status.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">
            ID: {event.id}
          </span>
        </div>

        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Event Name
              </label>
              <input
                id="organizer-event-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Lifecycle Status
              </label>
              <select
                id="organizer-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="UPCOMING">UPCOMING (Registration Open)</option>
                <option value="ACTIVE">ACTIVE (Accepting Submissions)</option>
                <option value="VOTING">VOTING (Judging In Progress)</option>
                <option value="CLOSED">CLOSED (Finished)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="organizer-event-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Starts At
              </label>
              <input
                id="organizer-starts-at-input"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ends At
              </label>
              <input
                id="organizer-ends-at-input"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
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
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="organizer-save-settings-btn"
              type="submit"
              disabled={updating}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {updating ? 'Saving Changes...' : 'Save Event Schedule'}
            </button>
          </div>
        </form>
      </div>

      {/* Tracks & Prizes Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracks Management */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">
                Competition Tracks ({event.tracks?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Add specialized challenge tracks for participant categorization.
            </p>

            <div className="space-y-2 mb-6 max-h-56 overflow-y-auto pr-1">
              {event.tracks && event.tracks.length > 0 ? (
                event.tracks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="font-semibold text-indigo-400">{t.name}</div>
                      {t.description && (
                        <div className="text-slate-400 mt-0.5 line-clamp-1">{t.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTrack(t.id, t.name)}
                      className="text-slate-600 hover:text-rose-400 font-bold px-2 py-1 rounded transition-colors text-xs"
                      title="Delete track"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/40 rounded-xl">
                  No tracks configured yet.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleAddTrack} className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Add New Track</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Track name (e.g. AI & Tooling)"
                required
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newTrackDesc}
                onChange={(e) => setNewTrackDesc(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={addingTrack || !newTrackName.trim()}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white font-semibold text-xs rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            >
              {addingTrack ? 'Adding Track...' : '+ Add Track'}
            </button>
          </form>
        </div>

        {/* Prizes Management */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">
                Prize Pool ({event.prizes?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Awards and honors configured for top-scoring submissions.
            </p>

            <div className="space-y-2 mb-6 max-h-56 overflow-y-auto pr-1">
              {event.prizes && event.prizes.length > 0 ? (
                event.prizes.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="font-semibold text-white">{p.title}</div>
                      {p.description && (
                        <div className="text-slate-400 mt-0.5 line-clamp-1">{p.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {p.amount && (
                        <span className="font-mono text-emerald-400 font-bold shrink-0">
                          {p.amount}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeletePrize(p.id, p.title)}
                        className="text-slate-600 hover:text-rose-400 font-bold px-2 py-1 rounded transition-colors text-xs"
                        title="Delete prize"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/40 rounded-xl">
                  No prizes configured yet.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleAddPrize} className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Add New Prize</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Prize Title"
                required
                value={newPrizeTitle}
                onChange={(e) => setNewPrizeTitle(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 sm:col-span-2"
              />
              <input
                type="text"
                placeholder="Amount (e.g. $5,000)"
                value={newPrizeAmount}
                onChange={(e) => setNewPrizeAmount(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={addingPrize || !newPrizeTitle.trim()}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white font-semibold text-xs rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            >
              {addingPrize ? 'Adding Prize...' : '+ Add Prize'}
            </button>
          </form>
        </div>
      </div>

      {/* Submissions & Teams Master Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Submissions Directory</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live entries, track assignments, and source repository links.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search submissions or teams..."
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['ALL', 'SUBMITTED', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
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
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub: any) => (
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
                    No submissions matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          name={createName}
          setName={setCreateName}
          desc={createDesc}
          setDesc={setCreateDesc}
          startsAt={createStartsAt}
          setStartsAt={setCreateStartsAt}
          endsAt={createEndsAt}
          setEndsAt={setCreateEndsAt}
          deadline={createDeadline}
          setDeadline={setCreateDeadline}
          status={createStatus}
          setStatus={setCreateStatus}
          loading={creatingEvent}
        />
      )}
    </div>
  )
}

function CreateEventModal({
  onClose,
  onSubmit,
  name,
  setName,
  desc,
  setDesc,
  startsAt,
  setStartsAt,
  endsAt,
  setEndsAt,
  deadline,
  setDeadline,
  status,
  setStatus,
  loading,
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-lg w-full border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-white mb-1">Create New Hackathon Event</h3>
        <p className="text-xs text-slate-400 mb-6">
          Set up schedule, submission window, and event metadata.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Event Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI Innovations 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Event description and goals"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Starts At *
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Ends At *
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Submission Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="UPCOMING">UPCOMING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="VOTING">VOTING</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
