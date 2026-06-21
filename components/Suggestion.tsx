'use client'
import { ACTION_META } from '@/lib/actionMeta'
import { Recommendation } from '@/lib/recommendations'

export default function Suggestion({
  recommendation,
  onLog,
}: {
  recommendation: Recommendation
  onLog: (category: string) => void
}) {
  const meta = ACTION_META[recommendation.category]
  const Icon = meta?.icon

  return (
    <div className="ct-card p-4 mb-5 flex items-center gap-3">
      <span
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: meta?.bg }}
      >
        {Icon && <Icon size={20} color={meta!.color} strokeWidth={2} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--ink-muted)' }}>
          Top suggestion for you
        </p>
        <p className="text-sm font-medium leading-snug">{recommendation.label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          {recommendation.reason}
        </p>
      </div>
      <button
        onClick={() => onLog(recommendation.category)}
        className="ct-btn-pill px-3 py-2 text-xs shrink-0"
      >
        Log it
      </button>
    </div>
  )
}