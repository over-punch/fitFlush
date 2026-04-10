# Progress

## Works today (scaffolded — not yet verified by running)

- Repo bootstrap: src, tests, configs, site stub, agent memory, README, PROCESS.md
- Core algorithm: `fitFlush()` + `fitFlushLive()` with analytical fast path (width mode) and binary search (height/both modes)
- Variable-font max-axis worst-case measurement via `vfSettings`
- SSR-safe entry points
- Scroll restoration via `requestAnimationFrame` inside the core (not the React layer)
- React hook `useFitFlush` with ResizeObserver width-only dedup and `document.fonts.ready` refit
- React component `<FitFlushText as={...} />` via `forwardRef`
- Jest test suite — width/height/both modes, edge cases, idempotence, probe cleanup, padding, VF string builder
- README covering every usage path (component, hook, vanilla one-shot, vanilla live, VF, TypeScript)
- Next.js 16 App Router site stub at `site/`

## Not yet verified

- `npm install` (not yet run — pending user approval)
- `npm run typecheck`
- `npm run test`
- `npm run build` (verify `dist/` emission)
- Real-browser sanity check against a variable font
- Probe style-copy correctness under CSS-variable-driven fonts

## To build

- **Full site demo** — sliders (min/max/precision/padding), mode toggle, VF toggle, worst-case preview, OG image, sitemap
- **Lighthouse audit** — ≥ 95 across all four categories before v1.0.0
- **Rich inline HTML preservation** in the probe (v0.1.0)
- **Animated size transitions** on resize (v0.2.0, gated on `prefers-reduced-motion`)
- **Group fit** (`shared` option for headline grids — v0.2.0)
- **`onFit` callback** hook
- **Measurement caching** — skip re-measurement when text, container size, and options haven't changed
- **npm publish** as `@liiift-studio/fit-flush` once site is live and Lighthouse passes

## Known concerns

- Some happy-dom versions stub `getComputedStyle` return values as empty strings for certain properties. The `createProbe` style-copy guards against this with `if (value)` before `setProperty`, so only non-empty values are copied, but real-browser behaviour may differ slightly.
- `ResizeObserver` availability in happy-dom varies by version. The hook and `fitFlushLive` both guard `typeof ResizeObserver !== 'undefined'` and no-op when missing.
- Jest ESM support requires `--experimental-vm-modules` on some Node versions; the `test` script handles this explicitly.
