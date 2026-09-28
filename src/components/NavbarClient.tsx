'use client'

import { AuthUser } from '@/lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NavbarClient({ user }: { user: AuthUser | null }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error', err)
    } finally {
      setLoggingOut(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          id="nav-login-btn"
          className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          id="nav-register-btn"
          className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-lg shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          Register
        </Link>
      </div>
    )
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    ORGANIZER: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    JUDGE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    PARTICIPANT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-200 hidden sm:inline-block">
          {user.name}
        </span>
        <span
          className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
            roleColors[user.role] || 'bg-slate-800 text-slate-300'
          }`}
        >
          {user.role}
        </span>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        id="nav-logout-btn"
        className="text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/60 px-2.5 py-1.5 rounded-lg transition-all"
      >
        {loggingOut ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  )
}
