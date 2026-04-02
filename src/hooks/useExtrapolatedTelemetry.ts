import { useState, useEffect, useRef } from 'react'
import type { TelemetryData } from './useTelemetry'

export interface LiveTelemetry {
  altitude: number | null
  distFromCenter: number | null
  distToMoon: number | null
  speed: number | null
  liveX: number | null   // extrapolated ECI X, feet
  liveY: number | null   // extrapolated ECI Y, feet
  liveZ: number | null   // extrapolated ECI Z, feet
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
    return { altitude: null, distFromCenter: null, distToMoon: null, speed: null, liveX: null, liveY: null, liveZ: null }
  }

  const dt = (Date.now() - snapshot.receivedAt) / 1000 // seconds elapsed

  const xe = snapshot.rawX + snapshot.rawVx * dt
  const ye = snapshot.rawY + snapshot.rawVy * dt
  const ze = snapshot.rawZ + snapshot.rawVz * dt

  const distFromCenter = Math.sqrt(xe * xe + ye * ye + ze * ze) / FT_PER_MILE
  const altitude = distFromCenter - EARTH_RADIUS_MILES

  // Use real Moon ECI position for accurate 3D distance (Moon moves ~0.6 mi/s, negligible over 15s)
  let distToMoon: number | null = null
  if (snapshot.moonEciX !== null && snapshot.moonEciY !== null && snapshot.moonEciZ !== null) {
    const scX_mi = xe / FT_PER_MILE
    const scY_mi = ye / FT_PER_MILE
    const scZ_mi = ze / FT_PER_MILE
    distToMoon = Math.sqrt(
      (snapshot.moonEciX - scX_mi) ** 2 +
      (snapshot.moonEciY - scY_mi) ** 2 +
      (snapshot.moonEciZ - scZ_mi) ** 2
    )
  } else {
    distToMoon = Math.max(0, MOON_DIST_MILES - distFromCenter)
  }

  return { altitude, distFromCenter, distToMoon, speed: snapshot.speed, liveX: xe, liveY: ye, liveZ: ze }
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
