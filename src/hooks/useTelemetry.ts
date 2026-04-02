import React, { useState, useEffect } from 'react'
import { GeoMoon } from 'astronomy-engine'

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
  // Moon ECI position (miles, J2000 equatorial) — same frame as raw vectors
  moonEciX: number | null
  moonEciY: number | null
  moonEciZ: number | null
  moonDistNow: number | null   // Earth-to-Moon distance at data time, miles
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

const AU_TO_MILES = 92_955_807.3

function parseNasaTime(s: string): Date | null {
  const parts = s.split(':')
  if (parts.length < 5) return null
  const year = parseInt(parts[0], 10)
  const doy  = parseInt(parts[1], 10)
  const hh   = parseInt(parts[2], 10)
  const mm   = parseInt(parts[3], 10)
  const ss   = parseFloat(parts[4])
  const ms = Date.UTC(year, 0, 1)
           + (doy - 1) * 86_400_000
           + hh * 3_600_000
           + mm * 60_000
           + Math.round(ss * 1000)
  return new Date(ms)
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
  const dataTime = raw.Parameter_2003.Time

  // Compute Moon ECI position from NASA timestamp for accurate distToMoon
  let moonEciX: number | null = null
  let moonEciY: number | null = null
  let moonEciZ: number | null = null
  let moonDistNow: number | null = null
  let distToMoon: number | null = null

  const dataDate = parseNasaTime(dataTime)
  if (dataDate !== null) {
    const moonVec = GeoMoon(dataDate)            // AU, J2000 equatorial — same frame as NASA ECI
    moonEciX = moonVec.x * AU_TO_MILES
    moonEciY = moonVec.y * AU_TO_MILES
    moonEciZ = moonVec.z * AU_TO_MILES
    moonDistNow = Math.sqrt(moonEciX ** 2 + moonEciY ** 2 + moonEciZ ** 2)
    const scX_mi = x / 5280
    const scY_mi = y / 5280
    const scZ_mi = z / 5280
    distToMoon = Math.sqrt(
      (moonEciX - scX_mi) ** 2 +
      (moonEciY - scY_mi) ** 2 +
      (moonEciZ - scZ_mi) ** 2
    )
  } else {
    distToMoon = Math.max(0, 238_855 - distFromCenter)
  }

  return {
    altitude, speed, distToMoon, distFromCenter, dataTime,
    rawX: x, rawY: y, rawZ: z,
    rawVx: vx, rawVy: vy, rawVz: vz,
    receivedAt,
    moonEciX, moonEciY, moonEciZ, moonDistNow,
  }
}

const nullData: TelemetryData = {
  altitude: null, speed: null, distToMoon: null, distFromCenter: null,
  dataTime: null, lastUpdated: null, status: 'error',
  rawX: null, rawY: null, rawZ: null,
  rawVx: null, rawVy: null, rawVz: null,
  receivedAt: null,
  moonEciX: null, moonEciY: null, moonEciZ: null, moonDistNow: null,
}

export function useTelemetry(): TelemetryData {
  const [data, setData] = useState<TelemetryData>(nullData)
  const hasDataRef = React.useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      const receivedAt = Date.now()
      try {
        const res = await fetch(`${ENDPOINT}&_cb=${receivedAt}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw: RawTelemetry = await res.json()
        const parsed = parseTelemetry(raw, receivedAt)

        hasDataRef.current = true
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
        // Retry quickly on failure if we've never successfully loaded data
        if (!hasDataRef.current) {
          setTimeout(fetchData, 3_000)
        }
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
