import { useState, useEffect, useRef } from 'react'
import StarField from './components/StarField'
import MissionTimer from './components/MissionTimer'
import TelemetryGauge from './components/TelemetryGauge'
import TrajectoryView from './components/TrajectoryView'
import MissionPhase from './components/MissionPhase'
import CrewCards from './components/CrewCards'
import { useTelemetry, POLL_INTERVAL_MS } from './hooks/useTelemetry'
import { useExtrapolatedTelemetry } from './hooks/useExtrapolatedTelemetry'

// Format NASA's "YYYY:DDD:HH:MM:SS.mmm" into "HH:MM:SS UTC"
function formatNasaTime(raw: string | null): string {
  if (!raw) return '--'
  const parts = raw.split(':')
  if (parts.length < 5) return raw
  const hh = parts[2].padStart(2, '0')
  const mm = parts[3].padStart(2, '0')
  const ss = parts[4].split('.')[0].padStart(2, '0')
  return `${hh}:${mm}:${ss} UTC`
}

function usePollCountdown(lastUpdated: Date | null): number {
  const [seconds, setSeconds] = useState(POLL_INTERVAL_MS / 1000)

  useEffect(() => {
    const tick = () => {
      if (!lastUpdated) { setSeconds(POLL_INTERVAL_MS / 1000); return }
      const elapsed = (Date.now() - lastUpdated.getTime()) / 1000
      const remaining = Math.max(0, POLL_INTERVAL_MS / 1000 - elapsed)
      setSeconds(Math.ceil(remaining))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  return seconds
}

function LiveBadge({ status }: { status: 'live' | 'stale' | 'error' }) {
  const colors = {
    live:  { bg: 'rgba(94,207,207,0.1)',  border: 'rgba(94,207,207,0.35)', dot: '#5ECFCF',  text: '#5ECFCF',  label: 'LIVE'    },
    stale: { bg: 'rgba(255,165,0,0.08)',  border: 'rgba(255,165,0,0.3)',   dot: '#FFA500',  text: '#FFA500',  label: 'STALE'   },
    error: { bg: 'rgba(255,80,80,0.08)',  border: 'rgba(255,80,80,0.25)',  dot: '#FF5050',  text: '#FF5050',  label: 'NO DATA' },
  }
  const c = colors[status]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 13px' }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: c.dot,
        boxShadow: status === 'live' ? `0 0 8px ${c.dot}` : 'none',
        animation: status === 'live' ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ fontSize: 10, color: c.text, letterSpacing: '0.16em', fontWeight: 700 }}>{c.label}</span>
    </div>
  )
}

export default function App() {
  const telemetry = useTelemetry()
  const live = useExtrapolatedTelemetry(telemetry)

  const countdown = usePollCountdown(telemetry.lastUpdated)
  const prevUpdatedRef = useRef(telemetry.lastUpdated)
  const [showUpdated, setShowUpdated] = useState(false)

  useEffect(() => {
    if (telemetry.lastUpdated && telemetry.lastUpdated !== prevUpdatedRef.current) {
      prevUpdatedRef.current = telemetry.lastUpdated
      setShowUpdated(true)
      const t = setTimeout(() => setShowUpdated(false), 2500)
      return () => clearTimeout(t)
    }
  }, [telemetry.lastUpdated])

  // Arc: fills as Orion travels toward Moon (0 = just launched, 1 = at Moon)
  const moonJourneyProgress = live.distToMoon !== null
    ? Math.min(1, Math.max(0, 1 - live.distToMoon / 238855))
    : undefined

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', position: 'relative' }}>
      <StarField />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes updatedPulse {
          0% { opacity: 0; transform: translateY(2px); }
          18% { opacity: 1; transform: translateY(0); }
          82% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-1px); }
        }
        @media (max-width: 640px) {
          .gauge-grid { grid-template-columns: repeat(2,1fr) !important; gap: 24px !important; }
          .crew-grid  { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 28px' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Left: NASA + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="48" height="18" viewBox="0 0 48 18" aria-label="NASA">
              <text x="0" y="14" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="900" fill="#e63946" letterSpacing="2">NASA</text>
            </svg>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 200, letterSpacing: '0.42em', color: '#fff', textTransform: 'uppercase', lineHeight: 1.1 }}>
                Artemis&nbsp;II
              </div>
              <div style={{ fontSize: 8, color: '#3a3a3a', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 3 }}>
                Mission Tracker
              </div>
            </div>
          </div>

          {/* Right: status + telemetry time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

            {/* "Updated" flash toast */}
            <div style={{
              fontSize: 10, color: '#5ECFCF', letterSpacing: '0.14em',
              textTransform: 'uppercase', fontWeight: 600,
              opacity: showUpdated ? 1 : 0,
              animation: showUpdated ? 'updatedPulse 2s ease' : 'none',
              pointerEvents: 'none',
            }}>
              ↑ Updated
            </div>

            {/* NASA data timestamp */}
            {telemetry.dataTime && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#2e2e2e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Data time</div>
                <div style={{ fontSize: 12, color: '#4a4a4a', fontVariantNumeric: 'tabular-nums' }}>
                  {formatNasaTime(telemetry.dataTime)}
                </div>
              </div>
            )}

            {/* Poll countdown */}
            {telemetry.status !== 'error' && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#2e2e2e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Refresh in</div>
                <div style={{
                  fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                  color: countdown <= 3 ? '#5ECFCF' : '#3a3a3a',
                  transition: 'color 0.3s ease',
                }}>
                  {countdown}s
                </div>
              </div>
            )}

            <LiveBadge status={telemetry.status} />
          </div>
        </header>

        {/* ── Trajectory ─────────────────────────────────────────── */}
        <section style={{ padding: '52px 0 20px' }}>
          {/* TrajectoryView uses live extrapolated position for smooth dot movement */}
          <TrajectoryView distFromCenter={live.distFromCenter} />
        </section>

        {/* ── Mission Phase ──────────────────────────────────────── */}
        <section style={{ padding: '8px 0 52px' }}>
          <MissionPhase />
        </section>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 52 }} />

        {/* ── Telemetry Gauges ───────────────────────────────────── */}
        <section style={{ padding: '0 0 68px' }}>
          <div
            className="gauge-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40, justifyItems: 'center' }}
          >
            <MissionTimer />

            {/* Velocity: snaps on new telemetry (changes ~1-3 mph per 15s, barely noticeable) */}
            <TelemetryGauge
              value={live.speed}
              unit="mph"
              label="Velocity"
              maxValue={25000}
              direction="ltr"
            />

            {/* Altitude: continuously extrapolated, updates every 250ms */}
            <TelemetryGauge
              value={live.altitude}
              unit="miles"
              label="Distance from Earth"
              maxValue={238855}
              direction="ltr"
            />

            {/* Distance to Moon: continuously extrapolated, arc fills toward Moon */}
            <TelemetryGauge
              value={live.distToMoon}
              unit="miles"
              label="Distance to Moon"
              maxValue={238855}
              progress={moonJourneyProgress}
              direction="rtl"
            />
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 52 }} />

        {/* ── Crew ───────────────────────────────────────────────── */}
        <section style={{ padding: '0 0 68px' }}>
          <CrewCards />
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '20px 0 28px', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#2a2a2a', letterSpacing: '0.06em', lineHeight: 2, margin: 0 }}>
            Telemetry data sourced from NASA AROW via Google Cloud Storage. Not affiliated with NASA.
          </p>
        </footer>
      </div>
    </div>
  )
}
