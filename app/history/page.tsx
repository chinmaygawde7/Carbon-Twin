'use client'
import { useEffect, useState } from 'react'
import { getWeeklyHistory } from '@/lib/scoring'
import Avatar from '@/components/Avatar'
import dynamic from 'next/dynamic'

const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
  ssr: false,
})
const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false })

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'

type WeekRow = { week_start: string; total_co2e_kg: number; logs_count: number }

export default function History() {
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

  const [weeks, setWeeks] = useState<WeekRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWeeklyHistory(8).then((data) => {
      setWeeks(data)
      setLoading(false)
    })
  }, [])

  const chartData = weeks.map((w) => ({
    week: new Date(w.week_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    co2e: w.total_co2e_kg,
  }))

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Your garden</h1>
        <Link href="/" className="text-sm ct-link" style={{ color: 'var(--ink-muted)' }}>
          ← Back
        </Link>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Loading…
        </p>
      )}

      {!loading && weeks.length === 0 && (
        <div className="ct-card p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            No history yet — log a few actions to see your garden grow over time.
          </p>
        </div>
      )}

      {!loading && weeks.length > 0 && (
        <>
          <div className="ct-card p-4 mb-6">
            <p className="text-xs mb-3 font-mono-num" style={{ color: 'var(--ink-muted)' }}>
              weekly CO2e (kg)
            </p>

            <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--paper-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="co2e" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.co2e < 0 ? '#2D6A4F' : '#C8723D'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className="sr-only">
              <caption>Weekly carbon dioxide equivalent emissions, in kilograms, by week</caption>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">CO2 equivalent (kg)</th>
                  <th scope="col">Logs that week</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr key={w.week_start}>
                    <td>
                      {new Date(w.week_start).toLocaleDateString('en-IN', {
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td>{w.total_co2e_kg.toFixed(1)}</td>
                    <td>{w.logs_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs mb-3" style={{ color: 'var(--ink-muted)' }}>
            your garden, week by week
          </p>
          <div className="flex flex-wrap gap-4 justify-center ct-card p-5">
            {weeks.map((w) => (
              <div key={w.week_start} className="text-center">
                <Avatar totalCo2e={w.total_co2e_kg} size="small" />
                <p className="text-[10px] font-mono-num mt-1" style={{ color: 'var(--ink-muted)' }}>
                  {new Date(w.week_start).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
