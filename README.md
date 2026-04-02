# Artemis II Mission Tracker

React + Vite + TypeScript web app that displays live Artemis II telemetry in a NASA-inspired UI.

## What this project does

This app renders a mission dashboard for Artemis II with:

- mission elapsed time
- velocity
- distance from Earth
- distance to Moon (approximation)
- trajectory visualization (Earth to Moon)
- mission phase timeline
- crew cards
- live/status indicators and polling countdown

Telemetry comes from NASA's public AROW data feed (Google Cloud Storage), then the app extrapolates between fetches so values can animate continuously.

## Why it exists

It provides a simpler, developer-friendly telemetry UI that mirrors the high-level behavior of NASA's Artemis Real-time Orbit Website, but implemented as a standard React app you can run and extend locally.

## Tech stack

- **Language:** TypeScript
- **Frontend:** React 19
- **Build/dev:** Vite 8
- **Styling:** Tailwind CSS v4 (imported in CSS), plus extensive inline styles in components
- **Linting:** ESLint 9 + `typescript-eslint` + React hooks/react-refresh plugins

Key files:

- `package.json`
- `vite.config.ts`
- `eslint.config.js`
- `tsconfig.app.json`
- `src/App.tsx`

## External services and live data

Primary telemetry endpoint (public, no auth):

- `https://storage.googleapis.com/storage/v1/b/p-2-cen1/o/October%2F1%2FOctober_105_1.txt?alt=media`

Used in:

- `src/hooks/useTelemetry.ts`

Current polling behavior:

- poll interval: `15_000 ms` (`POLL_INTERVAL_MS`)
- stale threshold: `75_000 ms`
- request cache busting: `&_cb=${Date.now()}`
- fetch option: `{ cache: 'no-store' }`

## Project structure

Top-level:

- `index.html` - Vite HTML entry
- `src/main.tsx` - React mount point
- `src/index.css` - global CSS + Tailwind import
- `src/App.tsx` - main composition/layout
- `vite.config.ts` - Vite config (`base: './'`, React plugin, Tailwind plugin)
- `package.json` - scripts and dependencies

Feature modules under `src/`:

- `components/StarField.tsx` - animated canvas star background
- `components/TelemetryGauge.tsx` - reusable circular gauge with direction support (`ltr`/`rtl`)
- `components/MissionTimer.tsx` - MET timer gauge
- `components/TrajectoryView.tsx` - Earth/Moon/Orion SVG trajectory view
- `components/MissionPhase.tsx` - mission phase progress bar
- `components/CrewCards.tsx` - static crew panel
- `hooks/useTelemetry.ts` - fetches and parses NASA telemetry snapshots
- `hooks/useExtrapolatedTelemetry.ts` - extrapolates position between snapshots (250ms tick)

## Data flow (important)

1. `useTelemetry` fetches raw snapshot telemetry every 15s.
2. It stores both:
   - derived snapshot values (`speed`, `distFromCenter`, `altitude`, `distToMoon`)
   - raw vectors (`rawX`, `rawY`, `rawZ`, `rawVx`, `rawVy`, `rawVz`)
3. `useExtrapolatedTelemetry` uses raw vectors + `receivedAt` to propagate position every 250ms.
4. `App.tsx` renders gauges and trajectory from extrapolated values.

This is why values can move without manual refresh.

## Telemetry math currently implemented

In `src/hooks/useTelemetry.ts` and `src/hooks/useExtrapolatedTelemetry.ts`:

- `distFromCenter = sqrt(x²+y²+z²) / 5280`
- `distanceFromEarthSurface (named altitude internally) = distFromCenter - 3958.8`
- `speed = sqrt(vx²+vy²+vz²) * 3600 / 5280`
- `distToMoon = max(0, 238855 - distFromCenter)` (**approximation**)

## Getting started (fresh clone)

## 1) Prerequisites

- Node.js (current LTS recommended)
- npm

The repo does not pin Node via `.nvmrc` or `engines`, so Node version policy is currently informal.

## 2) Install

```bash
npm install
```

## 3) Run dev server

```bash
npm run dev
```

Then open:

- `http://localhost:5173`

## 4) Production build

```bash
npm run build
```

## 5) Preview built app

```bash
npm run preview
```

## Scripts

From `package.json`:

- `npm run dev` - start Vite dev server
- `npm run build` - TypeScript build (`tsc -b`) + Vite production build
- `npm run lint` - run ESLint across project
- `npm run preview` - serve production build locally

## Environment variables

Current state: **none**.

Search for `import.meta.env` and `process.env` in `src/` returns no usage.  
Endpoint URL is hardcoded in `src/hooks/useTelemetry.ts`.

If you plan to make endpoint configurable, that is currently missing.

## Deployment notes

Visible deployment-related config:

- `vite.config.ts` sets `base: './'`, which is useful for static hosting with relative asset paths.

No platform-specific deployment config is present (no `vercel.json`, no CI workflow files in repo root).  
So deployment process is not codified in this repository yet.

## No-backend / no-database scope

This project is frontend-only:

- no server routes
- no API handlers in repo
- no database schema or migrations

## Notable design decisions and caveats

- **Distance to Moon is approximate:** uses fixed `238855` mile reference, not full orbital ephemeris.
- **MET can diverge from official NASA page:** `MissionTimer` uses local `Date.now()` with fixed launch timestamp in `src/components/MissionTimer.tsx`.
- **Heavy inline styling:** most visuals are inline style objects in components, not centralized design tokens/theme.
- **Gauge behavior is custom:** direction and arc behavior are controlled in `src/components/TelemetryGauge.tsx`; this is a high-change area.
- **Telemetry continuity depends on extrapolation:** if raw vectors are missing/invalid, gauges can fall back to static/null behavior.

## Where to modify common things

- Poll frequency: `src/hooks/useTelemetry.ts` (`POLL_INTERVAL_MS`)
- Stale threshold: `src/hooks/useTelemetry.ts` (`STALE_THRESHOLD_MS`)
- Endpoint URL: `src/hooks/useTelemetry.ts` (`ENDPOINT`)
- Extrapolation update rate: `src/hooks/useExtrapolatedTelemetry.ts` (`setInterval(..., 250)`)
- Gauge direction/arc visuals: `src/components/TelemetryGauge.tsx`
- Mission phases/timing windows: `src/components/MissionPhase.tsx`
- Crew roster: `src/components/CrewCards.tsx`

## Contributing conventions (current)

No dedicated contributing guide exists (`CONTRIBUTING.md` not present).

Practical conventions implied by the repo:

- TypeScript strict mode enabled
- ESLint should pass before merge
- Build should pass (`npm run build`)
- Keep UI changes consistent with NASA-inspired design language in existing components

## License

No project license file is present in repo root (`LICENSE` not found).  
Do not assume usage rights beyond private/internal use without adding an explicit license.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
