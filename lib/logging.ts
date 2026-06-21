import { supabase } from './supabase'

async function callLogActionApi(params: { source: string; category: string; rawInput: string }) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { error: 'No user session' }

  const res = await fetch('/api/log-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  })

  return res.json()
}

export async function logQuickAction(category: string) {
  return callLogActionApi({ source: 'quick_action', category, rawInput: category })
}

export async function logConfirmedAction(params: {
  source: 'voice' | 'receipt' | 'photo' | 'passive'
  category: string
  rawInput: string
}) {
  return callLogActionApi(params)
}

export async function logReceiptItems(
  items: { name: string; category: string; price_inr: number }[]
) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { error: 'No user session' }

  const res = await fetch('/api/log-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ items }),
  })

  return res.json()
}
