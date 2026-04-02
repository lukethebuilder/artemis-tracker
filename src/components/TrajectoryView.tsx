interface TrajectoryViewProps {
  liveX: number | null   // extrapolated ECI X, feet
  liveY: number | null   // extrapolated ECI Y, feet
  liveZ: number | null   // extrapolated ECI Z, feet (unused in 2D projection)
  moonEciX: number | null // Moon ECI X, miles
  moonEciY: number | null // Moon ECI Y, miles
  moonEciZ: number | null // Moon ECI Z, miles
}

// SVG viewBox dimensions
const VW = 800
const VH = 260

// Earth and Moon positions in SVG space
const EARTH_CX = 90
const EARTH_CY = VH / 2
const MOON_CX = VW - 90
const MOON_CY = VH / 2
const SVG_SPAN = MOON_CX - EARTH_CX  // 620px
const MOON_FAR_X = MOON_CX + 20      // far side of Moon (Moon radius = 20px)

// Compress perpendicular axis so the dot stays within the SVG bounds
const PERP_SCALE = 0.5

// Free-return trajectory path control points
// Outbound: bows above the Earth-Moon centerline
const OUT_CP1_X = 200, OUT_CP1_Y = 65
const OUT_CP2_X = 560, OUT_CP2_Y = 50
// Return: bows below the Earth-Moon centerline
const RET_CP1_X = 600, RET_CP1_Y = 200
const RET_CP2_X = 250, RET_CP2_Y = 195

const OUTBOUND_D = `M ${EARTH_CX} ${EARTH_CY} C ${OUT_CP1_X} ${OUT_CP1_Y} ${OUT_CP2_X} ${OUT_CP2_Y} ${MOON_FAR_X} ${MOON_CY}`
const RETURN_D   = `M ${MOON_FAR_X} ${MOON_CY} C ${RET_CP1_X} ${RET_CP1_Y} ${RET_CP2_X} ${RET_CP2_Y} ${EARTH_CX} ${EARTH_CY}`

function projectToSvg(
  liveX: number, liveY: number,
  moonEciX: number, moonEciY: number, moonEciZ: number
): { x: number; y: number; isReturn: boolean } | null {
  const moonDistNow = Math.sqrt(moonEciX ** 2 + moonEciY ** 2 + moonEciZ ** 2)
  if (moonDistNow === 0) return null

  // Angle of Moon direction in the ECI X-Y plane
  const moonAngle = Math.atan2(moonEciY, moonEciX)
  const cos = Math.cos(moonAngle)
  const sin = Math.sin(moonAngle)

  // Spacecraft position in miles
  const scX_mi = liveX / 5280
  const scY_mi = liveY / 5280

  // Rotate spacecraft into Earth-Moon reference frame
  const sc_along = scX_mi * cos + scY_mi * sin    // component along Earth-Moon axis
  const sc_perp  = -scX_mi * sin + scY_mi * cos   // component perpendicular to it

  const svgX = EARTH_CX + (sc_along / moonDistNow) * SVG_SPAN
  const svgY = EARTH_CY - (sc_perp  / moonDistNow) * SVG_SPAN * PERP_SCALE

  // Return leg: spacecraft is clearly below the Earth-Moon line (negative perpendicular)
  const isReturn = sc_perp < -5000  // miles threshold

  return { x: svgX, y: svgY, isReturn }
}

export default function TrajectoryView({ liveX, liveY, liveZ: _liveZ, moonEciX, moonEciY, moonEciZ }: TrajectoryViewProps) {
  const orion = (
    liveX !== null && liveY !== null &&
    moonEciX !== null && moonEciY !== null && moonEciZ !== null
  ) ? projectToSvg(liveX, liveY, moonEciX, moonEciY, moonEciZ) : null

  const isReturn = orion?.isReturn ?? false

  return (
    <div style={{ width: '100%', maxWidth: 840, margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', height: 'auto', overflow: 'hidden' }}
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

        {/* Outbound leg — dimmed when on return leg */}
        <path
          d={OUTBOUND_D}
          fill="none"
          stroke={isReturn ? '#1a3a3a' : '#2a4a4a'}
          strokeWidth={1.5}
          strokeDasharray="6 8"
        />

        {/* Return leg — dimmed when on outbound leg */}
        <path
          d={RETURN_D}
          fill="none"
          stroke={isReturn ? '#2a4a4a' : '#1a3a3a'}
          strokeWidth={1.5}
          strokeDasharray="6 8"
        />

        {/* Active leg teal highlight */}
        {orion && (
          <path
            d={isReturn ? RETURN_D : OUTBOUND_D}
            fill="none"
            stroke="#5ECFCF"
            strokeWidth={1.5}
            strokeDasharray="6 8"
            opacity={0.35}
          />
        )}

        {/* Moon */}
        <circle cx={MOON_CX} cy={MOON_CY} r={20} fill="url(#moonGrad)" />

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
            <circle cx={orion.x} cy={orion.y} r={2} fill="#fff" />
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
