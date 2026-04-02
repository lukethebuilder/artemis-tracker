import { useState, useEffect } from 'react'

const ENDPOINT =
  'https://storage.googleapis.com/storage/v1/b/p-2-cen1/o/October%2F1%2FOctober_105_1.txt?alt=media'

export const POLL_INTERVAL_MS = 15_000
const STALE_THRESHOLD_MS = 75_000

export interface TelemetryData {
  // Derived display values (from the snapshot)
  altitude: number | null
  speed: number | null
  distToMoon: number | null
  distFromCenter: number | null
  dataTime: string | null      // raw NASA timestamp, e.g. "2026:092:02:18:45"
  lastUpdated: Date | null     // when we last fetched
  status: 'live' | 'stale' | 'error'
  // Raw ECI vectors for dead-reckoning extrapolation (feet, ft/s)
  rawX: number | null
  rawY: number | null
  rawZ: number | null
  rawVx: number | null
  rawVy: number | null
  rawVz: number | null
  receivedAt: number | null    // Date.now() at fetch time, for Δt calculation
}

interface RawParameter {
  Number: string
  Status: string
  Time: string
  Type: string
  Value: string
}

interface RawTelemetry {
  Parameter_2003: RawParameter
  Parameter_2004: RawParameter
  Parameter_2005: RawParameter
  Parameter_2009: RawParameter
  Parameter_2010: RawParameter
  Parameter_2011: RawParameter
}

function parseTelemetry(raw: RawTelemetry, receivedAt: number): Omit<TelemetryData, 'status' | 'lastUpdated'> {
  const x = parseFloat(raw.Parameter_2003.Value)
  const y = parseFloat(raw.Parameter_2004.Value)
  const z = parseFloat(raw.Parameter_2005.Value)
  const vx = parseFloat(raw.Parameter_2009.Value)
  const vy = parseFloat(raw.Parameter_2010.Value)
  const vz = parseFloat(raw.Parameter_2011.Value)

  const distFromCenter = Math.sqrt(x * x + y * y + z * z) / 5280
  const altitude = distFromCenter - 3958.8
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz) * (3600 / 5280)
  const distToMoon = Math.max(0, 238855 - distFromCenter)
  const dataTime = raw.Parameter_2003.Time

  return {
    altitude, speed, distToMoon, distFromCenter, dataTime,
    rawX: x, rawY: y, rawZ: z,
    rawVx: vx, rawVy: vy, rawVz: vz,
    receivedAt,
  }
}

const nullData: TelemetryData = {
  altitude: null, speed: null, distToMoon: null, distFromCenter: null,
  dataTime: null, lastUpdated: null, status: 'error',
  rawX: null, rawY: null, rawZ: null,
  rawVx: null, rawVy: null, rawVz: null,
  receivedAt: null,
}

export function useTelemetry(): TelemetryData {
  const [data, setData] = useState<TelemetryData>(nullData)

  useEffect(() => {
    const fetchData = async () => {
      const receivedAt = Date.now()
      try {
        const res = await fetch(`${ENDPOINT}&_cb=${receivedAt}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw: RawTelemetry = await res.json()
        const parsed = parseTelemetry(raw, receivedAt)

        setData({
          ...parsed,
          lastUpdated: new Date(receivedAt),
          status: 'live',
        })
      } catch {
        setData((prev) => {
          if (!prev.lastUpdated) return { ...nullData, status: 'error' }
          const age = Date.now() - prev.lastUpdated.getTime()
          return { ...prev, status: age > STALE_THRESHOLD_MS ? 'stale' : prev.status }
        })
      }
    }

    fetchData()
    const id = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Stale check every 10s
  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        if (prev.status !== 'live' || !prev.lastUpdated) return prev
        const age = Date.now() - prev.lastUpdated.getTime()
        return age > STALE_THRESHOLD_MS ? { ...prev, status: 'stale' } : prev
      })
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  return data
}
