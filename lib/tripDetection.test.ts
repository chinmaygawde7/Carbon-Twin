import { describe, it, expect } from 'vitest'
import { classifySpeed, TripTracker } from './tripDetection'

describe('classifySpeed', () => {
  it('classifies near-zero speed as stationary', () => {
    expect(classifySpeed(0.5)).toBe('stationary')
  })

  it('classifies walking-pace speed correctly', () => {
    expect(classifySpeed(5)).toBe('walking')
  })

  it('classifies cycling-pace speed correctly', () => {
    expect(classifySpeed(15)).toBe('biking')
  })

  it('classifies highway-pace speed as driving', () => {
    expect(classifySpeed(60)).toBe('driving')
  })

  it('handles boundary values without crashing', () => {
    expect(classifySpeed(7)).toBe('biking') // exactly at the walking/biking boundary
    expect(classifySpeed(25)).toBe('driving') // exactly at the biking/driving boundary
  })
})

describe('TripTracker', () => {
  it('reports zero distance with fewer than two points', () => {
    const tracker = new TripTracker()
    tracker.addPoint({ lat: 18.5204, lng: 73.8567, timestamp: Date.now() })
    expect(tracker.totalDistanceKm).toBe(0)
  })

  it('accumulates distance across multiple points', () => {
    const tracker = new TripTracker()
    const now = Date.now()
    tracker.addPoint({ lat: 18.5204, lng: 73.8567, timestamp: now })
    tracker.addPoint({ lat: 18.5214, lng: 73.8567, timestamp: now + 60_000 }) // ~111m north, 1 min later
    expect(tracker.totalDistanceKm).toBeGreaterThan(0.05)
    expect(tracker.totalDistanceKm).toBeLessThan(0.2)
  })

  it('resets cleanly', () => {
    const tracker = new TripTracker()
    tracker.addPoint({ lat: 18.5204, lng: 73.8567, timestamp: Date.now() })
    tracker.addPoint({ lat: 18.5214, lng: 73.8567, timestamp: Date.now() + 60_000 })
    tracker.reset()
    expect(tracker.totalDistanceKm).toBe(0)
  })

  it('does not report a completed trip while still moving', () => {
    const tracker = new TripTracker()
    const now = Date.now()
    tracker.addPoint({ lat: 18.5204, lng: 73.8567, timestamp: now })
    tracker.addPoint({ lat: 18.5214, lng: 73.8567, timestamp: now + 60_000 })
    expect(tracker.checkTripComplete()).toBeNull()
  })
})