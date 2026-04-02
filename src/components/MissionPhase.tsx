import { useMET } from './MissionTimer'

const HOUR = 3600 * 1000
const DAY = 24 * HOUR
const TOTAL_MS = 10 * DAY

interface Phase {
  label: string
  startMs: number
  endMs: number
}

const PHASES: Phase[] = [
  { label: 'Earth Orbit',         startMs: 0,           endMs: 3 * HOUR  },
  { label: 'TLI & Coast',         startMs: 3 * HOUR,    endMs: 12 * HOUR },
  { label: 'Translunar Coast',    startMs: 12 * HOUR,   endMs: 4 * DAY   },
  { label: 'Lunar Flyby',         startMs: 4 * DAY,     endMs: 5 * DAY   },
  { label: 'Return Coast',        startMs: 5 * DAY,     endMs: 9 * DAY   },
  { label: 'Reentry',             startMs: 9 * DAY,     endMs: 10 * DAY  },
]

function getCurrentPhaseIndex(met: number): number {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (met >= PHASES[i].startMs) return i
  }
  return 0
}

export default function MissionPhase() {
  const met = useMET()
  const currentIndex = getCurrentPhaseIndex(met)
  const progressFraction = Math.min(1, met / TOTAL_MS)

  return (
    <div style={{ width: '100%', maxWidth: 840, margin: '0 auto' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Mission Phase
          </span>
          <span style={{ fontSize: 14, color: '#5ECFCF', letterSpacing: '0.05em', fontWeight: 600 }}>
            {PHASES[currentIndex].label}
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {(progressFraction * 100).toFixed(1)}% complete
        </span>
      </div>

      {/* Segmented bar */}
      <div style={{ display: 'flex', gap: 3 }}>
        {PHASES.map((phase, i) => {
          const duration = phase.endMs - phase.startMs
          const widthPct = (duration / TOTAL_MS) * 100
          const isPast = i < currentIndex
          const isCurrent = i === currentIndex

          let bg: string
          if (isPast) {
            bg = 'rgba(94,207,207,0.3)'
          } else if (isCurrent) {
            const elapsed = met - phase.startMs
            const frac = Math.min(1, Math.max(0, elapsed / duration)) * 100
            bg = `linear-gradient(to right, #5ECFCF ${frac}%, rgba(94,207,207,0.1) ${frac}%)`
          } else {
            bg = 'rgba(255,255,255,0.04)'
          }

          return (
            <div
              key={phase.label}
              style={{
                flex: `0 0 calc(${widthPct}% - 3px)`,
                height: 10,
                borderRadius: 5,
                background: bg,
                border: isCurrent ? '1px solid rgba(94,207,207,0.4)' : '1px solid transparent',
                overflow: 'hidden',
              }}
            />
          )
        })}
      </div>

      {/* Phase labels */}
      <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
        {PHASES.map((phase, i) => {
          const duration = phase.endMs - phase.startMs
          const widthPct = (duration / TOTAL_MS) * 100
          const isPast = i < currentIndex
          const isCurrent = i === currentIndex

          return (
            <div
              key={phase.label}
              style={{
                flex: `0 0 calc(${widthPct}% - 3px)`,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 9,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: isCurrent ? '#5ECFCF' : isPast ? '#3a3a3a' : '#2e2e2e',
                  fontWeight: isCurrent ? 700 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {phase.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
