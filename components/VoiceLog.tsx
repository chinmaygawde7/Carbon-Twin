'use client'
import { useState } from 'react'
import { Mic } from 'lucide-react'

type ParseResult = { category: string | null; confidence: string }

export default function VoiceLog({ onParsed }: { onParsed: (transcript: string, result: ParseResult) => void }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice input not supported in this browser. Try Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setListening(true)
    setError('')

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setListening(false)

      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const result = await res.json()
      onParsed(transcript, result)
    }

    recognition.onerror = (event: any) => {
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