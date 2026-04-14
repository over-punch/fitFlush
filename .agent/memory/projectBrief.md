# fit-flush — Project Brief

## Identity
`fit-flush` is a text-container-fit sizing tool for the type-tools suite. It resizes type so it fills its container as large as possible without overflowing, with binary-search precision and variable-font axis safety.

- npm: `@liiift-studio/fit-flush`
- Repo: `Liiift-Studio/fitFlush`
- Domain: fit-flush.com

## Problem Statement
CSS has no way to say "size this text exactly as large as possible without overflowing its container." `clamp()` is viewport-linear. Container-query units are coarse. Neither is aware of variable-font axis travel — text that fits today will overflow tomorrow when an axis animates to its max. fit-flush solves all three.

## Scope — v0.0.1
- Vanilla JS: `fitFlush(el, opts)` and `fitFlushLive(el, opts)` → `FitFlushHandle`
- React hook: `useFitFlush(opts)`
- React component: `<FitFlushText as={...} mode={...} />`
- Modes: `'width'` (analytical fast path), `'height'` and `'both'` (binary search)
- Variable-font worst-case measurement via `vfSettings`
- Text-only content (no rich inline HTML preservation yet)

## Out of Scope — v0.0.1
- Rich inline HTML (`<em>`, `<strong>`, `<a>`) preservation in the probe
- Animated transitions between sizes (added later as a toggle)
- Group fit (`shared` option)
- `onFit` callback
- Measurement caching

## Success Criteria
- Converges in ≤ ~11 probe measurements for any `[min, max]` at `precision: 0.5` (binary path)
- ≤ 2 measurements for width-only mode (analytical path)
- Zero runtime deps; React is strictly an optional peer dep
- SSR-safe on Next.js App Router and Pages Router
- Test coverage ≥ 90% on `src/core`

## Constraints
- Build with `tsc` (not Vite) — matches "Next.js only" stack direction
- Test with Jest + `@happy-dom/jest-environment` + `@swc/jest`
- Next.js 16 App Router for the `site/` demo
- npm (not pnpm/yarn/bun)
- Tabs for indentation
- File header comment on every source file
- Keep `next` in root devDependencies for Vercel framework detection
