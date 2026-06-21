'use client'
import { useState } from 'react'
import { Mic } from 'lucide-react'

type ParseResult = { category: string | null; confidence: string }

// Minimal local typing for the Web Speech API — not part of standard lib.dom.d.ts,
// so we define just the shape we actually use rather than fighting incomplete
// ambient declarations.
interface SpeechRecognitionResultLike {
  transcript: string
}
interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } }
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}
interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export default function VoiceLog({
  onParsed,
}: {
  onParsed: (transcript: string, result: ParseResult) => void
}) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')

  function startListening() {
    const win = window as unknown as WindowWithSpeechRecognition
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setError('Voice input not supported in this browser. Try Chrome.')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setListening(true)
    setError('')

    recognition.onresult = async (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (!transcript) return
      setListening(false)

      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const result = await res.json()
      onParsed(transcript, result)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      setListening(false)
      setError(`Voice error: ${event.error}`)
    }

    recognition.onend = () => setListening(false)

    recognition.start()
  }

  return (
    <div className="text-center">
      <button
        onClick={startListening}
        disabled={listening}
        aria-label={listening ? 'Listening for voice input' : 'Log an action by speaking'}
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: listening ? 'var(--canopy)' : 'var(--paper-raised)',
          border: '1px solid var(--border)',
        }}
      >
        <Mic size={24} color={listening ? '#fff' : 'var(--ink)'} />
      </button>
      <p className="text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
        {listening ? 'Listening…' : 'Speak'}
      </p>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
