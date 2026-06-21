'use client'
import { useState } from 'react'
import { getPurchaseFactor, listPurchaseCategories } from '@/lib/emissions'

type ReceiptItem = { name: string; price_inr: number; category: string }

export default function ReceiptConfirm({
  items,
  onConfirm,
  onCancel,
}: {
  items: ReceiptItem[]
  onConfirm: (items: (ReceiptItem & { co2e: number })[]) => void
  onCancel: () => void
}) {
  const [list, setList] = useState(items.map((i) => ({ ...i, included: true })))
  const allCategories = listPurchaseCategories()

  function updateCategory(index: number, category: string) {
    setList((prev) => prev.map((item, i) => (i === index ? { ...item, category } : item)))
  }

  function toggleIncluded(index: number) {
    setList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, included: !item.included } : item))
    )
  }

  function computeCo2e(item: ReceiptItem) {
    const factor = getPurchaseFactor(item.category)
    if (!factor) return 0
    return Number(((item.price_inr / 100) * factor.factor_per_100inr).toFixed(2))
  }

  const totalCo2e = list.filter((i) => i.included).reduce((sum, i) => sum + computeCo2e(i), 0)

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: 'var(--ink-muted)' }}>
        {list.length} items found
      </p>

      <div className="space-y-2 mb-3 max-h-72 overflow-y-auto pr-1">
        {list.map((item, i) => (
          <div key={i} className="ct-card p-3" style={{ opacity: item.included ? 1 : 0.4 }}>
            <div className="flex justify-between items-center mb-2 gap-2">
              <span className="text-sm font-medium flex-1">{item.name}</span>
              <span className="text-xs font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                ₹{item.price_inr}
              </span>
              <input
                type="checkbox"
                checked={item.included}
                onChange={() => toggleIncluded(i)}
                aria-label={`Include ${item.name} in total`}
                className="w-4 h-4 shrink-0"
                style={{ accentColor: 'var(--canopy)' }}
              />
            </div>
            <select
              value={item.category}
              onChange={(e) => updateCategory(i, e.target.value)}
              className="text-xs p-1.5 w-full rounded"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--paper)' }}
            >
              {allCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="ct-impact-negative p-3 mb-3 text-sm font-medium font-mono-num">
        total estimated impact: {totalCo2e.toFixed(1)} kg CO2e
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="ct-btn-secondary flex-1 py-2.5 text-sm">
          Cancel
        </button>
        <button
          onClick={() =>
            onConfirm(list.filter((i) => i.included).map((i) => ({ ...i, co2e: computeCo2e(i) })))
          }
          className="ct-btn-pill flex-1 py-2.5 text-sm"
        >
          Confirm all
        </button>
      </div>
    </div>
  )
}
