type GeoPoint = { lat: number; lng: number; timestamp: number }

function haversineKm(a: GeoPoint, b: GeoPoint) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

export type TripMode = 'walking' | 'biking' | 'driving' | 'stationary'

export function classifySpeed(speedKmh: number): TripMode {
  if (speedKmh < 1) return 'stationary'
  if (speedKmh < 7) return 'walking'
  if (speedKmh < 25) return 'biking'
  return 'driving'
}

export class TripTracker {
  private points: GeoPoint[] = []
  private idleStart: number | null = null
  private readonly idleThresholdMs = 60_000 // 1 min stationary = trip ended
  private readonly minTripKm = 0.5 // ignore trips shorter than this

  addPoint(point: GeoPoint) {
    this.points.push(point)
    if (this.points.length > 200) this.points.shift() // cap memory
  }

  get totalDistanceKm() {
    let total = 0
    for (let i = 1; i < this.points.length; i++) {
      total += haversineKm(this.points[i - 1], this.points[i])
    }
    return total
  }

  get currentSpeedKmh() {
    const n = this.points.length
    if (n < 2) return 0
    const a = this.points[n - 2]
    const b = this.points[n - 1]
    const distKm = haversineKm(a, b)
    const timeHr = (b.timestamp - a.timestamp) / 1000 / 3600
    if (timeHr <= 0) return 0
    return distKm / timeHr
  }

  get dominantMode(): TripMode {
    if (this.points.length < 2) return 'stationary'
    const speeds: number[] = []
    for (let i = 1; i < this.points.length; i++) {
      const distKm = haversineKm(this.points[i - 1], this.points[i])
      const timeHr = (this.points[i].timestamp - this.points[i - 1].timestamp) / 1000 / 3600
      if (timeHr > 0) speeds.push(distKm / timeHr)
    }
    if (speeds.length === 0) return 'stationary'
    const avg = speeds.reduce((s, v) => s + v, 0) / speeds.length
    return classifySpeed(avg)
  }

  checkTripComplete(): { mode: TripMode; distanceKm: number } | null {
    const speed = this.currentSpeedKmh
    const now = Date.now()

    if (speed < 1) {
      if (this.idleStart === null) this.idleStart = now
      const idleFor = now - this.idleStart

      if (idleFor > this.idleThresholdMs && this.totalDistanceKm >= this.minTripKm) {
        const result = { mode: this.dominantMode, distanceKm: this.totalDistanceKm }
        this.points = []
        this.idleStart = null
        return result
      }
    } else {
      this.idleStart = null
    }

    return null
  }

  reset() {
    this.points = []
    this.idleStart = null
  }
}