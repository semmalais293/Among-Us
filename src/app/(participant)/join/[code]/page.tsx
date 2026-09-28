import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/db'
import Link from 'next/link'
import JoinClient from './JoinClient'

export const dynamic = 'force-dynamic'

export default async function JoinTeamPage({
  params,
}: {
  params: { code: string }
}) {
  const user = await getCurrentUser()
  const inviteCode = params.code.trim().toUpperCase()

  const team = await prisma.team.findUnique({
    where: { inviteCode },
    include: {
      event: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  })

  if (!team) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            ✕
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Invite Link</h2>
          <p className="text-xs text-slate-400 mb-6">
            No active team was found matching invite code <span className="font-mono text-cyan-400 font-bold">{params.code}</span>. Please verify the link with your team captain.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const isAlreadyMember = user ? team.members.some((m) => m.userId === user.id) : false
  const isFull = team.members.length >= 4

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="glass-panel p-8 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            Team Invitation
          </span>
          <h1 className="text-2xl font-black text-white mt-3">{team.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Competing in <span className="text-slate-200 font-medium">{team.event.name}</span>
          </p>
        </div>

        {/* Team Roster */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">
              Current Members
            </span>
            <span
              className={`font-semibold ${
                isFull ? 'text-rose-400' : 'text-cyan-400'
              }`}
            >
              {team.members.length} / 4 spots filled
            </span>
          </div>

          <div className="space-y-2">
            {team.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-slate-200">{m.user.name}</span>
                </div>
                {user?.id === m.userId && (
                  <span className="text-[10px] font-bold text-indigo-400">(You)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <JoinClient
          user={user}
          inviteCode={inviteCode}
          teamId={team.id}
          isAlreadyMember={isAlreadyMember}
          isFull={isFull}
        />
      </div>
    </div>
  )
}
