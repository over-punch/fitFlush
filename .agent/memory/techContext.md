# Tech Context

## Stack

- **Language:** TypeScript 5.5 strict
- **Library build:** `tsc -p tsconfig.build.json` → `dist/index.js` + `dist/index.d.ts` (pure ESM)
- **Tests:** Jest 29 + `@happy-dom/jest-environment` + `@swc/jest` (matches Next.js SWC pipeline)
- **React peers:** `react` / `react-dom` ≥ 17, marked optional in `peerDependenciesMeta`
- **Site:** Next.js 16 App Router (currently a stub — full demo in follow-up session)
- **Package manager:** npm
- **Node:** ≥ 18

## Rationale for no Vite

The wider Liiift stack is Next.js-only. Keeping the build surface small means fewer tools to learn, upgrade, and debug. `tsc` alone is sufficient for a zero-dep library with no asset pipeline. Jest + SWC is the Next.js-recommended test stack and reuses the same transformer Next.js already ships with.

## Dependencies

- **Runtime:** zero
- **Peer (optional):** `react`, `react-dom`
- **Dev:**
  - `typescript` — library build + typecheck
  - `jest`, `@types/jest`
  - `@happy-dom/jest-environment` — lightweight DOM for measurement tests
  - `@swc/core`, `@swc/jest` — fast TS transformation for tests
  - `react`, `react-dom`, `@types/react`, `@types/react-dom` — so React bindings compile
  - `next` — **Vercel framework detection only** (do not remove; see GUIDE.md Pitfall #12)

## Build outputs

- `dist/index.js` — ESM entry
- `dist/index.d.ts` — rolled-up types (via `declaration: true`)
- `dist/index.js.map` + `dist/index.d.ts.map` — sourcemaps
- Sub-paths (`dist/core/*`, `dist/react/*`) — internal, not in package.json `exports`

## Browser requirements

- `ResizeObserver` — Chrome 64, Safari 13.1, Firefox 69 (all evergreen)
- `document.fonts.ready` — universal since 2018
- `requestAnimationFrame` — universal
- `getBoundingClientRect` — universal

## Git remotes (set up after initial commit)

- `origin` — https://github.com/Liiift-Studio/FitFlush.git
- `deploy` — git@github-liiift:Liiift-Studio/FitFlush.git (SSH alias, triggers Vercel)
