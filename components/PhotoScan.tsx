'use client'
import { useRef, useState } from 'react'
import { ScanLine } from 'lucide-react'

type ReceiptItem = { name: string; price_inr: number; category: string }

export default function PhotoScan({ onParsed }: { onParsed: (items: ReceiptItem[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]

      try {
        const res = await fetch('/api/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        })
        const result = await res.json()
        if (result.error) {
          setError(result.error)
        } else {
          onParsed(result.items)
        }
      } catch {
        setError('Failed to scan receipt')
      } finally {
        setLoading(false) 
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        aria-label={loading ? 'Scanning receipt' : 'Scan a receipt to log purchases'}
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: loading ? 'var(--canopy)' : 'var(--paper-raised)',
          border: '1px solid var(--border)',
        }}
      >
        <ScanLine size={24} color={loading ? '#fff' : 'var(--ink)'} />
      </button>
      <p className="text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
        {loading ? 'Scanning…' : 'Scan receipt'}
      </p>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
