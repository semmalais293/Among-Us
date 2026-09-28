'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinClient({
  user,
  inviteCode,
  teamId,
  isAlreadyMember,
  isFull,
}: {
  user: any
  inviteCode: string
  teamId: string
  isAlreadyMember: boolean
  isFull: boolean
}) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    setError(null)
    setJoining(true)

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join team')
      }

      router.push('/participant')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error joining team')
    } finally {
      setJoining(false)
    }
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-400 text-center mb-2">
          You must be signed in as a participant to join this team.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/login?redirect=/join/${inviteCode}`}
            className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={`/register?redirect=/join/${inviteCode}`}
            className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    )
  }

  if (isAlreadyMember) {
    return (
      <div className="text-center space-y-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          ✓ You are already a registered member of this team.
        </div>
        <Link
          href="/participant"
          className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
        >
          Go to Participant Dashboard &rarr;
        </Link>
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="text-center space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          This team has reached the maximum size limit of 4 members.
        </div>
        <Link
          href="/participant"
          className="inline-block px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <button
        onClick={handleJoin}
        disabled={joining}
        id="confirm-join-team-btn"
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {joining ? 'Joining Team...' : 'Accept Invite & Join Team'}
      </button>

      <div className="text-center">
        <Link href="/participant" className="text-xs text-slate-500 hover:text-slate-300">
          Cancel and return to workspace
        </Link>
      </div>
    </div>
  )
}
