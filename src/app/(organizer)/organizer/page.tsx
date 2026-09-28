import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getActiveEvent, getEventDetails } from '@/services/events'
import OrganizerDashboardClient from './OrganizerDashboardClient'

export const dynamic = 'force-dynamic'

export default async function OrganizerPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
    redirect('/participant')
  }

  const activeEvent = await getActiveEvent()
  let fullEvent = null
  if (activeEvent) {
    fullEvent = await getEventDetails(activeEvent.id)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Organizer & Admin Control
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Event Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure hackathon schedules, monitor team formation, and track live submission statistics.
          </p>
        </div>
      </div>

      <OrganizerDashboardClient initialEvent={fullEvent} />
    </div>
  )
}
