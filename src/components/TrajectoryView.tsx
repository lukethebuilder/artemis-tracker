interface TrajectoryViewProps {
  distFromCenter: number | null // miles from Earth center
}

const MOON_DIST = 238855 // miles

// SVG viewBox dimensions
const VW = 800
const VH = 260

// Earth and Moon positions in SVG space
const EARTH_CX = 90
const EARTH_CY = VH / 2
const MOON_CX = VW - 90
const MOON_CY = VH / 2

// Bezier control point (arc bows upward)
const CTRL_X = VW / 2
const CTRL_Y = 30

function getOrionPoint(t: number) {
  // Quadratic bezier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
  const u = 1 - t
  const x = u * u * EARTH_CX + 2 * u * t * CTRL_X + t * t * MOON_CX
  const y = u * u * EARTH_CY + 2 * u * t * CTRL_Y + t * t * MOON_CY
  return { x, y }
}

export default function TrajectoryView({ distFromCenter }: TrajectoryViewProps) {
  const t = distFromCenter !== null
    ? Math.min(0.98, Math.max(0.02, distFromCenter / MOON_DIST))
    : null

  const orion = t !== null ? getOrionPoint(t) : null

  // Generate dots along the arc for dashed effect
  const dashPoints: { x: number; y: number }[] = []
  for (let i = 0; i <= 50; i++) {
    if (i % 2 === 0) dashPoints.push(getOrionPoint(i / 50))
  }

  return (
    <div style={{ width: '100%', maxWidth: 840, margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        aria-label="Orion trajectory diagram"
      >
        <defs>
          {/* Earth gradient */}
          <radialGradient id="earthGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#4fc3f7" />
            <stop offset="50%" stopColor="#1565c0" />
            <stop offset="100%" stopColor="#0a1628" />
          </radialGradient>

          {/* Moon gradient */}
          <radialGradient id="moonGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#c0c0c0" />
            <stop offset="100%" stopColor="#555" />
          </radialGradient>

          {/* Orion glow */}
          <filter id="orionGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Earth atmosphere glow */}
          <filter id="earthGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Trajectory arc path (dashed) */}
        <path
          d={`M ${EARTH_CX} ${EARTH_CY} Q ${CTRL_X} ${CTRL_Y} ${MOON_CX} ${MOON_CY}`}
          fill="none"
          stroke="#2a4a4a"
          strokeWidth={1.5}
          strokeDasharray="6 8"
        />

        {/* Teal highlight on traversed portion */}
        {orion && t !== null && (
          <path
            d={`M ${EARTH_CX} ${EARTH_CY} Q ${CTRL_X} ${CTRL_Y} ${MOON_CX} ${MOON_CY}`}
            fill="none"
            stroke="#5ECFCF"
            strokeWidth={1.5}
            strokeDasharray="6 8"
            strokeDashoffset={0}
            opacity={0.4}
            clipPath={`inset(0 ${VW - orion.x - 1}px 0 0)`}
          />
        )}

        {/* Moon */}
        <circle
          cx={MOON_CX}
          cy={MOON_CY}
          r={20}
          fill="url(#moonGrad)"
        />

        {/* Earth atmosphere */}
        <circle
          cx={EARTH_CX}
          cy={EARTH_CY}
          r={40}
          fill="rgba(79,195,247,0.06)"
          filter="url(#earthGlow)"
        />

        {/* Earth */}
        <circle
          cx={EARTH_CX}
          cy={EARTH_CY}
          r={34}
          fill="url(#earthGrad)"
          filter="url(#earthGlow)"
        />

        {/* Orion spacecraft */}
        {orion && (
          <>
            {/* Glow halo */}
            <circle
              cx={orion.x}
              cy={orion.y}
              r={10}
              fill="rgba(94,207,207,0.15)"
              filter="url(#orionGlow)"
            />
            {/* Spacecraft dot */}
            <circle
              cx={orion.x}
              cy={orion.y}
              r={5}
              fill="#5ECFCF"
              filter="url(#orionGlow)"
            />
            {/* Center pin */}
            <circle
              cx={orion.x}
              cy={orion.y}
              r={2}
              fill="#fff"
            />
          </>
        )}

        {/* Labels */}
        <text
          x={EARTH_CX}
          y={EARTH_CY + 52}
          textAnchor="middle"
          fill="#888"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.1em"
          style={{ textTransform: 'uppercase' }}
        >
          EARTH
        </text>

        <text
          x={MOON_CX}
          y={MOON_CY + 36}
          textAnchor="middle"
          fill="#888"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.1em"
        >
          MOON
        </text>

        {orion && (
          <text
            x={orion.x}
            y={orion.y - 16}
            textAnchor="middle"
            fill="#5ECFCF"
            fontSize={10}
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.12em"
          >
            ORION
          </text>
        )}

        {!orion && (
          <text
            x={VW / 2}
            y={VH / 2 + 50}
            textAnchor="middle"
            fill="#444"
            fontSize={11}
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.1em"
          >
            AWAITING TELEMETRY
          </text>
        )}
      </svg>
    </div>
  )
}
