# System Patterns

## Architecture

```
src/
├── core/                  framework-agnostic
│   ├── types.ts           FitFlushOptions, FitFlushHandle, FIT_FLUSH_CLASSES, DEFAULTS
│   ├── adjust.ts          fitFlush() + fitFlushLive() — public entry points
│   ├── measure.ts         createProbe, configureProbe, fits, analyticalWidthFit, binarySearchFit
│   └── vf.ts              buildMaxAxisString — variable-font axis serialization
├── react/
│   ├── useFitFlush.ts     React hook: ResizeObserver + fonts.ready auto-refit
│   └── FitFlushText.tsx   forwardRef component with `as` prop
├── __tests__/
│   ├── mocks.ts           shared getBoundingClientRect mock keyed to FIT_FLUSH_CLASSES.probe
│   ├── fitFlush.test.ts   core algorithm
│   └── vf.test.ts         axis string builder
└── index.ts               public exports
```

## The invariant pattern

```
batch-read container → build probe → copy styles → search size → write target → dispose probe → rAF scroll restore
```

All DOM reads happen before any DOM writes within a single `fitFlush()` call. No interleaving.

## Search strategies

- **`mode: 'width'`** → analytical fast path
  - Measure probe at 100 px
  - Predict `target = 100 * innerWidth / measured`
  - Verify; if overshoot, single bisect downward
  - Typical cost: 1 measurement + 1 verify
- **`mode: 'height'` and `'both'`** → binary search
  - `~log2((max - min) / precision)` iterations
  - For `[8, 400]` at `0.5 px` precision: ~10 measurements
  - Short-circuits: if `max` already fits, return `max`; if `min` already overflows, return `min`

## Probe rules

- Cloned stylistically from the target via `getComputedStyle`, appended to `document.body`
- Always detached from the target's subtree (no layout disruption in the visible tree)
- `position: fixed; left: -99999px; visibility: hidden; pointer-events: none; aria-hidden: true`
- Distinct class `FIT_FLUSH_CLASSES.probe = 'ff-probe'` — test mocks must key on this class
- Removed after every one-shot `fitFlush` call (not cached across calls in v0.0.1)

## SSR safety

Every public entry point guards `typeof window === 'undefined'` and `typeof document === 'undefined'` at the top and returns a no-op:
- `fitFlush` → returns `0`
- `fitFlushLive` → returns `{ size: 0, refit: () => 0, dispose: () => {} }`
- `useFitFlush` → uses an isomorphic layout effect that no-ops on the server

## Scroll restoration

iOS Safari ignores `overflow-anchor: none`. Every `fitFlush` call saves `window.scrollY` before mutation and restores it inside a `requestAnimationFrame` if the delta exceeds 2 px. Never add this in the React layer — it must live in the core so both vanilla and React consumers benefit.

## Test mock contract

- Container elements return fixed `{ containerWidth, containerHeight }`
- Probe elements (identified by the `ff-probe` class) return `probeWidth(fontSize, text)` and `probeHeight(fontSize, text)` — default linear
- Mocks installed via `jest.spyOn(Element.prototype, 'getBoundingClientRect')`, restored in `afterEach`
