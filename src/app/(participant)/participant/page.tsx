import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getActiveEvent, isSubmissionWindowOpen } from '@/services/events'
import { getUserTeam } from '@/services/teams'
import { getTeamSubmission } from '@/services/submissions'
import ParticipantDashboardClient from './ParticipantDashboardClient'

export const dynamic = 'force-dynamic'

export default async function ParticipantPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const event = await getActiveEvent()
  let team = null
  let submission = null

  if (event) {
    team = await getUserTeam(user.id, event.id)
    if (team) {
      submission = await getTeamSubmission(team.id, event.id)
    }
  }

  const isWindowOpen = event ? isSubmissionWindowOpen(event) : false

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Participant Workspace</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your hackathon team, collaborate on submissions, and track deadline progress.
          </p>
        </div>
      </div>

      <ParticipantDashboardClient
        user={user}
        event={event}
        initialTeam={team}
        initialSubmission={submission}
        isWindowOpen={isWindowOpen}
      />
    </div>
  )
}
