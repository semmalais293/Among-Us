export default function TrackBadge({ name }: { name?: string | null }) {
  if (!name) return null

  const trackColors: Record<string, string> = {
    'Full-Stack Dev': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'AI & Tooling': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Infra & DevOps': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Design & UX': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  const style = trackColors[name] || 'bg-slate-800 text-slate-300 border-slate-700'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      {name}
    </span>
  )
}
