import { useState, useEffect, useRef } from 'react'
import type { TelemetryData } from './useTelemetry'

export interface LiveTelemetry {
  altitude: number | null
  distFromCenter: number | null
  distToMoon: number | null
  speed: number | null
}

const EARTH_RADIUS_MILES = 3958.8
const MOON_DIST_MILES = 238855
const FT_PER_MILE = 5280

function extrapolate(snapshot: TelemetryData): LiveTelemetry {
  if (
    snapshot.rawX === null || snapshot.rawY === null || snapshot.rawZ === null ||
    snapshot.rawVx === null || snapshot.rawVy === null || snapshot.rawVz === null ||
    snapshot.receivedAt === null
  ) {
    return { altitude: null, distFromCenter: null, distToMoon: null, speed: null }
  }

  const dt = (Date.now() - snapshot.receivedAt) / 1000 // seconds elapsed

  const xe = snapshot.rawX + snapshot.rawVx * dt
  const ye = snapshot.rawY + snapshot.rawVy * dt
  const ze = snapshot.rawZ + snapshot.rawVz * dt

  const distFromCenter = Math.sqrt(xe * xe + ye * ye + ze * ze) / FT_PER_MILE
  const altitude = distFromCenter - EARTH_RADIUS_MILES
  const distToMoon = Math.max(0, MOON_DIST_MILES - distFromCenter)

  return { altitude, distFromCenter, distToMoon, speed: snapshot.speed }
}

export function useExtrapolatedTelemetry(snapshot: TelemetryData): LiveTelemetry {
  const [live, setLive] = useState<LiveTelemetry>(() => extrapolate(snapshot))
  const snapshotRef = useRef(snapshot)

  // Keep ref current so the interval always uses the latest snapshot
  useEffect(() => {
    snapshotRef.current = snapshot
    // Immediately apply new snapshot so there's no stale value on update
    setLive(extrapolate(snapshot))
  }, [snapshot])

  useEffect(() => {
    const id = setInterval(() => {
      setLive(extrapolate(snapshotRef.current))
    }, 250)
    return () => clearInterval(id)
  }, []) // single interval for the component lifetime

  return live
}
