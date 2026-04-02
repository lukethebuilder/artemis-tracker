import { useEffect, useRef, useState } from 'react'

interface TelemetryGaugeProps {
  value: number | string | null
  unit: string
  label: string
  maxValue?: number
  progress?: number // 0–1, overrides value/maxValue for arc fill
  direction?: 'ltr' | 'rtl'
}

const SIZE = 164
const TRACK_STROKE = 2
const ARC_STROKE = 10
const RADIUS = (SIZE - ARC_STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC_START_DEG = 90

const CX = SIZE / 2
const CY = SIZE / 2

export default function TelemetryGauge({
  value,
  unit,
  label,
  maxValue,
  progress,
  direction = 'ltr',
}: TelemetryGaugeProps) {
  const hasValue = value !== null && value !== undefined && value !== ''
  const isNumericValue = typeof value === 'number' && Number.isFinite(value)
  const prevValueRef = useRef(value)
  const [flash, setFlash] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const animatedValueRef = useRef<number | null>(isNumericValue ? value : null)
  const [animatedValue, setAnimatedValue] = useState<number | null>(isNumericValue ? value : null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Smoothly tween numeric values so they look continuously alive.
  useEffect(() => {
    if (!isNumericValue) {
      animatedValueRef.current = null
      setAnimatedValue(null)
      return
    }

    const target = value
    const start = animatedValueRef.current ?? target
    const delta = target - start

    if (Math.abs(delta) < 0.001) {
      animatedValueRef.current = target
      setAnimatedValue(target)
      return
    }

    const durationMs = 1200
    const startTime = performance.now()

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs)
      const next = start + delta * t
      animatedValueRef.current = next
      setAnimatedValue(next)

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(step)
      } else {
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(step)
  }, [isNumericValue, value])

  // Trigger a brief highlight whenever the value changes
  useEffect(() => {
    const prev = prevValueRef.current
    if (prev !== value && value !== null) {
      prevValueRef.current = value
      const isSignificantNumericChange =
        typeof prev === 'number' && typeof value === 'number'
          ? Math.abs(value - prev) >= 2
          : true
      if (!isSignificantNumericChange) return
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 1200)
      return () => clearTimeout(t)
    }
  }, [value])

  let fillRatio = 0
  const displayNumericValue = isNumericValue ? (animatedValue ?? value) : null

  if (progress !== undefined) {
    fillRatio = Math.min(1, Math.max(0, progress))
  } else if (hasValue && maxValue && displayNumericValue !== null) {
    fillRatio = Math.min(1, Math.max(0, displayNumericValue / maxValue))
  }

  const arcFill = fillRatio * CIRCUMFERENCE
  const arcDash = `${arcFill} ${CIRCUMFERENCE}`

  const isTimeValue = typeof value === 'string' && value.includes(':')

  const displayValue = hasValue
    ? displayNumericValue !== null
      ? Math.round(displayNumericValue).toLocaleString('en-US')
      : value
    : '--'

  const arcColor = flash ? '#b8f0f0' : '#b7e8ea'
  const glowOpacity = flash ? 0.5 : 0.25

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Outer frame ring */}
          <circle
            cx={CX} cy={CY} r={RADIUS + 6}
            fill="none"
            stroke={flash ? 'rgba(183,232,234,0.25)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={1.2}
            style={{ transition: 'stroke 0.4s ease' }}
          />

          {/* NASA-like thin full track */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={TRACK_STROKE}
          />

          {/* Glow layer */}
          {hasValue && fillRatio > 0 && (
            <g transform={direction === 'rtl' ? `translate(${SIZE} 0) scale(-1 1)` : undefined}>
              <circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke={`rgba(183,232,234,${glowOpacity})`}
                strokeWidth={ARC_STROKE + 6}
                strokeLinecap="round"
                strokeDasharray={arcDash}
                strokeDashoffset={0}
                transform={`rotate(${ARC_START_DEG} ${CX} ${CY})`}
                style={{ transition: 'stroke 0.4s ease, stroke-opacity 0.4s ease' }}
              />
            </g>
          )}

          {/* Main arc */}
          {hasValue && fillRatio > 0 && (
            <g transform={direction === 'rtl' ? `translate(${SIZE} 0) scale(-1 1)` : undefined}>
              <circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke={arcColor}
                strokeWidth={ARC_STROKE}
                strokeLinecap="round"
                strokeDasharray={arcDash}
                strokeDashoffset={0}
                transform={`rotate(${ARC_START_DEG} ${CX} ${CY})`}
                style={{ transition: 'stroke-dasharray 0.25s linear, stroke 0.4s ease' }}
              />
            </g>
          )}
        </svg>

        {/* Center content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: isTimeValue ? 21 : hasValue && String(displayValue).length > 6 ? 20 : 42,
              fontWeight: 700,
              color: flash ? '#9EEAEA' : hasValue ? '#fff' : '#333',
              lineHeight: 1,
              letterSpacing: isTimeValue ? '0.02em' : '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'system-ui, sans-serif',
              transition: 'color 0.4s ease',
            }}
          >
            {displayValue}
          </span>
          <span
            style={{
              fontSize: 13,
              color: hasValue ? '#e9f3f4' : '#333',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            {unit}
          </span>
        </div>
      </div>

      <span
        style={{
          fontSize: 11,
          color: '#f0f0f0',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.4,
          textShadow: '0 6px 16px rgba(181,233,236,0.22)',
        }}
      >
        {label}
      </span>
    </div>
  )
}
