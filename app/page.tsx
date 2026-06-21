'use client'
import { useState, useEffect, useCallback } from 'react'
import { logQuickAction, logConfirmedAction, logReceiptItems } from '@/lib/logging'
import { listActionCategories } from '@/lib/emissions'
import { getCurrentWeekScore, getLastWeekScore } from '@/lib/scoring'
import Avatar from '@/components/Avatar'
import ConfirmCard from '@/components/ConfirmCard'
import ReceiptConfirm from '@/components/ReceiptConfirm'
import Link from 'next/link'
import { ACTION_META } from '@/lib/actionMeta'
import { getTopRecommendation, Recommendation } from '@/lib/recommendations'
import Suggestion from '@/components/Suggestion'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

const VoiceLog = dynamic(() => import('@/components/VoiceLog'), { ssr: false })
const PhotoScan = dynamic(() => import('@/components/PhotoScan'), { ssr: false })

const PRIMARY_ACTIONS = [
  'biked_or_walked',
  'veg_meal',
  'took_transit',
  'saved_power',
  'reused_or_repaired',
  'air_dried_laundry',
]

export default function Home() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        router.push('/login')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])
  const [score, setScore] = useState({ total_co2e_kg: 0, logs_count: 0 })
  const [status, setStatus] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<{
    rawInput: string
    category: string | null
  } | null>(null)
  type ReceiptItem = { name: string; price_inr: number; category: string }
  const [pendingReceipt, setPendingReceipt] = useState<ReceiptItem[] | null>(null)

  // inside the component:
  const { primary, rest } = useMemo(() => {
    const allActions = listActionCategories()
    return {
      primary: allActions.filter((a) => PRIMARY_ACTIONS.includes(a.key)),
      rest: allActions.filter((a) => !PRIMARY_ACTIONS.includes(a.key)),
    }
  }, [])

  const [suggestion, setSuggestion] = useState<Recommendation | null>(null)

  useEffect(() => {
    getTopRecommendation().then(setSuggestion)
  }, [score.logs_count]) // re-fetch whenever logs_count changes, so it updates after each log

  const [lastWeekScore, setLastWeekScore] = useState<{ total_co2e_kg: number } | null>(null)

  useEffect(() => {
    getLastWeekScore().then(setLastWeekScore)
  }, [])

  // compute a percent change:
  const percentChange =
    lastWeekScore && lastWeekScore.total_co2e_kg !== 0
      ? ((score.total_co2e_kg - lastWeekScore.total_co2e_kg) /
          Math.abs(lastWeekScore.total_co2e_kg)) *
        100
      : null

  const refreshScore = useCallback(async () => {
    const s = await getCurrentWeekScore()
    setScore(s)
  }, [])

  useEffect(() => {
    refreshScore()
  }, [refreshScore])

  async function handleLog(category: string) {
    setStatus('Logging…')
    const result = await logQuickAction(category)
    if (result.error) {
      setStatus(`Error: ${result.error}`)
    } else {
      setStatus(`Logged ${result.log.co2e_kg} kg CO2e`)
      await refreshScore()
    }
  }

  async function handleConfirm(category: string) {
    if (!pendingConfirm) return
    const result = await logConfirmedAction({
      source: 'voice',
      category,
      rawInput: pendingConfirm.rawInput,
    })
    setPendingConfirm(null)
    if (result.error) {
      setStatus(`Error: ${result.error}`)
    } else {
      setStatus(`Logged ${result.log.co2e_kg} kg CO2e`)
      await refreshScore()
    }
  }

  async function handleReceiptConfirm(items: any[]) {
    const result = await logReceiptItems(items)
    setPendingReceipt(null)
    if (result.error) {
      setStatus(`Error: ${result.error}`)
    } else {
      setStatus(`Logged ${items.length} items`)
      await refreshScore()
    }
  }

  if (!authChecked) {
    return (
      <main className="px-5 py-8 max-w-md mx-auto w-full">
        <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
          Loading…
        </p>
      </main>
    )
  }
  return (
    <main className="px-5 py-8 max-w-md mx-auto w-full">
      <div className="flex justify-end mb-2">
        <button
          onClick={async () => {
            await signOut()
            router.push('/login')
          }}
          className="text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          Sign out
        </button>
      </div>
      <Avatar totalCo2e={score.total_co2e_kg} />

      <div className="text-center mt-1">
        <Link href="/history" className="text-xs ct-link" style={{ color: 'var(--ink-muted)' }}>
          View garden history →
        </Link>
      </div>

      <div className="text-center my-5">
        <span className="font-mono-num text-sm" style={{ color: 'var(--ink-muted)' }}>
          this week · {score.total_co2e_kg.toFixed(1)} kg CO2e · {score.logs_count} logs
        </span>
        {percentChange !== null && (
          <p
            className="text-xs font-mono-num mt-1"
            style={{ color: percentChange < 0 ? 'var(--canopy)' : 'var(--clay)' }}
          >
            {percentChange < 0 ? '↓' : '↑'} {Math.abs(percentChange).toFixed(0)}% vs last week
          </p>
        )}
      </div>

      {suggestion && <Suggestion recommendation={suggestion} onLog={handleLog} />}

      <p
        role="status"
        aria-live="polite"
        className="text-center text-xs mb-4 min-h-[1rem]"
        style={{ color: 'var(--ink-muted)' }}
      >
        {status}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {primary.map((a) => {
          const meta = ACTION_META[a.key]
          const Icon = meta?.icon
          return (
            <button
              key={a.key}
              onClick={() => handleLog(a.key)}
              aria-label={`Log: ${a.label}, ${a.co2e} kilograms CO2 equivalent`}
              className="ct-quick-tile p-4 text-left flex flex-col gap-3"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: meta?.bg }}
              >
                {Icon && <Icon size={20} color={meta.color} strokeWidth={2} />}
              </span>
              <span className="text-sm font-medium leading-snug">{a.label}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setShowMore((v) => !v)}
        className="text-xs w-full text-center py-2"
        style={{ color: 'var(--ink-muted)' }}
      >
        {showMore ? 'Show less' : 'More actions'}
      </button>

      {showMore && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {rest.map((a) => {
            const meta = ACTION_META[a.key]
            const Icon = meta?.icon
            return (
              <button
                key={a.key}
                onClick={() => handleLog(a.key)}
                aria-label={`Log: ${a.label}, ${a.co2e} kilograms CO2 equivalent`}
                className="ct-quick-tile p-4 text-left flex flex-col gap-3"
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: meta?.bg }}
                >
                  {Icon && <Icon size={20} color={meta.color} strokeWidth={2} />}
                </span>
                <span className="text-sm font-medium leading-snug">{a.label}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        {pendingConfirm ? (
          <ConfirmCard
            rawInput={pendingConfirm.rawInput}
            category={pendingConfirm.category}
            onConfirm={handleConfirm}
            onCancel={() => setPendingConfirm(null)}
          />
        ) : pendingReceipt ? (
          <ReceiptConfirm
            items={pendingReceipt}
            onConfirm={handleReceiptConfirm}
            onCancel={() => setPendingReceipt(null)}
          />
        ) : (
          <div className="flex gap-6 justify-center items-start">
            <button
              onClick={() =>
                (document.querySelector('[data-voice-trigger]') as HTMLElement)?.click()
              }
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <VoiceLog
                onParsed={(transcript, result) =>
                  setPendingConfirm({ rawInput: transcript, category: result.category })
                }
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <PhotoScan onParsed={(items) => setPendingReceipt(items)} />
            </div>
          </div>
        )}
      </div>
      <p className="text-[10px] text-center mt-8" style={{ color: 'var(--ink-muted)' }}>
        Emissions estimates based on DEFRA &amp; EPA conversion factors
      </p>
    </main>
  )
}
