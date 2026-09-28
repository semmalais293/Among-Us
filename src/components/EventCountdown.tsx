'use client'

import { useEffect, useState } from 'react'

interface EventCountdownProps {
  deadline: string | Date
  title?: string
}

export default function EventCountdown({
  deadline,
  title = 'Submission Deadline Countdown',
}: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    const target = new Date(deadline).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        })
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
        })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  if (timeLeft.isExpired) {
    return (
      <div
        id="deadline-expired-badge"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold shadow-lg shadow-rose-500/10"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        Submissions Closed (Deadline Passed)
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center sm:items-start gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
        {title}
      </div>
      <div
        id="countdown-timer-display"
        className="grid grid-cols-4 gap-2 sm:gap-3 text-center"
      >
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-700/60 min-w-[56px]">
          <span className="block text-xl sm:text-2xl font-black text-white font-mono">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Days</span>
        </div>
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-700/60 min-w-[56px]">
          <span className="block text-xl sm:text-2xl font-black text-white font-mono">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Hours</span>
        </div>
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-700/60 min-w-[56px]">
          <span className="block text-xl sm:text-2xl font-black text-white font-mono">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Mins</span>
        </div>
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-700/60 min-w-[56px]">
          <span className="block text-xl sm:text-2xl font-black text-indigo-400 font-mono">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Secs</span>
        </div>
      </div>
    </div>
  )
}
