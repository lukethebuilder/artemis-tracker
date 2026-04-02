# Artemis II Mission Tracker

Live mission dashboard for NASA's Artemis II — built with React, TypeScript, and Vite.

**Live:** https://lukethebuilder.github.io/artemis-tracker

## What it does

Real-time telemetry dashboard showing:

- **Trajectory view** — free-return path visualization with Orion's position projected from actual ECI coordinates
- **Mission Elapsed Time** — live countdown from launch
- **Velocity** — current spacecraft speed in mph
- **Distance from Earth** — continuously extrapolated between telemetry updates
- **Distance to Moon** — computed as true 3D distance using the Moon's actual position (via `astronomy-engine`)
- **Crew cards** — Reid Wiseman, Victor Glover, Christina Koch, Jeremy Hansen
- **Live/Stale/No Data** status badge with polling countdown

## Data source

Telemetry is pulled from NASA's public AROW feed (Google Cloud Storage) — no API key required:

```
https://storage.googleapis.com/storage/v1/b/p-2-cen1/o/October%2F1%2FOctober_105_1.txt?alt=media
```

The file contains raw ECI position/velocity vectors (feet, ft/s) in J2000 equatorial frame. The app polls every 15 seconds and extrapolates position every 250ms between fetches so values animate continuously.

On failure with no prior data, it retries after 3 seconds before falling back to the normal 15s interval.

## How the math works

**In `useTelemetry.ts`:**
- `distFromCenter = sqrt(x²+y²+z²) / 5280` — miles from Earth center
- `altitude = distFromCenter - 3958.8` — miles above Earth surface
- `speed = sqrt(vx²+vy²+vz²) * 3600 / 5280` — mph
- Moon ECI position from `GeoMoon(dataDate)` via `astronomy-engine` (AU → miles)
- `distToMoon = sqrt((moonX-scX)² + (moonY-scY)² + (moonZ-scZ)²)` — true 3D distance

**In `useExtrapolatedTelemetry.ts`:**
- Dead-reckoning every 250ms: `xe = x + vx * dt`
- Reuses Moon ECI from last snapshot (Moon moves ~0.6 mi/s, negligible over 15s)

**In `TrajectoryView.tsx`:**
- Rotates spacecraft ECI into Earth-Moon reference frame using `atan2(moonY, moonX)`
- Projects along-track and perpendicular components into SVG coordinates
- Path is two cubic Bezier segments forming a free-return trajectory loop

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4**
- **astronomy-engine** — client-side lunar ephemeris (no API calls)

## Project structure

```
src/
  App.tsx                          — layout and data orchestration
  components/
    TelemetryGauge.tsx             — circular gauge (ltr/rtl, animated)
    MissionTimer.tsx               — MET timer
    TrajectoryView.tsx             — Earth/Moon/Orion SVG with ECI projection
    CrewCards.tsx                  — crew roster
    StarField.tsx                  — animated canvas star background
  hooks/
    useTelemetry.ts                — NASA fetch, parse, Moon ECI, 15s polling
    useExtrapolatedTelemetry.ts    — 250ms dead-reckoning extrapolation
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run deploy     # build + push to gh-pages branch
```

## Notes

- Launch time is hardcoded in `src/components/MissionTimer.tsx` (`2026-04-01T22:35:00Z`)
- Telemetry endpoint URL is hardcoded in `src/hooks/useTelemetry.ts`
- Not affiliated with NASA
