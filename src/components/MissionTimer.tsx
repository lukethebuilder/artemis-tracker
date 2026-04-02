import { useState, useEffect } from 'react'
import TelemetryGauge from './TelemetryGauge'

export const LAUNCH_TIME = new Date('2026-04-01T22:35:00Z')
export const MISSION_DURATION_MS = 10 * 24 * 60 * 60 * 1000 // 10 days

export function formatMET(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${days}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function useMET() {
  const [met, setMet] = useState(() => Date.now() - LAUNCH_TIME.getTime())

  useEffect(() => {
    const id = setInterval(() => {
      setMet(Date.now() - LAUNCH_TIME.getTime())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return met
}

export default function MissionTimer() {
  const met = useMET()
  const progress = Math.min(1, met / MISSION_DURATION_MS)
  const formatted = formatMET(met)

  return (
    <TelemetryGauge
      value={formatted}
      unit="D:H:M"
      label="Mission Elapsed Time"
      progress={progress}
      direction="ltr"
    />
  )
}
