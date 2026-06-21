'use client'
import { useEffect, useRef, useState } from 'react'
import { TripTracker, TripMode } from '@/lib/tripDetection'

type DetectedTrip = { mode: TripMode; distanceKm: number }

export default function PassiveTripWatcher({
  onTripDetected,
}: {
  onTripDetected: (trip: DetectedTrip) => void
}) {
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const trackerRef = useRef(new TripTracker())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const consecutiveErrorsRef = useRef(0)

  function pollOnce() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        consecutiveErrorsRef.current = 0
        setError('')

        trackerRef.current.addPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
        })

        const completedTrip = trackerRef.current.checkTripComplete()
        if (
          completedTrip &&
          completedTrip.mode !== 'driving' &&
          completedTrip.mode !== 'stationary'
        ) {
          onTripDetected(completedTrip)
        }
      },
      (err) => {
        consecutiveErrorsRef.current += 1
        console.warn(
          `Geolocation poll error (${consecutiveErrorsRef.current} consecutive):`,
          err.code,
          err.message
        )
        if (consecutiveErrorsRef.current >= 5) {
          setError('Location unavailable — check device location services')
        }
      },
      { enableHighAccuracy: false, maximumAge: 5000, timeout: 15000 }
    )
  }

  function startWatching() {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported in this browser')
      return
    }

    setActive(true)
    setError('')
    trackerRef.current.reset()
    consecutiveErrorsRef.current = 0

    pollOnce() // immediate first reading
    intervalRef.current = setInterval(pollOnce, 8000) // poll every 8s
  }

  function stopWatching() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setActive(false)
  }

  useEffect(() => {
    return () => stopWatching()
  }, [])

  return (
    <div className="text-center">
      <button
        onClick={active ? stopWatching : startWatching}
        className="border rounded p-3 text-sm"
      >
        {active ? 'Stop trip detection' : 'Enable trip detection'}
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {active && !error && <p className="text-xs text-gray-400 mt-2">Watching for movement...</p>}
    </div>
  )
}
