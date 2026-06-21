'use client'
import { getActionFactor, listActionCategories } from '@/lib/emissions'
import { ACTION_META } from '@/lib/actionMeta'
import { useState } from 'react'

export default function ConfirmCard({
  rawInput,
  category,
  onConfirm,
  onCancel,
}: {
  rawInput: string
  category: string | null
  onConfirm: (category: string) => void
  onCancel: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(category ?? '')
  const factor = selected ? getActionFactor(selected) : null
  const meta = selected ? ACTION_META[selected] : null
  const Icon = meta?.icon
  const allCategories = listActionCategories()

  return (
    <div>
      <div className="ct-card p-3 mb-3">
        <p className="text-xs italic" style={{ color: 'var(--ink-muted)' }}>
          &ldquo;{rawInput}&rdquo;
        </p>
      </div>

      {!editing && factor ? (
        <button
          onClick={() => setEditing(true)}
          aria-label={`Category: ${factor.label}. Tap to change.`}
          className="ct-quick-tile w-full p-3 mb-3 flex items-center gap-3 text-left"
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: meta?.bg }}
          >
            {Icon && <Icon size={18} color={meta!.color} strokeWidth={2} />}
          </span>
          <span className="text-sm font-medium flex-1">{factor.label}</span>
          <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            edit
          </span>
        </button>
      ) : (
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value)
            setEditing(false)
          }}
          className="w-full p-3 mb-3 text-sm ct-card"
          style={{ color: 'var(--ink)' }}
        >
          <option value="">Select a category</option>
          {allCategories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      )}

      {factor && (
        <div
          className={`p-3 mb-3 text-sm font-medium font-mono-num ${
            factor.factor_per_event < 0 ? 'ct-impact-positive' : 'ct-impact-negative'
          }`}
        >
          {factor.factor_per_event > 0 ? '+' : ''}
          {factor.factor_per_event} kg CO2e
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="ct-btn-secondary flex-1 py-2.5 text-sm">
          Cancel
        </button>
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className="ct-btn-pill flex-1 py-2.5 text-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
