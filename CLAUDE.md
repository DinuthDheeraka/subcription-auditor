# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Subscription Auditor — a privacy-first, client-side-only React SPA that calculates the true cost of subscriptions including opportunity cost (compound interest at 7% annual return). Dark "vampire" themed UI. Monetized via Google AdSense with GA4 analytics tracking.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Dev server at http://localhost:5173 (Vite HMR)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

No linting, testing, or formatting tooling is configured.

## Architecture

**Stack**: React 18 + Vite 5 + Recharts (charting). Pure JavaScript (no TypeScript). ES modules (`"type": "module"`).

**Key files:**
- `src/App.jsx` — Monolithic component (~688 lines) containing all business logic, UI components, data, and financial calculations. Four tab-based views: Dashboard, Manage, Projection, Reminders.
- `src/AdUnit.jsx` — Reusable Google AdSense ad component (uses `useRef` to prevent duplicate ad pushes).
- `src/analytics.js` — GA4 event tracking helpers (6 custom events: add/remove subscription, view change, projection change, set reminder, audit summary).
- `src/index.css` — Global styles, CSS animations (`drip`, `fadeSlideIn`, `pulseGlow`, `countUp`, `slideDown`), dark theme.
- `index.html` — Entry point with AdSense/GA4 script placeholders (`ca-pub-YOUR_ADSENSE_PUB_ID`, `G-XXXXXXXXXX`).

**Data model** (all in `App.jsx`):
- `CATEGORIES` — 10 subscription categories with colors and emoji icons.
- `PRESETS` — 30 hardcoded popular subscriptions with prices and suggested alternatives.
- `ANNUAL_RETURN` (7%) — Used by `futureValue()` for opportunity cost calculations.

**State management**: React hooks only (`useState`, `useEffect`, `useMemo`). No external state library. All data is ephemeral (no persistence across page reloads).

**Styling**: Predominantly inline styles with shared style objects. No CSS modules or CSS-in-JS library.

## Deployment

Configured for Vercel (`vercel.json`) and Netlify (`netlify.toml`). Build output directory is `dist/`.

## Conventions

- Components: PascalCase. Functions: camelCase. Constants: SCREAMING_SNAKE_CASE.
- Heavy use of inline styles rather than CSS classes.
- Ad placements are strategically positioned (6 slots) — preserve placement when modifying layout.
- GA4 tracking calls are embedded in event handlers throughout `App.jsx`.